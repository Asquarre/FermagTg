const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const ExcelJS = require('exceljs');
const { createCatalogService, createCatalogHandlers, MAX_UPLOAD_BYTES } = require('../server/catalog-sync.cjs');
const { createBlobStore, PATHNAME } = require('../server/catalog-blob.cjs');
const catalog = { categories: [{ id: 'Хлеб', name: 'Хлеб' }], productsByCategory: { Хлеб: [
  { id: '0012', name: 'Хлеб', price: 150, image: '/photo.avif?v=old' },
  { id: '0001', name: 'Молоко', price: 250 },
] } };
const now = () => Date.parse('2026-10-19T12:00:00Z');
const date = '2026-10-19T06:00:00.000Z';
const secret = 'a'.repeat(64);

async function workbook(rows = [['0012', 'Хлеб', 180], ['0001', 'Молоко', 300]]) {
  const book = new ExcelJS.Workbook();
  book.addWorksheet('Любая категория').addRows([['Код', 'Название', 'Цена'], ...rows]);
  return Buffer.from(await book.xlsx.writeBuffer());
}
function memoryStore() {
  let state = null, counter = 0;
  return { read: async () => state && structuredClone(state),
    async write(value, etag) {
      if (state?.etag !== etag) return false;
      state = { value: structuredClone(value), etag: String(++counter) }; return true;
    }, count: () => counter };
}
function setup() {
  const store = memoryStore();
  const service = createCatalogService({ catalog, store, now });
  const handlers = createCatalogHandlers({ service, getCatalog: service.catalog, secret });
  return { store, service, handlers };
}
async function request(handler, { method = 'POST', body, headers = {} } = {}) {
  const req = Readable.from(body ? [body] : []);
  req.method = method;
  req.headers = { 'content-type': 'application/octet-stream', authorization: `Bearer ${secret}`, 'x-catalog-updated-at': date, ...headers };
  const res = { code: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  await handler(req, res);
  return res;
}

test('XLSX upload changes only prices, not names/categories/photos; leading zeros preserved', async () => {
  const h = setup();
  const file = await workbook([['0012', 'Другое название', '180,50'], ['0001', 'Другое', 300], ['unknown', 'Не товар сайта', -5]]);
  const result = await request(h.handlers.upload, { body: file });
  assert.equal(result.code, 200); assert.equal(result.body.matchedProducts, 2);
  const current = await h.service.catalog();
  assert.deepEqual(current.categories, catalog.categories);
  assert.deepEqual(current.productsByCategory.Хлеб, catalog.productsByCategory.Хлеб.map((p, i) => ({ ...p, price: [180.5, 300][i] })));
  assert.equal(result.headers['Cache-Control'], 'no-store');
});
test('without secret, wrong secret, wrong method, wrong type and oversized body are rejected', async () => {
  const h = setup(), body = await workbook();
  for (const authorization of ['', 'Bearer wrong']) {
    assert.equal((await request(h.handlers.upload, { body, headers: { authorization } })).code, 401);
  }
  assert.equal((await request(h.handlers.upload, { method: 'GET' })).code, 405);
  assert.equal((await request(h.handlers.upload, { body, headers: { 'content-type': 'multipart/form-data' } })).code, 415);
  assert.equal((await request(h.handlers.upload, { headers: { 'content-length': MAX_UPLOAD_BYTES + 1 } })).code, 413);
  assert.equal((await request(h.handlers.upload, { body: Buffer.alloc(MAX_UPLOAD_BYTES + 1) })).code, 413);
  for (const options of [{ secret: undefined }, { secret, allowUpload: false }]) {
    const handlers = createCatalogHandlers({ service: h.service, getCatalog: h.service.catalog, ...options });
    assert.equal((await request(handlers.upload, { body })).code, 503);
  }
  assert.equal(h.store.count(), 0);
});
test('malformed, missing codes, numeric lost zero, invalid prices and conflicting duplicates preserve previous prices', async () => {
  const h = setup(); await h.service.upload(await workbook(), date);
  for (const rows of [
    [['0012', '', 100]], [[12, '', 100], ['0001', '', 300]],
    [['0012', '', -1], ['0001', '', 300]], [['0012', '', '1.111'], ['0001', '', 300]],
    [['0012', '', 100], ['0001', '', 300], ['0012', '', 200]],
    [['0012', '', { formula: '1+2' }], ['0001', '', 300]],
  ]) {
    await assert.rejects(h.service.upload(await workbook(rows), '2026-10-19T07:00:00Z'), { status: 422 });
  }
  await assert.rejects(h.service.upload(Buffer.from('not xlsx'), date), { status: 422 });
  await assert.rejects(h.service.upload(Buffer.from('PKinvalidzip'), date), { status: 422 });
  assert.equal(h.store.count(), 1);
  assert.equal((await h.service.catalog()).productsByCategory.Хлеб[0].price, 180);
});
test('repeat is idempotent; older file, equal-time conflict and future timestamps cannot replace newest file', async () => {
  const h = setup(), file = await workbook();
  await h.service.upload(file, date);
  assert.equal((await h.service.upload(file, date)).unchanged, true);
  await assert.rejects(h.service.upload(file, '2026-10-18T00:00:00Z'), { status: 409 });
  await assert.rejects(h.service.upload(await workbook([['0012', '', 200], ['0001', '', 300]]), date), { status: 409 });
  for (const timestamp of [undefined, 'yesterday', '2026-10-20T00:00:00Z']) {
    await assert.rejects(h.service.upload(file, timestamp), { status: 400 });
  }
  assert.equal(h.store.count(), 1);
});
test('concurrent writers use CAS; latest source date wins, restart reads persisted prices', async () => {
  const h = setup();
  const first = await workbook(), second = await workbook([['0012', '', 220], ['0001', '', 310]]);
  await Promise.allSettled([h.service.upload(first, date), h.service.upload(second, '2026-10-19T07:00:00Z')]);
  const restarted = createCatalogService({ catalog, store: h.store, now });
  assert.equal((await restarted.catalog()).productsByCategory.Хлеб[0].price, 220);
});
test('missing or unavailable store never claims upload success or serves obsolete enabled prices', async () => {
  const h = setup();
  assert.equal((await request(h.handlers.read, { method: 'GET' })).code, 503);
  const store = { read: async () => { throw Error('secret internal storage error'); } };
  const service = createCatalogService({ catalog, store, now });
  const handlers = createCatalogHandlers({ service, getCatalog: service.catalog, secret });
  const result = await request(handlers.upload, { body: await workbook() });
  assert.equal(result.code, 503); assert(!JSON.stringify(result.body).includes('secret internal'));
});
test('Blob adapter uses private consistent reads and conditional writes, does not leak token', async () => {
  const calls = [];
  class Precondition extends Error {}
  const client = {
    BlobPreconditionFailedError: Precondition,
    get: async (name, options) => {
      calls.push({ name, options });
      return { statusCode: 200, stream: new Response('{"schema":1}').body, blob: { etag: 'etag1', size: 12 } };
    },
    put: async (...args) => { calls.push(args); },
  };
  const store = createBlobStore({ BLOB_READ_WRITE_TOKEN: 'secret' }, client);
  assert.equal((await store.read()).etag, 'etag1');
  assert.deepEqual(calls[0], { name: PATHNAME, options: { access: 'private', token: 'secret', useCache: false } });
  assert.equal(await store.write({ schema: 1 }, 'etag1'), true);
  assert.equal(calls[1][2].ifMatch, 'etag1'); assert.equal(calls[1][2].addRandomSuffix, false);
  client.put = async () => { throw new Precondition(); };
  assert.equal(await store.write({}, 'etag1'), false);
  client.get = async () => null;
  assert.equal(await store.read(), null);
  await assert.rejects(createBlobStore({}, client).read(), { status: 503 });
});
test('dynamic order validation rejects old prices; accepted ID remains confirmable if Blob is down', async () => {
  const { createOrderService } = require('../server/order-service.cjs');
  const h = setup(); await h.service.upload(await workbook(), date);
  let accepted = null, sends = 0;
  const service = createOrderService({ catalog: h.service.catalog, sheets: {
    find: async () => accepted,
    ensure: async (order) => { accepted = order; return true; },
  }, telegram: { send: async () => { sends++; } } });
  const body = { orderId: '12345678-1234-4123-8123-123456789abc', customerName: 'Тест', phone: '+77001234567', address: '', fulfillmentType: 'Самовывоз', items: [{ id: '0012', price: 150, quantity: 2 }] };
  await assert.rejects(service.submit(body), { status: 409 });
  body.items[0].price = 180;
  assert.equal((await service.submit(body)).total, 360);
  h.store.read = async () => { throw Error('offline'); };
  assert.equal((await service.submit(body)).sheetsDone, true); assert.equal(sends, 1);
});
