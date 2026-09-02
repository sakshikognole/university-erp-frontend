import React from 'react';

export default function ViewBookModal({ isOpen, book, onClose }) {
  if (!isOpen || !book) return null;

  const rows = [
    ['Book ID',       book.bookId || book.id],
    ['Book Title',    book.bookTitle],
    ['Author Name',   book.authorName],
    ['Total Copies',  book.totalCopies],
    ['Book Location', book.bookLocation],
    ['Department',    book.department],
  ];

  return (
    <div className="books-overlay">
      <div className="books-modal">
        <div className="books-modal-head">
          <h3>Book Details</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>
        <div className="books-modal-body">
          {rows.map(([label, value]) => (
            <div className="books-detail-row" key={label}>
              <span className="books-detail-label">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
        <div className="books-modal-foot">
          <button className="books-btn books-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
