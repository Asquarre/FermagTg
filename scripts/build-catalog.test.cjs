const { test } = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const { makeCatalog, attachImages } = require('./build-catalog.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

function workbook(rows) {
  const book = new ExcelJS.Workbook();
  book.addWorksheet('Категория').addRows(rows);
  return book;
}

test('CLI creates the catalog directory in a clean checkout and supports rebuilding', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'catalog-build-test-'));
  try {
    await fs.mkdir(path.join(root, 'scripts'));
    await fs.mkdir(path.join(root, 'public'));
    await fs.mkdir(path.join(root, 'public/product-images'));
    await fs.copyFile(path.join(__dirname, '../public/product-images/Default.avif'), path.join(root, 'public/product-images/Default.avif'));
    const script = path.join(root, 'scripts/build-catalog.cjs');
    await fs.copyFile(path.join(__dirname, 'build-catalog.cjs'), script);
    await workbook([['0012', 'Хлеб', 150]]).xlsx.writeFile(path.join(root, 'public/Цены.xlsx'));
    const destination = path.join(root, 'src/data/catalog.generated.json');
    await assert.rejects(fs.access(path.dirname(destination)), { code: 'ENOENT' });
    for (let attempt = 0; attempt < 2; attempt++) {
      execFileSync(process.execPath, [script], {
        env: { ...process.env, NODE_PATH: path.resolve(__dirname, '../node_modules') },
        stdio: 'pipe',
      });
      const catalog = JSON.parse(await fs.readFile(destination, 'utf8'));
      assert.equal(catalog.productsByCategory.Категория[0].id, '0012');
      assert.equal(catalog.productsByCategory.Категория[0].price, 150);
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('preserves nomenclature codes, leading zeros and decimal prices', () => {
  const catalog = makeCatalog(workbook([['Код', 'Название', 'Цена'], ['0012', 'Хлеб', '1 250,50']]));
  assert.equal(catalog.productsByCategory.Категория[0].id, '0012');
  assert.equal(catalog.productsByCategory.Категория[0].price, 1250.5);
});

test('rejects duplicate codes across categories with row context', () => {
  const book = workbook([['12', 'Хлеб', 100]]);
  book.addWorksheet('Другая').addRow(['12', 'Торт', 200]);
  assert.throws(() => makeCatalog(book), /Другая.*строка 1.*повторяется/);
});

test('rejects incomplete rows, invalid prices and empty catalog', () => {
  for (const price of ['100тенге', -1, 'Infinity']) {
    assert.throws(() => makeCatalog(workbook([['12', 'Хлеб', price]])), /строка 1/);
  }
  assert.throws(() => makeCatalog(workbook([])), /не содержит товаров/);
  assert.throws(() => makeCatalog(workbook([['12', '', 100]])), /строка 1/);
});

test('omits unpriced products and collapses identical duplicate rows with warnings', () => {
  const warnings = [];
  const catalog = makeCatalog(workbook([['12', 'Хлеб', 100], ['12', 'Хлеб', 100], ['13', 'Торт', null]]), (message) => warnings.push(message));
  assert.equal(catalog.productsByCategory.Категория.length, 1);
  assert.equal(warnings.length, 2);
});

test('moving a product between categories does not change its code', () => {
  const before = makeCatalog(workbook([['12', 'Хлеб', 100]]));
  const book = new ExcelJS.Workbook();
  book.addWorksheet('Новая').addRow(['12', 'Хлеб', 200]);
  assert.equal(before.productsByCategory.Категория[0].id, makeCatalog(book).productsByCategory.Новая[0].id);
});

test('photo versions change only with file contents; missing photos use a versioned placeholder', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'catalog-images-test-'));
  try {
    await fs.writeFile(path.join(directory, 'Default.avif'), 'placeholder');
    await fs.writeFile(path.join(directory, '0012.avif'), 'photo one');
    const build = () => attachImages(makeCatalog(workbook([['0012', 'Хлеб', 100], ['0020', 'Торт', 200]])), directory);
    const first = await build();
    const [photo, missing] = first.productsByCategory.Категория;
    assert.match(photo.image, /^\/product-images\/0012\.avif\?v=[a-f0-9]{16}$/);
    assert.equal(photo.imageSources.avif, photo.image);
    assert.equal(photo.imageSources.webp, undefined);
    assert.equal(missing.image, first.fallbackImage);
    assert.match(first.fallbackImage, /Default\.avif\?v=/);
    assert.equal((await build()).productsByCategory.Категория[0].image, photo.image);
    await fs.writeFile(path.join(directory, '0012.avif'), 'photo two');
    await fs.writeFile(path.join(directory, '0020.webp'), 'new photo');
    const next = await build();
    assert.notEqual(next.productsByCategory.Категория[0].image, photo.image);
    assert.equal(next.fallbackImage, first.fallbackImage);
    assert.match(next.productsByCategory.Категория[1].image, /0020\.webp\?v=/);
    assert.equal(next.productsByCategory.Категория[1].imageSources.avif, undefined);
    const repriced = await attachImages(makeCatalog(workbook([['0012', 'Новое имя', 999]])), directory);
    assert.equal(repriced.productsByCategory.Категория[0].image, next.productsByCategory.Категория[0].image);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
