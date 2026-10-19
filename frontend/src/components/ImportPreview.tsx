import { useRef, useState } from 'react';
import { checkImportDuplicates, importEvents } from '../services/events.api';
import { eventCategories, eventCategoryLabels } from '../types/events';
import type { EventCategory, EventInput } from '../types/events';
import Modal from './Modal';
import Pagination from './Pagination';
import ScrollableWindow from './ScrollableWindow';

const EVENTS_PER_PAGE = 25;

type ImportedEvent = Partial<EventInput> & { occurrenceOverrides?: unknown[] };
type Candidate = {
  index: number;
  data: ImportedEvent;
  preserveOverrides: boolean;
  keep: boolean;
  imported: boolean;
  selection: 'auto' | 'manual';
};
const knownFields = new Set([
  'category',
  'title',
  'date',
  'startTime',
  'endTime',
  'description',
  'details',
  'externalUid',
  'timeZone',
  'allDay',
  'location',
  'url',
  'recurrenceRule',
  'status',
  'sequence',
  'originalIcs',
  'recurrenceDates',
  'exclusionDates',
  'recurring',
  'numberOfRecurrences',
  'recurrenceEndDate',
  'allowCompletion',
  'completed',
  'occurrenceOverrides',
]);
const repairableFields = [
  ['title', 'Title'],
  ['category', 'Category'],
  ['date', 'Date'],
  ['startTime', 'Start time'],
  ['endTime', 'End time'],
  ['description', 'Description'],
  ['details', 'Category details'],
  ['externalUid', 'External calendar UID'],
  ['timeZone', 'Time zone'],
  ['allDay', 'All-day status'],
  ['location', 'Location'],
  ['url', 'URL'],
  ['recurrenceRule', 'Repeat rule'],
  ['status', 'Status'],
  ['sequence', 'Sequence'],
  ['originalIcs', 'Original ICS'],
  ['recurrenceDates', 'Additional repeat dates'],
  ['exclusionDates', 'Excluded repeat dates'],
  ['recurring', 'Repeat'],
  ['numberOfRecurrences', 'Number of repeats'],
  ['recurrenceEndDate', 'Repeat end date'],
  ['allowCompletion', 'Allow completion'],
  ['completed', 'Completed'],
  ['occurrenceOverrides', 'Repeat overrides'],
] as const;
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

function problems(event: ImportedEvent) {
  const result: string[] = [];
  if (!event.title?.trim()) result.push('title is required.');
  if (!eventCategories.includes(event.category as EventCategory))
    result.push('category is invalid.');
  if (!event.date && !event.startTime) result.push('a date or start time is required.');
  if (
    event.date &&
    (!dateOnly.test(event.date) || Number.isNaN(Date.parse(`${event.date}T00:00:00Z`)))
  )
    result.push('date must use YYYY-MM-DD.');
  if (event.date && (event.startTime || event.endTime))
    result.push('date-only events cannot include start or end times.');
  Object.keys(event)
    .filter((key) => !knownFields.has(key))
    .forEach((key) => result.push(`“${key}” is not a recognised field.`));
  return result;
}

