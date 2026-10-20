const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const directory = path.resolve(__dirname, '../.catalog-sync');
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  for (const [filename, url] of [
    ['upload-config.json', 'https://fermag.vercel.app/api/catalog-sync'],
    ['local-config.json', 'http://127.0.0.1:3000/api/catalog-sync'],
  ]) {
    const destination = path.join(directory, filename);
    try {
      await fs.writeFile(destination, JSON.stringify({ url, key: randomBytes(32).toString('hex') }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      console.log(`Создан ${destination}. Ключ не выводится и не попадает в Git.`);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      console.log(`${destination} уже существует; ключ не изменён.`);
    }
  }
}
main().catch(() => { console.error('Не удалось подготовить секретные настройки.'); process.exitCode = 1; });
