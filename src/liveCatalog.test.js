import { mergeLivePrices, updateCartPrices, pricesDiffer } from './liveCatalog';
import catalog from './data/catalog.generated.json';

test('live prices preserve build identities, categories, photos and cart quantities', () => {
  const first = Object.values(catalog.productsByCategory).flat()[0];
  const data = JSON.parse(JSON.stringify(catalog));
  const updated = Object.values(data.productsByCategory).flat()[0];
  updated.price = first.price + 10;
  updated.name = 'Must not replace name';
  const live = mergeLivePrices(data);
  expect(Object.values(live.productsByCategory).flat()[0]).toEqual({ ...first, price: first.price + 10 });
  const cart = [{ ...first, quantity: 1.5 }];
  const repriced = updateCartPrices(cart, live);
  expect(repriced).toEqual([{ ...first, price: first.price + 10, quantity: 1.5 }]);
  expect(pricesDiffer(cart, repriced)).toBe(true);
  expect(cart[0].price).toBe(first.price);
});
test('incomplete or invalid live catalog is not silently accepted', () => {
  expect(() => mergeLivePrices({ productsByCategory: {} })).toThrow();
  const data = JSON.parse(JSON.stringify(catalog));
  Object.values(data.productsByCategory).flat()[0].price = -1;
  expect(() => mergeLivePrices(data)).toThrow();
});
