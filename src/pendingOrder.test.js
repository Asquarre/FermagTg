import { loadPendingOrder, preparePendingOrder, clearPendingOrder, PENDING_ORDER_KEY } from './pendingOrder';
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'crypto', { configurable: true, value: { randomUUID: jest.fn(() => '12345678-1234-4123-8123-123456789abc') } });
});
test('repeated attempts and reload reuse the saved ID and frozen cart', async () => {
  const first = await preparePendingOrder({ items: [{id:'0012', quantity:2}] });
  const second = await preparePendingOrder({ items: [{id:'0012', quantity:99}] });
  expect(second).toEqual(first);
  expect(loadPendingOrder()).toEqual(first);
  expect(window.crypto.randomUUID).toHaveBeenCalledTimes(1);
  clearPendingOrder('different-id');
  expect(localStorage.getItem(PENDING_ORDER_KEY)).not.toBeNull();
  clearPendingOrder(first.orderId);
  expect(loadPendingOrder()).toBeNull();
});
test('blocked storage prevents preparation of an untrackable order', async () => {
  const storage = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {throw Error('blocked');});
  await expect(preparePendingOrder({items:[]})).rejects.toThrow('blocked');
  storage.mockRestore();
});
