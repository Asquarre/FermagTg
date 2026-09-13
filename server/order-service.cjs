const { createHash } = require('node:crypto');

const validId = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
class OrderError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function normalize(body) {
  if (!validId(body?.orderId)) throw new OrderError(400, 'Обновите страницу и повторите оформление заказа.');
  const result = {};
  for (const key of ['customerName', 'address', 'phone', 'fulfillmentType']) {
    if (typeof body[key] !== 'string' || body[key].length > 1000) throw new OrderError(400, 'Проверьте данные покупателя.');
    result[key] = body[key].trim();
  }
  if (!result.customerName || result.phone.replace(/\D/g, '').length < 11 || !['Доставка', 'Самовывоз'].includes(result.fulfillmentType) || (result.fulfillmentType === 'Доставка' && !result.address)) {
    throw new OrderError(400, 'Проверьте имя, телефон и способ получения.');
  }
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 500) throw new OrderError(400, 'Некорректная корзина.');
  const seen = new Set();
  result.items = body.items.map((item) => {
    if (!item || typeof item.id !== 'string' || seen.has(item.id) ||
      !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 100000 ||
      Math.abs(item.quantity * 10 - Math.round(item.quantity * 10)) > 0.00001 ||
      !Number.isFinite(item.price) || item.price < 0) throw new OrderError(400, 'Проверьте товары и количество.');
    seen.add(item.id);
    return { id: item.id, quantity: item.quantity, price: item.price };
  });
  return result;
}
// Canonicalize only the fingerprint; the displayed basket keeps the customer's order.
const fingerprint = (payload) => createHash('sha256').update(JSON.stringify({
  ...payload, items: [...payload.items].sort((a, b) => a.id.localeCompare(b.id)),
})).digest('hex');

function resolveOrderDate(timestamp, now) {
  if (typeof timestamp === 'string' || typeof timestamp === 'number' || timestamp instanceof Date) {
    const parsed = new Date(timestamp);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(now());
}

// Stable across requests, cold starts and deployments. Never choose a new sheet ID on retry.
const sheetIdFor = (id) => (createHash('sha256').update(id.toLowerCase()).digest().readUInt32BE(0) & 0x7fffffff) || 1;
function createOrderService({ sheets, telegram, catalog, now = Date.now }) {
  async function submit(body) {
    const payload = normalize(body);
    const hash = fingerprint(payload);
    const id = body.orderId.toLowerCase();
    const existing = await sheets.find(id);
    if (existing) {
      if (existing.hash && existing.hash !== hash) throw new OrderError(409, 'Этот запрос уже принят с другим составом.');
      return existing;
    }
    const products = new Map(Object.values(catalog.productsByCategory).flat().map((item) => [item.id, item]));
    const items = payload.items.map((item) => {
      const product = products.get(item.id);
      if (!product || product.price !== item.price) throw new OrderError(409, 'Каталог изменился. Обновите страницу и проверьте корзину.');
      return { ...item, name: product.name, catalogueName: product.catalogueName || product.name };
    });
    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    if (!Number.isFinite(total)) throw new OrderError(400, 'Некорректная сумма.');
    if (payload.fulfillmentType === 'Доставка' && total < 25000) throw new OrderError(400, 'Доставка доступна от 25 000 тенге.');
    const order = { id, hash, payload: { ...payload, items }, total,
      createdAt: resolveOrderDate(body.timestamp, now).toISOString(), sheetId: sheetIdFor(id), sheetsDone: false };
    const created = await sheets.ensure(order);
    order.sheetsDone = true;
    // Only the request that received a successful CREATE response sends Telegram.
    // Replays and ambiguous Google responses must not resend the entire order.
    if (created) {
      try {
        await telegram.send(order);
        console.log('Order completed', { orderId: id });
      } catch {
        console.error('Order saved; Telegram delivery failed or unknown', { orderId: id });
      }
    }
    return order;
  }
  return { submit, find: (id) => sheets.find(id.toLowerCase()) };
}
function publicStatus(order) {
  return { orderId: order.id, status: order.sheetsDone ? 'confirmed' : 'processing', retryAfterMs: 5000 };
}
module.exports = { createOrderService, OrderError, validId, publicStatus, sheetIdFor };
