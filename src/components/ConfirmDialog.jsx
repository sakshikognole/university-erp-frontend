import React from 'react';

export default function ConfirmDialog({ isOpen, message, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 380 }}>
        <div className="books-modal-head">
          <h3>Confirm Delete</h3>
          <button className="books-modal-close" onClick={onCancel}>x</button>
        </div>
        <div className="books-modal-body">
          <p style={{ fontSize: 14, color: '#444' }}>{message}</p>
          <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
            This action cannot be undone.
          </p>
        </div>
        <div className="books-modal-foot">
          <button
            className="books-btn books-btn-ghost"
            onClick={onCancel} disabled={loading}
          >
            Cancel
          </button>
          <button
            className="books-btn books-btn-danger"
            onClick={onConfirm} disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
