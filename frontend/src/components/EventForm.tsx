import { useState } from 'react';
import type { DashboardEvent, EventCategory, EventInput, Recurrence } from '../types/events';
import {
  eventCategories,
  eventCategoryLabels,
  recurrenceLabels,
  recurrences,
} from '../types/events';
import { createEvent, updateEvent } from '../services/events.api';
import { localDateInputValue } from '../utils/dateUtils';
import Modal from './Modal';

const blankEvent = (category: EventCategory, date?: string): EventInput => ({
  category,
  title: '',
  date: date ?? localDateInputValue(),
  startTime: null,
  endTime: null,
  description: null,
  details: null,
  location: null,
  url: null,
  recurring: null,
  numberOfRecurrences: null,
  recurrenceEndDate: null,
  allowCompletion: category === 'TODO',
  completed: false,
});
type EventFormProps = {
  category?: EventCategory;
  event?: DashboardEvent;
  initialDate?: string;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
};

type DetailField = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'url' | 'select';
  options?: string[];
  placeholder?: string;
};

const categoryDetailFields: Record<EventCategory, DetailField[]> = {
  APPOINTMENT: [
    { key: 'contactName', label: 'Contact person' },
    { key: 'contactPhone', label: 'Phone number', placeholder: '+49 ...' },
  ],
  BIRTHDAY: [
    { key: 'relationship', label: 'Relationship' },
    { key: 'birthYear', label: 'Birth year', type: 'number' },
    { key: 'giftIdeas', label: 'Gift ideas' },
  ],
  MOVIE: [
    { key: 'director', label: 'Director' },
    { key: 'releaseYear', label: 'Release year', type: 'number' },
    { key: 'genre', label: 'Genre' },
    { key: 'watchOn', label: 'Cinema or streaming service' },
  ],
  TV_SHOW: [
    { key: 'streamingService', label: 'Streaming service' },
    { key: 'genre', label: 'Genre' },
  ],
  GAME: [
    { key: 'platform', label: 'Platform' },
    { key: 'developer', label: 'Developer' },
    { key: 'genre', label: 'Genre' },
    {
      key: 'progress',
      label: 'Progress',
      type: 'select',
      options: ['Not started', 'Playing', 'Completed', 'Paused'],
    },
  ],
  TODO: [
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: ['Low', 'Medium', 'High'],
    },
    { key: 'project', label: 'Project or list' },
    { key: 'estimatedMinutes', label: 'Estimated minutes', type: 'number' },
  ],
  EVENT: [
    { key: 'eventType', label: 'Event type', placeholder: 'Concert, party, conference...' },
    { key: 'organizer', label: 'Organizer or host' },
    { key: 'ticketNumber', label: 'Ticket or confirmation number' },
  ],
  TRAVEL: [
    { key: 'origin', label: 'Origin' },
    { key: 'destination', label: 'Destination' },
    {
      key: 'transportType',
      label: 'Transport type',
      type: 'select',
      options: ['Flight', 'Train', 'Bus', 'Car', 'Ferry', 'Other'],
    },
    { key: 'carrier', label: 'Airline or carrier' },
    { key: 'bookingReference', label: 'Booking reference' },
    { key: 'accommodation', label: 'Accommodation' },
  ],
  WORK: [
    { key: 'organization', label: 'Organization or client' },
    { key: 'project', label: 'Project' },
    { key: 'meetingWith', label: 'Meeting with' },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: ['Low', 'Medium', 'High'],
    },
  ],
  SCHOOL: [
    { key: 'course', label: 'Course or subject' },
    { key: 'institution', label: 'School or institution' },
    { key: 'instructor', label: 'Teacher or instructor' },
    { key: 'room', label: 'Room' },
    {
      key: 'schoolEventType',
      label: 'School event type',
      type: 'select',
      options: ['Class', 'Exam', 'Assignment', 'Presentation', 'Study session', 'Other'],
    },
  ],
  OTHER: [],
};

const categoriesWithPlace = new Set<EventCategory>([
  'APPOINTMENT',
  'MOVIE',
  'EVENT',
  'TRAVEL',
  'WORK',
  'SCHOOL',
  'OTHER',
]);

