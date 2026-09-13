// Increase only when saved product identifiers / order structure become incompatible.
export const ORDER_CACHE_VERSION = 2;
export const ORDER_CACHE_KEY = 'lastOrder:v2';

export function loadLastOrder() {
  try {
    localStorage.removeItem('lastOrder');
    const saved = JSON.parse(localStorage.getItem(ORDER_CACHE_KEY) || 'null');
    if (!saved) return [];
    if (saved.version !== ORDER_CACHE_VERSION || !Array.isArray(saved.items)) {
      localStorage.removeItem(ORDER_CACHE_KEY);
      return [];
    }
    return saved.items.filter((item) => item && typeof item.id === 'string' && item.id.length > 0 && Number.isFinite(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

export function saveLastOrder(cart) {
  const items = cart.map(({ id, name, quantity }) => ({ id, name, quantity }));
  try {
    localStorage.setItem(ORDER_CACHE_KEY, JSON.stringify({ version: ORDER_CACHE_VERSION, items }));
  } catch (error) {
    // A storage restriction must not turn an accepted order into a failed order.
    console.warn('Не удалось сохранить прошлый заказ', error);
  }
  return items;
}
