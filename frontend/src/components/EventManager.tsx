import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardEvent, EventCategory } from '../types/events';
import { eventCategories, eventCategoryLabels, eventDetailLabels } from '../types/events';
import {
  deleteEvent,
  deleteAllEvents,
  deleteEvents,
  exportEvents,
  exportIcs,
  getEventOccurrences,
  getEvents,
  updateEvent,
  updateOccurrence,
} from '../services/events.api';
import { dateOnlyToDisplay } from '../utils/dateUtils';
import EventForm from './EventForm';
import Modal from './Modal';

const EVENTS_PER_PAGE = 25;

export default function EventManager({ initialCategory }: { initialCategory?: EventCategory }) {
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'ALL'>(
    initialCategory ?? 'ALL',
  );
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DashboardEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<DashboardEvent | null>(null);
  const [occurrenceEventId, setOccurrenceEventId] = useState<number | null>(null);
  const [occurrences, setOccurrences] = useState<DashboardEvent[]>([]);
  const [editingOccurrence, setEditingOccurrence] = useState<DashboardEvent | null>(null);
  const [occurrenceDescription, setOccurrenceDescription] = useState('');
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [showOccurrenceSaveConfirmation, setShowOccurrenceSaveConfirmation] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<number>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'selected' | 'all' | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [searchField, setSearchField] = useState<'title' | 'description'>('title');
  const [eventPage, setEventPage] = useState(1);
  const deleteMenuRef = useRef<HTMLDetailsElement>(null);
  const transferMenuRef = useRef<HTMLDetailsElement>(null);
  const navigate = useNavigate();
  const load = useCallback(async () => {
    try {
      setError(null);
      setEvents(await getEvents(filterCategory === 'ALL' ? {} : { category: filterCategory }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load events.');
    }
  }, [filterCategory]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    const closeMenus = () => {
      if (deleteMenuRef.current) deleteMenuRef.current.open = false;
      if (transferMenuRef.current) transferMenuRef.current.open = false;
    };
    const closeWhenOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !deleteMenuRef.current?.contains(target) &&
        !transferMenuRef.current?.contains(target)
      ) {
        closeMenus();
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus();
    };
    document.addEventListener('mousedown', closeWhenOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('mousedown', closeWhenOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);
  const matchingEvents = useMemo(() => {
    const query = eventSearch.trim().toLocaleLowerCase();
    const sorted = [...events].sort(
      (a, b) =>
        (a.date ?? a.startTime?.slice(0, 10) ?? '').localeCompare(
          b.date ?? b.startTime?.slice(0, 10) ?? '',
        ) || (a.startTime ?? '').localeCompare(b.startTime ?? ''),
    );
    if (!query) return sorted;
    return sorted.filter((event) =>
      (searchField === 'title' ? event.title : (event.description ?? ''))
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [eventSearch, events, searchField]);
  const eventPageCount = Math.max(1, Math.ceil(matchingEvents.length / EVENTS_PER_PAGE));
  const currentEventPage = Math.min(eventPage, eventPageCount);
  const visibleEvents = matchingEvents.slice(
    (currentEventPage - 1) * EVENTS_PER_PAGE,
    currentEventPage * EVENTS_PER_PAGE,
  );
  const closeForm = () => {
    setShowCreate(false);
    setEditingEvent(null);
  };
  const saved = async () => {
    closeForm();
    await load();
  };
  const toggleOccurrences = async (event: DashboardEvent) => {
    if (occurrenceEventId === event.id) {
      setOccurrenceEventId(null);
      setEditingOccurrence(null);
      return;
    }
    try {
      setOccurrences(await getEventOccurrences(event.id));
      setOccurrenceEventId(event.id);
      setEditingOccurrence(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load occurrences.');
    }
  };
  const saveOccurrence = async () => {
    if (!editingOccurrence || occurrenceEventId === null) return;
    try {
      await updateOccurrence(
        occurrenceEventId,
        editingOccurrence.sourceOccurrenceDate ?? editingOccurrence.occurrenceDate ?? '',
        { description: occurrenceDescription, date: occurrenceDate },
      );
      setOccurrences(await getEventOccurrences(occurrenceEventId));
      setEditingOccurrence(null);
      setShowOccurrenceSaveConfirmation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save occurrence changes.');
    }
  };
  const downloadExport = async () => {
    try {
      const eventExport = await exportEvents();
      const file = new Blob([JSON.stringify(eventExport, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = `dashboard-events-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export events.');
    }
  };
  const downloadIcsExport = async () => {
    try {
      const ics = await exportIcs();
      const file = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = `dashboard-events-${new Date().toISOString().slice(0, 10)}.ics`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export ICS calendar.');
    }
  };
  const confirmBulkDelete = async () => {
    try {
      if (bulkDeleteMode === 'all') await deleteAllEvents();
      else if (bulkDeleteMode === 'selected') await deleteEvents([...selectedEventIds]);
      setSelectedEventIds(new Set());
      setBulkDeleteMode(null);
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete events.');
      setBulkDeleteMode(null);
    }
  };
  return (
    <div className="event-manager">
      <Modal
        isOpen={bulkDeleteMode !== null}
        title={bulkDeleteMode === 'all' ? 'Delete all events?' : 'Delete selected events?'}
        confirmLabel={
          bulkDeleteMode === 'all'
            ? 'Delete all events'
            : `Delete ${selectedEventIds.size} selected`
        }
        destructive
        onCancel={() => setBulkDeleteMode(null)}
        onConfirm={() => void confirmBulkDelete()}
      >
        <p>
          {bulkDeleteMode === 'all'
            ? 'This permanently deletes every event in your account, across all categories.'
            : `This permanently deletes ${selectedEventIds.size} selected event${selectedEventIds.size === 1 ? '' : 's'}.`}
        </p>
      </Modal>
      <Modal
        isOpen={showOccurrenceSaveConfirmation}
        title="Save occurrence changes?"
        confirmLabel="Save changes"
        onCancel={() => setShowOccurrenceSaveConfirmation(false)}
        onConfirm={() => void saveOccurrence()}
      >
        <p>This updates only the selected occurrence, not the entire recurring event.</p>
      </Modal>
      <Modal
        isOpen={eventToDelete !== null}
        title="Delete event?"
        confirmLabel="Delete event"
        destructive
        onCancel={() => setEventToDelete(null)}
        onConfirm={() => {
          if (!eventToDelete) return;
          void deleteEvent(eventToDelete.id)
            .then(() => {
              setSelectedEventIds((current) => {
                const next = new Set(current);
                next.delete(eventToDelete.id);
                return next;
              });
              return load();
            })
            .finally(() => setEventToDelete(null));
        }}
      >
        <p>Delete “{eventToDelete?.title}”? This cannot be undone.</p>
      </Modal>
      <header className="event-manager__header">
        <div className="event-manager__heading">
          <h1>Events</h1>
          <p>Browse, add and update your events</p>
        </div>
        <div className="event-manager__controls">
          <div className="event-manager__primary-controls">
            <label className="category-selector">
              Category
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value as EventCategory | 'ALL');
                  setEventPage(1);
                  closeForm();
                }}
              >
                <option value="ALL">All categories</option>
                {eventCategories.map((item) => (
                  <option key={item} value={item}>
                    {eventCategoryLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setShowCreate((open) => !open);
              }}
            >
              {showCreate ? 'Close form' : 'Add event'}
            </button>
            <details
              className="event-manager__menu event-manager__delete-menu"
              ref={deleteMenuRef}
            >
              <summary>Delete</summary>
              <div className="event-manager__menu-items">
                <button
                  type="button"
                  className="danger-button"
                  disabled={selectedEventIds.size === 0}
                  onClick={() => {
                    deleteMenuRef.current!.open = false;
                    setBulkDeleteMode('selected');
                  }}
                >
                  Delete selected ({selectedEventIds.size})
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    deleteMenuRef.current!.open = false;
                    setBulkDeleteMode('all');
                  }}
                >
                  Delete all events
                </button>
              </div>
            </details>
          </div>
          <details
            className="event-manager__menu event-manager__transfer-menu"
            ref={transferMenuRef}
          >
            <summary>Import/Export Calendar</summary>
            <div className="event-manager__menu-items">
              <button
                type="button"
                onClick={() => {
                  transferMenuRef.current!.open = false;
                  void downloadExport();
                }}
              >
                Export as JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  transferMenuRef.current!.open = false;
                  void downloadIcsExport();
                }}
              >
                Export as ICS
              </button>
              <button
                type="button"
                onClick={() => {
                  transferMenuRef.current!.open = false;
                  navigate('/events/import');
                }}
              >
                Import calendar
              </button>
            </div>
          </details>
        </div>
        <div className="event-manager__browser-controls">
          <label className="event-search-field">
            Search events
            <input
              type="search"
              value={eventSearch}
              placeholder={`Search by ${searchField}`}
              onChange={(changeEvent) => {
                setEventSearch(changeEvent.target.value);
                setEventPage(1);
              }}
            />
          </label>
          <fieldset className="event-search-selector">
            <legend>Search in</legend>
            <label>
              <input
                type="radio"
                name="managed-event-search-field"
                checked={searchField === 'title'}
                onChange={() => {
                  setSearchField('title');
                  setEventPage(1);
                }}
              />
              Title
            </label>
            <label>
              <input
                type="radio"
                name="managed-event-search-field"
                checked={searchField === 'description'}
                onChange={() => {
                  setSearchField('description');
                  setEventPage(1);
                }}
              />
              Description
            </label>
          </fieldset>
        </div>
      </header>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {showCreate && (
        <EventForm
          key={`create-${filterCategory}`}
          category={filterCategory === 'ALL' ? undefined : filterCategory}
          onSaved={saved}
          onCancel={closeForm}
        />
      )}
      <section className="event-manager__results-window" aria-label="Event search results">
        <EventManagerPagination
          currentPage={currentEventPage}
          pageCount={eventPageCount}
          onChange={setEventPage}
        />
        <div className="event-manager__list" aria-label="Saved events">
        {visibleEvents.length === 0 ? (
          <p className="event-list-empty">
            {eventSearch.trim()
              ? `No events contain “${eventSearch.trim()}” in their ${searchField}.`
              : 'No events in this category.'}
          </p>
        ) : (
          visibleEvents.map((event) => (
            <div className="event-manager__entry" key={event.id}>
              <article className="event-manager__card">
                <div className="event-manager__card-header">
                  <h3>{event.title}</h3>
                  <label className="event-manager__select">
                    <input
                      type="checkbox"
                      checked={selectedEventIds.has(event.id)}
                      onChange={(changeEvent) =>
                        setSelectedEventIds((current) => {
                          const next = new Set(current);
                          if (changeEvent.target.checked) next.add(event.id);
                          else next.delete(event.id);
                          return next;
                        })
                      }
                    />
                    Select for deletion
                  </label>
                </div>
                <p>
                  {eventCategoryLabels[event.category]} ·{' '}
                  {dateOnlyToDisplay(event.date ?? event.startTime?.slice(0, 10) ?? '')}
                </p>
                {event.description && <p>{event.description}</p>}
                {event.location && <p>Location: {event.location}</p>}
                {event.url && (
                  <p>
                    Link: <a href={event.url}>{event.url}</a>
                  </p>
                )}
                {Object.entries(event.details ?? {}).map(([key, value]) => (
                  <p key={key}>
                    <strong>{eventDetailLabels[key] ?? key}:</strong> {value}
                  </p>
                ))}
                <div className="event-manager__card-actions">
                  {event.allowCompletion && (
                  <button
                    type="button"
                    onClick={async () => {
                      await updateEvent(event.id, { completed: !event.completed });
                      await load();
                    }}
                  >
                    {event.completed ? 'Mark incomplete' : 'Complete'}
                  </button>
                  )}
                  <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setEditingEvent((current) => (current?.id === event.id ? null : event));
                  }}
                >
                  Edit
                </button>
                  {event.recurring && (
                    <button type="button" onClick={() => void toggleOccurrences(event)}>
                      {occurrenceEventId === event.id ? 'Close occurrences' : 'Edit occurrences'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="danger-button event-manager__delete-event"
                    onClick={() => setEventToDelete(event)}
                  >
                    Delete
                  </button>
                </div>
              </article>
              {editingEvent?.id === event.id && (
                <EventForm
                  key={`edit-${event.id}`}
                  event={event}
                  category={event.category}
                  onSaved={saved}
                  onCancel={closeForm}
                />
              )}
              {occurrenceEventId === event.id && (
                <section
                  className="occurrences-window"
                  aria-label={`Occurrences of ${event.title}`}
                >
                  <h4>Occurrences</h4>
                  {occurrences.map((occurrence) => (
                    <div className="occurrences-window__item" key={occurrence.occurrenceDate}>
                      <div>
                        <strong>{dateOnlyToDisplay(occurrence.occurrenceDate ?? '')}</strong>
                        <p>
                          {occurrence.description ||
                            'No description has been added for this occurrence.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isEditingThisOccurrence =
                            editingOccurrence?.occurrenceDate === occurrence.occurrenceDate;
                          if (isEditingThisOccurrence) {
                            setEditingOccurrence(null);
                            setOccurrenceDescription('');
                            setOccurrenceDate('');
                            return;
                          }
                          setEditingOccurrence(occurrence);
                          setOccurrenceDescription(occurrence.description ?? '');
                          setOccurrenceDate(occurrence.occurrenceDate ?? '');
                        }}
                      >
                        {editingOccurrence?.occurrenceDate === occurrence.occurrenceDate
                          ? 'Close occurrence'
                          : 'Edit occurrence'}
                      </button>
                      {editingOccurrence?.occurrenceDate === occurrence.occurrenceDate && (
                        <div className="occurrences-window__editor">
                          <label className="form-field occurrences-window__date">
                            Date
                            <input
                              type="date"
                              value={occurrenceDate}
                              onChange={(changeEvent) =>
                                setOccurrenceDate(changeEvent.target.value)
                              }
                            />
                          </label>
                          <label className="form-field occurrences-window__description">
                            Description
                            <textarea
                              value={occurrenceDescription}
                              onChange={(changeEvent) =>
                                setOccurrenceDescription(changeEvent.target.value)
                              }
                            />
                          </label>
                          <button
                            className="primary-button"
                            type="button"
                            onClick={() => setShowOccurrenceSaveConfirmation(true)}
                          >
                            Save occurrence
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}
            </div>
          ))
        )}
        </div>
        <EventManagerPagination
          currentPage={currentEventPage}
          pageCount={eventPageCount}
          onChange={setEventPage}
        />
      </section>
    </div>
  );
}

function EventManagerPagination({
  currentPage,
  pageCount,
  onChange,
}: {
  currentPage: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="event-pagination" aria-label="Managed event pages">
      <span>
        Page {currentPage} of {pageCount}
      </span>
      <div className="event-pagination__pages">
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
          <button
            type="button"
            key={page}
            className={page === currentPage ? 'active' : undefined}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Go to managed event page ${page}`}
            onClick={() => onChange(page)}
          >
            {page}
          </button>
        ))}
      </div>
    </nav>
  );
}
