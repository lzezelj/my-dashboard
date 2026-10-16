import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import EventManager from '../src/components/EventManager';
import type { DashboardEvent } from '../src/types/events';

const events: DashboardEvent[] = [1, 2].map((id) => ({
  id,
  userId: 1,
  category: 'OTHER',
  title: `Event ${id}`,
  date: `2026-10-${String(id).padStart(2, '0')}`,
  startTime: null,
  endTime: null,
  description: null,
  recurring: null,
  numberOfRecurrences: null,
  allowCompletion: false,
  completed: false,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
}));
const { getEvents } = vi.hoisted(() => ({ getEvents: vi.fn() }));

vi.mock('../src/services/events.api', () => ({
  getEvents,
  deleteEvent: vi.fn(),
  deleteAllEvents: vi.fn(),
  deleteEvents: vi.fn(),
  exportEvents: vi.fn(),
  exportIcs: vi.fn(),
  getEventOccurrences: vi.fn(),
  updateEvent: vi.fn(),
  updateOccurrence: vi.fn(),
}));

describe('EventManager bulk selection', () => {
  it('shows the empty events message without empty pagination', async () => {
    getEvents.mockResolvedValue([]);
    render(
      <MemoryRouter>
        <EventManager />
      </MemoryRouter>,
    );

    expect(await screen.findByText('There are no events.')).toBeInTheDocument();
    expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search events' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import Calendar' })).toBeInTheDocument();
  });

  it("opens on the page containing today's event, or the first upcoming event", async () => {
    const manyEvents: DashboardEvent[] = Array.from({ length: 30 }, (_, index) => ({
      ...events[0]!,
      id: index + 1,
      title: `Dated event ${index + 1}`,
      date: `2026-10-${String(index + 1).padStart(2, '0')}`,
    }));
    getEvents.mockImplementation(async (filters = {}) =>
      'upcoming' in filters ? [{ ...manyEvents[26]!, occurrenceDate: '2026-10-27' }] : manyEvents,
    );

    render(
      <MemoryRouter>
        <EventManager />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Dated event 27')).toBeInTheDocument();
    expect(screen.queryByText('Dated event 1')).not.toBeInTheDocument();
  });

  it('displays and sorts a repeating series by its next repetition', async () => {
    const repeatingEvent: DashboardEvent = {
      ...events[0]!,
      id: 20,
      title: 'Repeating event',
      date: '2020-01-01',
      recurring: 'YEARLY',
    };
    getEvents.mockImplementation(async (filters = {}) =>
      'upcoming' in filters
        ? [{ ...repeatingEvent, occurrenceDate: '2026-10-20' }]
        : [repeatingEvent],
    );

    render(
      <MemoryRouter>
        <EventManager />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Tuesday, 20/10/2026')).toBeInTheDocument();
    expect(screen.getByText('Other · 20/10/2026')).toBeInTheDocument();
    expect(screen.queryByText('01/01/2020')).not.toBeInTheDocument();
  });

  it('selects multiple events and asks for confirmation before deleting them', async () => {
    getEvents.mockResolvedValue(events);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EventManager />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Event 1')).toBeInTheDocument());
    const checkboxes = screen.getAllByRole('checkbox', { name: 'Select for deletion' });
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(screen.getByText('Delete', { selector: 'summary' }));
    await user.click(screen.getByRole('button', { name: 'Delete selected (2)' }));
    expect(screen.getByRole('dialog', { name: 'Delete selected events?' })).toBeInTheDocument();
    expect(screen.getByText('This permanently deletes 2 selected events.')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting all events', async () => {
    getEvents.mockResolvedValue(events);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EventManager />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Event 1')).toBeInTheDocument());
    await user.click(screen.getByText('Delete', { selector: 'summary' }));
    await user.click(screen.getByRole('button', { name: 'Delete all events' }));
    expect(screen.getByRole('dialog', { name: 'Delete all events?' })).toBeInTheDocument();
  });
});
