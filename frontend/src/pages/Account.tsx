import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import type { AuthUser } from '../services/authentication.api';
import { deleteAllEvents, exportEvents, exportIcs } from '../services/events.api';

type Props = { user: AuthUser; onDeleteAccount: () => Promise<void> };

export default function Account({ user, onDeleteAccount }: Props) {
  const [action, setAction] = useState<'data' | 'account' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const downloadMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        downloadMenuRef.current.open = false;
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const download = async (format: 'json' | 'ics') => {
    try {
      setError(null);
      const contents =
        format === 'json' ? JSON.stringify(await exportEvents(), null, 2) : await exportIcs();
      const url = URL.createObjectURL(
        new Blob([contents], {
          type: format === 'json' ? 'application/json' : 'text/calendar;charset=utf-8',
        }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `calendar-dashboard.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      if (downloadMenuRef.current) downloadMenuRef.current.open = false;
    } catch (downloadError) {
      setError(
        downloadError instanceof Error ? downloadError.message : 'Could not download calendar.',
      );
    }
  };

  const confirm = async () => {
    if (action === 'data') {
      const result = await deleteAllEvents();
      setMessage(`${result.count} event${result.count === 1 ? '' : 's'} deleted.`);
    }
    if (action === 'account') await onDeleteAccount();
    setAction(null);
  };

  return (
    <main className="account-page">
      <header className="event-manager__heading">
        <h1>My account</h1>
        <p>Review your profile and manage your data</p>
      </header>
      <section className="account-overview">
        <h2>Basic information</h2>
        <dl>
          <div>
            <dt>Name</dt>
            <dd>{user.name || 'Not provided'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email || 'Not used for this demo account'}</dd>
          </div>
          <div>
            <dt>Account type</dt>
            <dd>{user.isDemo ? 'Demo account' : 'Google account'}</dd>
          </div>
        </dl>
        {user.canManageDemoAccounts && (
          <Link className="account-action-link account-control" to="/demo-accounts">
            Manage demo accounts
          </Link>
        )}
      </section>
      <section className="account-overview account-overview--actions">
        <h2>Account actions</h2>
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="account-actions__row">
          <details className="account-download-menu" ref={downloadMenuRef}>
            <summary>Download calendar</summary>
            <div className="account-download-menu__items">
              <button
                className="account-control"
                type="button"
                onClick={() => void download('json')}
              >
                Download as JSON
              </button>
              <button
                className="account-control"
                type="button"
                onClick={() => void download('ics')}
              >
                Download as ICS
              </button>
            </div>
          </details>
          <button className="danger-button" type="button" onClick={() => setAction('data')}>
            Delete all calendar data
          </button>
          <button
            className="danger-button account-delete-button"
            type="button"
            onClick={() => setAction('account')}
          >
            Delete account
          </button>
        </div>
      </section>
      <Modal
        isOpen={action !== null}
        title={action === 'data' ? 'Delete all calendar data?' : 'Delete your account?'}
        confirmLabel={action === 'data' ? 'Delete all data' : 'Delete account'}
        destructive
        onCancel={() => setAction(null)}
        onConfirm={() => void confirm()}
      >
        <p>
          {action === 'data'
            ? 'This permanently deletes every calendar event while keeping your account.'
            : 'This permanently deletes your account and all calendar events.'}
        </p>
        <button
          type="button"
          className="account-export-button"
          onClick={() => void download('json')}
        >
          Download calendar JSON first
        </button>
      </Modal>
    </main>
  );
}
