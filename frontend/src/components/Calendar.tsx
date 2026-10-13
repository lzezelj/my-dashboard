import { useEffect, useMemo, useState } from 'react';
import type { DashboardEvent, EventCategory } from '../types/events';
import { eventCategories } from '../types/events';
import { getEvents, updateEvent } from '../services/events.api';
import { dateOnlyToDisplay, localDateInputValue } from '../utils/dateUtils';

const categoryLabels: Record<EventCategory, string> = {
  APPOINTMENT: 'Appointment',
  BIRTHDAY: 'Birthday',
  MOVIE: 'Movie',
  TV_SHOW: 'TV show',
  GAME: 'Game',
  TODO: 'Todo',
  OTHER: 'Other',
};
const eventDate = (event: DashboardEvent) =>
  event.occurrenceDate ?? event.date?.slice(0, 10) ?? event.startTime?.slice(0, 10) ?? '';
const isSameEvent = (first: DashboardEvent | null, second: DashboardEvent) =>
  first?.id === second.id && eventDate(first) === eventDate(second);
function EventDetails({ event }: { event: DashboardEvent }) {
  return (
    <aside className="event-details" aria-live="polite">
      <p>{event.description?.trim() || 'No description has been added for this event.'}</p>
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
  useEffect(() => {
    const start = `${month}-01`,
      end = localDateInputValue(new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0));
    getEvents({ from: start, to: end }).then(setEvents).catch(console.error);
  }, [month]);
  useEffect(() => {
    const filters =
      upcomingCategory === 'ALL' ? { from: today } : { from: today, category: upcomingCategory };
    getEvents(filters)
      .then((items) =>
        setUpcomingEvents(
          items.sort((a, b) => eventDate(a).localeCompare(eventDate(b))).slice(0, 5),
        ),
      )
      .catch(console.error);
  }, [today, upcomingCategory]);
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
  return (
    <>
      <div className="calendar">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
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
                    {categoryLabels[event.category]}
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
                {isSameEvent(selectedDayEvent, event) && <EventDetails event={event} />}
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
                  {categoryLabels[category]}
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
                    {categoryLabels[event.category]}
                  </span>
                </button>
                {isSameEvent(selectedUpcomingEvent, event) && <EventDetails event={event} />}
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
