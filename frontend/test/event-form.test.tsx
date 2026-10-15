import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EventForm from '../src/components/EventForm';
import type { EventCategory } from '../src/types/events';

const eventApi = vi.hoisted(() => ({ createEvent: vi.fn(), updateEvent: vi.fn() }));
vi.mock('../src/services/events.api', () => ({
  createEvent: eventApi.createEvent,
  updateEvent: eventApi.updateEvent,
}));

type CategoryCase = {
  category: EventCategory;
  titleLabel?: string;
  fields: Array<{ label: string; value: string; select?: boolean }>;
  hasLocation?: boolean;
};

const categoryCases: CategoryCase[] = [
  {
    category: 'APPOINTMENT',
    fields: [
      { label: 'Contact person', value: 'Alex Example' },
      { label: 'Phone number', value: '+49 123 456' },
    ],
    hasLocation: true,
  },
  {
    category: 'BIRTHDAY',
    titleLabel: 'Name',
    fields: [
      { label: 'Relationship', value: 'Friend' },
      { label: 'Birth year', value: '1990' },
      { label: 'Gift ideas', value: 'A book' },
    ],
  },
  {
    category: 'EVENT',
    fields: [
      { label: 'Event type', value: 'Conference' },
      { label: 'Organizer or host', value: 'Example Org' },
      { label: 'Ticket or confirmation number', value: 'TICKET-1' },
    ],
    hasLocation: true,
  },
  {
    category: 'GAME',
    fields: [
      { label: 'Platform', value: 'PC' },
      { label: 'Developer', value: 'Example Studio' },
      { label: 'Genre', value: 'Strategy' },
      { label: 'Progress', value: 'Playing', select: true },
    ],
  },
  {
    category: 'MOVIE',
    fields: [
      { label: 'Director', value: 'Example Director' },
      { label: 'Release year', value: '2026' },
      { label: 'Genre', value: 'Drama' },
      { label: 'Cinema or streaming service', value: 'Cinema' },
    ],
    hasLocation: true,
  },
  { category: 'OTHER', fields: [], hasLocation: true },
  {
    category: 'SCHOOL',
    fields: [
      { label: 'Course or subject', value: 'Mathematics' },
      { label: 'School or institution', value: 'Example School' },
      { label: 'Teacher or instructor', value: 'Professor Example' },
      { label: 'Room', value: 'A12' },
      { label: 'School event type', value: 'Exam', select: true },
    ],
    hasLocation: true,
  },
  {
    category: 'TODO',
    fields: [
      { label: 'Priority', value: 'High', select: true },
      { label: 'Project or list', value: 'Dashboard' },
      { label: 'Estimated minutes', value: '30' },
    ],
  },
  {
    category: 'TRAVEL',
    fields: [
      { label: 'Origin', value: 'Berlin' },
      { label: 'Destination', value: 'Hamburg' },
      { label: 'Transport type', value: 'Train', select: true },
      { label: 'Airline or carrier', value: 'Example Rail' },
      { label: 'Booking reference', value: 'BOOK-1' },
      { label: 'Accommodation', value: 'Example Hotel' },
    ],
    hasLocation: true,
  },
  {
    category: 'TV_SHOW',
    fields: [
      { label: 'Streaming service', value: 'Example TV' },
      { label: 'Genre', value: 'Comedy' },
    ],
  },
  {
    category: 'WORK',
    fields: [
      { label: 'Organization or client', value: 'Example Company' },
      { label: 'Project', value: 'Dashboard' },
      { label: 'Meeting with', value: 'Example Client' },
      { label: 'Priority', value: 'Medium', select: true },
    ],
    hasLocation: true,
  },
];

describe('EventForm interactions', () => {
  it('uses category-specific titles and useful TV show fields', () => {
    render(
      <EventForm category="TV_SHOW" onSaved={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'Create TV show' })).toBeInTheDocument();
    expect(screen.getByLabelText('Streaming service')).toBeInTheDocument();
    expect(screen.getByLabelText('Genre')).toBeInTheDocument();
    expect(screen.queryByLabelText('Season')).not.toBeInTheDocument();
  });

  it('shows controls for infinite, date-limited, and count-limited recurrence', async () => {
    const user = userEvent.setup();
    render(<EventForm category="OTHER" onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('Recurrence'), 'WEEKLY');
    const ends = screen.getByLabelText('Ends');
    expect(ends).toHaveValue('never');

    await user.selectOptions(ends, 'date');
    expect(screen.getByLabelText('End date')).toBeInTheDocument();

    await user.selectOptions(ends, 'count');
    expect(screen.getByLabelText('Occurrences')).toHaveValue(1);
  });

  it.each([
    ['EVENT', ['Event type', 'Organizer or host', 'Ticket or confirmation number']],
    [
      'TRAVEL',
      ['Origin', 'Destination', 'Transport type', 'Airline or carrier', 'Booking reference'],
    ],
    ['WORK', ['Organization or client', 'Project', 'Meeting with', 'Priority']],
    [
      'SCHOOL',
      ['Course or subject', 'School or institution', 'Teacher or instructor', 'Room'],
    ],
  ] as const)('shows the expected %s fields', (category, fields) => {
    render(<EventForm category={category} onSaved={vi.fn()} onCancel={vi.fn()} />);

    fields.forEach((field) => expect(screen.getByLabelText(field)).toBeInTheDocument());
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Related link')).toBeInTheDocument();
  });

  it.each(categoryCases)(
    'submits every populated $category field',
    async ({ category, titleLabel = 'Title', fields, hasLocation }) => {
      eventApi.createEvent.mockResolvedValue(undefined);
      eventApi.createEvent.mockClear();
      const user = userEvent.setup();
      render(<EventForm category={category} onSaved={vi.fn()} onCancel={vi.fn()} />);

      await user.type(screen.getByLabelText(titleLabel), `${category} example`);
      await user.type(screen.getByLabelText('Description'), `${category} description`);
      for (const field of fields) {
        const control = screen.getByLabelText(field.label);
        if (field.select) await user.selectOptions(control, field.value);
        else await user.type(control, field.value);
      }
      if (hasLocation) {
        await user.type(screen.getByLabelText('Location'), `${category} location`);
        await user.type(screen.getByLabelText('Related link'), 'https://example.com/event');
      }
      await user.selectOptions(screen.getByLabelText('Recurrence'), 'YEARLY');
      await user.selectOptions(screen.getByLabelText('Ends'), 'count');
      const occurrences = screen.getByLabelText('Occurrences');
      await user.clear(occurrences);
      await user.type(occurrences, '2');
      await user.click(screen.getByRole('button', { name: /^Create / }));

      await vi.waitFor(() => expect(eventApi.createEvent).toHaveBeenCalledOnce());
      const payload = eventApi.createEvent.mock.calls[0]![0];
      expect(payload).toEqual(
        expect.objectContaining({
          category,
          title: `${category} example`,
          description: `${category} description`,
          recurring: 'YEARLY',
          numberOfRecurrences: 2,
        }),
      );
      expect(Object.values(payload.details ?? {})).toEqual(fields.map((field) => field.value));
      if (hasLocation) {
        expect(payload).toMatchObject({
          location: `${category} location`,
          url: 'https://example.com/event',
        });
      }
    },
  );
});
