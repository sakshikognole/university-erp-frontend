import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { springApi, springGet } from '../services/api';
import PageError from '../components/PageError';

// URL helpers
const onLocalhost = window.location.hostname === 'localhost';
const NODE_URL = onLocalhost ? 'http://localhost:5000/api' : 'https://university-erp-node.onrender.com/api';
const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
});

// Days config
const DAYS = [
  { key: 'M',  label: 'Monday'    },
  { key: 'T',  label: 'Tuesday'   },
  { key: 'W',  label: 'Wednesday' },
  { key: 'Th', label: 'Thursday'  },
  { key: 'F',  label: 'Friday'    },
  { key: 'S',  label: 'Saturday'  },
  { key: 'Su', label: 'Sunday'    },
];

const EMPTY_FORM = {
  department:   '', semester: '', subjectId: '', subjectName: '',
  facultyId: '', facultyName: '', venueId: '', venueName: '',
  scheduleDate: '', daySlots: [],
};

// Add Class Schedule Modal
function ClassScheduleModal({ isOpen, onSave, onClose, saving }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [subjects,    setSubjects]    = useState([]);
  const [faculty,     setFaculty]     = useState([]);
  const [venues,      setVenues]      = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setLoading(true);
    Promise.all([
      springGet('/subjects'),
      fetch(`${NODE_URL}/super-admin/staff`, { headers: authHeader() }).then(r => r.json()),
      fetch(`${NODE_URL}/super-admin/venues`, { headers: authHeader() }).then(r => r.json()),
      fetch(`${NODE_URL}/super-admin/departments`, { headers: authHeader() }).then(r => r.json()),
    ])
      .then(([subRes, staffRes, venueRes, deptRes]) => {
        setSubjects(Array.isArray(subRes) ? subRes : []);
        setFaculty(Array.isArray(staffRes) ? staffRes : []);
        setVenues(Array.isArray(venueRes) ? venueRes : []);
        setDepartments(Array.isArray(deptRes) ? deptRes : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayKey) => {
    const exists = form.daySlots.find(s => s.day === dayKey);
    if (exists) {
      setForm(f => ({ ...f, daySlots: f.daySlots.filter(s => s.day !== dayKey) }));
    } else {
      setForm(f => ({ ...f, daySlots: [...f.daySlots, { day: dayKey, startTime: '', endTime: '' }] }));
    }
    setErrors(e => ({ ...e, daySlots: '' }));
  };

  const updateSlotTime = (dayKey, field, value) => {
    setForm(f => ({
      ...f,
      daySlots: f.daySlots.map(s => s.day === dayKey ? { ...s, [field]: value } : s),
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.department.trim())  e.department   = 'Department is required.';
    if (!form.semester.trim())    e.semester     = 'Semester is required.';
    if (!form.subjectId)          e.subjectId    = 'Subject is required.';
    if (!form.facultyId)          e.facultyId    = 'Faculty is required.';
    if (!form.venueId)            e.venueId      = 'Venue is required.';
    if (!form.scheduleDate)       e.scheduleDate = 'Date is required.';
    if (!form.daySlots.length)    e.daySlots     = 'Select at least one day.';
    else {
      for (const slot of form.daySlots) {
        if (!slot.startTime || !slot.endTime) {
          e.daySlots = 'Enter start and end time for all selected days.'; break;
        }
        if (slot.startTime >= slot.endTime) {
          e.daySlots = 'End time must be after start time for all selected days.'; break;
        }
      }
    }
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const selectedDayKeys = new Set(form.daySlots.map(s => s.day));

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 560 }}>
        <div className="books-modal-head">
          <h3>Add Class Schedule</h3>
          <button className="books-modal-close" onClick={onClose} disabled={saving}>×</button>
        </div>
        {loading ? (
          <div className="books-modal-body" style={{ textAlign: 'center', padding: 32 }}>
            <p>Loading data...</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Department + Semester */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="books-form-group">
                  <label className="books-form-label">Department *</label>
                  <select className={`books-form-control ${errors.department ? 'err' : ''}`}
                    value={form.department}
                    onChange={e => { setForm(f => ({ ...f, department: e.target.value })); setErrors(er => ({ ...er, department: '' })); }}>
                    <option value="">— Select —</option>
                    {departments.map(d => (
                      <option key={d._id || d.departmentId} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  {errors.department && <p className="books-form-err">{errors.department}</p>}
                </div>
                <div className="books-form-group">
                  <label className="books-form-label">Semester *</label>
                  <input className={`books-form-control ${errors.semester ? 'err' : ''}`}
                    value={form.semester} placeholder="e.g. Semester 3"
                    onChange={e => { setForm(f => ({ ...f, semester: e.target.value })); setErrors(er => ({ ...er, semester: '' })); }} />
                  {errors.semester && <p className="books-form-err">{errors.semester}</p>}
                </div>
              </div>

              {/* Subject + Faculty */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="books-form-group">
                  <label className="books-form-label">Subject *</label>
                  <select className={`books-form-control ${errors.subjectId ? 'err' : ''}`}
                    value={form.subjectId}
                    onChange={e => {
                      const sid = e.target.value;
                      const sub = subjects.find(s => s.subjectId === sid);
                      setForm(f => ({ ...f, subjectId: sid, subjectName: sub?.subjectName ?? '' }));
                      setErrors(er => ({ ...er, subjectId: '' }));
                    }}>
                    <option value="">— Select Subject —</option>
                    {subjects.map(s => (
                      <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                    ))}
                  </select>
                  {errors.subjectId && <p className="books-form-err">{errors.subjectId}</p>}
                </div>
                <div className="books-form-group">
                  <label className="books-form-label">Faculty *</label>
                  <select className={`books-form-control ${errors.facultyId ? 'err' : ''}`}
                    value={form.facultyId}
                    onChange={e => {
                      const fid = e.target.value;
                      const fac = faculty.find(f => f._id === fid || f.staffId === fid);
                      setForm(f => ({ ...f, facultyId: fid, facultyName: fac?.name ?? '' }));
                      setErrors(er => ({ ...er, facultyId: '' }));
                    }}>
                    <option value="">— Select Faculty —</option>
                    {faculty.map(f => (
                      <option key={f._id || f.staffId} value={f._id || f.staffId}>{f.name}</option>
                    ))}
                  </select>
                  {errors.facultyId && <p className="books-form-err">{errors.facultyId}</p>}
                </div>
              </div>

              {/* Venue */}
              <div className="books-form-group">
                <label className="books-form-label">Venue *</label>
                <select className={`books-form-control ${errors.venueId ? 'err' : ''}`}
                  value={form.venueId}
                  onChange={e => {
                    const vid = e.target.value;
                    const ven = venues.find(v => v.venueId === vid);
                    setForm(f => ({ ...f, venueId: vid, venueName: ven?.name ?? '' }));
                    setErrors(er => ({ ...er, venueId: '' }));
                  }}
                  style={{ maxWidth: 340 }}>
                  <option value="">— Select Venue —</option>
                  {venues.map(v => (
                    <option key={v.venueId} value={v.venueId}>{v.name} ({v.venueId})</option>
                  ))}
                </select>
                {errors.venueId && <p className="books-form-err">{errors.venueId}</p>}
              </div>

              {/* Date */}
              <div className="books-form-group" style={{ maxWidth: 220 }}>
                <label className="books-form-label">Date *</label>
                <input type="date" className={`books-form-control ${errors.scheduleDate ? 'err' : ''}`}
                  value={form.scheduleDate}
                  onChange={e => { setForm(f => ({ ...f, scheduleDate: e.target.value })); setErrors(er => ({ ...er, scheduleDate: '' })); }} />
                {errors.scheduleDate && <p className="books-form-err">{errors.scheduleDate}</p>}
              </div>

              {/* Days */}
              <div className="books-form-group">
                <label className="books-form-label">Days & Times *</label>
                {errors.daySlots && <p className="books-form-err">{errors.daySlots}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                  {DAYS.map(({ key, label }) => {
                    const isSelected = selectedDayKeys.has(key);
                    const slot = form.daySlots.find(s => s.day === key);
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button type="button" title={label} onClick={() => toggleDay(key)}
                          style={{
                            width: 38, height: 38, borderRadius: '50%',
                            border: isSelected ? '2px solid #2563eb' : '2px solid #d1d5db',
                            background: isSelected ? '#2563eb' : '#f9fafb',
                            color: isSelected ? '#fff' : '#374151',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                          {key}
                        </button>
                        {isSelected && slot && (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <label style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>Start</label>
                              <input type="time" className="books-form-control"
                                style={{ width: 120, padding: '4px 8px' }}
                                value={slot.startTime}
                                onChange={e => updateSlotTime(key, 'startTime', e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <label style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>End</label>
                              <input type="time" className="books-form-control"
                                style={{ width: 120, padding: '4px 8px' }}
                                value={slot.endTime}
                                onChange={e => updateSlotTime(key, 'endTime', e.target.value)} />
                            </div>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
                          </>
                        )}
                        {!isSelected && <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="books-modal-foot">
              <button type="button" className="books-btn books-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="books-btn books-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Add Class Schedule'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Main Page
export default function ClassSchedulePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await springGet('/schedules');
      const list = Array.isArray(res) ? res : (res.data?.content ?? res.content ?? []);
      // Filter only class schedules (no examId)
      const classSchedules = list.filter(s => !s.examId);
      setSchedules(classSchedules);
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load class schedules.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    const slowTimer = setTimeout(() => setError('Server waking up...'), 4000);
    try {
      await springApi.post('/schedules', form);
      clearTimeout(slowTimer); setError('');
      setSuccess('Class schedule added successfully.');
      setModalOpen(false);
      load(true);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.message || 'Failed to save class schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sch) => {
    if (!window.confirm(`Delete class schedule "${sch.scheduleId}"?`)) return;
    setDeleting(sch.scheduleId);
    try {
      await springApi.delete(`/schedules/${sch.scheduleId}`);
      setSuccess('Class schedule deleted.');
      load(true);
    } catch {
      setError('Failed to delete class schedule.');
    } finally {
      setDeleting(null);
    }
  };

  const slotSummary = (daySlots) => {
    if (!daySlots || !daySlots.length) return '—';
    return daySlots.map(s => s.day).join(', ');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="books-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <button className="books-btn books-btn-ghost books-btn-sm" onClick={() => navigate('/schedules')}
            style={{ marginBottom: 8 }}>
            ← Back to Schedule
          </button>
          <h1 className="page-title">Class Schedules</h1>
          <p className="books-page-sub">Manage regular class schedules by department</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={() => setModalOpen(true)} style={{ flexShrink: 0 }}>
          + Add Schedule
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
        <div className="card"><p style={{ padding: 32, textAlign: 'center' }}>Loading...</p></div>
      ) : pageError ? (
        <PageError message={pageError} onRetry={load} />
      ) : schedules.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
          <p style={{ fontSize: 15, marginBottom: 16 }}>No class schedules yet.</p>
          <button className="books-btn books-btn-primary" onClick={() => setModalOpen(true)}>
            + Add First Schedule
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '1rem' }}>
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th style={{ width: 42 }}>#</th>
                  <th>Schedule ID</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Subject</th>
                  <th>Faculty</th>
                  <th>Date</th>
                  <th>Days</th>
                  <th>Venue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sch, i) => (
                  <tr key={sch.scheduleId}>
                    <td style={{ color: '#9ca3af', fontSize: 13 }}>{i + 1}</td>
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontSize: '0.78rem',
                        background: '#f9fafb', padding: '2px 8px',
                        borderRadius: 6, color: '#6b7280',
                      }}>
                        {sch.scheduleId}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{sch.department}</td>
                    <td style={{ fontSize: 13 }}>{sch.semester}</td>
                    <td style={{ fontSize: 13 }}>{sch.subjectName}</td>
                    <td style={{ fontSize: 13 }}>{sch.facultyName}</td>
                    <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                      {sch.scheduleDate
                        ? new Date(sch.scheduleDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {(sch.daySlots || []).map(s => (
                          <span key={s.day} style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: '#dbeafe', color: '#1e40af',
                            display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 10, fontWeight: 700,
                          }}>
                            {s.day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{sch.venueName || sch.venueId || '—'}</td>
                    <td>
                      <div className="books-actions">
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
      )}

      <ClassScheduleModal
        isOpen={modalOpen}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        saving={saving}
      />
    </div>
  );
}
