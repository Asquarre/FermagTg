export const PENDING_ORDER_KEY = 'pendingOrder:v1';
export function loadPendingOrder() {
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_ORDER_KEY) || 'null');
    return value && typeof value.orderId === 'string' && Array.isArray(value.items) ? value : null;
  } catch { return null; }
}
export async function preparePendingOrder(payload) {
  const prepare = () => {
    const existing = loadPendingOrder();
    if (existing) return existing;
    const order = { ...payload, orderId: window.crypto.randomUUID() };
    // Persist BEFORE sending. If persistence is blocked, do not create an untrackable order.
    localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
    return order;
  };
  return navigator.locks?.request ? navigator.locks.request(PENDING_ORDER_KEY, prepare) : prepare();
}
export function clearPendingOrder(id) {
  if (loadPendingOrder()?.orderId === id) localStorage.removeItem(PENDING_ORDER_KEY);
}
