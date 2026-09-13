const ExcelJS = require('exceljs');
const fs = require('node:fs/promises');
const path = require('node:path');

const text = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('result' in value) return text(value.result);
    if (value.richText) return value.richText.map((part) => part.text).join('').trim();
    throw new Error('Неподдерживаемое значение ячейки (или формула без сохранённого результата)');
  }
  return String(value).trim();
};

function makeCatalog(workbook, warn = console.warn) {
  const categories = [];
  const productsByCategory = Object.create(null);
  const codes = new Map();
  workbook.eachSheet((sheet) => {
    const name = sheet.name.trim();
    const products = [];
    sheet.eachRow((row, rowNumber) => {
      const location = `Лист «${name}», строка ${rowNumber}`;
      try {
        const [id, productName, rawPrice] = [1, 2, 3].map((column) => text(row.getCell(column).value));
        if (!id && !productName && !rawPrice) return;
        if (rowNumber === 1 && /^(код|код номенклатуры|артикул|id)$/i.test(id) && /^(цена|price)$/i.test(rawPrice)) return;
        if (id && productName && !rawPrice) {
          warn(`${location}: «${productName}» пропущен — цена не указана.`);
          return;
        }
        if (!id || !productName || !rawPrice) throw new Error('обязательны код, название и цена');
        if (!/^[\p{L}\p{N}._-]+$/u.test(id)) throw new Error('код содержит недопустимые символы');
        const normalizedPrice = rawPrice.replace(/\s/g, '').replace(',', '.');
        const price = Number(normalizedPrice);
        if (!/^\d+(?:\.\d+)?$/.test(normalizedPrice) || !Number.isFinite(price) || price < 0) throw new Error(`некорректная цена «${rawPrice}»`);
        if (codes.has(id)) {
          const previous = codes.get(id);
          if (previous.category === name && previous.name === productName && previous.price === price) {
            warn(`${location}: точный дубль кода «${id}» объединён с ${previous.location}.`);
            return;
          }
          throw new Error(`код «${id}» повторяется (${previous.location})`);
        }
        codes.set(id, { location, category: name, name: productName, price });
        products.push({ id, name: productName, catalogueName: productName, price, image: `/product-images/${encodeURIComponent(id)}.avif` });
      } catch (error) {
        throw new Error(`${location}: ${error.message}`);
      }
    });
    if (products.length) {
      if (Object.hasOwn(productsByCategory, name)) throw new Error(`Повтор категории «${name}»`);
      categories.push({ id: name, name });
      productsByCategory[name] = products;
    }
  });
  if (!codes.size) throw new Error('Каталог не содержит товаров');
  return { categories, productsByCategory };
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(root, 'public/Цены.xlsx'));
  const catalog = makeCatalog(workbook);
  const destination = path.join(root, 'src/data/catalog.generated.json');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Каталог подготовлен: ${catalog.categories.length} категории, ${Object.values(catalog.productsByCategory).flat().length} товаров.`);
}

if (require.main === module) main().catch((error) => {
  console.error(`Ошибка каталога: ${error.message}`);
  process.exitCode = 1;
});
module.exports = { makeCatalog };
