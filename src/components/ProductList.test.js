import { fireEvent, render, screen } from '@testing-library/react';
import ProductList from './ProductList';
import catalog from '../data/catalog.generated.json';

test('uses real versioned image sources and a direct placeholder without inventing WebP URLs', () => {
  const placeholder = catalog.fallbackImage;
  const products = [
    { id: 'test-photo', name: 'Фото', catalogueName: 'Фото', price: 100,
      image: '/product-images/test.avif?v=abc', imageSources: { avif: '/product-images/test.avif?v=abc', fallback: '/product-images/test.avif?v=abc' } },
    { id: 'test-missing', name: 'Заглушка', catalogueName: 'Заглушка', price: 100,
      image: placeholder, imageSources: { avif: placeholder, fallback: placeholder } },
  ];
  const props = { products, cart: [], onAdd: jest.fn(), onRemove: jest.fn(), onSetQuantity: jest.fn(), onBack: jest.fn(), onCheckout: jest.fn() };
  const { container } = render(<ProductList {...props} />);
  const photo = screen.getByRole('img', { name: 'Фото' });
  expect(photo).toHaveAttribute('src', '/product-images/test.avif?v=abc');
  expect(container.querySelector('source[type="image/webp"]')).toBeNull();
  expect(screen.getByRole('img', { name: 'Заглушка' })).toHaveAttribute('src', placeholder);
  fireEvent.error(photo);
  expect(photo).toHaveAttribute('src', placeholder);
  expect(photo.closest('picture').querySelector('source')).toBeNull();
});
