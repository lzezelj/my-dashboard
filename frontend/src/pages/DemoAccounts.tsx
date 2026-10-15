import { useEffect, useState, type FormEvent } from 'react';
import {
  createDemoAccount,
  deleteDemoAccount,
  getDemoAccounts,
  type DemoAccount,
} from '../services/authentication.api';

type CreatedCredentials = {
  username: string;
  password: string;
};

export default function DemoAccounts() {
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [username, setUsername] = useState('');
  const [label, setLabel] = useState('');
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void getDemoAccounts()
      .then(setAccounts)
      .catch((caughtError: unknown) =>
        setError(caughtError instanceof Error ? caughtError.message : 'Could not load demo accounts'),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setCredentials(null);
    setIsSubmitting(true);
    try {
      const result = await createDemoAccount(username, label);
      setAccounts((current) => [result.account, ...current]);
      setCredentials({ username: result.account.demoUsername, password: result.password });
      setUsername('');
      setLabel('');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not create demo account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (account: DemoAccount) => {
    if (!window.confirm(`Delete demo account "${account.demoUsername}" and all of its events?`)) return;
    setError(null);
    try {
      await deleteDemoAccount(account.id);
      setAccounts((current) => current.filter(({ id }) => id !== account.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not delete demo account');
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(
      `Username: ${credentials.username}\nPassword: ${credentials.password}`,
    );
  };

  return (
    <main className="demo-accounts-page">
      <header className="demo-accounts-page__header">
        <h1>Demo accounts</h1>
        <p>Create isolated, empty accounts for portfolio reviewers.</p>
      </header>

      <section className="demo-account-panel">
        <h2>Create demo account</h2>
        <form className="demo-account-form" onSubmit={(event) => void submit(event)}>
          <label>
            Company label
            <input
              value={label}
              maxLength={100}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Example Company"
            />
          </label>
          <label>
            Username
            <input
              value={username}
              minLength={3}
              maxLength={64}
              pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,63}"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="example-company"
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create demo account'}
          </button>
        </form>
        {credentials && (
          <div className="demo-credentials" role="status">
            <p><strong>Save these credentials now.</strong> The password cannot be shown again.</p>
            <code>Username: {credentials.username}</code>
            <code>Password: {credentials.password}</code>
            <button type="button" onClick={() => void copyCredentials()}>Copy credentials</button>
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>

      <section className="demo-account-panel">
        <h2>Existing demo accounts</h2>
        {isLoading ? (
          <p>Loading demo accounts…</p>
        ) : accounts.length === 0 ? (
          <p>No demo accounts have been created.</p>
        ) : (
          <ul className="demo-account-list">
            {accounts.map((account) => (
              <li key={account.id}>
                <div>
                  <strong>{account.name || account.demoUsername}</strong>
                  <span>{account.demoUsername} · {account.eventCount} events</span>
                </div>
                <button type="button" className="danger-button" onClick={() => void remove(account)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
