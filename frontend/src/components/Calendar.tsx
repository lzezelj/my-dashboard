import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardEvent, EventCategory } from '../types/events';
import {
  eventCategories,
  eventCategoryLabels,
  eventDetailLabels,
  recurrenceLabels,
} from '../types/events';
import { getEvents, updateEvent, updateOccurrence } from '../services/events.api';
import {
  dateOnlyToDisplay,
  dateOnlyToWeekdayDisplay,
  localDateInputValue,
} from '../utils/dateUtils';
import EventForm from './EventForm';
import Modal from './Modal';
import Pagination from './Pagination';
import ScrollableWindow from './ScrollableWindow';

const EVENTS_PER_PAGE = 25;
const HOUR_ROW_HEIGHT = 68;

const eventDate = (event: DashboardEvent) =>
  event.occurrenceDate ??
  event.date?.slice(0, 10) ??
  (event.startTime ? localDateInputValue(new Date(event.startTime)) : '');

const timedEventRange = (event: DashboardEvent) => {
  const start = new Date(event.startTime!);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  let endMinutes = 24 * 60;
  if (event.endTime) {
    const end = new Date(event.endTime);
    if (!Number.isNaN(end.getTime())) {
      endMinutes =
        localDateInputValue(end) === localDateInputValue(start)
          ? end.getHours() * 60 + end.getMinutes()
          : 24 * 60;
    }
  }
  const durationMinutes = Math.max(15, Math.min(24 * 60 - startMinutes, endMinutes - startMinutes));
  return { startMinutes, endMinutes: startMinutes + durationMinutes, durationMinutes };
};

const layoutTimedEventLines = (events: DashboardEvent[]) => {
  const columnEnds: number[] = [];
  return events.map((event, index) => {
    const range = timedEventRange(event);
    const freeColumn = columnEnds.findIndex((endMinutes) => endMinutes <= range.startMinutes);
    const column = freeColumn === -1 ? columnEnds.length : freeColumn;
    columnEnds[column] = range.endMinutes;
    return { event, column, colorIndex: index, ...range };
  });
};

