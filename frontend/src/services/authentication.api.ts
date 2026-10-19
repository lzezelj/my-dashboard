import { apiUrl } from '../config';
import { fetchWithWakeRetry } from '../utils/fetchWithWakeRetry';

export type AuthUser = {
  id: number;
  email: string | null;
  name: string | null;
  isDemo?: boolean;
  canManageDemoAccounts?: boolean;
};

export type DemoAccount = {
  id: number;
  demoUsername: string;
  name: string | null;
  createdAt: string;
  eventCount: number;
  applicationSalutation: string | null;
  applicationPosition: string | null;
  applicationSource: string | null;
  applicationCompanyAddress: string | null;
};

const authUrl = `${apiUrl}/api/auth`;

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetchWithWakeRetry(`${authUrl}/me`, { credentials: 'include' });

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

const responseMessage = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
};

export async function loginWithDemoAccount(username: string, password: string): Promise<AuthUser> {
  const response = await fetchWithWakeRetry(`${authUrl}/demo/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) throw new Error(await responseMessage(response, 'Could not sign in'));
  const { user } = (await response.json()) as { user: AuthUser };
  return user;
}

export async function getDemoAccounts(): Promise<DemoAccount[]> {
  const response = await fetch(`${authUrl}/demo-accounts`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(await responseMessage(response, 'Could not load demo accounts'));
  }
  const { accounts } = (await response.json()) as { accounts: DemoAccount[] };
  return accounts;
}

export async function createDemoAccount(
  username: string,
  label: string,
  application: {
    salutation: string;
    position: string;
    source: string;
    companyAddress: string;
  },
): Promise<{ account: DemoAccount; password: string }> {
  const response = await fetch(`${authUrl}/demo-accounts`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, label, ...application }),
  });
  if (!response.ok) {
    throw new Error(await responseMessage(response, 'Could not create demo account'));
  }
  return response.json() as Promise<{ account: DemoAccount; password: string }>;
}

export async function deleteDemoAccount(id: number): Promise<void> {
  const response = await fetch(`${authUrl}/demo-accounts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(await responseMessage(response, 'Could not delete demo account'));
  }
}
