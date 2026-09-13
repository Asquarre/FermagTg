const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, readdir, readFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createLocalOrdersApp } = require('./local-orders.cjs');

test('local API saves only a local order and rejects empty orders', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'local-orders-test-'));
  const server = createLocalOrdersApp(directory).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/submit-order`;
    const post = (body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await post({ items: [] })).status, 400);
    assert.deepEqual(await readdir(directory), []);
    const body = { orderId: '12345678-1234-4123-8123-123456789abc', customerName: 'Локальный тест', items: [{ id: '0012', name: 'Хлеб', price: 100, quantity: 2 }] };
    const response = await post(body);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.testMode, true);
    assert.equal(result.status, 'confirmed');
    assert.equal((await post(body)).status, 200);
    assert.equal((await readdir(directory)).length, 1);
    const status = await fetch(`http://127.0.0.1:${server.address().port}/api/order-status?orderId=${body.orderId}`);
    assert.equal((await status.json()).status, 'confirmed');
    const order = JSON.parse(await readFile(path.join(directory, `${result.orderId}.json`), 'utf8'));
    assert.equal(order.total, 200);
    assert.equal(order.items[0].id, '0012');
    assert.deepEqual(order.delivery, { telegram: 'not_sent', googleSheets: 'not_sent' });
    assert.equal(Object.keys(require.cache).some((file) => file.endsWith('/api/submit-order.js')), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
