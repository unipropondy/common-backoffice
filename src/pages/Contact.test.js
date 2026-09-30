import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Contact from './Contact';
import axios from 'axios';

jest.mock('axios');

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ UserId: 'user-1' }));
  axios.get.mockImplementation((url) => {
    if (url.endsWith('/kitchen')) {
      return Promise.resolve({ data: [] });
    }

    if (url.endsWith('/kitchen/nextcode')) {
      return Promise.resolve({ data: { NextNumber: 10 } });
    }

    return Promise.resolve({ data: [] });
  });
});

test('kitchen modal overlay is visible above the page content', async () => {
  render(<Contact />);

  fireEvent.click(screen.getByRole('button', { name: /new/i }));

  await waitFor(() => {
    expect(screen.getByText(/new kitchen/i)).toBeInTheDocument();
  });

  const modal = document.querySelector('.kitchen_modal');
  expect(modal).toBeInTheDocument();
  expect(modal).toHaveClass('kitchen_modal');
});
