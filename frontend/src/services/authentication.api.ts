import { apiUrl } from '../config';

export type AuthUser = {
  id: number;
  email: string | null;
  name: string | null;
};

const authUrl = `${apiUrl}/api/auth`;

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${authUrl}/me`, { credentials: 'include' });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Could not restore your session');
  }

  const { user } = (await response.json()) as { user: AuthUser };
  return user;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${authUrl}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Could not log out');
  }
}

export async function deleteAccount(): Promise<void> {
  const response = await fetch(`${authUrl}/account`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Could not delete account');
  }
}
