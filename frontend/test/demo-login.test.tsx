import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DemoLoginForm from '../src/components/DemoLoginForm';

const authentication = vi.hoisted(() => ({
  loginWithDemoAccount: vi.fn(),
}));

vi.mock('../src/services/authentication.api', () => authentication);

describe('DemoLoginForm', () => {
  it('signs in with the supplied reviewer credentials', async () => {
    const demoUser = {
      id: 12,
      email: null,
      name: 'Example Company',
      isDemo: true,
      canManageDemoAccounts: false,
    };
    authentication.loginWithDemoAccount.mockResolvedValue(demoUser);
    const onLogin = vi.fn();
    const user = userEvent.setup();
    render(<DemoLoginForm onLogin={onLogin} />);

    await user.type(screen.getByLabelText('Username'), 'example-company');
    await user.type(screen.getByLabelText('Password'), 'generated-demo-password');
    await user.click(screen.getByRole('button', { name: 'Sign in to demo' }));

    expect(authentication.loginWithDemoAccount).toHaveBeenCalledWith(
      'example-company',
      'generated-demo-password',
    );
    expect(onLogin).toHaveBeenCalledWith(demoUser, false);
  });
});
