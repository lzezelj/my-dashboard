import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';

type ScrollableWindowProps = ComponentPropsWithoutRef<'div'>;

const ScrollableWindow = forwardRef<HTMLDivElement, ScrollableWindowProps>(
  ({ children, className, ...props }, forwardedRef) => {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [canScroll, setCanScroll] = useState(false);

    const setViewport = useCallback(
      (node: HTMLDivElement | null) => {
        viewportRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const update = () => setCanScroll(viewport.scrollHeight > viewport.clientHeight + 1);
      update();
      const frame = window.requestAnimationFrame(update);
      const observer =
        typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => update());
      observer?.observe(viewport);
      window.addEventListener('resize', update);
      return () => {
        window.cancelAnimationFrame(frame);
        observer?.disconnect();
        window.removeEventListener('resize', update);
      };
    }, [children]);

    return (
      <div className={`scrollable-window${canScroll ? ' scrollable-window--overflowing' : ''}`}>
        <div className={className} ref={setViewport} {...props}>
          {children}
        </div>
        {canScroll && (
          <div className="scrollable-window__controls" aria-label="Scroll controls">
            <button
              type="button"
              aria-label="Scroll to top"
              title="Scroll to top"
              onClick={() => viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <span aria-hidden="true">↑</span>
            </button>
            <button
              type="button"
              aria-label="Scroll to bottom"
              title="Scroll to bottom"
              onClick={() =>
                viewportRef.current?.scrollTo({
                  top: viewportRef.current.scrollHeight,
                  behavior: 'smooth',
                })
              }
            >
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        )}
      </div>
    );
  },
);

ScrollableWindow.displayName = 'ScrollableWindow';

export default ScrollableWindow;
