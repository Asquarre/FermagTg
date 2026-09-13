import { act, render } from '@testing-library/react';
import AnimatedNumber from './AnimatedNumber';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('keeps the outgoing digit for the full CSS transition duration', () => {
  const { container, rerender } = render(<AnimatedNumber value={1} />);
  rerender(<AnimatedNumber value={2} />);
  expect(container.querySelector('.digit-up-enter-active')).toHaveTextContent('2');
  act(() => jest.advanceTimersByTime(150));
  expect(container.querySelector('.digit-up-exit-active')).toHaveTextContent('1');
  act(() => jest.advanceTimersByTime(150));
  expect(container.textContent).toBe('2');
  expect(container.querySelector('.digit-up-exit-active')).toBeNull();
});

test('rapid quantity changes settle on the latest value in either direction', () => {
  const { container, rerender } = render(<AnimatedNumber value={1} />);
  for (const value of [2, 3, 2, 1.5, 10, 9]) {
    rerender(<AnimatedNumber value={value} />);
    act(() => jest.advanceTimersByTime(50));
  }
  act(() => jest.advanceTimersByTime(300));
  expect(container.textContent).toBe('9');
  expect(container.querySelectorAll('.digit')).toHaveLength(1);
});

test('decreasing uses the same downward direction for both digits and keeps it on rerender', () => {
  const { container, rerender } = render(<AnimatedNumber value={1} />);
  rerender(<AnimatedNumber value={2} />);
  act(() => jest.advanceTimersByTime(300));
  rerender(<AnimatedNumber value={1} />);
  expect(container.querySelector('.digit-down-enter-active')).toHaveTextContent('1');
  expect(container.querySelector('.digit-down-exit-active')).toHaveTextContent('2');
  rerender(<AnimatedNumber value={1} className="qty-inline" />);
  expect(container.querySelector('.digit-down-enter-active')).toHaveTextContent('1');
  act(() => jest.advanceTimersByTime(300));
  expect(container.textContent).toBe('1');
  rerender(<AnimatedNumber value={2} />);
  expect(container.querySelector('.digit-up-enter-active')).toHaveTextContent('2');
  expect(container.querySelector('.digit-up-exit-active')).toHaveTextContent('1');
  act(() => jest.advanceTimersByTime(300));
  expect(container.textContent).toBe('2');
});
