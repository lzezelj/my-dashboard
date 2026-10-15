import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Navbar from '../src/components/Navbar';

vi.mock('../src/services/events.api', () => ({ exportEvents: vi.fn() }));

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <Navbar
        user={{ id: 1, email: 'person@example.com', name: 'Test Person', picture: null }}
        onLogin={vi.fn()}
        onLogout={vi.fn()}
        onDeleteAccount={vi.fn()}
      />
    </MemoryRouter>,
  );

describe('Navbar account menu', () => {
  it('closes after Events is selected', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByRole('button', { name: 'My Account' }));
    await user.click(screen.getByRole('menuitem', { name: 'Events' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes when the user clicks outside it', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByRole('button', { name: 'My Account' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
