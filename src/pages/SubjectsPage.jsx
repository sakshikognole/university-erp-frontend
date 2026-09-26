import { useState, useEffect, useCallback } from 'react';
import { springApi, springGet } from '../services/api';
import PageError from '../components/PageError';

// ── Empty form ─────────────────────────────────────────────────────────────
const EMPTY = { subjectName: '', description: '' };

// ── Add / Edit Modal ───────────────────────────────────────────────────────
function SubjectModal({ isOpen, mode, subject, onSave, onClose, saving }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && subject) {
      setForm({
        subjectName: subject.subjectName  ?? '',
        description: subject.description ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [isOpen, mode, subject]);

  if (!isOpen) return null;

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.subjectName.trim()) e.subjectName = 'Subject name is required.';
    else if (!/^[A-Za-z\s]+$/.test(form.subjectName.trim()))
      e.subjectName = 'Subject name must contain only letters and spaces.';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 460 }}>
        <div className="books-modal-head">
          <h3>{mode === 'add' ? 'Add Subject' : 'Edit Subject'}</h3>
          <button className="books-modal-close" onClick={onClose} disabled={saving}>
            x
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="books-modal-body">

            {/* Subject ID — shown in edit mode only (auto-generated, read-only) */}
            {mode === 'edit' && subject && (
              <div className="books-form-group">
                <label className="books-form-label">Subject ID</label>
                <input
                  className="books-form-control"
                  value={subject.subjectId}
                  readOnly
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                           cursor: 'default' }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                  Auto-generated — cannot be changed.
                </p>
              </div>
            )}

            {/* Subject Name */}
            <div className="books-form-group">
              <label className="books-form-label">Subject Name *</label>
              <input
                className={`books-form-control ${errors.subjectName ? 'err' : ''}`}
                name="subjectName"
                value={form.subjectName}
                onChange={change}
                placeholder="e.g. Data Structures"
                autoFocus
              />
              {errors.subjectName && (
                <p className="books-form-err">{errors.subjectName}</p>
              )}
            </div>

            {/* Description */}
            <div className="books-form-group">
              <label className="books-form-label">Description</label>
              <textarea
                className="books-form-control"
                name="description"
                value={form.description}
                onChange={change}
                placeholder="e.g. Covers arrays, linked lists, trees and graphs"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

          </div>
          <div className="books-modal-foot">
            <button
              type="button"
              className="books-btn books-btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="books-btn books-btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : mode === 'add' ? 'Add Subject' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── View Modal ─────────────────────────────────────────────────────────────
function ViewSubjectModal({ isOpen, subject, onClose }) {
  if (!isOpen || !subject) return null;
  return (
    <div className="books-overlay" onClick={onClose}>
      <div className="books-modal" style={{ maxWidth: 420 }}
           onClick={(e) => e.stopPropagation()}>
        <div className="books-modal-head">
          <h3>Subject Details</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>
        <div className="books-modal-body">
          {[
            ['Subject ID',   subject.subjectId],
            ['Subject Name', subject.subjectName],
            ['Description',  subject.description || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', gap: 12, padding: '8px 0',
              borderBottom: '1px solid var(--border-primary, #f3f4f6)',
            }}>
              <span style={{ width: 130, flexShrink: 0, fontWeight: 600,
                             fontSize: 13, color: 'var(--text-secondary)' }}>
                {label}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-primary)',
                             wordBreak: 'break-word' }}>
                {value}
              </span>
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

