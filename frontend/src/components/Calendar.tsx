import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardEvent, EventCategory } from '../types/events';
import { eventCategories, eventCategoryLabels } from '../types/events';
import { getEvents, updateEvent, updateOccurrence } from '../services/events.api';
import { dateOnlyToDisplay, localDateInputValue } from '../utils/dateUtils';
import EventForm from './EventForm';
import Modal from './Modal';

const eventDate = (event: DashboardEvent) =>
  event.occurrenceDate ?? event.date?.slice(0, 10) ?? event.startTime?.slice(0, 10) ?? '';
const isSameEvent = (first: DashboardEvent | null, second: DashboardEvent) =>
  first?.id === second.id && eventDate(first) === eventDate(second);
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
    <aside className="event-details" aria-live="polite">
      <Modal
        isOpen={showSaveConfirmation}
        title="Save occurrence changes?"
        confirmLabel="Save changes"
        onCancel={() => setShowSaveConfirmation(false)}
        onConfirm={() => void saveOccurrence()}
      >
        <p>This changes only this occurrence, not the full recurring event.</p>
      </Modal>
      <p>{event.description?.trim() || 'No description has been added for this event.'}</p>
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
    </aside>
  );
}

export default function Calendar() {
  const today = localDateInputValue();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([]);
  const [selected, setSelected] = useState(today);
  const [upcomingCategory, setUpcomingCategory] = useState<EventCategory | 'ALL'>('ALL');
  const [selectedDayEvent, setSelectedDayEvent] = useState<DashboardEvent | null>(null);
  const [selectedUpcomingEvent, setSelectedUpcomingEvent] = useState<DashboardEvent | null>(null);
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
      setUpcomingEvents(items.sort((a, b) => eventDate(a).localeCompare(eventDate(b))).slice(0, 5));
    } catch (error) {
      console.error(error);
    }
  }, [today, upcomingCategory]);
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
  const selectedDayEvents = byDate.get(selected) ?? [];
  const changeMonth = (offset: number) => {
    const currentMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 1);
    currentMonth.setMonth(currentMonth.getMonth() + offset);
    setMonth(
      `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`,
    );
  };
  return (
    <>
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
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
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
              setSelectedDayEvent(null);
              setShowCreateForm(false);
            }}
          >
            Current Month
          </button>
        </div>
        <div className="calendar-grid">
          {Array.from({ length: days }, (_, index) => {
            const date = `${month}-${String(index + 1).padStart(2, '0')}`,
              items = byDate.get(date) ?? [];
            return (
              <button
                className={`calendar-day${selected === date ? ' selected' : ''}`}
                key={date}
                onClick={() => {
                  setSelected(date);
                  setSelectedDayEvent(null);
                  setShowCreateForm(false);
                }}
              >
                <span>{index + 1}</span>
                {items.length > 0 && <span className="event-count">{items.length}</span>}
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
                  onClick={() =>
                    setSelectedDayEvent((current) => (isSameEvent(current, event) ? null : event))
                  }
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
                {isSameEvent(selectedDayEvent, event) && (
                  <EventDetails event={event} onSaved={loadMonth} />
                )}
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
        <div className="upcoming-events-window__header">
          <h2 id="upcoming-events-title">Next five events</h2>
          <label className="category-selector">
            Category
            <select
              value={upcomingCategory}
              onChange={(e) => {
                setUpcomingCategory(e.target.value as EventCategory | 'ALL');
                setSelectedUpcomingEvent(null);
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
        <div className="upcoming-events-list">
          {upcomingEvents.length === 0 ? (
            <p className="event-list-empty">No upcoming events in this category.</p>
          ) : (
            upcomingEvents.map((event) => (
              <div
                className="event-list-entry"
                key={`${event.id}-${event.occurrenceDate ?? eventDate(event)}`}
              >
                <button
                  className="event-list-item"
                  type="button"
                  onClick={() =>
                    setSelectedUpcomingEvent((current) =>
                      isSameEvent(current, event) ? null : event,
                    )
                  }
                >
                  <strong>{event.title}</strong>
                  <span>
                    {dateOnlyToDisplay(eventDate(event))} {'\u2014'}{' '}
                    {eventCategoryLabels[event.category]}
                  </span>
                </button>
                {isSameEvent(selectedUpcomingEvent, event) && (
                  <EventDetails
                    event={event}
                    onSaved={async () => {
                      await Promise.all([loadMonth(), loadUpcoming()]);
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
