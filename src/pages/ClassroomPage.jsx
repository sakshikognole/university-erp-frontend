import { useState, useEffect, useCallback } from 'react';
import { springApi, springGet } from '../services/api';
import Pagination from '../components/Pagination';
import PageError from '../components/PageError';

// URL helpers for Node backend (Faculty data)
const onLocalhost = window.location.hostname === 'localhost';
const NODE_URL = onLocalhost ? 'http://localhost:5000/api' : 'https://university-erp-node.onrender.com/api';
const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
});

const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 10, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

const EMPTY_FORM = {
  classroomName: '', rows: '', columns: '', extra: '', examinerId: '', examinerName: '',
};

// Add/Edit Modal
function ClassroomModal({ isOpen, mode, classroom, onSave, onClose, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load faculty for examiner dropdown
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`${NODE_URL}/super-admin/staff`, { headers: authHeader() })
      .then(r => r.json())
      .then(res => setFaculty(Array.isArray(res) ? res : []))
      .catch(() => setFaculty([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Populate form on edit
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && classroom) {
      setForm({
        classroomName: classroom.classroomName ?? '',
        rows: classroom.rows ?? '',
        columns: classroom.columns ?? '',
        extra: classroom.extra ?? '',
        examinerId: classroom.examinerId ?? '',
        examinerName: classroom.examinerName ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, mode, classroom]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.classroomName.trim()) e.classroomName = 'Classroom name is required.';
    else if (!/^[a-zA-Z0-9 ]+$/.test(form.classroomName)) {
      e.classroomName = 'Only letters, numbers and spaces allowed.';
    }
    if (!form.rows || form.rows < 1) e.rows = 'Rows must be at least 1.';
    if (!form.columns || form.columns < 1) e.columns = 'Columns must be at least 1.';
    if (form.extra === '' || form.extra < 0) e.extra = 'Extra cannot be negative.';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const capacity = (parseInt(form.rows) || 0) * (parseInt(form.columns) || 0) + (parseInt(form.extra) || 0);

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 520 }}>
        <div className="books-modal-head">
          <h3>{mode === 'edit' ? 'Edit Classroom' : 'Add Classroom'}</h3>
          <button className="books-modal-close" onClick={onClose} disabled={saving}>×</button>
        </div>
        {loading ? (
          <div className="books-modal-body" style={{ textAlign: 'center', padding: 32 }}>
            <p>Loading...</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="books-modal-body">
              {/* Classroom Name */}
              <div className="books-form-group">
                <label className="books-form-label">
                  Classroom Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  className={`books-form-control ${errors.classroomName ? 'err' : ''}`}
                  value={form.classroomName}
                  onChange={e => {
                    setForm(f => ({ ...f, classroomName: e.target.value }));
                    setErrors(er => ({ ...er, classroomName: '' }));
                  }}
                  placeholder="e.g. Room 101, Hall A, Lab 3"
                />
                {errors.classroomName && <p className="books-form-err">{errors.classroomName}</p>}
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Only letters, numbers and spaces allowed
                </p>
              </div>

              {/* Rows, Columns, Extra */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="books-form-group">
                  <label className="books-form-label">Rows *</label>
                  <input
                    type="number"
                    min="1"
                    className={`books-form-control ${errors.rows ? 'err' : ''}`}
                    value={form.rows}
                    onChange={e => {
                      setForm(f => ({ ...f, rows: e.target.value }));
                      setErrors(er => ({ ...er, rows: '' }));
                    }}
                  />
                  {errors.rows && <p className="books-form-err">{errors.rows}</p>}
                </div>
                <div className="books-form-group">
                  <label className="books-form-label">Columns *</label>
                  <input
                    type="number"
                    min="1"
                    className={`books-form-control ${errors.columns ? 'err' : ''}`}
                    value={form.columns}
                    onChange={e => {
                      setForm(f => ({ ...f, columns: e.target.value }));
                      setErrors(er => ({ ...er, columns: '' }));
                    }}
                  />
                  {errors.columns && <p className="books-form-err">{errors.columns}</p>}
                </div>
                <div className="books-form-group">
                  <label className="books-form-label">Extra *</label>
                  <input
                    type="number"
                    min="0"
                    className={`books-form-control ${errors.extra ? 'err' : ''}`}
                    value={form.extra}
                    onChange={e => {
                      setForm(f => ({ ...f, extra: e.target.value }));
                      setErrors(er => ({ ...er, extra: '' }));
                    }}
                  />
                  {errors.extra && <p className="books-form-err">{errors.extra}</p>}
                </div>
              </div>

              {/* Capacity (auto-calculated, read-only) */}
              <div className="books-form-group">
                <label className="books-form-label">Capacity (Auto-calculated)</label>
                <input
                  className="books-form-control"
                  value={capacity}
                  readOnly
                  style={{ background: '#f9fafb', fontWeight: 700, color: '#059669' }}
                />
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Formula: Rows × Columns + Extra = {form.rows || 0} × {form.columns || 0} + {form.extra || 0} = {capacity}
                </p>
              </div>

              {/* Examiner */}
              <div className="books-form-group">
                <label className="books-form-label">Examiner (Optional)</label>
                <select
                  className="books-form-control"
                  value={form.examinerId}
                  onChange={e => {
                    const fid = e.target.value;
                    const fac = faculty.find(f => (f._id || f.staffId) === fid);
                    setForm(f => ({ ...f, examinerId: fid, examinerName: fac?.name ?? '' }));
                  }}
                >
                  <option value="">— No Examiner —</option>
                  {faculty.map(f => (
                    <option key={f._id || f.staffId} value={f._id || f.staffId}>
                      {f.name} {f.department ? `(${f.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="books-modal-foot">
              <button type="button" className="books-btn books-btn-ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="books-btn books-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : mode === 'edit' ? 'Update Classroom' : 'Add Classroom'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Main Page
export default function ClassroomPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [pageInfo, setPageInfo] = useState(DEFAULT_PAGE);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selClassroom, setSelClassroom] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Bunch functionality
  const [selectedClassrooms, setSelectedClassrooms] = useState([]);
  const [bunchModalOpen, setBunchModalOpen] = useState(false);
  const [bunchName, setBunchName] = useState('');
  const [bunches, setBunches] = useState([]);
  const [loadingBunches, setLoadingBunches] = useState(false);
  const [savingBunch, setSavingBunch] = useState(false);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await springGet(`/classrooms?page=${page}&size=${size}`);
      
      // Handle response - res is already unwrapped by springGet interceptor
      const content = res?.content ?? [];
      const pageData = {
        pageNumber: res?.number ?? 0,
        pageSize: res?.size ?? size,
        totalElements: res?.totalElements ?? 0,
        totalPages: res?.totalPages ?? 0,
        first: res?.first ?? true,
        last: res?.last ?? true,
      };
      
      setClassrooms(content);
      setPageInfo(pageData);
    } catch (err) {
      console.error('Load classrooms error:', err);
      if (!silent) setPageError(err.message || 'Failed to load classrooms.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, size]);

  useEffect(() => { load(); }, [load]);

  // Load bunches
  const loadBunches = useCallback(async () => {
    setLoadingBunches(true);
    try {
      const res = await springGet('/classroom-bunches');
      setBunches(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Load bunches error:', err);
    } finally {
      setLoadingBunches(false);
    }
  }, []);

  useEffect(() => { loadBunches(); }, [loadBunches]);

  const openAdd = () => { setSelClassroom(null); setModalMode('add'); setModalOpen(true); };
  const openEdit = (c) => { setSelClassroom(c); setModalMode('edit'); setModalOpen(true); };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await springApi.post('/classrooms', form);
        setSuccess('Classroom added successfully.');
      } else {
        await springApi.put(`/classrooms/${selClassroom.classroomId}`, form);
        setSuccess('Classroom updated successfully.');
      }
      setModalOpen(false);
      load(true);
    } catch (err) {
      setError(err.message || 'Failed to save classroom.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete classroom "${c.classroomName}"?`)) return;
    setDeleting(c.classroomId);
    try {
      await springApi.delete(`/classrooms/${c.classroomId}`);
      setSuccess('Classroom deleted.');
      if (classrooms.length === 1 && page > 0) setPage(page - 1);
      else load(true);
    } catch {
      setError('Failed to delete classroom.');
    } finally {
      setDeleting(null);
    }
  };

  // Handle checkbox selection
  const handleCheckbox = (classroomId) => {
    setSelectedClassrooms(prev => 
      prev.includes(classroomId) 
        ? prev.filter(id => id !== classroomId)
        : [...prev, classroomId]
    );
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedClassrooms(classrooms.map(c => c.classroomId));
    } else {
      setSelectedClassrooms([]);
    }
  };

  // Open bunch modal
  const openBunchModal = () => {
    if (selectedClassrooms.length === 0) {
      setError('Please select at least one classroom.');
      return;
    }
    setBunchName('');
    setBunchModalOpen(true);
  };

  // Create bunch
  const handleCreateBunch = async () => {
    if (!bunchName.trim()) {
      setError('Bunch name is required.');
      return;
    }
    setSavingBunch(true);
    try {
      await springApi.post('/classroom-bunches', {
        bunchName: bunchName.trim(),
        classroomIds: selectedClassrooms,
      });
      setSuccess('Bunch created successfully.');
      setBunchModalOpen(false);
      setBunchName('');
      setSelectedClassrooms([]);
      loadBunches();
    } catch (err) {
      setError(err.message || 'Failed to create bunch.');
    } finally {
      setSavingBunch(false);
    }
  };

  // Delete bunch
  const handleDeleteBunch = async (bunchId) => {
    if (!window.confirm('Delete this bunch?')) return;
    try {
      await springApi.delete(`/classroom-bunches/${bunchId}`);
      setSuccess('Bunch deleted.');
      loadBunches();
    } catch {
      setError('Failed to delete bunch.');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="books-page-header" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title">Classrooms</h1>
          <p className="page-subtitle">Manage classrooms with capacity and examiners</p>
        </div>
        <button
          className="books-btn books-btn-primary"
          style={{ flexShrink: 0 }}
          onClick={openAdd}
        >
          + Add Classroom
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="books-alert books-alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card">
          <p style={{ padding: 32, textAlign: 'center' }}>Loading classrooms...</p>
        </div>
      ) : pageError ? (
        <PageError message={pageError} onRetry={load} />
      ) : classrooms.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
          <p style={{ fontSize: 15, marginBottom: 16 }}>No classrooms added yet.</p>
          <button className="books-btn books-btn-primary" onClick={openAdd}>
            + Add First Classroom
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: '1rem' }}>
            <div className="books-table-wrap">
              <table className="books-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={selectedClassrooms.length === classrooms.length && classrooms.length > 0}
                      />
                    </th>
                    <th style={{ width: 42 }}>#</th>
                    <th>Classroom ID</th>
                    <th>Name</th>
                    <th style={{ width: 80 }}>Rows</th>
                    <th style={{ width: 100 }}>Columns</th>
                    <th style={{ width: 80 }}>Extra</th>
                    <th style={{ width: 100 }}>Capacity</th>
                    <th>Examiner</th>
                    <th style={{ width: 155 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classrooms.map((c, i) => (
                    <tr key={c.classroomId}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedClassrooms.includes(c.classroomId)}
                          onChange={() => handleCheckbox(c.classroomId)}
                        />
                      </td>
                      <td style={{ color: '#9ca3af', fontSize: 13 }}>{page * size + i + 1}</td>
                      <td>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '0.78rem',
                          background: '#f9fafb', padding: '2px 8px',
                          borderRadius: 6, color: '#6b7280',
                        }}>
                          {c.classroomId}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{c.classroomName}</td>
                      <td style={{ textAlign: 'center', fontSize: 13 }}>{c.rows}</td>
                      <td style={{ textAlign: 'center', fontSize: 13 }}>{c.columns}</td>
                      <td style={{ textAlign: 'center', fontSize: 13 }}>{c.extra}</td>
                      <td>
                        <span style={{
                          background: '#d1fae5', color: '#065f46',
                          padding: '3px 10px', borderRadius: 6,
                          fontSize: '0.85rem', fontWeight: 700,
                          display: 'inline-block',
                        }}>
                          {c.capacity}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{c.examinerName || '—'}</td>
                      <td>
                        <div className="books-actions">
                          <button
                            className="books-btn books-btn-sm books-btn-warning"
                            onClick={() => openEdit(c)}
                          >
                            Edit
                          </button>
                          <button
                            className="books-btn books-btn-sm books-btn-danger"
                            onClick={() => handleDelete(c)}
                            disabled={deleting === c.classroomId}
                          >
                            {deleting === c.classroomId ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <Pagination
            pageData={pageInfo}
            onPageChange={setPage}
            onSizeChange={(newSize) => {
              setSize(newSize);
              setPage(0);
            }}
          />

          {/* Create Bunch Button */}
          {selectedClassrooms.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button 
                className="books-btn books-btn-primary"
                onClick={openBunchModal}
                style={{ minWidth: 180 }}
              >
                Create Bunch ({selectedClassrooms.length} selected)
              </button>
            </div>
          )}
        </>
      )}

      {/* Bunches Section */}
      {bunches.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Classroom Bunches</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {bunches.map(bunch => {
              const bunchClassrooms = classrooms.filter(c => bunch.classroomIds.includes(c.classroomId));
              return (
                <div key={bunch.bunchId} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{bunch.bunchName}</h3>
                      <span style={{
                        fontFamily: 'monospace', fontSize: '0.75rem',
                        background: '#f9fafb', padding: '2px 6px',
                        borderRadius: 4, color: '#6b7280',
                      }}>
                        {bunch.bunchId}
                      </span>
                    </div>
                    <button
                      className="books-btn books-btn-sm books-btn-danger"
                      onClick={() => handleDeleteBunch(bunch.bunchId)}
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                      <strong>Total Classrooms:</strong> {bunch.totalClassrooms}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                      <strong>Total Capacity:</strong> {bunch.totalCapacity}
                    </div>
                  </div>

                  <div style={{ fontSize: 13 }}>
                    <strong style={{ display: 'block', marginBottom: 6 }}>Classrooms:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {bunchClassrooms.map(c => (
                        <span key={c.classroomId} style={{
                          background: '#dbeafe', color: '#1e40af',
                          padding: '4px 8px', borderRadius: 4,
                          fontSize: '0.75rem', fontWeight: 500,
                        }}>
                          {c.classroomName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bunch Modal */}
      {bunchModalOpen && (
        <div className="books-overlay">
          <div className="books-modal" style={{ maxWidth: 520 }}>
            <div className="books-modal-head">
              <h3>Create Classroom Bunch</h3>
              <button className="books-modal-close" onClick={() => setBunchModalOpen(false)} disabled={savingBunch}>×</button>
            </div>
            <div className="books-modal-body">
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                  Selected Classrooms ({selectedClassrooms.length}):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {classrooms
                    .filter(c => selectedClassrooms.includes(c.classroomId))
                    .map(c => (
                      <span key={c.classroomId} style={{
                        background: '#dbeafe', color: '#1e40af',
                        padding: '4px 10px', borderRadius: 6,
                        fontSize: '0.85rem', fontWeight: 500,
                      }}>
                        {c.classroomName}
                      </span>
                    ))
                  }
                </div>
              </div>

              <div className="books-form-group">
                <label className="books-form-label">
                  Bunch Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  className="books-form-control"
                  value={bunchName}
                  onChange={e => setBunchName(e.target.value)}
                  placeholder="e.g. Engineering Block A, Science Wing"
                  autoFocus
                />
              </div>
            </div>
            <div className="books-modal-foot">
              <button 
                type="button" 
                className="books-btn books-btn-ghost" 
                onClick={() => setBunchModalOpen(false)} 
                disabled={savingBunch}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="books-btn books-btn-primary" 
                onClick={handleCreateBunch}
                disabled={savingBunch}
              >
                {savingBunch ? 'Creating...' : 'Create Bunch'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ClassroomModal
        isOpen={modalOpen}
        mode={modalMode}
        classroom={selClassroom}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        saving={saving}
      />
    </div>
  );
}
