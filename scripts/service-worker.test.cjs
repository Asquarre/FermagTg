const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../public/service-worker.js'), 'utf8');
const response = (contentType = 'image/avif', status = 200) => ({
  status, type: 'basic', headers: { get: () => contentType }, clone() { return this; },
});

function worker() {
  const handlers = {}, stores = new Map();
  let requests = 0, next = response();
  const open = async (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const data = stores.get(name);
    const key = (request) => typeof request === 'string' ? request : request.url;
    return { match: async (req) => data.get(key(req)), put: async (req, res) => data.set(key(req), res),
      delete: async (req) => data.delete(key(req)) };
  };
  vm.runInNewContext(source, {
    URL, console,
    self: { location: { hostname: 'store.example', origin: 'https://store.example' },
      addEventListener: (event, handler) => { handlers[event] = handler; }, clients: { claim: async () => {} } },
    caches: { open, keys: async () => [...stores.keys()], delete: async (name) => stores.delete(name) },
    fetch: async () => { requests++; return next; },
    get localStorage() { throw Error('Saved orders must not be touched'); },
  });
  return { stores, open, requests: () => requests, setResponse: (value) => { next = value; },
    activate: () => { let promise; handlers.activate({ waitUntil: p => { promise = p; } }); return promise; },
    request: (path, destination = 'image', method = 'GET') => {
      let promise;
      handlers.fetch({ request: { url: `https://store.example${path}`, method, destination }, respondWith: p => { promise = p; } });
      return promise;
    } };
}

test('migration deletes only old static caches and preserves user/unrelated caches', async () => {
  const w = worker();
  for (const name of ['fermagtg-static-V1', 'fermagtg-static-V2', 'fermagtg-user-orders', 'another-app']) await w.open(name);
  await w.activate();
  assert.deepEqual([...w.stores.keys()], ['fermagtg-static-V2', 'fermagtg-user-orders', 'another-app']);
});

test('unchanged image version uses cache; a new content version fetches again', async () => {
  const w = worker();
  await w.request('/product-images/12.avif?v=first');
  await w.request('/product-images/12.avif?v=first');
  assert.equal(w.requests(), 1);
  await w.request('/product-images/12.avif?v=second');
  assert.equal(w.requests(), 2);
});

test('404 and HTML fallback are never cached as images; invalid cached responses are replaced', async () => {
  const w = worker();
  for (const bad of [response('text/html'), response('image/avif', 404)]) {
    const path = '/product-images/missing.avif';
    w.setResponse(bad);
    await w.request(path);
    assert.equal(w.stores.get('fermagtg-static-V2').has(`https://store.example${path}`), false);
  }
  const cache = await w.open('fermagtg-static-V2');
  await cache.put('https://store.example/product-images/12.avif', response('text/html'));
  w.setResponse(response());
  const loaded = await w.request('/product-images/12.avif');
  assert.equal(loaded.headers.get('Content-Type'), 'image/avif');
});

test('order endpoints and POST requests bypass caching', () => {
  const w = worker();
  assert.equal(w.request('/api/order-status?orderId=test', ''), undefined);
  assert.equal(w.request('/api/submit-order', '', 'POST'), undefined);
  assert.equal(w.requests(), 0);
  assert.equal(w.stores.size, 0);
});
