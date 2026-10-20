const { CatalogError } = require('./catalog-sync.cjs');

const PATHNAME = 'catalog/current-prices.json';
function createBlobStore(env = process.env, client) {
  const sdk = () => client || require('@vercel/blob');
  const token = () => {
    if (!env.BLOB_READ_WRITE_TOKEN) throw new CatalogError(503, 'Не подключено постоянное хранилище цен.');
    return env.BLOB_READ_WRITE_TOKEN;
  };
  return {
    async read() {
      const result = await sdk().get(PATHNAME, { access: 'private', token: token(), useCache: false });
      if (!result) return null;
      if (result.statusCode !== 200 || !result.stream || !result.blob.etag) throw new Error('Blob read failed');
      if (result.blob.size > 1024 * 1024) throw new Error('Unexpected catalog size');
      const value = await new Response(result.stream).json();
      return { value, etag: result.blob.etag };
    },
    async write(value, etag) {
      try {
        await sdk().put(PATHNAME, JSON.stringify(value), {
          access: 'private', token: token(), addRandomSuffix: false, contentType: 'application/json',
          allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}),
        });
        return true;
      } catch (error) {
        // A changed ETag means another upload committed first. Re-read before retrying.
        if (error instanceof sdk().BlobPreconditionFailedError) return false;
        throw error;
      }
    },
  };
}
module.exports = { createBlobStore, PATHNAME };
