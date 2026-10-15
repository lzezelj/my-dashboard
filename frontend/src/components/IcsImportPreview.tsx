import { useRef, useState } from 'react';
import {
  checkImportDuplicates,
  importIcs,
  previewIcsImport,
  type IcsPreviewEvent,
  type ImportEventsResult,
} from '../services/events.api';
import Modal from './Modal';

export default function IcsImportPreview({ onImported }: { onImported?: () => void } = {}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState('');
  const [events, setEvents] = useState<IcsPreviewEvent[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportEventsResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [importing, setImporting] = useState(false);
  const [duplicates, setDuplicates] = useState<Set<number>>(new Set());
  const [duplicatesChecked, setDuplicatesChecked] = useState(false);

  const load = async (file?: File) => {
    if (!file) return;
    try {
      const ics = await file.text();
      const preview = await previewIcsImport(ics);
      setSource(ics);
      setEvents(preview.events);
      setSelected(new Set(preview.events.map((event) => event.sourceIndex)));
      setDuplicates(new Set());
      setDuplicatesChecked(false);
      setResult(null);
      setError(null);
    } catch (loadError) {
      setEvents([]);
      setError(loadError instanceof Error ? loadError.message : 'Could not read ICS file.');
    }
  };

  const checkDuplicates = async () => {
    try {
      const checked = await checkImportDuplicates(events);
      const duplicateIndexes = new Set(
        checked.duplicates
          .map((index) => events[index]?.sourceIndex)
          .filter((index): index is number => index !== undefined),
      );
      setDuplicates(duplicateIndexes);
      setSelected((current) => {
        const next = new Set(current);
        duplicateIndexes.forEach((index) => next.delete(index));
        return next;
      });
      setDuplicatesChecked(true);
    } catch (checkError) {
      setError(
        checkError instanceof Error ? checkError.message : 'Could not check for duplicates.',
      );
    }
  };

  const submit = async () => {
    setImporting(true);
    try {
      const importResult = await importIcs(source, [...selected]);
      setResult(importResult);
      if (importResult.imported > 0) onImported?.();
      setEvents((items) => items.filter((item) => !selected.has(item.sourceIndex)));
      setSelected(new Set());
      setConfirming(false);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Could not import ICS file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="import-preview" aria-label="ICS import preview">
      <Modal
        isOpen={confirming}
        title="Import selected calendar events?"
        confirmLabel={importing ? 'Importing...' : `Import ${selected.size} events`}
        onCancel={() => !importing && setConfirming(false)}
        onConfirm={() => !importing && void submit()}
      >
        <p>The selected events will be added to Calendar Dashboard.</p>
      </Modal>
      <header>
        <div>
          <h2>Import ICS</h2>
          <p>Import an iCalendar file from Google Calendar, Apple Calendar, or Outlook.</p>
        </div>
        <button type="button" onClick={() => fileInput.current?.click()}>
          Choose ICS file
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="text/calendar,.ics"
          hidden
          onChange={(event) => void load(event.target.files?.[0])}
        />
      </header>
      {error && <p className="form-error">{error}</p>}
      {result && (
        <p className="import-preview__result" role="status">
          {result.imported} events imported successfully.
        </p>
      )}
      {duplicatesChecked && (
        <p className="import-preview__result" role="status">
          {duplicates.size === 0
            ? 'No duplicates were found.'
            : `${duplicates.size} possible duplicate${duplicates.size === 1 ? '' : 's'} found and unselected.`}
        </p>
      )}
      {events.map((event) => (
        <article className="import-preview__event" key={event.sourceIndex}>
          <label className="import-preview__event-header">
            <input
              type="checkbox"
              checked={selected.has(event.sourceIndex)}
              onChange={(changeEvent) =>
                setSelected((current) => {
                  const next = new Set(current);
                  if (changeEvent.target.checked) next.add(event.sourceIndex);
                  else next.delete(event.sourceIndex);
                  return next;
                })
              }
            />
            <strong>{event.title}</strong>
            <span>{event.date ?? event.startTime ?? 'No date'}</span>
            {duplicates.has(event.sourceIndex) && (
              <span className="import-preview__status import-preview__status--warning">
                Possible duplicate
              </span>
            )}
          </label>
          {event.warnings.length > 0 && (
            <ul className="ics-import-warnings">
              {event.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
      {events.length > 0 && (
        <div className="import-preview__actions">
          <button type="button" onClick={() => void checkDuplicates()}>
            Check for duplicates
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={selected.size === 0}
            onClick={() => setConfirming(true)}
          >
            Import {selected.size} selected events
          </button>
        </div>
      )}
    </section>
  );
}