export default function EventForm({
  category,
  event,
  initialDate,
  onSaved,
  onCancel,
}: EventFormProps) {
  const [form, setForm] = useState<EventInput>(() =>
    event
      ? { ...event, date: event.date?.slice(0, 10) ?? null }
      : blankEvent(category ?? 'OTHER', initialDate),
  );
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recurrenceEnd, setRecurrenceEnd] = useState<'never' | 'date' | 'count'>(() =>
    event?.numberOfRecurrences ? 'count' : event?.recurrenceEndDate ? 'date' : 'never',
  );
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setDetail = (key: string, value: string) =>
    setForm((current) => {
      const details = { ...(current.details ?? {}) };
      if (value) details[key] = value;
      else delete details[key];
      return { ...current, details: Object.keys(details).length ? details : null };
    });
  const submit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError(null);
    const payload: EventInput = {
      ...form,
      description: form.description?.trim() || null,
      details: form.details
        ? Object.fromEntries(
            Object.entries(form.details)
              .map(([key, value]) => [key, value.trim()])
              .filter(([, value]) => value),
          )
        : null,
      location: form.location?.trim() || null,
      url: form.url?.trim() || null,
      date: form.startTime ? null : form.date,
      endTime: form.startTime ? form.endTime : null,
      allowCompletion: form.category === 'TODO' ? form.allowCompletion : false,
      completed: form.category === 'TODO' && form.allowCompletion ? form.completed : false,
      recurring: form.recurring || null,
      numberOfRecurrences:
        form.recurring && recurrenceEnd === 'count' ? form.numberOfRecurrences : null,
      recurrenceEndDate:
        form.recurring && recurrenceEnd === 'date' ? form.recurrenceEndDate : null,
      recurrenceRule: form.recurring ? null : form.recurrenceRule,
    };
    try {
      if (event) await updateEvent(event.id, payload);
      else await createEvent(payload);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save event.');
    }
  };
  const isEditing = Boolean(event);
  const categoryLabel = eventCategoryLabels[form.category];
  const finishSaving = async () => {
    setShowSuccess(false);
    await onSaved();
  };
  return (
    <form className="event-form" onSubmit={submit}>
      <Modal
        isOpen={showSuccess}
        title={isEditing ? 'Event updated' : 'Event created'}
        confirmLabel="Done"
        cancelLabel="Close"
        onConfirm={() => void finishSaving()}
        onCancel={() => void finishSaving()}
      >
        <p>
          {isEditing
            ? 'Your changes have been saved.'
            : 'Your event has been added to the calendar.'}
        </p>
      </Modal>
      <header className="event-form__header">
        <div>
          <h2>{isEditing ? `Edit ${categoryLabel}` : `Create ${categoryLabel}`}</h2>
          <p>{isEditing ? 'Update the details below.' : 'Add an event to your dashboard.'}</p>
        </div>
        <button type="button" className="event-form__close" onClick={onCancel}>
          Close
        </button>
      </header>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="event-form-section event-form-section--details">
        <h3>Details</h3>
        {!category && (
          <label className="form-field">
            Category
            <select
              value={form.category}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  category: e.target.value as EventCategory,
                  details: null,
                  location: null,
                  url: null,
                }))
              }
            >
              {eventCategories.map((item) => (
                <option key={item} value={item}>
                  {eventCategoryLabels[item]}
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
        {categoriesWithPlace.has(form.category) && (
          <label className="form-field">
            Location
            <input
              value={form.location ?? ''}
              placeholder={form.category === 'MOVIE' ? 'Cinema or venue' : undefined}
              onChange={(e) => set('location', e.target.value || null)}
            />
          </label>
        )}
        {categoriesWithPlace.has(form.category) && (
          <label className="form-field">
            Related link
            <input
              type="url"
              value={form.url ?? ''}
              placeholder="https://..."
              onChange={(e) => set('url', e.target.value || null)}
            />
          </label>
        )}
        {categoryDetailFields[form.category].map((field) => (
          <label className="form-field" key={field.key}>
            {field.label}
            {field.type === 'select' ? (
              <select
                value={form.details?.[field.key] ?? ''}
                onChange={(e) => setDetail(field.key, e.target.value)}
              >
                <option value="">Not specified</option>
                {field.options?.map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? 'text'}
                min={field.type === 'number' ? '0' : undefined}
                value={form.details?.[field.key] ?? ''}
                placeholder={field.placeholder}
                onChange={(e) => setDetail(field.key, e.target.value)}
              />
            )}
          </label>
        ))}
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
                required
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
                {recurrenceLabels[item]}
              </option>
            ))}
          </select>
        </label>
        {form.recurring && (
          <>
            <label className="form-field">
              Ends
              <select
                value={recurrenceEnd}
                onChange={(e) =>
                  setRecurrenceEnd(e.target.value as 'never' | 'date' | 'count')
                }
              >
                <option value="never">Never</option>
                <option value="date">On a date</option>
                <option value="count">After a number of occurrences</option>
              </select>
            </label>
            {recurrenceEnd === 'count' && (
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
            {recurrenceEnd === 'date' && (
              <label className="form-field">
                End date
                <input
                  required
                  type="date"
                  min={form.date ?? form.startTime?.slice(0, 10) ?? undefined}
                  value={form.recurrenceEndDate ?? ''}
                  onChange={(e) => set('recurrenceEndDate', e.target.value || null)}
                />
              </label>
            )}
          </>
        )}
      </div>
      <div className="event-form__actions">
        <button className="primary-button" type="submit">
          {isEditing ? `Update ${categoryLabel}` : `Create ${categoryLabel}`}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
