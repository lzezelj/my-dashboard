import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Navbar from '../src/components/Navbar';

const renderNavbar = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar
        user={{ id: 1, email: 'person@example.com', name: 'Test Person', picture: null }}
        onLogin={vi.fn()}
        onLogout={vi.fn()}
      />
    </MemoryRouter>,
  );

describe('Navbar account navigation', () => {
  it('shows event management as primary navigation', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Manage events' })).toHaveAttribute('href', '/events');
    expect(screen.getByRole('link', { name: 'Add event' })).toHaveAttribute('href', '/events/add');
  });

  it('highlights the current primary page', () => {
    renderNavbar('/events/add');
    expect(screen.getByRole('link', { name: 'Add event' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Manage events' })).not.toHaveAttribute('aria-current');
  });

  it('opens My Account with Overview and Log out', async () => {
    const user = userEvent.setup();
    renderNavbar();
    await user.click(screen.getByRole('button', { name: 'My Account' }));
    expect(screen.getByRole('menuitem', { name: 'Overview' })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
  });
});
