import { useCallback, useEffect, useState } from 'react';
import type { DashboardEvent, EventCategory, EventInput, Recurrence } from '../types/events';
import { eventCategories, recurrences } from '../types/events';
import { createEvent, deleteEvent, getEvents, updateEvent } from '../services/events.api';
import { dateOnlyToDisplay, localDateInputValue } from '../utils/dateUtils';

const labels: Record<EventCategory, string> = {
  APPOINTMENT: 'Appointment',
  BIRTHDAY: 'Birthday',
  MOVIE: 'Movie',
  TV_SHOW: 'TV show',
  GAME: 'Game',
  TODO: 'Todo',
  OTHER: 'Other',
};
const empty = (category: EventCategory): EventInput => ({
  category,
  title: '',
  date: localDateInputValue(),
  startTime: null,
  endTime: null,
  description: null,
  recurring: null,
  numberOfRecurrences: null,
  allowCompletion: category === 'TODO',
  completed: false,
});
export default function EventManager({ category }: { category?: EventCategory }) {
  const initialCategory = category ?? 'OTHER';
  const [events, setEvents] = useState<DashboardEvent[]>([]),
    [form, setForm] = useState<EventInput>(() => empty(initialCategory)),
    [error, setError] = useState<string | null>(null),
    [editing, setEditing] = useState<number | null>(null);
  const load = useCallback(async () => {
    try {
      setEvents(await getEvents(category ? { category } : {}));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load events.');
    }
  }, [category]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form,
        description: form.description?.trim() || null,
        date: form.startTime ? null : form.date,
        endTime: form.startTime ? form.endTime : null,
        allowCompletion: form.category === 'TODO' ? form.allowCompletion : false,
        completed: form.category === 'TODO' && form.allowCompletion ? form.completed : false,
        recurring: form.recurring || null,
        numberOfRecurrences: form.recurring ? form.numberOfRecurrences : null,
      };
      if (editing) await updateEvent(editing, payload);
      else await createEvent(payload);
      setEditing(null);
      setForm(empty(category ?? form.category));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save event.');
    }
  };
  const edit = (event: DashboardEvent) => {
    setEditing(event.id);
    setForm({
      ...event,
      date: event.date?.slice(0, 10) ?? null,
      startTime: event.startTime,
      endTime: event.endTime,
    });
  };
  return (
    <div className="event-manager">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form className="event-manager__form" onSubmit={submit}>
        <header className="event-manager__form-header">
          <div>
            <h2>{editing ? 'Edit event' : 'Create event'}</h2>
            <p>{editing ? 'Update the details below.' : 'Add an event to your dashboard.'}</p>
          </div>
        </header>
        <div className="event-form-section event-form-section--details">
          <h3>Details</h3>
          {!category && (
            <label className="form-field">
              Category
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as EventCategory)}
              >
                {eventCategories.map((item) => (
                  <option key={item} value={item}>
                    {labels[item]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="form-field">
            {form.category === 'BIRTHDAY' ? 'Name' : 'Title'}
            <input
              required
              name={form.category === 'BIRTHDAY' ? 'name' : 'title'}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </label>
          <label className="form-field">
            Description
            <textarea
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value || null)}
            />
          </label>
        </div>
        <div className="event-form-section event-form-section--schedule">
          <h3>Schedule</h3>
          <label className="calendar-checkbox">
            <input
              type="checkbox"
              checked={Boolean(form.startTime)}
              onChange={(e) =>
                set(
                  'startTime',
                  e.target.checked ? new Date().toISOString().slice(0, 16) + ':00.000Z' : null,
                )
              }
            />{' '}
            Timed event
          </label>
          {form.startTime ? (
            <>
              <label className="form-field">
                Start
                <input
                  type="datetime-local"
                  value={form.startTime.slice(0, 16)}
                  onChange={(e) => set('startTime', new Date(e.target.value).toISOString())}
                />
              </label>
              <label className="form-field">
                End
                <input
                  type="datetime-local"
                  value={form.endTime?.slice(0, 16) ?? ''}
                  onChange={(e) =>
                    set('endTime', e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                />
              </label>
            </>
          ) : (
            <label className="form-field">
              Date
              <input
                required
                type="date"
                value={form.date ?? ''}
                onChange={(e) => set('date', e.target.value)}
              />
            </label>
          )}
        </div>
        <div className="event-form-section event-form-section--options">
          <h3>Options</h3>
          {form.category === 'TODO' && (
            <label className="calendar-checkbox">
              <input
                type="checkbox"
                checked={form.allowCompletion}
                onChange={(e) => set('allowCompletion', e.target.checked)}
              />{' '}
              Allow completion
            </label>
          )}
          <label className="form-field">
            Recurrence
            <select
              value={form.recurring ?? ''}
              onChange={(e) => set('recurring', (e.target.value || null) as Recurrence | null)}
            >
              <option value="">One-time</option>
              {recurrences.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          {form.recurring && (
            <label className="form-field">
              Occurrences
              <input
                required
                min="1"
                type="number"
                value={form.numberOfRecurrences ?? 1}
                onChange={(e) => set('numberOfRecurrences', Number(e.target.value))}
              />
            </label>
          )}
        </div>
        <div className="event-manager__form-actions">
          <button className="primary-button" type="submit">
            {editing ? 'Update event' : 'Create event'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(empty(category ?? form.category));
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <section className="event-manager__list" aria-label="Saved events">
        <h1>{category ? `${labels[category]} events` : 'Events'}</h1>
        {events.map((event) => (
          <article className="event-manager__card" key={event.id}>
            <h3>{event.title}</h3>
            <p>
              {labels[event.category]} ·{' '}
              {dateOnlyToDisplay(event.date ?? event.startTime?.slice(0, 10) ?? '')}
            </p>
            {event.description && <p>{event.description}</p>}
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
            <button type="button" onClick={() => edit(event)}>
              Edit
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={async () => {
                await deleteEvent(event.id);
                await load();
              }}
            >
              Delete
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
