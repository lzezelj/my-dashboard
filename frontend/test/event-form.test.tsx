import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EventForm from '../src/components/EventForm';
import type { EventCategory } from '../src/types/events';

const eventApi = vi.hoisted(() => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  checkImportDuplicates: vi.fn().mockResolvedValue({ duplicates: [], matches: [] }),
}));
vi.mock('../src/services/events.api', () => ({
  createEvent: eventApi.createEvent,
  updateEvent: eventApi.updateEvent,
  checkImportDuplicates: eventApi.checkImportDuplicates,
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
  it('requires the user to select a category in the general add form', () => {
    render(<EventForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Select a category' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Create event' })).toBeInTheDocument();
  });

  it('uses category-specific titles and useful TV show fields', () => {
    render(<EventForm category="TV_SHOW" onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Create TV show' })).toBeInTheDocument();
    expect(screen.getByLabelText('Streaming service (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Genre (Optional)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Season')).not.toBeInTheDocument();
  });

  it('defaults a timed event end to one minute after its start', async () => {
    const user = userEvent.setup();
    render(<EventForm category="EVENT" onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByLabelText('Timed event (Optional)'));
    const start = screen.getByLabelText('Start');
    const end = screen.getByLabelText('End (Optional)');
    fireEvent.change(start, { target: { value: '2026-10-14T01:00' } });

    expect(end).toHaveValue('2026-10-14T01:01');
    expect(end).toHaveAttribute('min', '2026-10-14T01:01');

    await user.click(screen.getByLabelText('Timed event (Optional)'));
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-14');
  });

  it('shows controls for infinite, date-limited, and count-limited recurrence', async () => {
    const user = userEvent.setup();
    render(<EventForm category="OTHER" onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('Repeat (Optional)'), 'WEEKLY');
    const ends = screen.getByLabelText('Ends (Optional)');
    expect(ends).toHaveValue('never');

    await user.selectOptions(ends, 'date');
    expect(screen.getByLabelText('End date')).toBeInTheDocument();

    await user.selectOptions(ends, 'count');
    const repeatCount = screen.getByLabelText('Number of repeats');
    expect(repeatCount).toHaveValue(1);
    await user.click(repeatCount);
    await user.keyboard('12');
    expect(repeatCount).toHaveValue(12);
  });

  it.each([
    ['EVENT', ['Event type', 'Organizer or host', 'Ticket or confirmation number']],
    [
      'TRAVEL',
      ['Origin', 'Destination', 'Transport type', 'Airline or carrier', 'Booking reference'],
    ],
    ['WORK', ['Organization or client', 'Project', 'Meeting with', 'Priority']],
    ['SCHOOL', ['Course or subject', 'School or institution', 'Teacher or instructor', 'Room']],
  ] as const)('shows the expected %s fields', (category, fields) => {
    render(<EventForm category={category} onSaved={vi.fn()} onCancel={vi.fn()} />);

    fields.forEach((field) =>
      expect(screen.getByLabelText(`${field} (Optional)`)).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Location (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Related link (Optional)')).toBeInTheDocument();
  });

  it.each(categoryCases)(
    'submits every populated $category field',
    async ({ category, titleLabel = 'Title', fields, hasLocation }) => {
      eventApi.createEvent.mockResolvedValue(undefined);
      eventApi.createEvent.mockClear();
      const user = userEvent.setup();
      render(<EventForm category={category} onSaved={vi.fn()} onCancel={vi.fn()} />);

      await user.type(screen.getByLabelText(titleLabel), `${category} example`);
      await user.type(screen.getByLabelText('Description (Optional)'), `${category} description`);
      for (const field of fields) {
        const control = screen.getByLabelText(`${field.label} (Optional)`);
        if (field.select) await user.selectOptions(control, field.value);
        else await user.type(control, field.value);
      }
      if (hasLocation) {
        await user.type(screen.getByLabelText('Location (Optional)'), `${category} location`);
        await user.type(
          screen.getByLabelText('Related link (Optional)'),
          'https://example.com/event',
        );
      }
      await user.selectOptions(screen.getByLabelText('Repeat (Optional)'), 'YEARLY');
      await user.selectOptions(screen.getByLabelText('Ends (Optional)'), 'count');
      const occurrences = screen.getByLabelText('Number of repeats');
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
