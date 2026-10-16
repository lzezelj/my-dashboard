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
import { dateOnlyToDisplay, localDateInputValue } from '../utils/dateUtils';
import EventForm from './EventForm';
import Modal from './Modal';
import Pagination from './Pagination';
import ScrollableWindow from './ScrollableWindow';

const EVENTS_PER_PAGE = 25;
const eventDate = (event: DashboardEvent) =>
  event.date?.slice(0, 10) ?? event.startTime?.slice(0, 10) ?? '';
const sortEvents = (events: DashboardEvent[]) =>
  [...events].sort(
    (a, b) =>
      eventDate(a).localeCompare(eventDate(b)) ||
      (a.startTime ?? '').localeCompare(b.startTime ?? '') ||
      a.id - b.id,
  );

export default function EventManager({ initialCategory }: { initialCategory?: EventCategory }) {
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'ALL'>(
    initialCategory ?? 'ALL',
  );
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
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
  const [duplicateGroups, setDuplicateGroups] = useState<Array<{
    original: DashboardEvent;
    duplicates: DashboardEvent[];
  }> | null>(null);
  const hasSetInitialPage = useRef(false);
  const hasScrolledToInitialEvent = useRef(false);
  const [initialEventId, setInitialEventId] = useState<number | null>(null);
  const eventListRef = useRef<HTMLDivElement>(null);
  const resultsWindowRef = useRef<HTMLElement>(null);
  const deleteMenuRef = useRef<HTMLDetailsElement>(null);
  const transferMenuRef = useRef<HTMLDetailsElement>(null);
  const navigate = useNavigate();
  const load = useCallback(async () => {
    try {
      setError(null);
      const loadedEvents = await getEvents(
        filterCategory === 'ALL' ? {} : { category: filterCategory },
      );
      setEvents(loadedEvents);
      if (!hasSetInitialPage.current) {
        const sorted = sortEvents(loadedEvents);
        const today = localDateInputValue();
        const upcomingOccurrences = await getEvents({
          from: today,
          upcoming: true,
          ...(filterCategory === 'ALL' ? {} : { category: filterCategory }),
        });
        const firstUpcoming = [...upcomingOccurrences].sort(
          (a, b) =>
            (a.occurrenceDate ?? eventDate(a)).localeCompare(b.occurrenceDate ?? eventDate(b)) ||
            (a.startTime ?? '').localeCompare(b.startTime ?? '') ||
            a.id - b.id,
        )[0];
        const currentIndex = firstUpcoming
          ? sorted.findIndex((event) => event.id === firstUpcoming.id)
          : -1;
        setEventPage(currentIndex < 0 ? 1 : Math.floor(currentIndex / EVENTS_PER_PAGE) + 1);
        setInitialEventId(currentIndex < 0 ? null : sorted[currentIndex]!.id);
        hasSetInitialPage.current = true;
      }
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
      if (!deleteMenuRef.current?.contains(target) && !transferMenuRef.current?.contains(target)) {
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
    const sorted = sortEvents(events);
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
  useEffect(() => {
    if (initialEventId === null || hasScrolledToInitialEvent.current) return;
    const frame = window.requestAnimationFrame(() => {
      const target = eventListRef.current?.querySelector<HTMLElement>(
        `[data-event-id="${initialEventId}"]`,
      );
      if (!target) return;
      const list = eventListRef.current;
      list?.scrollTo?.({
        top: Math.max(0, target.offsetTop - (list?.offsetTop ?? 0) - 12),
        behavior: 'smooth',
      });
      resultsWindowRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      hasScrolledToInitialEvent.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentEventPage, initialEventId, visibleEvents]);
  const changeEventPage = (page: number) => {
    setEventPage(page);
    window.requestAnimationFrame(() => {
      eventListRef.current?.scrollTo?.({ top: 0 });
      resultsWindowRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    });
  };
  const closeForm = () => {
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
      link.download = `calendar-dashboard-events-${new Date().toISOString().slice(0, 10)}.json`;
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
      link.download = `calendar-dashboard-events-${new Date().toISOString().slice(0, 10)}.ics`;
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
      setDuplicateGroups(null);
      setBulkDeleteMode(null);
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete events.');
      setBulkDeleteMode(null);
    }
  };
  const checkForDuplicates = async () => {
    try {
      setError(null);
      const allEvents = sortEvents(await getEvents());
      const groupsByKey = new Map<string, DashboardEvent[]>();
      const duplicateIds = new Set<number>();
      for (const event of allEvents) {
        const date = eventDate(event);
        if (!date) continue;
        const key = `${event.title.trim().toLocaleLowerCase()}\u0000${date}`;
        groupsByKey.set(key, [...(groupsByKey.get(key) ?? []), event]);
      }
      const groups = [...groupsByKey.values()]
        .filter((group) => group.length > 1)
        .map(([original, ...duplicates]) => ({ original: original!, duplicates }));
      groups.forEach(({ duplicates }) =>
        duplicates.forEach((duplicate) => duplicateIds.add(duplicate.id)),
      );

      setFilterCategory('ALL');
      setEventSearch('');
      setEvents(allEvents);
      setSelectedEventIds(duplicateIds);
      setDuplicateGroups(groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check for duplicate events.');
    }
  };
  return (
    <div className="event-manager">
      <Modal
        isOpen={duplicateGroups !== null}
        title="Duplicate check results"
        confirmLabel="Close"
        showCancel={false}
        onCancel={() => setDuplicateGroups(null)}
        onConfirm={() => setDuplicateGroups(null)}
        className="duplicate-results-modal"
      >
        {duplicateGroups?.length === 0 ? (
          <p>No duplicate events were found.</p>
        ) : (
          <>
            <p>
              Suspected duplicates are selected for deletion. Review the original and duplicate
              copies below, then close this window and use Delete selected if they should be
              removed.
            </p>
            <ScrollableWindow className="duplicate-results">
              {duplicateGroups?.map(({ original, duplicates }) => (
                <section className="duplicate-results__group" key={original.id}>
                  <DuplicateEvent event={original} label="Original" />
                  {duplicates.map((duplicate) => (
                    <DuplicateEvent
                      event={duplicate}
                      label="Suspected duplicate"
                      key={duplicate.id}
                    />
                  ))}
                </section>
              ))}
            </ScrollableWindow>
          </>
        )}
      </Modal>
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
        <p>This updates only the selected occurrence, not the entire repeating event.</p>
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
              setDuplicateGroups(null);
              return load();
            })
            .finally(() => setEventToDelete(null));
        }}
      >
        <p>Delete “{eventToDelete?.title}”? This cannot be undone.</p>
      </Modal>
      <header className="event-manager__header">
        <div className="event-manager__heading">
          <h1>Manage events</h1>
          <p>Browse and update your events</p>
        </div>
        {(events.length > 0 || filterCategory !== 'ALL') && (
          <>
            <div className="event-manager__controls">
              <div className="event-manager__primary-controls">
                <label className="category-selector">
                  Category
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value as EventCategory | 'ALL');
                      setDuplicateGroups(null);
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
                <button type="button" onClick={() => void checkForDuplicates()}>
                  Check for duplicates
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
          </>
        )}
      </header>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {events.length === 0 && filterCategory === 'ALL' ? (
        <section className="event-manager__empty-state" aria-label="No saved events">
          <p>There are no events.</p>
          <div className="event-manager__empty-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => navigate('/events/add')}
            >
              Add event
            </button>
            <button type="button" onClick={() => navigate('/events/import')}>
              Import Calendar
            </button>
          </div>
        </section>
      ) : (
        <section
          className="event-manager__results-window"
          aria-label="Event search results"
          ref={resultsWindowRef}
        >
          {matchingEvents.length > 0 && (
            <Pagination
              currentPage={currentEventPage}
              pageCount={eventPageCount}
              onChange={changeEventPage}
            />
          )}
          <ScrollableWindow
            className="event-manager__list"
            aria-label="Saved events"
            ref={eventListRef}
          >
            {visibleEvents.length === 0 ? (
              <p className="event-list-empty">
                {eventSearch.trim()
                  ? `No events contain “${eventSearch.trim()}” in their ${searchField}.`
                  : 'There are no events.'}
              </p>
            ) : (
              visibleEvents.map((event) => (
                <div
                  className={`event-manager__entry${event.id === initialEventId ? ' event-manager__entry--current' : ''}`}
                  data-event-id={event.id}
                  key={event.id}
                >
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
                          setEditingEvent((current) => (current?.id === event.id ? null : event));
                        }}
                      >
                        Edit
                      </button>
                      {event.recurring && (
                        <button type="button" onClick={() => void toggleOccurrences(event)}>
                          {occurrenceEventId === event.id
                            ? 'Close occurrences'
                            : 'Edit occurrences'}
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
          </ScrollableWindow>
          {matchingEvents.length > 0 && (
            <Pagination
              currentPage={currentEventPage}
              pageCount={eventPageCount}
              onChange={changeEventPage}
            />
          )}
        </section>
      )}
    </div>
  );
}

function DuplicateEvent({ event, label }: { event: DashboardEvent; label: string }) {
  return (
    <article className="duplicate-results__event">
      <strong>{label}</strong>
      <span>{event.title}</span>
      <span>{dateOnlyToDisplay(eventDate(event))}</span>
      <span>{eventCategoryLabels[event.category]}</span>
    </article>
  );
}
