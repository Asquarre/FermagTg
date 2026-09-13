import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import App from './App';
import catalog from './data/catalog.generated.json';
import { saveLastOrder } from './orderStorage';
import axios from 'axios';
import { PENDING_ORDER_KEY } from './pendingOrder';

jest.mock('axios', () => ({ post: jest.fn(), get: jest.fn() }));
jest.mock('./components/Checkout', () => ({ cart }) => (
  <div data-testid="restored-cart">{JSON.stringify(cart)}</div>
));

beforeEach(() => localStorage.clear());

test('reload confirms the existing order without submitting a second one', async () => {
  const product = Object.values(catalog.productsByCategory).flat()[0];
  localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({orderId:'12345678-1234-4123-8123-123456789abc',items:[{...product,quantity:1}]}));
  axios.get.mockResolvedValueOnce({data:{status:'confirmed'}});
  const alert = jest.spyOn(window, 'alert').mockImplementation(() => {});
  render(<App />);
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Мы приняли ваш заказ!'));
  expect(axios.post).not.toHaveBeenCalled();
  expect(localStorage.getItem(PENDING_ORDER_KEY)).toBeNull();
  alert.mockRestore();
});

test('pending Sheets operation is not shown as a successful order', async () => {
  jest.useFakeTimers();
  localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({orderId:'12345678-1234-4123-8123-123456789abc',items:[]}));
  axios.get.mockResolvedValue({data:{status:'processing'}});
  const alert = jest.spyOn(window, 'alert').mockImplementation(() => {});
  const view = render(<App />);
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByRole('status')).toHaveTextContent('Ваш заказ обрабатывается');
  expect(screen.queryByText(/После перезагрузки страницы/)).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Оформляем заказ' })).toHaveClass('checkout-heading');
  expect(document.querySelector('.order-pending-loader')).toHaveAttribute('aria-hidden', 'true');
  expect(alert).not.toHaveBeenCalled();
  expect(localStorage.getItem(PENDING_ORDER_KEY)).not.toBeNull();
  view.unmount(); alert.mockRestore(); jest.useRealTimers();
});

test('renders categories heading', () => {
  render(<App />);
const headingElement = screen.getByText(/категории/i);
  expect(headingElement).toBeInTheDocument();
});

test('repeat uses the exact nomenclature code and current catalog price', () => {
  const product = Object.values(catalog.productsByCategory).flat()[0];
  saveLastOrder([{ id: product.id, name: 'Старое название', quantity: 2, price: 1 }]);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Повторить прошлый заказ/ }));
  const cart = JSON.parse(screen.getByTestId('restored-cart').textContent);
  expect(cart).toEqual([{ ...product, quantity: 2 }]);
});

test('does not match a missing code by product name', () => {
  const product = Object.values(catalog.productsByCategory).flat()[0];
  saveLastOrder([{ id: 'missing-code', name: product.name, quantity: 2 }]);
  const alert = jest.spyOn(window, 'alert').mockImplementation(() => {});
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Повторить прошлый заказ/ }));
  expect(alert).toHaveBeenCalledWith(expect.stringContaining('Товары недоступны'));
  expect(screen.queryByTestId('restored-cart')).not.toBeInTheDocument();
  alert.mockRestore();
});
