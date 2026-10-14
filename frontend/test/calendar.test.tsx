import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Calendar from '../src/components/Calendar';

const { getEvents } = vi.hoisted(() => ({ getEvents: vi.fn().mockResolvedValue([]) }));
vi.mock('../src/services/events.api', () => ({
  getEvents,
  updateEvent: vi.fn(),
  updateOccurrence: vi.fn(),
}));

describe('Calendar month grid', () => {
  it('starts weeks on Monday and fills leading cells from the previous month', async () => {
    const { container } = render(<Calendar />);
    fireEvent.change(container.querySelector('input[type="month"]')!, {
      target: { value: '2026-11' },
    });

    expect(screen.getAllByText(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/))
      .toHaveLength(7);
    await waitFor(() => expect(getEvents).toHaveBeenCalled());
    const leadingDays = [...container.querySelectorAll('.calendar-day--outside')]
      .slice(0, 6)
      .map((element) => element.textContent?.trim());
    expect(leadingDays).toEqual(['26', '27', '28', '29', '30', '31']);
  });
});