const overlapMarkerColors = ['#7aa2ff', '#f59e7a', '#6dd6a8', '#c18cff', '#f2ca61', '#67c8e8'];
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
        saveError instanceof Error ? saveError.message : 'Could not save repetition changes.',
      );
    }
  };
  return (
    <div className="event-details" aria-live="polite">
      <Modal
        isOpen={showSaveConfirmation}
        title="Save repetition changes?"
        confirmLabel="Save changes"
        onCancel={() => setShowSaveConfirmation(false)}
        onConfirm={() => void saveOccurrence()}
      >
        <p>This changes only this repetition, not the full repeating event.</p>
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
            <dt>Repeat</dt>
            <dd>
              {event.recurring ? recurrenceLabels[event.recurring] : event.recurrenceRule}
              {event.numberOfRecurrences
                ? `, ${event.numberOfRecurrences} repeats`
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
            {editingDescription ? 'Cancel' : 'Edit this repetition'}
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
                Save repetition
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
  const [timedEventTooltip, setTimedEventTooltip] = useState<{
    event: DashboardEvent;
    color: string;
    x: number;
    y: number;
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createStartTime, setCreateStartTime] = useState<string | null>(null);
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
      upcomingCategory === 'ALL'
        ? { from: today, upcoming: true as const }
        : { from: today, category: upcomingCategory, upcoming: true as const };
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
  const previousMonthLastDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 0);
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const selectedDayEvents = byDate.get(selected) ?? [];
  const timedSelectedDayEvents = selectedDayEvents
    .filter(
      (event) => event.startTime && !event.allDay && !Number.isNaN(Date.parse(event.startTime)),
    )
    .sort(
      (first, second) => timedEventRange(first).startMinutes - timedEventRange(second).startMinutes,
    );
  const timedEventLines = layoutTimedEventLines(timedSelectedDayEvents);
  const allDaySelectedDayEvents = selectedDayEvents.filter(
    (event) => event.allDay || !event.startTime || Number.isNaN(Date.parse(event.startTime ?? '')),
  );
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
      {timedEventTooltip && (
        <div
          className="timed-event-tooltip"
          role="tooltip"
          style={{
            left: timedEventTooltip.x,
            top: timedEventTooltip.y,
            borderColor: timedEventTooltip.color,
          }}
        >
          <strong>{timedEventTooltip.event.title}</strong>
          <span>
            {eventCategoryLabels[timedEventTooltip.event.category]} ·{' '}
            {eventTime(timedEventTooltip.event.startTime!)}
            {timedEventTooltip.event.endTime
              ? `–${eventTime(timedEventTooltip.event.endTime)}`
              : '–End of day'}
          </span>
        </div>
      )}
      <div className="calendar">
        <div className="calendar-month-controls">
          <button
            type="button"
            className="calendar-month-button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
          >
            <span
              className="calendar-month-chevron calendar-month-chevron--previous"
              aria-hidden="true"
            />
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
            <span
              className="calendar-month-chevron calendar-month-chevron--next"
              aria-hidden="true"
            />
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
            Today
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
          <h4>Events for {dateOnlyToWeekdayDisplay(selected)}</h4>
          {selectedDayEvents.length === 0 ? (
            <p className="event-list-empty">No events scheduled for this day.</p>
          ) : (
            <div className="selected-day-agenda">
              <ScrollableWindow className="selected-day-timeline" aria-label="Hourly schedule">
                {Array.from({ length: 24 }, (_, hour) => {
                  return (
                    <div className="selected-day-hour" key={hour}>
                      <time dateTime={`${String(hour).padStart(2, '0')}:00`}>
                        {String(hour).padStart(2, '0')}:00
                      </time>
                      <div className="selected-day-hour__events" />
                      <button
                        className="selected-day-hour__add"
                        type="button"
                        aria-label={`Add event at ${String(hour).padStart(2, '0')}:00`}
                        title={`Add event at ${String(hour).padStart(2, '0')}:00`}
                        onClick={() => {
                          setCreateStartTime(
                            new Date(
                              `${selected}T${String(hour).padStart(2, '0')}:00`,
                            ).toISOString(),
                          );
                          setShowCreateForm(true);
                        }}
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  );
                })}
                <div className="selected-day-timed-events">
                  {timedEventLines.map(
                    ({ event, column, colorIndex, startMinutes, durationMinutes }) => {
                      const color = overlapMarkerColors[colorIndex % overlapMarkerColors.length];
                      return (
                        <button
                          className="timed-event-line"
                          style={{
                            top: (startMinutes / 60) * HOUR_ROW_HEIGHT,
                            left: 10 + column * 14,
                            height: (durationMinutes / 60) * HOUR_ROW_HEIGHT,
                            backgroundColor: color,
                          }}
                          type="button"
                          aria-label={`${event.title}, ${eventTime(event.startTime!)}${event.endTime ? ` to ${eventTime(event.endTime)}` : ' to end of day'}`}
                          key={`${event.id}-${event.occurrenceDate ?? selected}`}
                          onPointerMove={(pointerEvent) =>
                            setTimedEventTooltip({
                              event,
                              color,
                              x: Math.max(
                                12,
                                Math.min(pointerEvent.clientX + 16, window.innerWidth - 340),
                              ),
                              y: Math.max(
                                12,
                                Math.min(pointerEvent.clientY + 16, window.innerHeight - 90),
                              ),
                            })
                          }
                          onPointerLeave={() => setTimedEventTooltip(null)}
                          onFocus={(focusEvent) => {
                            const bounds = focusEvent.currentTarget.getBoundingClientRect();
                            setTimedEventTooltip({
                              event,
                              color,
                              x: Math.max(12, Math.min(bounds.right + 16, window.innerWidth - 340)),
                              y: Math.max(12, Math.min(bounds.top + 8, window.innerHeight - 90)),
                            });
                          }}
                          onBlur={() => setTimedEventTooltip(null)}
                          onClick={() => {
                            setTimedEventTooltip(null);
                            setSelectedEvent(event);
                          }}
                        />
                      );
                    },
                  )}
                </div>
              </ScrollableWindow>
              <aside className="selected-day-all-day" aria-label="All-day events">
                <h5>All-day events</h5>
                <ScrollableWindow className="selected-day-all-day__list">
                  {allDaySelectedDayEvents.length === 0 ? (
                    <p className="event-list-empty">No all-day events.</p>
                  ) : (
                    allDaySelectedDayEvents.map((event) => (
                      <button
                        className="selected-day-event"
                        type="button"
                        key={`${event.id}-${event.occurrenceDate ?? selected}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <strong>{event.title}</strong>
                        <span>{eventCategoryLabels[event.category]}</span>
                      </button>
                    ))
                  )}
                </ScrollableWindow>
                <button
                  className="selected-day-action primary-button"
                  type="button"
                  onClick={() => {
                    if (showCreateForm && createStartTime === null) {
                      setShowCreateForm(false);
                    } else {
                      setCreateStartTime(null);
                      setShowCreateForm(true);
                    }
                  }}
                >
                  {showCreateForm && createStartTime === null ? 'Close form' : 'Add event'}
                </button>
              </aside>
            </div>
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
          {selectedDayEvents.length === 0 && (
            <button
              className="selected-day-action primary-button"
              type="button"
              onClick={() => {
                setCreateStartTime(null);
                setShowCreateForm((open) => !open);
              }}
            >
              {showCreateForm ? 'Close form' : 'Add event'}
            </button>
          )}
          {showCreateForm && (
            <EventForm
              key={`calendar-create-${selected}-${createStartTime ?? 'all-day'}`}
              initialDate={selected}
              initialStartTime={createStartTime ?? undefined}
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
        <h2 id="upcoming-events-title">
          {upcomingEvents.length === 0 && upcomingCategory === 'ALL'
            ? 'No upcoming events'
            : 'Upcoming events'}
        </h2>
        {upcomingEvents.length === 0 && upcomingCategory === 'ALL' ? null : (
          <>
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
            {matchingUpcomingEvents.length > 0 && (
              <Pagination
                currentPage={currentEventPage}
                pageCount={eventPageCount}
                onChange={setEventPage}
              />
            )}
            <ScrollableWindow className="upcoming-events-list">
              {visibleUpcomingEvents.length === 0 ? (
                <p className="event-list-empty">
                  {eventSearch.trim()
                    ? `No events contain “${eventSearch.trim()}” in their ${searchField}.`
                    : 'No upcoming events.'}
                </p>
              ) : (
                visibleUpcomingEvents.map((event, index) => (
                  <div
                    className="event-list-entry"
                    key={`${event.id}-${event.occurrenceDate ?? eventDate(event)}`}
                  >
                    {(index === 0 ||
                      eventDate(visibleUpcomingEvents[index - 1]!) !== eventDate(event)) && (
                      <div className="event-date-heading">
                        {dateOnlyToWeekdayDisplay(eventDate(event))}
                      </div>
                    )}
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
            </ScrollableWindow>
            {matchingUpcomingEvents.length > 0 && (
              <Pagination
                currentPage={currentEventPage}
                pageCount={eventPageCount}
                onChange={setEventPage}
              />
            )}
          </>
        )}
      </section>
    </>
  );
}
