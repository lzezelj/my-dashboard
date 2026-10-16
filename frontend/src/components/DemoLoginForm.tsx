import { useState, type FormEvent } from 'react';
import { loginWithDemoAccount, type AuthUser } from '../services/authentication.api';

type DemoLoginFormProps = {
  onLogin: (user: AuthUser, isNewUser: boolean) => void;
};

export default function DemoLoginForm({ onLogin }: DemoLoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      onLogin(await loginWithDemoAccount(username, password), false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="demo-login" onSubmit={(event) => void submit(event)}>
      <p className="demo-login__title">Reviewer demo access</p>
      <label>
        Username
        <input
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in to demo'}
      </button>
    </form>
  );
}
