const { createHash, timingSafeEqual } = require('node:crypto');

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
class CatalogError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const digest = (value) => createHash('sha256').update(value).digest('hex');
const authorized = (header, secret) => typeof secret === 'string' && secret.length >= 32 &&
  typeof header === 'string' && timingSafeEqual(Buffer.from(digest(header)), Buffer.from(digest(`Bearer ${secret}`)));

function cellText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('result' in value) return cellText(value.result);
    if (value.richText) return value.richText.map((part) => part.text).join('').trim();
    throw new CatalogError(422, 'В Excel есть формула без сохранённого результата или неподдерживаемая ячейка.');
  }
  return String(value).trim();
}

async function parsePrices(buffer, catalog) {
  if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) throw new CatalogError(413, 'Размер файла: от 1 байта до 2 МБ.');
  // Only XLSX; do not guess column meanings or execute macros/formulas.
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new CatalogError(422, 'Нужен файл Excel .xlsx.');
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(buffer); }
  catch { throw new CatalogError(422, 'Не удалось прочитать Excel .xlsx.'); }
  const known = new Set(Object.values(catalog.productsByCategory).flat().map((p) => p.id));
  const prices = new Map();
  let ignored = 0, count = 0;
  workbook.eachSheet((sheet) => sheet.eachRow((row, number) => {
    if (++count > 50000) throw new CatalogError(422, 'В файле больше 50 000 строк.');
    const id = cellText(row.getCell(1).value);
    if (!id) return;
    if (!known.has(id)) { ignored++; return; }
    const raw = cellText(row.getCell(3).value).replace(/\s/g, '').replace(',', '.');
    const price = Number(raw);
    if (!/^\d+(?:\.\d{1,2})?$/.test(raw) || !Number.isFinite(price) || price > 1000000000) {
      throw new CatalogError(422, `Лист «${sheet.name}», строка ${number}: некорректная цена для кода ${id}.`);
    }
    if (prices.has(id) && prices.get(id) !== price) throw new CatalogError(422, `Разные цены для одного кода ${id}.`);
    prices.set(id, price);
  }));
  const missing = [...known].filter((id) => !prices.has(id));
  if (missing.length) throw new CatalogError(422, `В файле нет цен для ${missing.length} товаров сайта. Первые коды: ${missing.slice(0, 10).join(', ')}. Старые цены сохранены.`);
  return { prices: Object.fromEntries([...prices].sort(([a], [b]) => a.localeCompare(b))), ignoredRows: ignored };
}

function validateSnapshot(snapshot) {
  if (!snapshot || snapshot.schema !== 1 || !snapshot.prices || Array.isArray(snapshot.prices) ||
    !Number.isFinite(Date.parse(snapshot.sourceUpdatedAt)) || typeof snapshot.fileHash !== 'string' ||
    Object.entries(snapshot.prices).some(([id, price]) => !id || !Number.isFinite(price) || price < 0 || price > 1000000000)) {
    throw new CatalogError(503, 'Сохранённый каталог цен недоступен.');
  }
  return snapshot;
}

function createCatalogService({ catalog, store, now = Date.now }) {
  return {
    async catalog() {
      const saved = await store.read();
      if (!saved) throw new CatalogError(503, 'Первый файл цен ещё не загружен.');
      const snapshot = validateSnapshot(saved.value);
      return { ...catalog, priceVersion: snapshot.fileHash, pricesUpdatedAt: snapshot.sourceUpdatedAt,
        productsByCategory: Object.fromEntries(Object.entries(catalog.productsByCategory).map(([name, products]) => [name,
          products.map((product) => ({ ...product, price: Object.hasOwn(snapshot.prices, product.id) ? snapshot.prices[product.id] : product.price })),
        ])) };
    },
    async upload(buffer, sourceUpdatedAt) {
      if (typeof sourceUpdatedAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,7})?Z$/.test(sourceUpdatedAt) ||
        !Number.isFinite(Date.parse(sourceUpdatedAt)) || Date.parse(sourceUpdatedAt) > now() + 5 * 60000) {
        throw new CatalogError(400, 'Нужен X-Catalog-Updated-At: время изменения файла в UTC (ISO 8601), не из будущего.');
      }
      const parsed = await parsePrices(buffer, catalog);
      const fileHash = digest(buffer);
      const receivedAt = new Date(now()).toISOString();
      const value = { schema: 1, sourceUpdatedAt: new Date(sourceUpdatedAt).toISOString(), receivedAt, fileHash, prices: parsed.prices };
      for (let attempt = 0; attempt < 3; attempt++) {
        const previous = await store.read();
        if (previous) {
          const old = validateSnapshot(previous.value);
          const delta = Date.parse(value.sourceUpdatedAt) - Date.parse(old.sourceUpdatedAt);
          if (delta < 0) throw new CatalogError(409, 'На сервере уже более свежий файл. Старый файл не принят.');
          if (delta === 0) {
            if (old.fileHash !== fileHash) throw new CatalogError(409, 'Одинаковое время изменения у разных файлов. Проверьте источник.');
            return { ok: true, unchanged: true, version: fileHash, sourceUpdatedAt: old.sourceUpdatedAt, matchedProducts: Object.keys(parsed.prices).length, ignoredRows: parsed.ignoredRows };
          }
        }
        if (await store.write(value, previous?.etag)) return { ok: true, unchanged: false, version: fileHash,
          sourceUpdatedAt: value.sourceUpdatedAt, matchedProducts: Object.keys(parsed.prices).length, ignoredRows: parsed.ignoredRows };
      }
      throw new CatalogError(409, 'Каталог одновременно обновляется. Повторите отправку этого же файла.');
    },
  };
}

async function readUpload(req) {
  if (Number(req.headers['content-length']) > MAX_UPLOAD_BYTES) throw new CatalogError(413, 'Файл больше 2 МБ.');
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > MAX_UPLOAD_BYTES) throw new CatalogError(413, 'Файл больше 2 МБ.');
    return req.body;
  }
  if (req.body !== undefined) throw new CatalogError(415, 'Отправьте сам файл с Content-Type: application/octet-stream, не multipart/form-data.');
  const parts = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_UPLOAD_BYTES) throw new CatalogError(413, 'Файл больше 2 МБ.');
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}

function createCatalogHandlers({ service, getCatalog, secret, allowUpload = true }) {
  const fail = (res, error) => res.status(error instanceof CatalogError ? error.status : 503).json({
    error: error instanceof CatalogError ? error.message : 'Хранилище цен временно недоступно. Повторите позже.',
  });
  return {
    async read(req, res) {
      res.setHeader('Cache-Control', 'no-store');
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      try { return res.json(await getCatalog()); } catch (error) { return fail(res, error); }
    },
    async upload(req, res) {
      res.setHeader('Cache-Control', 'no-store');
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      if (!allowUpload || !secret || secret.length < 32) return res.status(503).json({ error: 'Приём цен ещё не настроен для этого окружения.' });
      if (!authorized(req.headers.authorization, secret)) return res.status(401).json({ error: 'Unauthorized' });
      const contentType = (req.headers['content-type'] || '').split(';')[0];
      if (!['application/octet-stream', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(contentType)) {
        return res.status(415).json({ error: 'Content-Type должен быть application/octet-stream. Отправьте файл без multipart-обёртки.' });
      }
      try { return res.json(await service.upload(await readUpload(req), req.headers['x-catalog-updated-at'])); }
      catch (error) { return fail(res, error); }
    },
  };
}

module.exports = { createCatalogService, createCatalogHandlers, CatalogError, parsePrices, validateSnapshot, MAX_UPLOAD_BYTES };
