import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