// ══════════════════════════════════════════════════════════════════════════
// SubjectsPage
// ══════════════════════════════════════════════════════════════════════════
export default function SubjectsPage() {

  const [subjects,  setSubjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);  // subjectId being deleted

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selSub,    setSelSub]    = useState(null);
  const [viewOpen,  setViewOpen]  = useState(false);
  const [viewSub,   setViewSub]   = useState(null);

  // Feedback
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Load ──────────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await springGet('/subjects');
      setSubjects(Array.isArray(res) ? res : (res.data ?? res ?? []));
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load subjects.');
      else setError('Failed to refresh subjects.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Open modal helpers ────────────────────────────────────────────────
  const openAdd  = ()  => { setSelSub(null); setModalMode('add');  setModalOpen(true); };
  const openEdit = (s) => { setSelSub(s);    setModalMode('edit'); setModalOpen(true); };
  const openView = (s) => { setViewSub(s);   setViewOpen(true); };

  // ── Save (add or edit) ────────────────────────────────────────────────
  const handleSave = async (form) => {
    setSaving(true);

    // Client-side duplicate name check (case-insensitive)
    const isDuplicate = subjects.some((s) => {
      const sameName = s.subjectName.trim().toLowerCase() ===
                       form.subjectName.trim().toLowerCase();
      // For edit mode, exclude the current subject itself
      const isSelf = modalMode === 'edit' && selSub &&
                     s.subjectId === selSub.subjectId;
      return sameName && !isSelf;
    });

    if (isDuplicate) {
      setError(`Subject "${form.subjectName.trim()}" already exists.`);
      setSaving(false);
      return;
    }

    // Slow-server hint for Render free tier
    const slowTimer = setTimeout(() =>
      setError('Server is waking up (free tier). Please wait...'), 4000);
    try {
      if (modalMode === 'add') {
        await springApi.post('/subjects', form);
        clearTimeout(slowTimer); setError('');
        setSuccess('Subject added successfully.');
      } else {
        await springApi.put(`/subjects/${selSub.subjectId}`, form);
        clearTimeout(slowTimer); setError('');
        setSuccess('Subject updated successfully.');
      }
      setModalOpen(false);
      load(true);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.message || 'Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async (sub) => {
    if (!window.confirm(`Delete subject "${sub.subjectName}"?`)) return;
    setDeleting(sub.subjectId);
    try {
      await springApi.delete(`/subjects/${sub.subjectId}`);
      setSuccess(`"${sub.subjectName}" deleted.`);
      load(true);
    } catch (err) {
      setError(err.message || 'Failed to delete subject.');
    } finally {
      setDeleting(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="books-page-sub">Manage university subjects</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={openAdd}>
          + Add Subject
        </button>
      </div>

      {/* ── Alerts ── */}
      {success && (
        <div className="books-alert books-alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>x</button>
        </div>
      )}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>x</button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        /* Skeleton loader — no blank screen while loading */
        <div className="card">
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th>#</th><th>Subject ID</th><th>Subject Name</th>
                  <th>Description</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[10, 20, 30, 30, 10].map((w, j) => (
                      <td key={j}>
                        <div style={{
                          height: 13, width: `${w + Math.random() * 20}%`,
                          borderRadius: 4,
                          background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'books-shimmer 1.4s infinite',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : pageError ? (
        <PageError message={pageError} onRetry={load} />
      ) : (
        <div className="card">
          {subjects.length === 0 ? (
            /* Empty state */
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
              <p style={{ fontSize: 15, marginBottom: 16 }}>
                No subjects added yet.
              </p>
              <button className="books-btn books-btn-primary" onClick={openAdd}>
                + Add First Subject
              </button>
            </div>
          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="book-desk-table">
                <div className="books-table-wrap">
                  <table className="books-table">
                    <thead>
                      <tr>
                        <th style={{ width: 45 }}>#</th>
                        <th style={{ width: 110 }}>Subject ID</th>
                        <th>Subject Name</th>
                        <th>Description</th>
                        <th style={{ width: 160 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub, i) => (
                        <tr
                          key={sub.subjectId}
                          style={{ cursor: 'pointer' }}
                          onClick={() => openView(sub)}
                        >
                          <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            {i + 1}
                          </td>
                          <td>
                            <span style={{
                              fontFamily: 'monospace', fontSize: '0.78rem',
                              background: 'var(--bg-secondary,#f9fafb)',
                              padding: '2px 8px', borderRadius: 6,
                              color: 'var(--text-secondary)',
                            }}>
                              {sub.subjectId}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{sub.subjectName}</td>
                          <td style={{
                            fontSize: 13, color: 'var(--text-secondary)',
                            maxWidth: 300, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {sub.description || '—'}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="books-actions">
                              <button
                                className="books-btn books-btn-sm books-btn-ghost"
                                onClick={() => openView(sub)}
                              >
                                View
                              </button>
                              <button
                                className="books-btn books-btn-sm books-btn-warning"
                                onClick={() => openEdit(sub)}
                              >
                                Edit
                              </button>
                              <button
                                className="books-btn books-btn-sm books-btn-danger"
                                onClick={() => handleDelete(sub)}
                                disabled={deleting === sub.subjectId}
                              >
                                {deleting === sub.subjectId ? '...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Mobile cards ── */}
              <div className="book-mob-list">
                {subjects.map((sub, i) => (
                  <div key={sub.subjectId} className="book-mob-card">
                    <button
                      type="button"
                      className="book-mob-header"
                      onClick={() => openView(sub)}
                    >
                      <div className="book-mob-summary">
                        <span className="book-mob-num">{i + 1}</span>
                        <div className="book-mob-title-wrap">
                          <span className="book-mob-title">{sub.subjectName}</span>
                          <span className="book-mob-author"
                                style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {sub.subjectId}
                          </span>
                        </div>
                      </div>
                      <span className="book-mob-chevron">▼</span>
                    </button>
                    <div className="book-mob-details">
                      <div className="book-mob-row">
                        <span className="book-mob-label">Description</span>
                        <span className="book-mob-value">{sub.description || '—'}</span>
                      </div>
                      <div className="book-mob-actions">
                        <button
                          className="books-btn books-btn-sm books-btn-ghost"
                          onClick={() => openView(sub)}
                        >
                          View
                        </button>
                        <button
                          className="books-btn books-btn-sm books-btn-warning"
                          onClick={() => openEdit(sub)}
                        >
                          Edit
                        </button>
                        <button
                          className="books-btn books-btn-sm books-btn-danger"
                          onClick={() => handleDelete(sub)}
                          disabled={deleting === sub.subjectId}
                        >
                          {deleting === sub.subjectId ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total count */}
              <p style={{
                fontSize: 13, color: 'var(--text-secondary)',
                padding: '10px 16px', borderTop: '1px solid var(--border-primary,#e5e7eb)',
                margin: 0,
              }}>
                Total: {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <SubjectModal
        isOpen={modalOpen}
        mode={modalMode}
        subject={selSub}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        saving={saving}
      />
      <ViewSubjectModal
        isOpen={viewOpen}
        subject={viewSub}
        onClose={() => setViewOpen(false)}
      />

    </div>
  );
}