export default function ImportPreview({
  onImported,
  onCancel,
}: { onImported?: () => void; onCancel?: () => void } = {}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [repairTargets, setRepairTargets] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<number[]>([]);
  const [duplicateMatches, setDuplicateMatches] = useState<
    Array<{
      candidateIndex: number;
      existing: Awaited<ReturnType<typeof checkImportDuplicates>>['matches'][number]['existing'];
    }>
  >([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: Array<{ index: number; message: string }>;
  } | null>(null);
  const checkDuplicates = async () => {
    const valid = candidates.filter((candidate) => problems(candidate.data).length === 0);
    if (!valid.length) {
      setDuplicates([]);
      setDuplicateMatches([]);
      setShowDuplicates(true);
      return;
    }
    try {
      const result = await checkImportDuplicates(valid.map((candidate) => candidate.data));
      const duplicateIndexes = result.duplicates
        .map((index) => valid[index]?.index)
        .filter((index): index is number => index !== undefined);
      setDuplicates(duplicateIndexes);
      setDuplicateMatches(
        result.matches.map((match) => ({
          candidateIndex: valid[match.index]?.index ?? -1,
          existing: match.existing,
        })),
      );
      setShowDuplicates(true);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Could not check for duplicates.');
    }
  };

  const cancelImport = () => {
    setShowCancelConfirmation(false);
    setCandidates([]);
    setDuplicates([]);
    setDuplicateMatches([]);
    setImportResult(null);
    setFileError(null);
    setSearch('');
    setPage(1);
    onCancel?.();
  };
  const loadFile = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('The JSON file exceeds 5 MB.');
      const parsed: unknown = JSON.parse(await file.text());
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !Array.isArray((parsed as { events?: unknown }).events)
      )
        throw new Error('The file must contain an events array.');
      const source = parsed as { version?: unknown; events: unknown[] };
      if (source.version !== 2)
        throw new Error('This import format is unsupported. Expected version 2.');
      setCandidates(
        source.events.map((item, index) => {
          const data = item && typeof item === 'object' ? { ...(item as ImportedEvent) } : {};
          return {
            index: index + 1,
            data,
            preserveOverrides: true,
            keep: problems(data).length === 0,
            imported: false,
            selection: 'auto' as const,
          };
        }),
      );
      setImportResult(null);
      setDuplicateMatches([]);
      setPage(1);
      setFileError(null);
    } catch (error) {
      setCandidates([]);
      setFileError(error instanceof Error ? error.message : 'Could not read this JSON file.');
    }
  };
  const change = (index: number, key: keyof ImportedEvent, value: unknown) =>
    setCandidates((items) =>
      items.map((item) => {
        if (item.index !== index) return item;
        const data = { ...item.data, [key]: value };
        return {
          ...item,
          data,
          keep: item.selection === 'auto' ? problems(data).length === 0 : item.keep,
        };
      }),
    );
  const repairField = (index: number, source: string, target: keyof ImportedEvent) =>
    setCandidates((items) =>
      items.map((item) => {
        if (item.index !== index) return item;
        const data = { ...item.data, [target]: item.data[source as keyof ImportedEvent] };
        delete data[source as keyof ImportedEvent];
        return {
          ...item,
          data,
          keep: item.selection === 'auto' ? problems(data).length === 0 : item.keep,
        };
      }),
    );
  const validCount = candidates.filter((item) => problems(item.data).length === 0).length;
  const eventsToImport = candidates.filter(
    (candidate) => candidate.keep && !candidate.imported && problems(candidate.data).length === 0,
  );
  const matchingCandidates = candidates.filter((candidate) =>
    `${candidate.data.title ?? ''} ${candidate.data.description ?? ''}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(matchingCandidates.length / EVENTS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visibleCandidates = matchingCandidates.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE,
  );
  const changePage = (nextPage: number) => {
    setPage(nextPage);
    window.requestAnimationFrame(() =>
      previewRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
    );
  };
  const submitImport = async () => {
    setImporting(true);
    setFileError(null);
    try {
      const result = await importEvents(
        eventsToImport.map((candidate) => ({
          sourceIndex: candidate.index,
          event: candidate.data,
          preserveOverrides: candidate.preserveOverrides,
        })),
      );
      const skippedIndexes = new Set(result.skipped.map((item) => item.index));
      const requestedIndexes = new Set(eventsToImport.map((item) => item.index));
      setCandidates((items) =>
        items.map((item) =>
          requestedIndexes.has(item.index) && !skippedIndexes.has(item.index)
            ? { ...item, imported: true, keep: false }
            : item,
        ),
      );
      setImportResult(result);
      if (result.imported > 0) onImported?.();
      setShowImportConfirmation(false);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Could not import events.');
    } finally {
      setImporting(false);
    }
  };
  return (
    <ScrollableWindow className="import-preview" aria-label="Import preview" ref={previewRef}>
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
        confirmLabel={duplicates.length === 0 ? 'Close' : 'Exclude duplicates'}
        showCancel={duplicates.length > 0}
        onCancel={() => setShowDuplicates(false)}
        onConfirm={() => {
          if (duplicates.length === 0) {
            setShowDuplicates(false);
            return;
          }
          setCandidates((items) =>
            items.map((item) =>
              duplicates.includes(item.index)
                ? { ...item, keep: false, selection: 'manual' as const }
                : item,
            ),
          );
          setShowDuplicates(false);
        }}
      >
        {duplicates.length === 0 ? (
          <p>No duplicate events were found.</p>
        ) : (
          <>
            <p>
              Review the suspected duplicates below. Exclude them from the import, or cancel to keep
              your current selection.
            </p>
            <ScrollableWindow className="duplicate-results">
              {duplicateMatches.map((match) => {
                const item = candidates.find(
                  (candidate) => candidate.index === match.candidateIndex,
                );
                return (
                  <section className="duplicate-results__group" key={match.candidateIndex}>
                    <article className="duplicate-results__event">
                      <strong>Import #{match.candidateIndex}</strong>
                      <span>{item?.data.title}</span>
                      <span>{item?.data.date ?? item?.data.startTime?.slice(0, 10)}</span>
                      <span>{item?.data.category}</span>
                    </article>
                    {match.existing && (
                      <article className="duplicate-results__event">
                        <strong>Existing</strong>
                        <span>{match.existing.title}</span>
                        <span>
                          {match.existing.date?.slice(0, 10) ??
                            match.existing.startTime?.slice(0, 10)}
                        </span>
                        <span>{match.existing.category}</span>
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
        isOpen={showImportConfirmation}
        title="Import selected events?"
        confirmLabel={importing ? 'Importing...' : `Import ${eventsToImport.length} events`}
        onCancel={() => setShowImportConfirmation(false)}
        onConfirm={() => {
          if (!importing) void submitImport();
        }}
      >
        <p>Each selected event will be added as a new event. Existing events are not changed.</p>
      </Modal>
      <header className="import-preview__header">
        <div>
          <h2>Import JSON</h2>
          <p>Review and repair a Calendar Dashboard backup before importing it.</p>
        </div>
        <button type="button" onClick={() => fileInput.current?.click()}>
          Choose JSON file
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => void loadFile(e.target.files?.[0])}
        />
      </header>
      <p className="import-preview__format-note">
        <strong>JSON is primarily the Calendar Dashboard backup format.</strong> JSON import and
        export preserve app-specific information. Use ICS when moving events to or from another
        calendar application.
      </p>
      {fileError && <p className="form-error">{fileError}</p>}
      {importResult && (
        <div className="import-preview__result" role="status">
          <strong>{importResult.imported} events imported.</strong>
          {importResult.skipped.length > 0 && (
            <ul>
              {importResult.skipped.map((item) => (
                <li key={`${item.index}-${item.message}`}>
                  Event {item.index}: {item.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {candidates.length > 0 && (
        <p className="import-preview__summary">
          {validCount} ready to import · {candidates.length - validCount} need attention
        </p>
      )}
      {candidates.length > 0 && (
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
      {candidates.length > 0 && (
        <Pagination currentPage={currentPage} pageCount={pageCount} onChange={changePage} />
      )}
      {visibleCandidates.map((candidate) => {
        const errors = problems(candidate.data);
        const recurring = Boolean(candidate.data.recurring);
        const duplicate = duplicates.includes(candidate.index);
        return (
          <article
            className={`import-preview__event${candidate.imported ? ' import-preview__event--imported' : candidate.keep ? '' : ' import-preview__event--discarded'}`}
            key={candidate.index}
          >
            <div className="import-preview__event-header">
              <button
                className="import-preview__expand"
                type="button"
                onClick={() => setOpenIndex(openIndex === candidate.index ? null : candidate.index)}
              >
                <strong>
                  Event {candidate.index}: {candidate.data.title || 'Untitled'}
                </strong>
                <span
                  className={
                    candidate.imported || (!errors.length && !duplicate)
                      ? 'import-preview__status import-preview__status--ready'
                      : 'import-preview__status import-preview__status--warning'
                  }
                >
                  {candidate.imported
                    ? 'Imported'
                    : errors.length
                      ? `${errors.length} issue${errors.length === 1 ? '' : 's'}`
                      : duplicate
                        ? 'Possible duplicate'
                        : 'Ready'}
                </span>
              </button>
              <button
                type="button"
                disabled={candidate.imported}
                onClick={() => {
                  setCandidates((items) =>
                    items
                      .map((item) =>
                        item.index === candidate.index ? { ...item, keep: !item.keep } : item,
                      )
                      .map((item) =>
                        item.index === candidate.index
                          ? { ...item, selection: 'manual' as const }
                          : item,
                      ),
                  );
                }}
              >
                {candidate.imported ? 'Imported' : candidate.keep ? 'Keep' : 'Discard'}
              </button>
            </div>
            {openIndex === candidate.index && (
              <div className="import-preview__editor">
                {errors.length > 0 && (
                  <ul>
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
                {Object.keys(candidate.data)
                  .filter((field) => !knownFields.has(field))
                  .map((field) => {
                    const repairKey = `${candidate.index}-${field}`;
                    return (
                      <div className="import-preview__repair" key={field}>
                        <span>
                          Use <code>{field}</code> as
                        </span>
                        <select
                          value={repairTargets[repairKey] ?? ''}
                          onChange={(e) =>
                            setRepairTargets((current) => ({
                              ...current,
                              [repairKey]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Choose a field</option>
                          {repairableFields.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!repairTargets[repairKey]}
                          onClick={() =>
                            repairField(
                              candidate.index,
                              field,
                              repairTargets[repairKey] as keyof ImportedEvent,
                            )
                          }
                        >
                          Apply fix
                        </button>
                      </div>
                    );
                  })}
                <label className="form-field">
                  Title
                  <input
                    value={candidate.data.title ?? ''}
                    onChange={(e) => change(candidate.index, 'title', e.target.value)}
                  />
                </label>
                <label className="form-field">
                  Category
                  <select
                    value={candidate.data.category ?? ''}
                    onChange={(e) => change(candidate.index, 'category', e.target.value)}
                  >
                    <option value="">Select category</option>
                    {eventCategories.map((category) => (
                      <option key={category} value={category}>
                        {eventCategoryLabels[category]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  Date
                  <input
                    type="date"
                    value={candidate.data.date ?? ''}
                    onChange={(e) => change(candidate.index, 'date', e.target.value || null)}
                  />
                </label>
                {recurring && (
                  <>
                    <label className="calendar-checkbox">
                      <input
                        type="checkbox"
                        checked={candidate.preserveOverrides}
                        onChange={(e) =>
                          setCandidates((items) =>
                            items.map((item) =>
                              item.index === candidate.index
                                ? { ...item, preserveOverrides: e.target.checked }
                                : item,
                            ),
                          )
                        }
                      />{' '}
                      Preserve repeat overrides
                    </label>
                    <details className="import-preview__overrides">
                      <summary>
                        Repeat overrides ({candidate.data.occurrenceOverrides?.length ?? 0})
                      </summary>
                      {(candidate.data.occurrenceOverrides ?? [])
                        .map((override, index) => ({ override, index }))
                        .sort(({ override: first }, { override: second }) => {
                          const firstItem = first as { occurrenceDate?: unknown; date?: unknown };
                          const secondItem = second as {
                            occurrenceDate?: unknown;
                            date?: unknown;
                          };
                          const firstDate =
                            typeof firstItem.date === 'string'
                              ? firstItem.date
                              : typeof firstItem.occurrenceDate === 'string'
                                ? firstItem.occurrenceDate
                                : '';
                          const secondDate =
                            typeof secondItem.date === 'string'
                              ? secondItem.date
                              : typeof secondItem.occurrenceDate === 'string'
                                ? secondItem.occurrenceDate
                                : '';
                          return firstDate.localeCompare(secondDate);
                        })
                        .map(({ override, index }) => {
                          const item = override as {
                            occurrenceDate?: unknown;
                            date?: unknown;
                            description?: unknown;
                          };
                          return (
                            <p key={index}>
                              <strong>
                                {typeof item.date === 'string'
                                  ? item.date
                                  : typeof item.occurrenceDate === 'string'
                                    ? item.occurrenceDate
                                    : 'Unknown date'}
                              </strong>
                              {typeof item.description === 'string'
                                ? ` — ${item.description}`
                                : ' — no description override'}
                            </p>
                          );
                        })}
                    </details>
                  </>
                )}
              </div>
            )}
          </article>
        );
      })}
      {candidates.length > 0 && (
        <Pagination currentPage={currentPage} pageCount={pageCount} onChange={changePage} />
      )}
      {candidates.length > 0 && (
        <div className="import-preview__actions">
          <div className="import-preview__primary-actions">
            <button
              className="primary-button"
              type="button"
              disabled={eventsToImport.length === 0 || importing}
              onClick={() => setShowImportConfirmation(true)}
            >
              Import {eventsToImport.length} selected events
            </button>
            <button type="button" onClick={() => void checkDuplicates()}>
              Check for duplicates
            </button>
          </div>
          <button
            className="import-preview__cancel"
            type="button"
            onClick={() => setShowCancelConfirmation(true)}
          >
            Cancel
          </button>
        </div>
      )}
    </ScrollableWindow>
  );
}
