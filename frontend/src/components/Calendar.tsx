import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardEvent, EventCategory } from '../types/events';
import {
  eventCategories,
  eventCategoryLabels,
  eventDetailLabels,
  recurrenceLabels,
} from '../types/events';
import { getEvents, updateEvent, updateOccurrence } from '../services/events.api';
import { dateOnlyToDisplay, localDateInputValue } from '../utils/dateUtils';
import EventForm from './EventForm';
import Modal from './Modal';

const EVENTS_PER_PAGE = 25;

const eventDate = (event: DashboardEvent) =>
  event.occurrenceDate ?? event.date?.slice(0, 10) ?? event.startTime?.slice(0, 10) ?? '';
const eventTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function EventDetails({
  event,
  onSaved,
}: {
  event: DashboardEvent;
  onSaved: () => void | Promise<void>;
}) {
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(event.description ?? '');
  const [occurrenceDate, setOccurrenceDate] = useState(eventDate(event));
  const [error, setError] = useState<string | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const saveOccurrence = async () => {
    try {
      setError(null);
      await updateOccurrence(event.id, event.sourceOccurrenceDate ?? eventDate(event), {
        description,
        date: occurrenceDate,
      });
      setEditingDescription(false);
      setShowSaveConfirmation(false);
      await onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Could not save occurrence changes.',
      );
    }
  };
  return (
    <div className="event-details" aria-live="polite">
      <Modal
        isOpen={showSaveConfirmation}
        title="Save occurrence changes?"
        confirmLabel="Save changes"
        onCancel={() => setShowSaveConfirmation(false)}
        onConfirm={() => void saveOccurrence()}
      >
        <p>This changes only this occurrence, not the full recurring event.</p>
      </Modal>
      <dl className="event-details__summary">
        <div>
          <dt>Category</dt>
          <dd>{eventCategoryLabels[event.category]}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{dateOnlyToDisplay(eventDate(event))}</dd>
        </div>
        {event.startTime && (
          <div>
            <dt>Time</dt>
            <dd>
              {eventTime(event.startTime)}
              {event.endTime ? ` – ${eventTime(event.endTime)}` : ''}
            </dd>
          </div>
        )}
        {(event.recurring || event.recurrenceRule) && (
          <div>
            <dt>Recurrence</dt>
            <dd>
              {event.recurring ? recurrenceLabels[event.recurring] : event.recurrenceRule}
              {event.numberOfRecurrences
                ? `, ${event.numberOfRecurrences} occurrences`
                : event.recurrenceEndDate
                  ? `, until ${dateOnlyToDisplay(event.recurrenceEndDate.slice(0, 10))}`
                  : ''}
            </dd>
          </div>
        )}
        {event.allowCompletion && (
          <div>
            <dt>Status</dt>
            <dd>{event.completed ? 'Completed' : 'Not completed'}</dd>
          </div>
        )}
        {event.location && (
          <div>
            <dt>Location</dt>
            <dd>{event.location}</dd>
          </div>
        )}
      </dl>
      <section className="event-details__description-block">
        <h3>Description</h3>
        <p>{event.description?.trim() || 'No description has been added for this event.'}</p>
      </section>
      {event.url && (
        <p>
          Link:{' '}
          <a href={event.url} target="_blank" rel="noreferrer">
            {event.url}
          </a>
        </p>
      )}
      {Object.entries(event.details ?? {}).map(([key, value]) => (
        <p key={key}>
          <strong>{eventDetailLabels[key] ?? key}:</strong> {value}
        </p>
      ))}
      {event.recurring && (
        <>
          <button
            type="button"
            className="event-details__edit"
            onClick={() => setEditingDescription((open) => !open)}
          >
            {editingDescription ? 'Cancel' : 'Edit this occurrence'}
          </button>
          {editingDescription && (
            <div className="event-details__editor">
              <label className="form-field event-details__date">
                Date
                <input
                  type="date"
                  value={occurrenceDate}
                  onChange={(e) => setOccurrenceDate(e.target.value)}
                />
              </label>
              <label className="form-field event-details__description">
                Description
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowSaveConfirmation(true)}
              >
                Save occurrence
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Calendar() {
  const today = localDateInputValue();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([]);
  const [selected, setSelected] = useState(today);
  const [upcomingCategory, setUpcomingCategory] = useState<EventCategory | 'ALL'>('ALL');
  const [eventSearch, setEventSearch] = useState('');
  const [searchField, setSearchField] = useState<'title' | 'description'>('title');
  const [eventPage, setEventPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<DashboardEvent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const loadMonth = useCallback(async () => {
    const start = `${month}-01`;
    const end = localDateInputValue(new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0));
    try {
      setEvents(await getEvents({ from: start, to: end }));
    } catch (error) {
      console.error(error);
    }
  }, [month]);
  const loadUpcoming = useCallback(async () => {
    const filters =
      upcomingCategory === 'ALL' ? { from: today } : { from: today, category: upcomingCategory };
    try {
      const items = await getEvents(filters);
      setUpcomingEvents(
        items.sort(
          (a, b) =>
            eventDate(a).localeCompare(eventDate(b)) ||
            (a.startTime ?? '').localeCompare(b.startTime ?? ''),
        ),
      );
    } catch (error) {
      console.error(error);
    }
  }, [today, upcomingCategory]);
  const matchingUpcomingEvents = useMemo(() => {
    const query = eventSearch.trim().toLocaleLowerCase();
    if (!query) return upcomingEvents;
    return upcomingEvents.filter((event) =>
      (searchField === 'title' ? event.title : (event.description ?? ''))
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [eventSearch, searchField, upcomingEvents]);
  const eventPageCount = Math.max(1, Math.ceil(matchingUpcomingEvents.length / EVENTS_PER_PAGE));
  const currentEventPage = Math.min(eventPage, eventPageCount);
  const visibleUpcomingEvents = matchingUpcomingEvents.slice(
    (currentEventPage - 1) * EVENTS_PER_PAGE,
    currentEventPage * EVENTS_PER_PAGE,
  );
  useEffect(() => {
    const timer = window.setTimeout(() => void loadMonth(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMonth]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadUpcoming(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUpcoming]);
  const byDate = useMemo(() => {
    const items = new Map<string, DashboardEvent[]>();
    events.forEach((event) => {
      const key = eventDate(event);
      if (key) items.set(key, [...(items.get(key) ?? []), event]);
    });
    return items;
  }, [events]);
  const days = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const firstDayOffset =
    (new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 1).getDay() + 6) % 7;
  const previousMonthLastDate = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5)) - 1,
    0,
  );
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const selectedDayEvents = byDate.get(selected) ?? [];
  const changeMonth = (offset: number) => {
    const currentMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 1);
    currentMonth.setMonth(currentMonth.getMonth() + offset);
    const nextMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    setMonth(nextMonth);
    setSelected(`${nextMonth}-01`);
    setSelectedEvent(null);
    setShowCreateForm(false);
  };
  return (
    <>
      <Modal
        isOpen={selectedEvent !== null}
        title={selectedEvent?.title ?? 'Event details'}
        confirmLabel="Close"
        showCancel={false}
        className="event-details-modal"
        onCancel={() => setSelectedEvent(null)}
        onConfirm={() => setSelectedEvent(null)}
      >
        {selectedEvent && (
          <EventDetails
            event={selectedEvent}
            onSaved={async () => {
              setSelectedEvent(null);
              await Promise.all([loadMonth(), loadUpcoming()]);
            }}
          />
        )}
      </Modal>
      <div className="calendar">
        <div className="calendar-month-controls">
          <button
            type="button"
            className="calendar-month-button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
          >
            <span className="calendar-month-chevron calendar-month-chevron--previous" aria-hidden="true" />
          </button>
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setSelected(`${e.target.value}-01`);
              setSelectedEvent(null);
              setShowCreateForm(false);
            }}
          />
          <button
            type="button"
            className="calendar-month-button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
          >
            <span className="calendar-month-chevron calendar-month-chevron--next" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="calendar-current-month-button"
            onClick={() => {
              setMonth(today.slice(0, 7));
              setSelected(today);
              setSelectedEvent(null);
              setShowCreateForm(false);
            }}
          >
            Current Month
          </button>
        </div>
        <div className="calendar-grid">
          {weekDays.map((day) => (
            <span className="calendar-weekday" key={day}>
              <span className="calendar-weekday__full">{day}</span>
              <span className="calendar-weekday__short" aria-hidden="true">
                {day.slice(0, 2)}
              </span>
            </span>
          ))}
          {Array.from({ length: firstDayOffset }, (_, index) => {
            const day = previousMonthLastDate.getDate() - firstDayOffset + index + 1;
            const date = `${previousMonthLastDate.getFullYear()}-${String(previousMonthLastDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return (
              <button
                type="button"
                className="calendar-day calendar-day--outside"
                aria-label={`Open ${dateOnlyToDisplay(date)}`}
                key={date}
                onClick={() => {
                  setMonth(date.slice(0, 7));
                  setSelected(date);
                  setSelectedEvent(null);
                  setShowCreateForm(false);
                }}
              >
                <span>{day}</span>
              </button>
            );
          })}
          {Array.from({ length: days }, (_, index) => {
            const date = `${month}-${String(index + 1).padStart(2, '0')}`,
              items = byDate.get(date) ?? [];
            return (
              <button
                className={`calendar-day${selected === date ? ' selected' : ''}`}
                key={date}
                onClick={() => {
                  setSelected(date);
                  setSelectedEvent(null);
                  setShowCreateForm(false);
                }}
              >
                <span>{index + 1}</span>
                {items.length > 0 && (
                  <span
                    className="event-count"
                    aria-label={`${items.length} event${items.length === 1 ? '' : 's'}`}
                  >
                    {items.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <section
          className="selected-date-events"
          aria-label={`Events for ${dateOnlyToDisplay(selected)}`}
        >
          <h4>Events for {dateOnlyToDisplay(selected)}</h4>
          {selectedDayEvents.length === 0 ? (
            <p className="event-list-empty">No events scheduled for this day.</p>
          ) : (
            selectedDayEvents.map((event) => (
              <div
                className="event-list-entry"
                key={`${event.id}-${event.occurrenceDate ?? selected}`}
              >
                <button
                  className="event-list-item"
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                >
                  <strong>{event.title}</strong>
                  <span>
                    {eventCategoryLabels[event.category]}
                    {event.startTime && (
                      <>
                        {' '}
                        {'\u2014'}{' '}
                        {new Date(event.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </>
                    )}
                  </span>
                </button>
              </div>
            ))
          )}
          {selectedDayEvents
            .filter((event) => event.allowCompletion)
            .map((event) => (
              <button
                key={event.id}
                className="selected-day-action"
                type="button"
                onClick={async () => {
                  await updateEvent(event.id, { completed: !event.completed });
                  setEvents((current) =>
                    current.map((item) =>
                      item.id === event.id ? { ...item, completed: !item.completed } : item,
                    ),
                  );
                }}
              >
                {event.title}: {event.completed ? 'Completed' : 'Complete'}
              </button>
            ))}
          <button
            className="selected-day-action primary-button"
            type="button"
            onClick={() => setShowCreateForm((open) => !open)}
          >
            {showCreateForm ? 'Close form' : 'Add event'}
          </button>
          {showCreateForm && (
            <EventForm
              key={`calendar-create-${selected}`}
              initialDate={selected}
              onCancel={() => setShowCreateForm(false)}
              onSaved={async () => {
                setShowCreateForm(false);
                await Promise.all([loadMonth(), loadUpcoming()]);
              }}
            />
          )}
        </section>
      </div>
      <section className="upcoming-events-window" aria-labelledby="upcoming-events-title">
        <h2 id="upcoming-events-title">Upcoming events</h2>
        <div className="upcoming-events-window__toolbar">
          <div className="event-search-controls">
            <label className="event-search-field">
              Search events
              <input
                type="search"
                value={eventSearch}
                placeholder={`Search by ${searchField}`}
                onChange={(event) => {
                  setEventSearch(event.target.value);
                  setEventPage(1);
                }}
              />
            </label>
            <fieldset className="event-search-selector">
              <legend>Search in</legend>
              <label>
                <input
                  type="radio"
                  name="event-search-field"
                  value="title"
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
                  name="event-search-field"
                  value="description"
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
          <label className="category-selector">
            Category
            <select
              value={upcomingCategory}
              onChange={(e) => {
                setUpcomingCategory(e.target.value as EventCategory | 'ALL');
                setEventPage(1);
                setSelectedEvent(null);
              }}
            >
              <option value="ALL">All categories</option>
              {eventCategories.map((category) => (
                <option key={category} value={category}>
                  {eventCategoryLabels[category]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <EventPagination
          currentPage={currentEventPage}
          pageCount={eventPageCount}
          onChange={setEventPage}
        />
        <div className="upcoming-events-list">
          {visibleUpcomingEvents.length === 0 ? (
            <p className="event-list-empty">
              {eventSearch.trim()
                ? `No events contain “${eventSearch.trim()}” in their ${searchField}.`
                : 'No upcoming events in this category.'}
            </p>
          ) : (
            visibleUpcomingEvents.map((event) => (
              <div
                className="event-list-entry"
                key={`${event.id}-${event.occurrenceDate ?? eventDate(event)}`}
              >
                <button
                  className="event-list-item"
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                >
                  <strong>{event.title}</strong>
                  <span>
                    {dateOnlyToDisplay(eventDate(event))} {'\u2014'}{' '}
                    {eventCategoryLabels[event.category]}
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
        <EventPagination
          currentPage={currentEventPage}
          pageCount={eventPageCount}
          onChange={setEventPage}
        />
      </section>
    </>
  );
}

function EventPagination({
  currentPage,
  pageCount,
  onChange,
}: {
  currentPage: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="event-pagination" aria-label="Event pages">
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
            aria-label={`Go to event page ${page}`}
            onClick={() => onChange(page)}
          >
            {page}
          </button>
        ))}
      </div>
    </nav>
  );
}
