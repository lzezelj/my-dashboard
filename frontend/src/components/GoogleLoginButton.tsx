import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useState } from 'react';
import type { AuthUser } from '../services/authentication.api';
import { apiUrl } from '../config';
import { fetchWithWakeRetry } from '../utils/fetchWithWakeRetry';

type GoogleLoginButtonProps = {
  onLogin: (user: AuthUser, isNewUser: boolean) => void;
};

function GoogleLoginButtonContent({ onLogin }: GoogleLoginButtonProps) {
  const [error, setError] = useState<string | null>(null);
  // Supported by Google Identity Services and this package at runtime, but omitted
  // from the package's bundled GsiButtonConfiguration TypeScript declaration.
  const englishLocale = { locale: 'en' } as { locale: string };

  return (
    <div className="google-login-control">
      <GoogleLogin
        {...englishLocale}
        onSuccess={async (credentialResponse) => {
          setError(null);
          if (!credentialResponse.credential) {
            setError('Google did not return a login credential. Please try again.');
            return;
          }

          try {
            const authenticate = (endpoint: 'login' | 'register') =>
              fetchWithWakeRetry(`${apiUrl}/api/auth/google/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ credential: credentialResponse.credential }),
              });

            let response = await authenticate('login');
            const isNewUser = response.status === 404;
            if (isNewUser) response = await authenticate('register');

            const data = (await response.json().catch(() => null)) as {
              message?: string;
              user?: AuthUser;
            } | null;

            if (!response.ok) {
              throw new Error(
                data?.message ||
                  ([502, 503, 504].includes(response.status)
                    ? 'The service is still waking up. Please try again in a moment.'
                    : 'Backend authentication failed'),
              );
            }

            if (!data?.user) {
              throw new Error('Backend did not return a user');
            }

            onLogin(data.user, isNewUser);
          } catch (error) {
            console.error('Backend authentication error:', error);
            setError(error instanceof Error ? error.message : 'Could not complete Google login');
          }
        }}
        onError={() => {
          console.error('Google login failed');
          setError('Google login failed. Please try again.');
        }}
      />
      {error && (
        <p className="form-error google-login-control__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function GoogleLoginButton(props: GoogleLoginButtonProps) {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <GoogleLoginButtonContent {...props} />
    </GoogleOAuthProvider>
  );
}
