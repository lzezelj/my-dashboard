import { useState } from 'react';
import type { DashboardEvent, EventCategory, EventInput, Recurrence } from '../types/events';
import { eventCategories, eventCategoryLabels, recurrences } from '../types/events';
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
  recurring: null,
  numberOfRecurrences: null,
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
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError(null);
    const payload: EventInput = {
      ...form,
      description: form.description?.trim() || null,
      date: form.startTime ? null : form.date,
      endTime: form.startTime ? form.endTime : null,
      allowCompletion: form.category === 'TODO' ? form.allowCompletion : false,
      completed: form.category === 'TODO' && form.allowCompletion ? form.completed : false,
      recurring: form.recurring || null,
      numberOfRecurrences: form.recurring ? form.numberOfRecurrences : null,
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
          <h2>{isEditing ? 'Edit event' : 'Create event'}</h2>
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
              onChange={(e) => set('category', e.target.value as EventCategory)}
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
      <div className="event-form__actions">
        <button className="primary-button" type="submit">
          {isEditing ? 'Update event' : 'Create event'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
