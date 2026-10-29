import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { springApi, springGet } from '../services/api';
import PageError from '../components/PageError';

// ── Empty form ─────────────────────────────────────────────────────────────
const EMPTY = { subjectName: '', description: '' };
const MAX_NAME_LENGTH = 50;

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
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'subjectName') {
      if (value.trim().length > MAX_NAME_LENGTH) {
        setErrors((er) => ({
          ...er,
          subjectName: `Subject name must not exceed ${MAX_NAME_LENGTH} characters.`,
        }));
      } else {
        setErrors((er) => ({ ...er, subjectName: '' }));
      }
    } else {
      setErrors((er) => ({ ...er, [name]: '' }));
    }
  };

  const validate = () => {
    const e = {};
    const trimmed = form.subjectName.trim();
    if (!trimmed) {
      e.subjectName = 'Subject name is required.';
    } else if (!/^[A-Za-z\s]+$/.test(trimmed)) {
      e.subjectName = 'Subject name must contain only letters and spaces.';
    } else if (trimmed.length > MAX_NAME_LENGTH) {
      e.subjectName = `Subject name must not exceed ${MAX_NAME_LENGTH} characters.`;
    }
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="books-form-label">Subject Name *</label>
                <span style={{
                  fontSize: '0.75rem',
                  color: form.subjectName.trim().length > MAX_NAME_LENGTH ? 'var(--color-danger, #ef4444)' : 'var(--text-secondary, #6b7280)',
                }}>
                  {form.subjectName.length}/{MAX_NAME_LENGTH}
                </span>
              </div>
              <input
                className={`books-form-control ${errors.subjectName ? 'err' : ''}`}
                name="subjectName"
                value={form.subjectName}
                onChange={change}
                placeholder="e.g. Data Structures"
                maxLength={MAX_NAME_LENGTH + 50}
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

  // Mobile accordion state
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

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
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Subjects</h1>
          <p className="page-subtitle">Manage university subjects</p>
        </div>
        <div className="feature-page-header-actions">
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={openAdd}
          >
            <Plus size={16} />
            <span>Add Subject</span>
          </button>
        </div>
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
        <div className="card table-card" style={{ marginTop: '1.25rem' }}>
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'left' }}>#</th>
                  <th style={{ width: '140px', textAlign: 'left' }}>Subject ID</th>
                  <th style={{ minWidth: '180px', width: '220px', textAlign: 'left' }}>Subject Name</th>
                  <th style={{ textAlign: 'left' }}>Description</th>
                  <th style={{ width: '230px', textAlign: 'right' }}>Actions</th>
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
        <div className="card table-card" style={{ marginTop: '1.25rem' }}>
          {/* Total Subjects Count Badge — top-right corner */}
          <div className="table-controls-bar" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div className="table-stats-badge" style={{ marginLeft: 'auto', alignSelf: 'flex-end', width: 'fit-content' }}>
              Total: <strong>{subjects.length}</strong> {subjects.length === 1 ? 'Subject' : 'Subjects'}
            </div>
          </div>

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
                <Plus size={16} />
                <span>Add First Subject</span>
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
                        <th style={{ width: '50px', textAlign: 'left' }}>#</th>
                        <th style={{ width: '140px', textAlign: 'left' }}>Subject ID</th>
                        <th style={{ minWidth: '180px', width: '220px', textAlign: 'left' }}>Subject Name</th>
                        <th style={{ textAlign: 'left' }}>Description</th>
                        <th style={{ width: '230px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub, i) => (
                        <tr
                          key={sub.subjectId}
                          style={{ cursor: 'pointer' }}
                          onClick={() => openView(sub)}
                        >
                          <td style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'left', verticalAlign: 'middle', width: '50px' }}>
                            {i + 1}
                          </td>
                          <td style={{ textAlign: 'left', verticalAlign: 'middle', width: '140px' }}>
                            <span className="code-badge">
                              {sub.subjectId}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, textAlign: 'left', verticalAlign: 'middle', width: '220px' }}>
                            <span className="dept-name-cell">{sub.subjectName}</span>
                          </td>
                          <td style={{
                            fontSize: 13, color: 'var(--text-secondary)',
                            textAlign: 'left', verticalAlign: 'middle',
                            maxWidth: 350, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {sub.description || '—'}
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'middle', width: '230px' }} onClick={(e) => e.stopPropagation()}>
                            <div className="action-buttons-cell" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                className="action-btn view-btn"
                                title="View Details"
                                onClick={() => openView(sub)}
                              >
                                <Eye size={14} /><span className="action-label">View</span>
                              </button>
                              <button
                                type="button"
                                className="action-btn edit-btn"
                                title="Edit Subject"
                                onClick={() => openEdit(sub)}
                              >
                                <Edit size={14} /><span className="action-label">Edit</span>
                              </button>
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                title="Delete Subject"
                                onClick={() => handleDelete(sub)}
                                disabled={deleting === sub.subjectId}
                              >
                                <Trash2 size={14} /><span className="action-label">{deleting === sub.subjectId ? 'Deleting...' : 'Delete'}</span>
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
                {subjects.map((sub, i) => {
                  const isExpanded = expandedId === sub.subjectId;
                  return (
                    <div key={sub.subjectId} className="book-mob-card">
                      <button
                        type="button"
                        className="book-mob-header"
                        onClick={() => toggleExpand(sub.subjectId)}
                        aria-expanded={isExpanded}
                      >
                        <div className="book-mob-summary">
                          <span className="book-mob-num">{i + 1}</span>
                          <div className="book-mob-title-wrap">
                            <span className="book-mob-title">{sub.subjectName}</span>
                            <span className="book-mob-author">{sub.subjectId}</span>
                          </div>
                        </div>
                        <span className="book-mob-chevron">{isExpanded ? '▲' : '▼'}</span>
                      </button>
                      {isExpanded && (
                        <div className="book-mob-details">
                          <div className="book-mob-row">
                            <span className="book-mob-label">Subject ID</span>
                            <span className="book-mob-value mono">{sub.subjectId}</span>
                          </div>
                          <div className="book-mob-row">
                            <span className="book-mob-label">Subject Name</span>
                            <span className="book-mob-value">{sub.subjectName}</span>
                          </div>
                          <div className="book-mob-row">
                            <span className="book-mob-label">Description</span>
                            <span className="book-mob-value">{sub.description || '—'}</span>
                          </div>
                          <div className="book-mob-actions" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button
                              type="button"
                              className="action-btn view-btn"
                              style={{ flex: 1, justifyContent: 'center' }}
                              onClick={() => openView(sub)}
                            >
                              <Eye size={14} /><span className="action-label">View</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              style={{ flex: 1, justifyContent: 'center' }}
                              onClick={() => openEdit(sub)}
                            >
                              <Edit size={14} /><span className="action-label">Edit</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              style={{ flex: 1, justifyContent: 'center' }}
                              onClick={() => handleDelete(sub)}
                              disabled={deleting === sub.subjectId}
                            >
                              <Trash2 size={14} /><span className="action-label">{deleting === sub.subjectId ? 'Deleting...' : 'Delete'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
