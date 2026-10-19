import { useMemo, useRef, useState } from 'react';
import {
  checkImportDuplicates,
  importEvents,
  previewIcsImport,
  type IcsPreviewEvent,
  type ImportEventsResult,
} from '../services/events.api';
import { eventCategoryLabels } from '../types/events';
import {
  detectDescriptionTemplate,
  suggestedDescription,
  suggestCategory,
} from '../utils/importSuggestions';
import Modal from './Modal';
import Pagination from './Pagination';
import ScrollableWindow from './ScrollableWindow';

const EVENTS_PER_PAGE = 25;
const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export default function IcsImportPreview({
  onImported,
  onCancel,
}: { onImported?: () => void; onCancel?: () => void } = {}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<IcsPreviewEvent[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportEventsResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [importing, setImporting] = useState(false);
  const [duplicates, setDuplicates] = useState<Set<number>>(new Set());
  const [duplicatesChecked, setDuplicatesChecked] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<
    Awaited<ReturnType<typeof checkImportDuplicates>>['matches']
  >([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error('The ICS file exceeds 5 MB.');
      const ics = await file.text();
      const preview = await previewIcsImport(ics);
      setEvents(preview.events);
      setSelected(new Set(preview.events.map((event) => event.sourceIndex)));
      setDuplicates(new Set());
      setDuplicateMatches([]);
      setDuplicatesChecked(false);
      setResult(null);
      setError(null);
      setPage(1);
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
      setDuplicateMatches(checked.matches);
      setShowDuplicates(true);
      setDuplicatesChecked(true);
    } catch (checkError) {
      setError(
        checkError instanceof Error ? checkError.message : 'Could not check for duplicates.',
      );
    }
  };

  const cancelImport = () => {
    setShowCancelConfirmation(false);
    setEvents([]);
    setSelected(new Set());
    setDuplicates(new Set());
    setDuplicateMatches([]);
    setDuplicatesChecked(false);
    setResult(null);
    setError(null);
    setSearch('');
    setPage(1);
    onCancel?.();
  };

  const submit = async () => {
    setImporting(true);
    try {
      const importResult = await importEvents(
        events
          .filter((event) => selected.has(event.sourceIndex))
          .map(({ sourceIndex, warnings: _warnings, ...event }) => ({
            sourceIndex,
            event,
            preserveOverrides: true,
          })),
      );
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

  const descriptionTemplate = useMemo(
    () =>
      detectDescriptionTemplate(
        events.flatMap((event) => (event.description ? [event.description] : [])),
      ),
    [events],
  );
  const descriptionSuggestions = useMemo(
    () =>
      new Map(
        events.map((event) => [
          event.sourceIndex,
          suggestedDescription(event.description, event.title, null),
        ]),
      ),
    [events],
  );
  const templateSuggestions = useMemo(
    () =>
      new Map(
        events.map((event) => [
          event.sourceIndex,
          suggestedDescription(event.description, event.title, descriptionTemplate),
        ]),
      ),
    [descriptionTemplate, events],
  );
  const updateEvent = (sourceIndex: number, update: Partial<IcsPreviewEvent>) =>
    setEvents((items) =>
      items.map((item) => (item.sourceIndex === sourceIndex ? { ...item, ...update } : item)),
    );
  const applyAllCategorySuggestions = () =>
    setEvents((items) =>
      items.map((item) => {
        const suggestion =
          item.category === 'OTHER' ? suggestCategory(item.title, item.description) : null;
        return suggestion ? { ...item, category: suggestion.category } : item;
      }),
    );
  const applyAllDescriptionSuggestions = () =>
    setEvents((items) =>
      items.map((item) => {
        const suggestion = descriptionSuggestions.get(item.sourceIndex);
        return suggestion === null || suggestion === undefined
          ? item
          : { ...item, description: suggestion || null };
      }),
    );
  const applyAllTemplateSuggestions = () =>
    setEvents((items) =>
      items.map((item) => {
        const suggestion = templateSuggestions.get(item.sourceIndex);
        return suggestion === null || suggestion === undefined
          ? item
          : { ...item, description: suggestion || null };
      }),
    );
  const matchingEvents = events.filter((event) =>
    `${event.title} ${event.description ?? ''}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(matchingEvents.length / EVENTS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visibleEvents = matchingEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE,
  );
  const changePage = (nextPage: number) => {
    setPage(nextPage);
    window.requestAnimationFrame(() =>
      previewRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
    );
  };

  return (
    <ScrollableWindow className="import-preview" aria-label="ICS import preview" ref={previewRef}>
      <Modal
        isOpen={showCancelConfirmation}
        title="Cancel import?"
        confirmLabel="Cancel import"
        destructive
        onCancel={() => setShowCancelConfirmation(false)}
        onConfirm={cancelImport}
      >
        <p>Your current selection and preview changes will be discarded.</p>
      </Modal>
      <Modal
        isOpen={showDuplicates}
        title="Duplicate check results"
        confirmLabel={duplicates.size === 0 ? 'Close' : 'Exclude duplicates'}
        showCancel={duplicates.size > 0}
        onCancel={() => setShowDuplicates(false)}
        onConfirm={() => {
          if (duplicates.size === 0) {
            setShowDuplicates(false);
            return;
          }
          setSelected((current) => {
            const next = new Set(current);
            duplicates.forEach((index) => next.delete(index));
            return next;
          });
          setShowDuplicates(false);
        }}
      >
        {duplicates.size === 0 ? (
          <p>No duplicate events were found.</p>
        ) : (
          <>
            <p>
              Review these matches. Exclude them from the import, or cancel to keep them selected.
            </p>
            <ScrollableWindow className="duplicate-results">
              {duplicateMatches.map((match) => {
                const incoming = events[match.index];
                return (
                  <section className="duplicate-results__group" key={match.index}>
                    <article className="duplicate-results__event">
                      <strong>Import</strong>
                      <span>{incoming?.title}</span>
                      <span>{incoming?.date ?? incoming?.startTime?.slice(0, 10)}</span>
                    </article>
                    {match.existing && (
                      <article className="duplicate-results__event">
                        <strong>Existing</strong>
                        <span>{match.existing.title}</span>
                        <span>
                          {match.existing.date?.slice(0, 10) ??
                            match.existing.startTime?.slice(0, 10)}
                        </span>
                      </article>
                    )}
                  </section>
                );
              })}
            </ScrollableWindow>
          </>
        )}
      </Modal>
      <Modal
        isOpen={confirming}
        title="Import selected calendar events?"
        confirmLabel={importing ? 'Importing...' : `Import ${selected.size} events`}
        onCancel={() => !importing && setConfirming(false)}
        onConfirm={() => !importing && void submit()}
      >
        <p>The selected events will be added to Calendar Dashboard.</p>
      </Modal>
      <header className="import-preview__header">
        <div>
          <h2>Import ICS</h2>
          <p>Review events from Google Calendar, Apple Calendar, Outlook, or another calendar.</p>
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
      <p className="import-preview__format-note">
        <strong>ICS is the compatibility format.</strong> Use it when moving calendar events between
        Calendar Dashboard and other calendar applications.
      </p>
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
            : `${duplicates.size} possible duplicate${duplicates.size === 1 ? '' : 's'} found. Review your selection before importing.`}
        </p>
      )}
      {events.length > 0 && (
        <p className="import-preview__summary">
          {selected.size} selected · {events.length - selected.size} discarded
        </p>
      )}
      {events.length > 0 && (
        <label className="import-preview__search">
          Search imported events
          <input
            type="search"
            value={search}
            placeholder="Search title or description"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
      )}
      {events.length > 0 && (
        <Pagination currentPage={currentPage} pageCount={pageCount} onChange={changePage} />
      )}
      {visibleEvents.map((event) => {
        const categorySuggestion =
          event.category === 'OTHER' ? suggestCategory(event.title, event.description) : null;
        const descriptionSuggestion = descriptionSuggestions.get(event.sourceIndex);
        const templateSuggestion = templateSuggestions.get(event.sourceIndex);
        return (
          <article
            className={`import-preview__event${selected.has(event.sourceIndex) ? '' : ' import-preview__event--discarded'}`}
            key={event.sourceIndex}
          >
            <div className="import-preview__event-header">
              <div className="import-preview__event-summary">
                <strong>{event.title}</strong>
                <span>{event.date ?? event.startTime ?? 'No date'}</span>
                <span
                  className={`import-preview__status ${!selected.has(event.sourceIndex) || duplicates.has(event.sourceIndex) || event.warnings.length > 0 ? 'import-preview__status--warning' : 'import-preview__status--ready'}`}
                >
                  {!selected.has(event.sourceIndex)
                    ? 'Discarded'
                    : duplicates.has(event.sourceIndex)
                      ? 'Possible duplicate'
                      : event.warnings.length > 0
                        ? `${event.warnings.length} warning${event.warnings.length === 1 ? '' : 's'}`
                        : 'Ready'}
                </span>
              </div>
              <button
                type="button"
                aria-pressed={selected.has(event.sourceIndex)}
                onClick={() =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (next.has(event.sourceIndex)) next.delete(event.sourceIndex);
                    else next.add(event.sourceIndex);
                    return next;
                  })
                }
              >
                {selected.has(event.sourceIndex) ? 'Keep' : 'Discard'}
              </button>
            </div>
            {event.warnings.length > 0 && (
              <ul className="ics-import-warnings">
                {event.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
            {(categorySuggestion ||
              (descriptionSuggestion !== null && descriptionSuggestion !== undefined) ||
              (templateSuggestion !== null && templateSuggestion !== undefined)) && (
              <ScrollableWindow className="import-suggestions">
                {categorySuggestion && (
                  <section className="import-suggestion">
                    <strong>Category suggestion</strong>
                    <p>
                      “{categorySuggestion.keyword}” suggests{' '}
                      {eventCategoryLabels[categorySuggestion.category]}.
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          updateEvent(event.sourceIndex, {
                            category: categorySuggestion.category,
                          })
                        }
                      >
                        Use {eventCategoryLabels[categorySuggestion.category]}
                      </button>
                      <button type="button" onClick={applyAllCategorySuggestions}>
                        Apply all category suggestions
                      </button>
                    </div>
                  </section>
                )}
                {descriptionSuggestion !== null && descriptionSuggestion !== undefined && (
                  <section className="import-suggestion">
                    <strong>HTML description cleanup</strong>
                    <p>
                      {descriptionSuggestion ? (
                        <>Suggested description: “{descriptionSuggestion}”</>
                      ) : (
                        'The repeated description adds no information beyond the title. It can be removed.'
                      )}
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          updateEvent(event.sourceIndex, {
                            description: descriptionSuggestion || null,
                          })
                        }
                      >
                        Convert this event
                      </button>
                      <button type="button" onClick={applyAllDescriptionSuggestions}>
                        Convert all HTML descriptions
                      </button>
                    </div>
                  </section>
                )}
                {templateSuggestion !== null &&
                  templateSuggestion !== undefined &&
                  templateSuggestion !== descriptionSuggestion && (
                    <section className="import-suggestion">
                      <strong>Repeated template found</strong>
                      <p>
                        {templateSuggestion
                          ? `Optional simplified description: ${templateSuggestion}`
                          : 'The variable part matches the title, so the description could be removed.'}
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            updateEvent(event.sourceIndex, {
                              description: templateSuggestion || null,
                            })
                          }
                        >
                          Simplify this event
                        </button>
                        <button type="button" onClick={applyAllTemplateSuggestions}>
                          Simplify all repeated descriptions
                        </button>
                      </div>
                    </section>
                  )}
              </ScrollableWindow>
            )}
          </article>
        );
      })}
      {events.length > 0 && (
        <Pagination currentPage={currentPage} pageCount={pageCount} onChange={changePage} />
      )}
      {events.length > 0 && (
        <div className="import-preview__actions">
          <div className="import-preview__primary-actions">
            <button
              type="button"
              className="primary-button"
              disabled={selected.size === 0}
              onClick={() => setConfirming(true)}
            >
              Import {selected.size} selected events
            </button>
            <button type="button" onClick={() => void checkDuplicates()}>
              Check for duplicates
            </button>
          </div>
          <button
            type="button"
            className="import-preview__cancel"
            onClick={() => setShowCancelConfirmation(true)}
          >
            Cancel
          </button>
        </div>
      )}
    </ScrollableWindow>
  );
}
