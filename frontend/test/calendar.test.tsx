import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Calendar from '../src/components/Calendar';

const { getEvents } = vi.hoisted(() => ({ getEvents: vi.fn().mockResolvedValue([]) }));
vi.mock('../src/services/events.api', () => ({
  getEvents,
  updateEvent: vi.fn(),
  updateOccurrence: vi.fn(),
}));

describe('Calendar month grid', () => {
  it('keeps all categories first and other last in category filters', async () => {
    getEvents.mockResolvedValue([
      {
        id: 1,
        userId: 1,
        category: 'OTHER',
        title: 'Future event',
        date: '2026-10-20',
      },
    ]);
    render(<Calendar />);
    const category = (await screen.findByLabelText('Category')) as HTMLSelectElement;
    const labels = [...category.options].map((option) => option.textContent);

    expect(labels[0]).toBe('All categories');
    expect(labels.at(-1)).toBe('Other');
  });

  it('shows the empty upcoming-events message without empty pagination', async () => {
    getEvents.mockResolvedValue([]);
    render(<Calendar />);

    expect(await screen.findByRole('heading', { name: 'No upcoming events' })).toBeInTheDocument();
    expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search events' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();
  });

  it('starts weeks on Monday and fills leading cells from the previous month', async () => {
    const { container } = render(<Calendar />);
    fireEvent.change(container.querySelector('input[type="month"]')!, {
      target: { value: '2026-11' },
    });

    expect(
      screen.getAllByText(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/),
    ).toHaveLength(7);
    await waitFor(() => expect(getEvents).toHaveBeenCalled());
    const leadingDays = [...container.querySelectorAll('.calendar-day--outside')]
      .slice(0, 6)
      .map((element) => element.textContent?.trim());
    expect(leadingDays).toEqual(['26', '27', '28', '29', '30', '31']);
    expect(screen.getByRole('region', { name: 'Events for 01/11/2026' })).toBeInTheDocument();
  });

  it('opens complete event information in a modal', async () => {
    const user = userEvent.setup();
    getEvents.mockResolvedValue([
      {
        id: 7,
        userId: 1,
        category: 'APPOINTMENT',
        title: 'Dentist',
        date: '2026-10-15',
        startTime: null,
        endTime: null,
        description: 'Routine check-up',
        location: 'City clinic',
        recurring: null,
        numberOfRecurrences: null,
        allowCompletion: false,
        completed: false,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);
    render(<Calendar />);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Dentist/ }).length).toBeGreaterThan(0),
    );
    await user.click(screen.getAllByRole('button', { name: /Dentist/ })[0]);

    const dialog = screen.getByRole('dialog', { name: 'Dentist' });
    expect(dialog).toHaveTextContent('Appointment');
    expect(dialog).toHaveTextContent('Routine check-up');
    expect(dialog).toHaveTextContent('City clinic');
  });

  it('separates timed events into hourly rows and date-only events into all-day events', async () => {
    const user = userEvent.setup();
    getEvents.mockResolvedValue([
      {
        id: 10,
        userId: 1,
        category: 'EVENT',
        title: 'All-day conference',
        date: '2026-10-16',
        startTime: null,
        endTime: null,
        allDay: true,
        recurring: null,
        numberOfRecurrences: null,
        allowCompletion: false,
        completed: false,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 11,
        userId: 1,
        category: 'APPOINTMENT',
        title: 'Early appointment',
        date: null,
        startTime: '2026-10-16T01:00:00',
        endTime: '2026-10-16T03:15:00',
        allDay: false,
        recurring: null,
        numberOfRecurrences: null,
        allowCompletion: false,
        completed: false,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 12,
        userId: 1,
        category: 'WORK',
        title: 'Overlapping call',
        date: null,
        startTime: '2026-10-16T02:00:00',
        endTime: '2026-10-16T02:30:00',
        allDay: false,
        recurring: null,
        numberOfRecurrences: null,
        allowCompletion: false,
        completed: false,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);
    render(<Calendar />);

    await user.click(await screen.findByRole('button', { name: /16.*3 events/i }));

    const timeline = await screen.findByLabelText('Hourly schedule');
    const oneOClock = within(timeline).getByText('01:00').closest('.selected-day-hour');
    expect(oneOClock).not.toBeNull();
    const earlyEventLine = within(timeline).getByRole('button', {
      name: /Early appointment, 01:00.*03:15/,
    });
    const overlappingEventLine = within(timeline).getByRole('button', {
      name: /Overlapping call, 02:00.*02:30/,
    });
    expect(earlyEventLine).toHaveStyle({ top: '68px', left: '10px', height: '153px' });
    expect(overlappingEventLine).toHaveStyle({ top: '136px', left: '24px', height: '34px' });
    fireEvent.pointerMove(earlyEventLine, { clientX: 200, clientY: 300 });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Early appointment');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Appointment · 01:00–03:15');

    const allDay = screen.getByLabelText('All-day events');
    expect(within(allDay).getByRole('button', { name: /All-day conference/ })).toBeInTheDocument();
    expect(within(allDay).queryByText('Early appointment')).not.toBeInTheDocument();
    expect(within(allDay).getByRole('button', { name: 'Add event' })).toBeInTheDocument();
    expect(screen.getByText('Events for Friday, 16/10/2026')).toBeInTheDocument();

    await user.click(earlyEventLine);
    expect(screen.getByRole('dialog', { name: 'Early appointment' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await user.click(within(oneOClock!).getByRole('button', { name: 'Add event at 01:00' }));
    const form = document.querySelector<HTMLElement>('.selected-date-events .event-form');
    expect(form).not.toBeNull();
    await user.selectOptions(within(form!).getByLabelText('Category'), 'EVENT');
    expect(form!.querySelector<HTMLInputElement>('input[type="datetime-local"]')?.value).toBe(
      '2026-10-16T01:00',
    );
  });

  it('paginates 25 events and searches either titles or descriptions', async () => {
    const user = userEvent.setup();
    const events = Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      userId: 1,
      category: 'OTHER' as const,
      title: index === 29 ? 'Special finale' : `Event ${String(index + 1).padStart(2, '0')}`,
      date: `2026-12-${String(index + 1).padStart(2, '0')}`,
      startTime: null,
      endTime: null,
      description: index === 28 ? 'Contains the secret phrase' : 'Regular description',
      location: null,
      recurring: null,
      numberOfRecurrences: null,
      allowCompletion: false,
      completed: false,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    }));
    getEvents.mockResolvedValue(events);
    render(<Calendar />);

    expect(await screen.findByText('Event 25')).toBeInTheDocument();
    expect(screen.queryByText('Event 26')).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Go to event page 2' })[0]);
    expect(await screen.findByText('Event 26')).toBeInTheDocument();

    const search = screen.getByRole('searchbox', { name: 'Search events' });
    await user.clear(search);
    await user.type(search, 'Special');
    expect(await screen.findByText('Special finale')).toBeInTheDocument();
    expect(screen.queryByText('Event 26')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Description' }));
    await user.clear(search);
    await user.type(search, 'secret');
    expect(await screen.findByText('Event 29')).toBeInTheDocument();
    expect(screen.queryByText('Special finale')).not.toBeInTheDocument();
  });
});
