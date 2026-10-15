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
  it('selects multiple events and asks for confirmation before deleting them', async () => {
    getEvents.mockResolvedValue(events);
    const user = userEvent.setup();
    render(<MemoryRouter><EventManager /></MemoryRouter>);

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
    render(<MemoryRouter><EventManager /></MemoryRouter>);
    await user.click(screen.getByText('Delete', { selector: 'summary' }));
    await user.click(screen.getByRole('button', { name: 'Delete all events' }));
    expect(screen.getByRole('dialog', { name: 'Delete all events?' })).toBeInTheDocument();
  });
});
