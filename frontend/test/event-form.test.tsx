import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EventForm from '../src/components/EventForm';

vi.mock('../src/services/events.api', () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
}));

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
});
