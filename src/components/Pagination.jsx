import React from 'react';

export default function Pagination({ pageData, onPageChange, onSizeChange }) {
  const { pageNumber, pageSize, totalElements, totalPages, first, last } = pageData;

  if (totalElements === 0) return null;

  const from = pageNumber * pageSize + 1;
  const to   = Math.min((pageNumber + 1) * pageSize, totalElements);

  // Build page buttons with ellipsis — matches screenshot style
  // Always show: first page, last page, current page, and 1 neighbour each side
  const buildPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const pages = new Set();
    pages.add(0);                                          // always first
    pages.add(totalPages - 1);                             // always last
    pages.add(pageNumber);                                 // current
    if (pageNumber - 1 >= 0) pages.add(pageNumber - 1);   // left neighbour
    if (pageNumber + 1 < totalPages) pages.add(pageNumber + 1); // right neighbour

    const sorted = Array.from(pages).sort((a, b) => a - b);

    // Insert ellipsis markers (-1) where gaps > 1
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(-1);
      result.push(sorted[i]);
    }
    return result;
  };

  const pageItems = buildPages();

  return (
    <div className="books-pagination-bar">

      {/* Left — Showing X to Y of Z */}
      <span className="books-pg-info">
        Showing {from} to {to} of {totalElements}
      </span>

      {/* Middle — < 1 ... 5 6 > */}
      <div className="books-pg-controls">
        <button
          className="books-pg-btn books-pg-arrow"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={first}
          title="Previous"
        >
          &lt;
        </button>

        {pageItems.map((p, idx) =>
          p === -1 ? (
            <span key={`ellipsis-${idx}`} className="books-pg-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={p}
              className={`books-pg-btn ${p === pageNumber ? 'active' : ''}`}
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

      {/* Right — Items per page dropdown */}
      <div className="books-pg-size">
        Items per page:
        <select value={pageSize} onChange={e => onSizeChange(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
        </select>
      </div>

    </div>
  );
}
