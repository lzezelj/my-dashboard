import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import IcsImportPreview from '../components/IcsImportPreview';
import ImportPreview from '../components/ImportPreview';
import type { AuthUser } from '../services/authentication.api';

export default function Welcome({ user }: { user: AuthUser | null }) {
  const [importType, setImportType] = useState<'json' | 'ics' | null>(null);
  const [hasImported, setHasImported] = useState(false);

  if (!user) return <Navigate to="/home" replace />;

  return (
    <main className="welcome-page">
      <section className="welcome-page__intro">
        <p className="welcome-page__eyebrow">Account created</p>
        <h1>Welcome{user.name ? `, ${user.name}` : ''}!</h1>
        <p>
          Start with an empty calendar, or bring your existing events with you. You can also import
          a calendar later from the Events page.
        </p>
      </section>
      <section className="welcome-page__choices" aria-label="Calendar setup options">
        <article>
          <h2>Import a JSON backup</h2>
          <p>
            Restore a Calendar Dashboard backup. JSON import and export are primarily intended for
            moving data between Calendar Dashboard installations.
          </p>
          <button type="button" className="primary-button" onClick={() => setImportType('json')}>
            Import JSON
          </button>
        </article>
        <article>
          <h2>Import an ICS calendar</h2>
          <p>Bring events from Google Calendar or another calendar service.</p>
          <button type="button" className="primary-button" onClick={() => setImportType('ics')}>
            Import ICS
          </button>
        </article>
      </section>
      {importType && (
        <section
          className="welcome-page__importer"
          aria-label={`${importType.toUpperCase()} import`}
        >
          <div className="welcome-page__importer-header">
            <h2>
              {importType === 'json' ? 'Import your JSON backup' : 'Import your ICS calendar'}
            </h2>
            <button type="button" onClick={() => setImportType(null)}>
              Close importer
            </button>
          </div>
          {importType === 'json' ? (
            <ImportPreview
              key="json"
              onImported={() => setHasImported(true)}
              onCancel={() => setImportType(null)}
            />
          ) : (
            <IcsImportPreview
              key="ics"
              onImported={() => setHasImported(true)}
              onCancel={() => setImportType(null)}
            />
          )}
        </section>
      )}
      <Link className="welcome-page__continue" to="/home">
        {hasImported ? 'Continue' : 'Continue without importing'}
      </Link>
      <p className="welcome-page__legal">
        Before continuing, please review the <Link to="/privacy">Privacy Policy</Link> and{' '}
        <Link to="/imprint">Impressum</Link>.
      </p>
    </main>
  );
}
