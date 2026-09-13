import { loadLastOrder, saveLastOrder, ORDER_CACHE_KEY } from './orderStorage';

beforeEach(() => localStorage.clear());

test('clears legacy order but preserves unrelated settings and new orders', () => {
  localStorage.setItem('lastOrder', JSON.stringify([{ id: 1112, quantity: 1 }]));
  localStorage.setItem('theme', 'dark');
  const items = [{ id: '0012', name: 'Хлеб', quantity: 2, price: 100 }];
  saveLastOrder(items);
  expect(loadLastOrder()).toEqual([{ id: '0012', name: 'Хлеб', quantity: 2 }]);
  expect(localStorage.getItem('lastOrder')).toBeNull();
  expect(localStorage.getItem('theme')).toBe('dark');
  expect(loadLastOrder()).toHaveLength(1);
});

test('invalid or incompatible data does not restore an order', () => {
  localStorage.setItem(ORDER_CACHE_KEY, '{');
  expect(loadLastOrder()).toEqual([]);
  localStorage.setItem(ORDER_CACHE_KEY, JSON.stringify({ version: 1, items: [] }));
  expect(loadLastOrder()).toEqual([]);
  expect(localStorage.getItem(ORDER_CACHE_KEY)).toBeNull();
});

test('storage failure does not fail an already accepted order', () => {
  const storage = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(saveLastOrder([{ id: '12', name: 'Хлеб', quantity: 1 }])).toHaveLength(1);
  storage.mockRestore();
  warning.mockRestore();
});
