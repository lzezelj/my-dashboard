import { useState } from 'react';

type Props = { currentPage: number; pageCount: number; onChange: (page: number) => void };

export default function Pagination({ currentPage, pageCount, onChange }: Props) {
  const [target, setTarget] = useState('');
  const pages = Array.from(
    new Set([
      1,
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
      pageCount,
    ]),
  )
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((a, b) => a - b);
  const go = () => {
    const page = Number(target);
    if (target && Number.isInteger(page) && page >= 1 && page <= pageCount) {
      onChange(page);
      setTarget('');
    }
  };
  return (
    <nav className="event-pagination" aria-label="Event pages">
      <span>
        Page {currentPage} of {pageCount}
      </span>
      <div className="event-pagination__pages">
        {pages.map((page, index) => (
          <span className="event-pagination__page-item" key={page}>
            {index > 0 && page - pages[index - 1]! > 1 && <span aria-hidden="true">…</span>}
            <button
              className={page === currentPage ? 'active' : ''}
              type="button"
              aria-label={`Go to event page ${page}`}
              onClick={() => onChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          </span>
        ))}
      </div>
      <form
        className="event-pagination__jump"
        onSubmit={(event) => {
          event.preventDefault();
          go();
        }}
      >
        <label>
          Go to page{' '}
          <input
            aria-label="Page number"
            type="number"
            min="1"
            max={pageCount}
            placeholder={String(currentPage)}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
        </label>
        <button type="submit">Go</button>
      </form>
    </nav>
  );
}
