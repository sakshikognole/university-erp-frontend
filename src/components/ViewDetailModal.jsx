import React from 'react';

export default function ViewDetailModal({ isOpen, title, subtitle, rows, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="books-overlay" onClick={onClose}>
      <div className="books-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="books-modal-head">
          <div>
            {subtitle && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                {subtitle}
              </p>
            )}
            <h3>{title}</h3>
          </div>
          <button type="button" className="books-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {rows && rows.map((row, idx) => {
            const label = Array.isArray(row) ? row[0] : row.label;
            const value = Array.isArray(row) ? row[1] : row.value;
            return (
              <div className="books-detail-row" key={idx}>
                <span className="books-detail-label">{label}</span>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1, wordBreak: 'break-word' }}>
                  {value != null && value !== '' ? value : '—'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="books-modal-foot">
          <button type="button" className="books-btn books-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
