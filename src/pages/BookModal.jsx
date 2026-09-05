import React, { useState, useEffect } from 'react';

const DEPARTMENTS = [
  'Artificial Intelligence',
  'Computer Science',
  'Civil',
  'Electronics',
];

const EMPTY = {
  bookId: '', bookTitle: '', authorName: '', totalCopies: '',
  bookLocation: '', department: '',
};

export default function BookModal({ isOpen, mode, book, onSave, onClose, loading, dupError, onDupOk }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      mode === 'edit' && book
        ? {
            bookId:       book.bookId       || '',
            bookTitle:    book.bookTitle     || '',
            authorName:   book.authorName    || '',
            totalCopies:  book.totalCopies   ?? '',
            bookLocation: book.bookLocation  || '',
            department:   book.department    || '',
          }
        : EMPTY
    );
    setErrors({});
  }, [isOpen, mode, book]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (mode === 'add' && !form.bookId.trim())
      e.bookId = 'Book ID is required';
    else if (mode === 'add' && !/^[A-Za-z0-9\-_]+$/.test(form.bookId.trim()))
      e.bookId = 'Only letters, numbers, hyphens and underscores allowed';
    if (!form.bookTitle.trim())   e.bookTitle    = 'Required';
    if (!form.authorName.trim())  e.authorName   = 'Required';
    if (form.totalCopies === '')  e.totalCopies  = 'Required';
    else if (Number(form.totalCopies) < 0) e.totalCopies = 'Cannot be negative';
    if (!form.bookLocation.trim()) e.bookLocation = 'Required';
    if (!form.department)          e.department   = 'Select a department';
    return e;
  };

  const change = (e) => {
    const { name, value } = e.target;
    setForm(f  => ({ ...f,  [name]: value }));
    setErrors(er => ({ ...er, [name]: '' }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, totalCopies: Number(form.totalCopies) });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      submit(e);
    }
  };

  return (
    <div className="books-overlay">
      <div className="books-modal">
        <div className="books-modal-head">
          <h3>{mode === 'add' ? 'Add Book' : 'Edit Book'}</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={submit} onKeyDown={handleKeyDown}>
          <div className="books-modal-body">

            {/* Duplicate warning */}
            {dupError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <p style={{ color: '#dc2626', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    {dupError}
                  </p>
                </div>
                <button type="button" onClick={onDupOk} style={{
                  alignSelf: 'flex-end', padding: '6px 20px',
                  background: '#dc2626', color: '#fff', border: 'none',
                  borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                }}>
                  OK
                </button>
              </div>
            )}

            {/* Book ID — user enters in add mode, read-only in edit */}
            <div className="books-form-group">
              <label className="books-form-label">
                Book ID *
                {mode === 'add' && (
                  <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.78rem', marginLeft: 6 }}>
                    e.g. BK-001, CS-101
                  </span>
                )}
              </label>
              <input
                className={`books-form-control ${errors.bookId ? 'err' : ''}`}
                name="bookId"
                value={form.bookId}
                onChange={change}
                placeholder="Enter a unique Book ID"
                disabled={mode === 'edit'}
                style={mode === 'edit' ? {
                  background: '#f9fafb', color: '#6b7280',
                  cursor: 'not-allowed', fontFamily: 'monospace',
                } : {}}
                autoFocus={mode === 'add'}
              />
              {errors.bookId && <p className="books-form-err">{errors.bookId}</p>}
            </div>

            <div className="books-form-group">
              <label className="books-form-label">Book Title *</label>
              <input
                className={`books-form-control ${errors.bookTitle ? 'err' : ''}`}
                name="bookTitle" value={form.bookTitle} onChange={change}
                placeholder="Enter book title"
                autoFocus={mode === 'edit'}
              />
              {errors.bookTitle && <p className="books-form-err">{errors.bookTitle}</p>}
            </div>

            <div className="books-form-group">
              <label className="books-form-label">Author Name *</label>
              <input
                className={`books-form-control ${errors.authorName ? 'err' : ''}`}
                name="authorName" value={form.authorName} onChange={change}
                placeholder="Enter author name"
              />
              {errors.authorName && <p className="books-form-err">{errors.authorName}</p>}
            </div>

            <div className="books-form-group">
              <label className="books-form-label">Total Copies *</label>
              <input
                className={`books-form-control ${errors.totalCopies ? 'err' : ''}`}
                name="totalCopies" type="number" min="0"
                value={form.totalCopies} onChange={change}
                placeholder="0"
              />
              {errors.totalCopies && <p className="books-form-err">{errors.totalCopies}</p>}
            </div>

            <div className="books-form-group">
              <label className="books-form-label">Book Location *</label>
              <input
                className={`books-form-control ${errors.bookLocation ? 'err' : ''}`}
                name="bookLocation" value={form.bookLocation} onChange={change}
                placeholder="e.g. Shelf A, Row 2"
              />
              {errors.bookLocation && <p className="books-form-err">{errors.bookLocation}</p>}
            </div>

            <div className="books-form-group">
              <label className="books-form-label">Department *</label>
              <select
                className={`books-form-control ${errors.department ? 'err' : ''}`}
                name="department" value={form.department} onChange={change}
              >
                <option value="">-- Select Department --</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.department && <p className="books-form-err">{errors.department}</p>}
            </div>

          </div>

          <div className="books-modal-foot">
            <button type="button" className="books-btn books-btn-ghost"
              onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Add Book' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
