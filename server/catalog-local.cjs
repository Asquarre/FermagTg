// Development only: never imported by a Vercel function or real order integrations.
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createCatalogService, createCatalogHandlers } = require('./catalog-sync.cjs');

function createLocalCatalog(directory, secret) {
  const filename = path.join(directory, 'prices.json');
  // Serialize local writes, including compare-and-swap. Production uses Blob ETags instead.
  let queue = Promise.resolve();
  const store = {
    async read() {
      try { return JSON.parse(await fs.readFile(filename, 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    write(value, etag) {
      const operation = queue.then(async () => {
        if ((await store.read())?.etag !== etag) return false;
        await fs.mkdir(directory, { recursive: true });
        const temp = path.join(directory, `${randomUUID()}.tmp`);
        await fs.writeFile(temp, JSON.stringify({ value, etag: randomUUID() }), { mode: 0o600 });
        await fs.rename(temp, filename);
        return true;
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
  const catalog = require('../src/data/catalog.generated.json');
  const service = createCatalogService({ catalog, store });
  const getCatalog = async () => (await store.read()) ? service.catalog() : catalog;
  return createCatalogHandlers({ service, getCatalog, secret });
}
module.exports = { createLocalCatalog };
