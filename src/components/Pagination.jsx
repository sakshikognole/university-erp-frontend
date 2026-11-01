import React from 'react';

/**
 * Reusable pagination bar matching screenshot
 * Props:
 *   pageData      — { pageNumber, pageSize, totalElements, totalPages, first, last }
 *   onPageChange  — (pageIndex: number) => void
 *   onSizeChange  — (size: number) => void
 *   unit          — string (e.g. 'books', 'students', 'classrooms', default: 'books')
 */
export default function Pagination({ pageData, onPageChange, onSizeChange, unit = 'books' }) {
  if (!pageData || pageData.totalElements === 0) return null;

  const { pageNumber, pageSize, totalElements, totalPages, first, last } = pageData;

  const to = Math.min((pageNumber + 1) * pageSize, totalElements);

  // Desktop page numbers with ellipsis
  const buildPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const pages = new Set();
    pages.add(0);
    pages.add(totalPages - 1);
    pages.add(pageNumber);
    if (pageNumber - 1 >= 0)          pages.add(pageNumber - 1);
    if (pageNumber + 1 < totalPages)  pages.add(pageNumber + 1);

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(-1);
      result.push(sorted[i]);
    }
    return result;
  };

  return (
    <div className="books-pagination-bar">
      {/* Showing X of Y unit */}
      <span className="books-pg-info">
        <span className="books-pg-count">{to} of {totalElements}</span>
        {unit ? <span className="books-pg-unit"> {unit}</span> : null}
      </span>

      {/* Page controls */}
      <div className="books-pg-controls">
        <button
          type="button"
          className="books-pg-btn books-pg-arrow"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={first}
          title="Previous"
          aria-label="Previous page"
        >
          &lt;
        </button>

        {/* Desktop full page buttons */}
        <div className="books-pg-desk-buttons">
          {buildPages().map((p, idx) =>
            p === -1 ? (
              <span key={`ellipsis-${idx}`} className="books-pg-ellipsis">...</span>
            ) : (
              <button
                type="button"
                key={p}
                className={`books-pg-btn${p === pageNumber ? ' active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p + 1}
              </button>
            )
          )}
        </div>

        {/* Mobile active page button: [ < ] [ 1 ] [ > ] */}
        <div className="books-pg-mob-button">
          <button type="button" className="books-pg-btn active">
            {pageNumber + 1}
          </button>
        </div>

        <button
          type="button"
          className="books-pg-btn books-pg-arrow"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={last}
          title="Next"
          aria-label="Next page"
        >
          &gt;
        </button>
      </div>

      {/* Divider */}
      <div className="books-pg-divider" />

      {/* Items per page */}
      <div className="books-pg-size">
        <span className="books-pg-size-label">
          <span className="books-pg-size-full">Items per page:</span>
          <span className="books-pg-size-short">Per page:</span>
        </span>
        <select value={pageSize} onChange={(e) => onSizeChange(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
        </select>
      </div>
    </div>
  );
}
