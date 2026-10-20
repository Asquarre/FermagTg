import { useCallback, useEffect, useRef, useState } from 'react';
import builtCatalog from './data/catalog.generated.json';

// Only prices are dynamic. Product identity, category, name and photos stay in the build.
export function mergeLivePrices(data) {
  if (!data || !data.productsByCategory) throw new Error('Invalid catalog');
  const prices = new Map(Object.values(data.productsByCategory).flat().map((p) => [p.id, p.price]));
  return { ...builtCatalog, productsByCategory: Object.fromEntries(
    Object.entries(builtCatalog.productsByCategory).map(([category, products]) => [category, products.map((product) => {
      const price = prices.get(product.id);
      if (!Number.isFinite(price) || price < 0) throw new Error('Invalid catalog price');
      return { ...product, price };
    })]),
  ) };
}

export function updateCartPrices(cart, catalog) {
  const products = new Map(Object.values(catalog.productsByCategory).flat().map((p) => [p.id, p]));
  return cart.map((item) => {
    const current = products.get(item.id);
    return current ? { ...item, price: current.price } : item;
  });
}
export const pricesDiffer = (before, after) => before.some((item, index) => item.price !== after[index]?.price);

export function useLiveCatalog(paused) {
  const [catalog, setCatalog] = useState(builtCatalog);
  const requestNumber = useRef(0);
  const refresh = useCallback(async () => {
    if (typeof fetch !== 'function') return null;
    const number = ++requestNumber.current;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/catalog', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Catalog unavailable');
      const updated = mergeLivePrices(await response.json());
      if (number !== requestNumber.current) return null;
      setCatalog(updated);
      return updated;
    } finally { clearTimeout(timer); }
  }, []);
  useEffect(() => {
    if (paused || typeof fetch !== 'function') return undefined;
    let active = true;
    const check = () => { if (active && document.visibilityState !== 'hidden') refresh().catch(() => {}); };
    check();
    const timer = setInterval(check, 60000);
    window.addEventListener('focus', check);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', check); };
  }, [paused, refresh]);
  return { catalog, refresh };
}
