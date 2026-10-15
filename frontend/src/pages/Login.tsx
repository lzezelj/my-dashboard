import GoogleLoginButton from '../components/GoogleLoginButton';
import type { AuthUser } from '../services/authentication.api';

type LoginProps = {
  onLogin: (user: AuthUser, isNewUser: boolean) => void;
};

export default function Login({ onLogin }: LoginProps) {
  return (
    <main className="login-page">
      <h1>Sign in</h1>
      <p>Sign in with Google to access your dashboard.</p>
      <GoogleLoginButton onLogin={onLogin} />
    </main>
  );
}
