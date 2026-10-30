import React from 'react';
import { AlertTriangle, AlertCircle, Trash2, X, Loader2 } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Delete Item',
  description,
  message,
  itemName,
  itemSubtext,
  itemBadge,
  confirmText,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!isOpen) return null;

  const descText =
    description ||
    message ||
    `Are you sure you want to delete this ${title.toLowerCase().replace('delete ', '')}? This action will permanently remove the record.`;
  const btnLabel = confirmText || (title.startsWith('Delete') ? title : `Delete ${title}`);

  return (
    <div className="modal-overlay" onClick={() => !loading && onCancel && onCancel()}>
      <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="delete-dialog-header">
          <div className="delete-dialog-icon">
            <AlertTriangle size={22} />
          </div>
          <div className="delete-dialog-title-box">
            <h3 className="delete-dialog-title">{title}</h3>
            <p className="delete-dialog-desc">{descText}</p>
          </div>
          <button
            type="button"
            className="close-modal-btn"
            onClick={() => !loading && onCancel && onCancel()}
            title="Close"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        {(itemName || itemBadge || itemSubtext) && (
          <div className="delete-item-preview">
            <div>
              {itemName && <div className="delete-item-name">{itemName}</div>}
              {itemSubtext && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {itemSubtext}
                </div>
              )}
            </div>
            {itemBadge && <span className="delete-item-code">{itemBadge}</span>}
          </div>
        )}

        <div className="delete-warning-note">
          <AlertCircle size={14} />
          <span>This operation cannot be undone.</span>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin-animate" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{btnLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

