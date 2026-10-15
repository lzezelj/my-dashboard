import { GoogleLogin } from '@react-oauth/google';
import type { AuthUser } from '../services/authentication.api';
import { apiUrl } from '../config';

type GoogleLoginButtonProps = {
  onLogin: (user: AuthUser) => void;
};

export default function GoogleLoginButton({ onLogin }: GoogleLoginButtonProps) {
  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        if (!credentialResponse.credential) {
          console.error('No Google credential received');
          return;
        }

        try {
          const authenticate = (endpoint: 'login' | 'register') =>
            fetch(`${apiUrl}/api/auth/google/${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ credential: credentialResponse.credential }),
            });

          let response = await authenticate('login');
          if (response.status === 404) response = await authenticate('register');

          const data = (await response.json()) as { message?: string; user?: AuthUser };

          if (!response.ok) {
            throw new Error(data.message || 'Backend authentication failed');
          }

          if (!data.user) {
            throw new Error('Backend did not return a user');
          }

          onLogin(data.user);
        } catch (error) {
          console.error('Backend authentication error:', error);
        }
      }}
      onError={() => {
        console.error('Google login failed');
      }}
    />
  );
}
