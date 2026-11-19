import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the build pipeline view on the home route', () => {
  render(<App />);
  expect(screen.getByText(/build-pipeline/i)).toBeInTheDocument();
});
