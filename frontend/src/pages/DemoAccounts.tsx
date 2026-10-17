import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  createDemoAccount,
  deleteDemoAccount,
  getDemoAccounts,
  type DemoAccount,
} from '../services/authentication.api';
import { createGermanCoverLetter, type CreatedCredentials } from '../utils/createGermanCoverLetter';
import Modal from '../components/Modal';
import CoverLetterDocument from '../components/CoverLetterDocument';

export default function DemoAccounts() {
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [username, setUsername] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [salutation, setSalutation] = useState('Sehr geehrte Damen und Herren');
  const [position, setPosition] = useState('');
  const [source, setSource] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [applicationUrl, setApplicationUrl] = useState(() => window.location.origin);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const coverLetter = useMemo(
    () => (credentials ? createGermanCoverLetter(credentials, applicationUrl) : ''),
    [credentials, applicationUrl],
  );

  useEffect(() => {
    void getDemoAccounts()
      .then(setAccounts)
      .catch((caughtError: unknown) =>
        setError(
          caughtError instanceof Error ? caughtError.message : 'Could not load demo accounts',
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setCredentials(null);
    setIsSubmitting(true);
    try {
      const result = await createDemoAccount(username, companyName, {
        salutation,
        position,
        source,
        companyAddress,
      });
      setAccounts((current) => [result.account, ...current]);
      setCredentials({ account: result.account, password: result.password });
      setUsername('');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Could not create demo account',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (account: DemoAccount) => {
    if (!window.confirm(`Delete demo account "${account.demoUsername}" and all of its events?`))
      return;
    setError(null);
    try {
      await deleteDemoAccount(account.id);
      setAccounts((current) => current.filter(({ id }) => id !== account.id));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Could not delete demo account',
      );
    }
  };

  const copy = (value: string) => navigator.clipboard.writeText(value);
  const saveLetterAsPdf = () => window.print();

  return (
    <main className="demo-accounts-page">
      <header className="demo-accounts-page__header">
        <h1>Demo accounts</h1>
        <p>Create an isolated account and a tailored German cover letter for a job application.</p>
      </header>

      <section className="demo-account-panel">
        <h2>Create demo account</h2>
        <form className="demo-account-form" onSubmit={(event) => void submit(event)}>
          <label>
            Company name
            <input
              value={companyName}
              maxLength={100}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Example Company GmbH"
              required
            />
          </label>
          <label>
            Position
            <input
              value={position}
              maxLength={150}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="Junior Softwareentwickler"
              required
            />
          </label>
          <label>
            Salutation
            <input
              value={salutation}
              maxLength={150}
              onChange={(event) => setSalutation(event.target.value)}
              placeholder="Sehr geehrte Frau Müller"
              required
            />
          </label>
          <label>
            Job listing source
            <input
              value={source}
              maxLength={300}
              onChange={(event) => setSource(event.target.value)}
              placeholder="StepStone oder Ihre Stellenanzeige auf ..."
            />
          </label>
          <label className="demo-account-form__wide">
            Company address
            <textarea
              value={companyAddress}
              maxLength={500}
              rows={3}
              onChange={(event) => setCompanyAddress(event.target.value)}
              placeholder={'Musterstraße 1\n12345 Musterstadt'}
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
          <label>
            Deployed website URL
            <input
              type="url"
              value={applicationUrl}
              maxLength={2048}
              onChange={(event) => setApplicationUrl(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create account and cover letter'}
          </button>
        </form>

        {credentials && (
          <div className="demo-credentials" role="status">
            <p>
              <strong>Save these credentials and the letter now.</strong> The password cannot be
              shown again.
            </p>
            <code>Username: {credentials.account.demoUsername}</code>
            <code>Password: {credentials.password}</code>
            <div className="demo-credentials__actions">
              <button
                type="button"
                onClick={() =>
                  void copy(
                    `Username: ${credentials.account.demoUsername}\nPassword: ${credentials.password}`,
                  )
                }
              >
                Copy credentials
              </button>
              <button type="button" onClick={() => void copy(coverLetter)}>
                Copy cover letter
              </button>
              <button type="button" onClick={() => setIsPreviewOpen(true)}>
                Preview and save as PDF
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
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
                  <span>
                    {account.applicationPosition || 'No position'} · {account.demoUsername} ·{' '}
                    {account.eventCount} events
                  </span>
                </div>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => void remove(account)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        isOpen={isPreviewOpen && credentials !== null}
        title="Cover letter preview"
        confirmLabel="Save as PDF"
        cancelLabel="Close"
        onConfirm={saveLetterAsPdf}
        onCancel={() => setIsPreviewOpen(false)}
        className="cover-letter-modal"
      >
        <p className="cover-letter-preview-help">
          Select &quot;Save as PDF&quot; as the destination in the browser print dialog.
        </p>
        <article className="cover-letter-print-area" aria-label="German cover letter preview">
          <CoverLetterDocument content={coverLetter} />
        </article>
      </Modal>
      {credentials &&
        createPortal(
          <div className="cover-letter-print-root" aria-hidden="true">
            <CoverLetterDocument content={coverLetter} />
          </div>,
          document.body,
        )}
    </main>
  );
}
