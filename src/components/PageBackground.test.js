import { act, render } from '@testing-library/react';
import PageBackground from './PageBackground';

test('covers a long page and updates the tile count when its height changes', () => {
  let resize;
  let pageHeight = 7000;
  const disconnect = jest.fn();
  const OriginalObserver = global.ResizeObserver;
  global.ResizeObserver = class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect() { disconnect(); }
  };
  const bounds = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return { height: this.id === 'root' ? pageHeight : 1400 };
  });
  const host = document.createElement('div');
  host.id = 'root';
  document.body.appendChild(host);
  try {
    const view = render(<PageBackground />, { container: host });
    expect(host.querySelectorAll('.page-background-tile')).toHaveLength(5);
    expect(host.querySelector('.page-background')).toHaveAttribute('aria-hidden', 'true');
    pageHeight = 2800;
    act(() => resize());
    expect(host.querySelectorAll('.page-background-tile')).toHaveLength(2);
    view.unmount();
    expect(disconnect).toHaveBeenCalled();
  } finally {
    bounds.mockRestore();
    global.ResizeObserver = OriginalObserver;
    host.remove();
  }
});
