import { useState, useEffect, useCallback } from 'react';
import { springApi, springGet } from '../services/api';
import Pagination from '../components/Pagination';
import PageError  from '../components/PageError';

// ── URL helpers ────────────────────────────────────────────────────────────
const onLocalhost = window.location.hostname === 'localhost';
const NODE_URL    = onLocalhost
  ? 'http://localhost:5000/api'
  : 'https://university-erp-node.onrender.com/api';

const authHeader = () => {
  const token = localStorage.getItem('erp_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// ── Days config: letter, label, order ────────────────────────────────────
const DAYS = [
  { key: 'M',  label: 'Monday'    },
  { key: 'T',  label: 'Tuesday'   },
  { key: 'W',  label: 'Wednesday' },
  { key: 'Th', label: 'Thursday'  },
  { key: 'F',  label: 'Friday'    },
  { key: 'S',  label: 'Saturday'  },
  { key: 'Su', label: 'Sunday'    },
];

const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 10, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

const EMPTY_FORM = {
  department: '', semester:    '',
  subjectId:  '', subjectName: '',
  facultyId:  '', facultyName: '',
  venueId:    '', venueName:   '',
  daySlots:   [],   // [{ day, startTime, endTime }]
};

// ── Schedule Add/Edit Modal ────────────────────────────────────────────────
function ScheduleModal({ isOpen, mode, schedule, onSave, onClose, saving }) {
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [errors,      setErrors]      = useState({});
  const [subjects,    setSubjects]    = useState([]);
  const [faculty,     setFaculty]     = useState([]);
  const [venues,      setVenues]      = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(false);

  // Load dropdowns when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadingDeps(true);

    Promise.all([
      springGet('/subjects'),
      fetch(`${NODE_URL}/super-admin/staff`,       { headers: authHeader() }).then(r => r.json()),
      fetch(`${NODE_URL}/super-admin/venues`,      { headers: authHeader() }).then(r => r.json()),
      fetch(`${NODE_URL}/super-admin/departments`, { headers: authHeader() }).then(r => r.json()),
    ])
      .then(([subRes, staffRes, venueRes, deptRes]) => {
        setSubjects(Array.isArray(subRes)   ? subRes   : []);
        setFaculty( Array.isArray(staffRes) ? staffRes : []);
        setVenues(  Array.isArray(venueRes) ? venueRes : []);
        setDepartments(Array.isArray(deptRes) ? deptRes : []);
      })
      .catch(() => {})
      .finally(() => setLoadingDeps(false));
  }, [isOpen]);

  // Populate form on edit
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && schedule) {
      setForm({
        department: schedule.department  ?? '',
        semester:   schedule.semester    ?? '',
        subjectId:  schedule.subjectId   ?? '',
        subjectName:schedule.subjectName ?? '',
        facultyId:  schedule.facultyId   ?? '',
        facultyName:schedule.facultyName ?? '',
        venueId:    schedule.venueId     ?? '',
        venueName:  schedule.venueName   ?? '',
        daySlots:   schedule.daySlots    ?? [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, mode, schedule]);

  if (!isOpen) return null;

  // ── Field helpers ────────────────────────────────────────────────────
  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const handleSubjectChange = (e) => {
    const sid = e.target.value;
    const sub = subjects.find(s => s.subjectId === sid);
    setForm(f => ({ ...f, subjectId: sid, subjectName: sub?.subjectName ?? '' }));
    setErrors(e => ({ ...e, subjectId: '' }));
  };

  const handleFacultyChange = (e) => {
    const fid = e.target.value;
    const fac = faculty.find(f => f._id === fid || f.staffId === fid);
    setForm(f => ({ ...f, facultyId: fid, facultyName: fac?.name ?? '' }));
    setErrors(e => ({ ...e, facultyId: '' }));
  };

  const handleVenueChange = (e) => {
    const vid = e.target.value;
    const ven = venues.find(v => v.venueId === vid);
    setForm(f => ({ ...f, venueId: vid, venueName: ven?.name ?? '' }));
    setErrors(e => ({ ...e, venueId: '' }));
  };

  // ── Day toggle ───────────────────────────────────────────────────────
  const toggleDay = (dayKey) => {
    const exists = form.daySlots.find(s => s.day === dayKey);
    if (exists) {
      // Deselect
      setForm(f => ({ ...f, daySlots: f.daySlots.filter(s => s.day !== dayKey) }));
    } else {
      // Select — add with empty times
      setForm(f => ({
        ...f,
        daySlots: [...f.daySlots, { day: dayKey, startTime: '', endTime: '' }],
      }));
    }
    setErrors(e => ({ ...e, daySlots: '' }));
  };

  const updateSlotTime = (dayKey, field, value) => {
    setForm(f => ({
      ...f,
      daySlots: f.daySlots.map(s =>
        s.day === dayKey ? { ...s, [field]: value } : s
      ),
    }));
  };

  // ── Validate ─────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.department.trim())  e.department = 'Department is required.';
    if (!form.semester.trim())    e.semester   = 'Semester is required.';
    if (!form.subjectId)          e.subjectId  = 'Subject is required.';
    if (!form.facultyId)          e.facultyId  = 'Faculty is required.';
    if (!form.venueId)            e.venueId    = 'Venue is required.';
    if (!form.daySlots.length)    e.daySlots   = 'Select at least one day.';
    else {
      for (const slot of form.daySlots) {
        if (!slot.startTime || !slot.endTime) {
          e.daySlots = 'Enter start and end time for all selected days.';
          break;
        }
        if (slot.startTime >= slot.endTime) {
          e.daySlots = 'End time must be after start time for all selected days.';
          break;
        }
      }
    }
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const selectedDayKeys = new Set(form.daySlots.map(s => s.day));

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 560, width: '100%' }}>
        <div className="books-modal-head">
          <h3>{mode === 'add' ? 'Add Schedule' : 'Edit Schedule'}</h3>
          <button className="books-modal-close" onClick={onClose} disabled={saving}>x</button>
        </div>

        {loadingDeps ? (
          <div className="books-modal-body" style={{ textAlign: 'center', padding: 32 }}>
            <p className="books-loading">Loading data...</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

              {/* Row 1: Department + Semester */}
              <div className="club-form-row">
                <div className="books-form-group">
                  <label className="books-form-label">Department *</label>
                  <select
                    className={`books-form-control ${errors.department ? 'err' : ''}`}
                    value={form.department}
                    onChange={e => set('department', e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {departments.map(d => (
                      <option key={d._id || d.departmentId} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {errors.department && <p className="books-form-err">{errors.department}</p>}
                </div>
                <div className="books-form-group">
                  <label className="books-form-label">Semester *</label>
                  <input
                    className={`books-form-control ${errors.semester ? 'err' : ''}`}
                    value={form.semester}
                    onChange={e => set('semester', e.target.value)}
                    placeholder="e.g. Semester 3"
                  />
                  {errors.semester && <p className="books-form-err">{errors.semester}</p>}
                </div>
              </div>

              {/* Row 2: Subject + Faculty */}
              <div className="club-form-row">
                <div className="books-form-group">
                  <label className="books-form-label">Subject *</label>
                  <select
                    className={`books-form-control ${errors.subjectId ? 'err' : ''}`}
                    value={form.subjectId}
                    onChange={handleSubjectChange}
                  >
                    <option value="">— Select Subject —</option>
                    {subjects.map(s => (
                      <option key={s.subjectId} value={s.subjectId}>
                        {s.subjectName}
                      </option>
                    ))}
                  </select>
                  {errors.subjectId && <p className="books-form-err">{errors.subjectId}</p>}
                </div>
                <div className="books-form-group">
                  <label className="books-form-label">Faculty *</label>
                  <select
                    className={`books-form-control ${errors.facultyId ? 'err' : ''}`}
                    value={form.facultyId}
                    onChange={handleFacultyChange}
                  >
                    <option value="">— Select Faculty —</option>
                    {faculty.map(f => (
                      <option key={f._id || f.staffId} value={f._id || f.staffId}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  {errors.facultyId && <p className="books-form-err">{errors.facultyId}</p>}
                </div>
              </div>

              {/* Venue */}
              <div className="books-form-group">
                <label className="books-form-label">Venue *</label>
                <select
                  className={`books-form-control ${errors.venueId ? 'err' : ''}`}
                  value={form.venueId}
                  onChange={handleVenueChange}
                  style={{ maxWidth: 340 }}
                >
                  <option value="">— Select Venue —</option>
                  {venues.map(v => (
                    <option key={v.venueId} value={v.venueId}>
                      {v.name} ({v.venueId})
                    </option>
                  ))}
                </select>
                {errors.venueId && <p className="books-form-err">{errors.venueId}</p>}
              </div>

              {/* Days + Time picker */}
              <div className="books-form-group">
                <label className="books-form-label">Days &amp; Times *</label>
                {errors.daySlots && <p className="books-form-err">{errors.daySlots}</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                  {DAYS.map(({ key, label }) => {
                    const isSelected = selectedDayKeys.has(key);
                    const slot = form.daySlots.find(s => s.day === key);
                    return (
                      <div key={key} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        flexWrap: 'wrap',
                      }}>
                        {/* Day circle */}
                        <button
                          type="button"
                          title={label}
                          onClick={() => toggleDay(key)}
                          style={{
                            width: 38, height: 38, borderRadius: '50%',
                            border: isSelected ? '2px solid #2563eb' : '2px solid #d1d5db',
                            background: isSelected ? '#2563eb' : '#f9fafb',
                            color:      isSelected ? '#fff'    : '#374151',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            flexShrink: 0, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {key}
                        </button>

                        {/* Time inputs — only shown when day is selected */}
                        {isSelected && slot && (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <label style={{ fontSize: 12, color: 'var(--text-secondary)',
                                             whiteSpace: 'nowrap' }}>
                                Start
                              </label>
                              <input
                                type="time"
                                className="books-form-control"
                                style={{ width: 120, padding: '4px 8px' }}
                                value={slot.startTime}
                                onChange={e => updateSlotTime(key, 'startTime', e.target.value)}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <label style={{ fontSize: 12, color: 'var(--text-secondary)',
                                             whiteSpace: 'nowrap' }}>
                                End
                              </label>
                              <input
                                type="time"
                                className="books-form-control"
                                style={{ width: 120, padding: '4px 8px' }}
                                value={slot.endTime}
                                onChange={e => updateSlotTime(key, 'endTime', e.target.value)}
                              />
                            </div>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
                          </>
                        )}
                        {/* Day label shown when not selected */}
                        {!isSelected && (
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
            <div className="books-modal-foot">
              <button type="button" className="books-btn books-btn-ghost"
                      onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="books-btn books-btn-primary"
                      disabled={saving}>
                {saving ? 'Saving...' : mode === 'add' ? 'Add Schedule' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── View Modal ─────────────────────────────────────────────────────────────
function ViewScheduleModal({ isOpen, schedule, onClose }) {
  if (!isOpen || !schedule) return null;

  return (
    <div className="books-overlay" onClick={onClose}>
      <div className="books-modal" style={{ maxWidth: 480 }}
           onClick={e => e.stopPropagation()}>
        <div className="books-modal-head">
          <h3>Schedule Details</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>
        <div className="books-modal-body">
          {[
            ['Schedule ID',  schedule.scheduleId],
            ['Department',   schedule.department],
            ['Semester',     schedule.semester],
            ['Subject',      schedule.subjectName],
            ['Faculty',      schedule.facultyName],
            ['Venue',        schedule.venueName || schedule.venueId],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', gap: 12, padding: '7px 0',
              borderBottom: '1px solid var(--border-primary,#f3f4f6)',
            }}>
              <span style={{ width: 120, flexShrink: 0, fontWeight: 600,
                             fontSize: 13, color: 'var(--text-secondary)' }}>
                {label}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                {value || '—'}
              </span>
            </div>
          ))}

          {/* Day slots */}
          {schedule.daySlots && schedule.daySlots.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 13,
                          color: 'var(--text-secondary)', marginBottom: 8 }}>
                Schedule Days &amp; Times
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {schedule.daySlots.map(slot => {
                  const dayLabel = DAYS.find(d => d.key === slot.day)?.label || slot.day;
                  return (
                    <div key={slot.day} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--bg-secondary,#f9fafb)',
                      borderRadius: 8, padding: '6px 12px',
                    }}>
                      <span style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: '#2563eb', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 12, flexShrink: 0,
                      }}>
                        {slot.day}
                      </span>
                      <span style={{ fontWeight: 500, fontSize: 13,
                                     flex: 1, color: 'var(--text-primary)' }}>
                        {dayLabel}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)',
                                     fontFamily: 'monospace' }}>
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="books-modal-foot">
          <button className="books-btn books-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SchedulePage
// ══════════════════════════════════════════════════════════════════════════
export default function SchedulePage() {

  const [schedules,  setSchedules]  = useState([]);
  const [pageData,   setPageData]   = useState(DEFAULT_PAGE);
  const [page,       setPage]       = useState(0);
  const [size,       setSize]       = useState(10);
  const [loading,    setLoading]    = useState(true);
  const [pageError,  setPageError]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);

  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalMode,  setModalMode]  = useState('add');
  const [selSch,     setSelSch]     = useState(null);
  const [viewOpen,   setViewOpen]   = useState(false);
  const [viewSch,    setViewSch]    = useState(null);

  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Load (paginated) ──────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await springGet(`/schedules?page=${page}&size=${size}`);
      // springApi interceptor unwraps res.data → res is the Page object
      const pd = res;
      setSchedules(Array.isArray(pd.content) ? pd.content : []);
      setPageData({
        pageNumber:    pd.number        ?? 0,
        pageSize:      pd.size          ?? size,
        totalElements: pd.totalElements ?? 0,
        totalPages:    pd.totalPages    ?? 0,
        first:         pd.first         ?? true,
        last:          pd.last          ?? true,
      });
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load schedules.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, size]);

  useEffect(() => { load(); }, [load]);

  const onPageChange = (p) => setPage(p);
  const onSizeChange = (s) => { setSize(s); setPage(0); };

  const openAdd  = ()  => { setSelSch(null); setModalMode('add');  setModalOpen(true); };
  const openEdit = (s) => { setSelSch(s);    setModalMode('edit'); setModalOpen(true); };
  const openView = (s) => { setViewSch(s);   setViewOpen(true); };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    setSaving(true);
    const slowTimer = setTimeout(() =>
      setError('Server is waking up (free tier). Please wait...'), 4000);
    try {
      if (modalMode === 'add') {
        await springApi.post('/schedules', form);
        clearTimeout(slowTimer); setError('');
        setSuccess('Schedule added successfully.');
      } else {
        await springApi.put(`/schedules/${selSch.scheduleId}`, form);
        clearTimeout(slowTimer); setError('');
        setSuccess('Schedule updated successfully.');
      }
      setModalOpen(false);
      load(true);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.message || 'Failed to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async (sch) => {
    if (!window.confirm(`Delete schedule "${sch.scheduleId}"?`)) return;
    setDeleting(sch.scheduleId);
    try {
      await springApi.delete(`/schedules/${sch.scheduleId}`);
      setSuccess('Schedule deleted.');
      load(true);
    } catch (err) {
      setError(err.message || 'Failed to delete schedule.');
    } finally {
      setDeleting(null);
    }
  };

  // ── Day slots summary for table ───────────────────────────────────────
  const slotSummary = (daySlots) => {
    if (!daySlots || !daySlots.length) return '—';
    return daySlots.map(s => s.day).join(', ');
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* Header */}
      <div className="books-page-header" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'nowrap', gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title">Schedule</h1>
          <p className="books-page-sub">Manage class schedules by department and semester</p>
        </div>
        <button
          className="books-btn books-btn-primary"
          style={{ flexShrink: 0 }}
          onClick={openAdd}
        >
          + Add Schedule
        </button>
      </div>

      {/* Alerts */}
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

      {/* Table */}
      {loading ? (
        <div className="card">
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th>#</th><th>Schedule ID</th><th>Department</th>
                  <th>Semester</th><th>Subject</th><th>Faculty</th>
                  <th>Days</th><th>Venue</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j}>
                        <div style={{
                          height: 13, width: '70%', borderRadius: 4,
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
          {schedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px',
                          color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
              <p style={{ fontSize: 15, marginBottom: 16 }}>No schedules added yet.</p>
              <button className="books-btn books-btn-primary" onClick={openAdd}>
                + Add First Schedule
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="book-desk-table">
                <div className="books-table-wrap">
                  <table className="books-table">
                    <thead>
                      <tr>
                        <th style={{ width: 42 }}>#</th>
                        <th style={{ width: 100 }}>Schedule ID</th>
                        <th>Department</th>
                        <th>Semester</th>
                        <th>Subject</th>
                        <th>Faculty</th>
                        <th style={{ width: 100 }}>Days</th>
                        <th>Venue</th>
                        <th style={{ width: 155 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((sch, i) => (
                        <tr key={sch.scheduleId} style={{ cursor: 'pointer' }}
                            onClick={() => openView(sch)}>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            {page * size + i + 1}
                          </td>
                          <td>
                            <span style={{
                              fontFamily: 'monospace', fontSize: '0.78rem',
                              background: 'var(--bg-secondary,#f9fafb)',
                              padding: '2px 8px', borderRadius: 6,
                              color: 'var(--text-secondary)',
                            }}>
                              {sch.scheduleId}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>{sch.department}</td>
                          <td style={{ fontSize: 13 }}>{sch.semester}</td>
                          <td style={{ fontSize: 13 }}>{sch.subjectName}</td>
                          <td style={{ fontSize: 13 }}>{sch.facultyName}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                              {(sch.daySlots || []).map(s => (
                                <span key={s.day} style={{
                                  width: 26, height: 26, borderRadius: '50%',
                                  background: '#dbeafe', color: '#1e40af',
                                  display: 'inline-flex', alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10, fontWeight: 700,
                                }}>
                                  {s.day}
                                </span>
                              ))}
                              {(!sch.daySlots || !sch.daySlots.length) && '—'}
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {sch.venueName || sch.venueId || '—'}
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <div className="books-actions">
                              <button className="books-btn books-btn-sm books-btn-ghost"
                                      onClick={() => openView(sch)}>
                                View
                              </button>
                              <button className="books-btn books-btn-sm books-btn-warning"
                                      onClick={() => openEdit(sch)}>
                                Edit
                              </button>
                              <button
                                className="books-btn books-btn-sm books-btn-danger"
                                onClick={() => handleDelete(sch)}
                                disabled={deleting === sch.scheduleId}
                              >
                                {deleting === sch.scheduleId ? '...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="book-mob-list">
                {schedules.map((sch, i) => (
                  <div key={sch.scheduleId} className="book-mob-card">
                    <button type="button" className="book-mob-header"
                            onClick={() => openView(sch)}>
                      <div className="book-mob-summary">
                        <span className="book-mob-num">{page * size + i + 1}</span>
                        <div className="book-mob-title-wrap">
                          <span className="book-mob-title">{sch.subjectName}</span>
                          <span className="book-mob-author"
                                style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {sch.scheduleId}
                          </span>
                        </div>
                      </div>
                      <span className="book-mob-chevron">▼</span>
                    </button>
                    <div className="book-mob-details">
                      {[
                        ['Department', sch.department],
                        ['Semester',   sch.semester],
                        ['Faculty',    sch.facultyName],
                        ['Venue',      sch.venueName || sch.venueId],
                        ['Days',       slotSummary(sch.daySlots)],
                      ].map(([label, val]) => (
                        <div key={label} className="book-mob-row">
                          <span className="book-mob-label">{label}</span>
                          <span className="book-mob-value">{val || '—'}</span>
                        </div>
                      ))}
                      <div className="book-mob-actions">
                        <button className="books-btn books-btn-sm books-btn-ghost"
                                onClick={() => openView(sch)}>View</button>
                        <button className="books-btn books-btn-sm books-btn-warning"
                                onClick={() => openEdit(sch)}>Edit</button>
                        <button
                          className="books-btn books-btn-sm books-btn-danger"
                          onClick={() => handleDelete(sch)}
                          disabled={deleting === sch.scheduleId}
                        >
                          {deleting === sch.scheduleId ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                pageData={pageData}
                onPageChange={onPageChange}
                onSizeChange={onSizeChange}
              />
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <ScheduleModal
        isOpen={modalOpen}
        mode={modalMode}
        schedule={selSch}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        saving={saving}
      />
      <ViewScheduleModal
        isOpen={viewOpen}
        schedule={viewSch}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
