import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DemoAccounts from '../src/pages/DemoAccounts';

const api = vi.hoisted(() => ({
  getDemoAccounts: vi.fn(),
  createDemoAccount: vi.fn(),
  deleteDemoAccount: vi.fn(),
}));
vi.mock('../src/services/authentication.api', () => api);

describe('demo account management without cover letters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDemoAccounts.mockResolvedValue([]);
  });

  it('creates accounts and shows one-time credentials without letter fields or actions', async () => {
    const user = userEvent.setup();
    api.createDemoAccount.mockResolvedValue({
      account: { id: 1, name: 'Example Ltd', demoUsername: 'example-reviewer', eventCount: 0 },
      password: 'one-time-demo-password',
    });
    render(<DemoAccounts />);
    await screen.findByText('No demo accounts have been created.');
    await user.type(screen.getByLabelText('Company name'), 'Example Ltd');
    await user.type(screen.getByLabelText('Username'), 'example-reviewer');
    await user.click(screen.getByRole('button', { name: 'Create demo account' }));
    expect(api.createDemoAccount).toHaveBeenCalledWith('example-reviewer', 'Example Ltd', {
      salutation: '',
      position: '',
      source: '',
      companyAddress: '',
    });
    expect(await screen.findByText('Password: one-time-demo-password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy credentials' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Salutation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cover letter|PDF/i })).not.toBeInTheDocument();
  });

  it('deletes an existing account after confirmation', async () => {
    api.getDemoAccounts.mockResolvedValue([
      { id: 5, name: 'Reviewer', demoUsername: 'reviewer', eventCount: 0 },
    ]);
    api.deleteDemoAccount.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DemoAccounts />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(api.deleteDemoAccount).toHaveBeenCalledWith(5));
    expect(await screen.findByText('No demo accounts have been created.')).toBeInTheDocument();
  });
});
