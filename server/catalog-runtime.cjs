const { createCatalogService, createCatalogHandlers, CatalogError } = require('./catalog-sync.cjs');
const { createBlobStore } = require('./catalog-blob.cjs');
const baseCatalog = require('../src/data/catalog.generated.json');

const service = createCatalogService({ catalog: baseCatalog, store: createBlobStore() });
async function getCatalog() {
  if (process.env.CATALOG_SYNC_ENABLED !== 'true') return baseCatalog;
  if (process.env.VERCEL_ENV !== 'production') throw new CatalogError(503, 'Рабочие цены не подключаются к тестовым окружениям.');
  return service.catalog();
}
function getHandlers() {
  return createCatalogHandlers({ service, getCatalog, secret: process.env.CATALOG_SYNC_SECRET,
    allowUpload: process.env.VERCEL_ENV === 'production' });
}
module.exports = { getCatalog, getHandlers };
