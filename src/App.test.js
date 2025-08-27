import { render, screen } from '@testing-library/react';
import App from './App';

test('renders categories heading', () => {
  render(<App />);
const headingElement = screen.getByText(/категории/i);
  expect(headingElement).toBeInTheDocument();
});
