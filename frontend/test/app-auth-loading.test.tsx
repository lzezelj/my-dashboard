import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import type { AuthUser } from '../src/services/authentication.api';

const authentication = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock('../src/services/authentication.api', () => authentication);
vi.mock('../src/components/Calendar', () => ({ default: () => <div>Calendar loaded</div> }));

describe('App authentication loading state', () => {
  it('does not render signed-out content before the session check finishes', async () => {
    let resolveSession!: (user: AuthUser | null) => void;
    authentication.getCurrentUser.mockReturnValue(
      new Promise<AuthUser | null>((resolve) => {
        resolveSession = resolve;
      }),
    );

    render(
      <MemoryRouter initialEntries={['/home']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading Calendar Dashboard…');
    expect(screen.queryByText('Keep your plans in one place.')).not.toBeInTheDocument();

    resolveSession({ id: 1, email: 'person@example.com', name: 'Test Person' });

    expect(await screen.findByText('Calendar loaded')).toBeInTheDocument();
    expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
