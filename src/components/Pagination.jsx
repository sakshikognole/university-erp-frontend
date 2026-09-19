import React from 'react';

/**
 * Reusable pagination bar — used by PaymentPage and BooksPage.
 *
 * Props:
 *   pageData      — { pageNumber, pageSize, totalElements, totalPages, first, last }
 *   onPageChange  — (pageIndex: number) => void
 *   onSizeChange  — (size: number) => void
 */
export default function Pagination({ pageData, onPageChange, onSizeChange }) {
  const { pageNumber, pageSize, totalElements, totalPages, first, last } = pageData;

  if (totalElements === 0) return null;

  const from = pageNumber * pageSize + 1;
  const to   = Math.min((pageNumber + 1) * pageSize, totalElements);

  // Build page button list with ellipsis
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
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(-1); // ellipsis
      result.push(sorted[i]);
    }
    return result;
  };

  return (
    <div className="books-pagination-bar">
      {/* Showing X–Y of Z */}
      <span className="books-pg-info">
        Showing {from} to {to} of {totalElements}
      </span>

      {/* Page buttons */}
      <div className="books-pg-controls">
        <button
          className="books-pg-btn books-pg-arrow"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={first}
          title="Previous"
        >
          &lt;
        </button>

        {buildPages().map((p, idx) =>
          p === -1 ? (
            <span key={`ellipsis-${idx}`} className="books-pg-ellipsis">...</span>
          ) : (
            <button
              key={p}
              className={`books-pg-btn${p === pageNumber ? ' active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </button>
          )
        )}

        <button
          className="books-pg-btn books-pg-arrow"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={last}
          title="Next"
        >
          &gt;
        </button>
      </div>

      {/* Items per page */}
      <div className="books-pg-size">
        <span>Items per page:</span>
        <select value={pageSize} onChange={(e) => onSizeChange(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
        </select>
      </div>
    </div>
  );
}
