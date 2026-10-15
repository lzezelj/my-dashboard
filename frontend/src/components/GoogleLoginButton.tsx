import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import type { AuthUser } from '../services/authentication.api';
import { apiUrl } from '../config';

type GoogleLoginButtonProps = {
  onLogin: (user: AuthUser, isNewUser: boolean) => void;
};

function GoogleLoginButtonContent({ onLogin }: GoogleLoginButtonProps) {
  // Supported by Google Identity Services and this package at runtime, but omitted
  // from the package's bundled GsiButtonConfiguration TypeScript declaration.
  const englishLocale = { locale: 'en' } as { locale: string };

  return (
    <GoogleLogin
      {...englishLocale}
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
          const isNewUser = response.status === 404;
          if (isNewUser) response = await authenticate('register');

          const data = (await response.json()) as { message?: string; user?: AuthUser };

          if (!response.ok) {
            throw new Error(data.message || 'Backend authentication failed');
          }

          if (!data.user) {
            throw new Error('Backend did not return a user');
          }

          onLogin(data.user, isNewUser);
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

export default function GoogleLoginButton(props: GoogleLoginButtonProps) {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <GoogleLoginButtonContent {...props} />
    </GoogleOAuthProvider>
  );
}
