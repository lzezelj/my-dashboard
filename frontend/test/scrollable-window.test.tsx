import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ScrollableWindow from '../src/components/ScrollableWindow';

describe('ScrollableWindow', () => {
  it('shows controls for overflowing content and jumps to either boundary', async () => {
    const user = userEvent.setup();
    render(
      <ScrollableWindow aria-label="Test scrolling area">
        <p>Content</p>
      </ScrollableWindow>,
    );
    const viewport = screen.getByLabelText('Test scrolling area');
    const scrollTo = vi.fn();
    Object.defineProperties(viewport, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 500 },
      scrollTo: { configurable: true, value: scrollTo },
    });

    fireEvent(window, new Event('resize'));
    await user.click(await screen.findByRole('button', { name: 'Scroll to bottom' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 500, behavior: 'smooth' });

    await user.click(screen.getByRole('button', { name: 'Scroll to top' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
  });
});
