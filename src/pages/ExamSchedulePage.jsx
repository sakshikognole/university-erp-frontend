import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { springApi, springGet } from '../services/api';
import PageError from '../components/PageError';

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
  examId:       '',
  examName:     '',
  scheduleDate: '',
  classroom:    '',
  multiDay:     false,
  daySlots:     [],
};

// Add/Edit Exam Schedule Modal
function ExamScheduleModal({ isOpen, onSave, onClose, saving }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setLoading(true);
    springGet('/exams')
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data ?? []);
        list.sort((a, b) => a.examId.localeCompare(b.examId));
        setExams(list);
      })
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayKey) => {
    const exists = form.daySlots.find(s => s.day === dayKey);
    if (exists) {
      setForm(f => ({ ...f, daySlots: f.daySlots.filter(s => s.day !== dayKey) }));
    } else {
      if (!form.multiDay) {
        setForm(f => ({ ...f, daySlots: [{ day: dayKey, startTime: '', endTime: '' }] }));
      } else {
        setForm(f => ({ ...f, daySlots: [...f.daySlots, { day: dayKey, startTime: '', endTime: '' }] }));
      }
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
    if (!form.examId)         e.examId       = 'Please select an exam.';
    if (!form.scheduleDate)   e.scheduleDate = 'Date is required.';
    if (!form.daySlots.length) e.daySlots    = 'Select at least one day.';
    else {
      for (const slot of form.daySlots) {
        if (!slot.startTime || !slot.endTime) {
          e.daySlots = 'Enter start and end time for all selected days.'; break;
        }
        if (slot.startTime >= slot.endTime) {
          e.daySlots = 'End time must be after start time.'; break;
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
      <div className="books-modal" style={{ maxWidth: 520 }}>
        <div className="books-modal-head">
          <h3>Add Exam Schedule</h3>
          <button className="books-modal-close" onClick={onClose} disabled={saving}>×</button>
        </div>
        {loading ? (
          <div className="books-modal-body" style={{ textAlign: 'center', padding: 32 }}>
            <p>Loading exams...</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Exam */}
              <div className="books-form-group">
                <label className="books-form-label">Exam <span style={{ color: '#dc2626' }}>*</span></label>
                <select
                  className={`books-form-control ${errors.examId ? 'err' : ''}`}
                  value={form.examId}
                  onChange={e => {
                    const eid = e.target.value;
                    const ex = exams.find(x => x.examId === eid);
                    setForm(f => ({ ...f, examId: eid, examName: ex?.subject ?? '' }));
                    setErrors(er => ({ ...er, examId: '' }));
                  }}
                >
                  <option value="">— Select Exam —</option>
                  {exams.map(ex => (
                    <option key={ex.examId} value={ex.examId}>
                      {ex.examId} — {ex.subject} {ex.academicYear ? `(${ex.academicYear})` : ''}
                    </option>
                  ))}
                </select>
                {errors.examId && <p className="books-form-err">{errors.examId}</p>}
              </div>

              {/* Date */}
              <div className="books-form-group" style={{ maxWidth: 220 }}>
                <label className="books-form-label">Date <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="date"
                  className={`books-form-control ${errors.scheduleDate ? 'err' : ''}`}
                  value={form.scheduleDate}
                  onChange={e => { setForm(f => ({ ...f, scheduleDate: e.target.value })); setErrors(er => ({ ...er, scheduleDate: '' })); }}
                />
                {errors.scheduleDate && <p className="books-form-err">{errors.scheduleDate}</p>}
              </div>

              {/* Classroom */}
              <div className="books-form-group" style={{ maxWidth: 280 }}>
                <label className="books-form-label">Classroom</label>
                <input className="books-form-control" value={form.classroom}
                  onChange={e => setForm(f => ({ ...f, classroom: e.target.value }))}
                  placeholder="e.g. Room 101" />
              </div>

              {/* Multiple Days checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input type="checkbox" id="multiDay" checked={form.multiDay}
                  onChange={e => {
                    const isMulti = e.target.checked;
                    setForm(f => ({
                      ...f, multiDay: isMulti,
                      daySlots: !isMulti && f.daySlots.length > 1 ? [f.daySlots[0]] : f.daySlots,
                    }));
                  }}
                  className="pay-checkbox" />
                <label htmlFor="multiDay" style={{ fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
                  Multiple Days
                </label>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {form.multiDay ? '(Select multiple days)' : '(Only one day)'}
                </span>
              </div>

              {/* Days */}
              <div className="books-form-group">
                <label className="books-form-label">Day{form.multiDay ? 's' : ''} & Time{form.multiDay ? 's' : ''} <span style={{ color: '#dc2626' }}>*</span></label>
                {errors.daySlots && <p className="books-form-err">{errors.daySlots}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                              <label style={{ fontSize: 12, color: '#6b7280' }}>Start</label>
                              <input type="time" className="books-form-control"
                                style={{ width: 120, padding: '4px 8px' }}
                                value={slot.startTime}
                                onChange={e => updateSlotTime(key, 'startTime', e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <label style={{ fontSize: 12, color: '#6b7280' }}>End</label>
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
                {saving ? 'Saving...' : 'Add Exam Schedule'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Main Page
export default function ExamSchedulePage() {
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
      // Filter only exam schedules
      const examSchedules = list.filter(s => s.examId);
      setSchedules(examSchedules);
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load exam schedules.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    const slowTimer = setTimeout(() => setError('Server waking up...'), 4000);
    try {
      const payload = {
        ...form,
        department:  'Exam',
        semester:    'All',
        subjectId:   form.examId,
        subjectName: form.examName,
        facultyId:   'EXAM',
        facultyName: 'Exam Schedule',
        venueId:     form.classroom || 'TBA',
        venueName:   form.classroom || 'To Be Announced',
      };
      await springApi.post('/schedules', payload);
      clearTimeout(slowTimer); setError('');
      setSuccess('Exam schedule added successfully.');
      setModalOpen(false);
      load(true);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.message || 'Failed to save exam schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sch) => {
    if (!window.confirm(`Delete exam schedule "${sch.scheduleId}"?`)) return;
    setDeleting(sch.scheduleId);
    try {
      await springApi.delete(`/schedules/${sch.scheduleId}`);
      setSuccess('Exam schedule deleted.');
      load(true);
    } catch {
      setError('Failed to delete exam schedule.');
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
          <h1 className="page-title">Exam Schedules</h1>
          <p className="books-page-sub">Manage exam dates and timings</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={() => setModalOpen(true)} style={{ flexShrink: 0 }}>
          + Add Exam Schedule
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
          <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
          <p style={{ fontSize: 15, marginBottom: 16 }}>No exam schedules yet.</p>
          <button className="books-btn books-btn-primary" onClick={() => setModalOpen(true)}>
            + Add First Exam Schedule
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
                  <th>Exam</th>
                  <th>Exam ID</th>
                  <th>Date</th>
                  <th>Days</th>
                  <th>Classroom</th>
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
                    <td style={{ fontWeight: 500 }}>{sch.examName || sch.subjectName}</td>
                    <td style={{ fontSize: 13 }}>{sch.examId || '—'}</td>
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
                            background: '#fef3c7', color: '#92400e',
                            display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 10, fontWeight: 700,
                          }}>
                            {s.day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{sch.classroom || sch.venueName || 'TBA'}</td>
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

      <ExamScheduleModal
        isOpen={modalOpen}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        saving={saving}
      />
    </div>
  );
}
