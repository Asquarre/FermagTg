// Deliberately no option for a production URL or production config.
const fs = require('node:fs/promises');
const path = require('node:path');
async function main() {
  const root = path.resolve(__dirname, '..');
  const config = JSON.parse(await fs.readFile(path.join(root, '.catalog-sync/local-config.json'), 'utf8'));
  const filename = path.resolve(process.argv[2] || path.join(root, 'public/Цены.xlsx'));
  const stat = await fs.stat(filename);
  const response = await fetch('http://127.0.0.1:3000/api/catalog-sync', {
    method: 'POST', redirect: 'error', headers: {
      Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/octet-stream',
      'X-Catalog-Updated-At': stat.mtime.toISOString(),
    }, body: await fs.readFile(filename), signal: AbortSignal.timeout(60000),
  });
  console.log(`HTTP ${response.status}`, await response.text());
  if (!response.ok) process.exitCode = 1;
}
main().catch(() => { console.error('Локальная загрузка не выполнена. Запустите npm run catalog:prepare-sync и npm run dev.'); process.exitCode = 1; });
