import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { springApi, springGet } from '../services/api';
import PageError from '../components/PageError';
import ViewDetailModal from '../components/ViewDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';

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

const EMPTY_EXAM_FORM = {
  examId: '', examName: '', scheduleDate: '', classroom: '', multiDay: false, daySlots: [],
};

const EMPTY_CLASS_FORM = {
  department: '', semester: '', subjectId: '', subjectName: '',
  facultyId: '', facultyName: '', venueId: '', venueName: '',
  scheduleDate: '', daySlots: [],
};

// Exam Schedule Modal
function ExamScheduleModal({ isOpen, mode, schedule, onSave, onClose, saving }) {
  const [form, setForm] = useState(EMPTY_EXAM_FORM);
  const [errors, setErrors] = useState({});
  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [bunches, setBunches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setLoadError('');
    setLoading(true);

    // Fetch each independently so one failure doesn't wipe the others
    const p1 = springGet('/exams')
      .then(res => Array.isArray(res) ? res : (res?.content ?? res?.data ?? []))
      .catch(() => []);

    const p2 = springGet('/classrooms', { params: { page: 0, size: 1000 } })
      .then(res => Array.isArray(res) ? res : (res?.content ?? []))
      .catch(() => []);

    const p3 = springGet('/classroom-bunches')
      .then(res => Array.isArray(res) ? res : [])
      .catch(() => []);

    Promise.all([p1, p2, p3])
      .then(([examList, allClassrooms, allBunches]) => {
        // Sort exams
        examList.sort((a, b) => (a.examId || '').localeCompare(b.examId || ''));
        setExams(examList);

        // Filter classrooms — exclude those already in a bunch
        const classroomIdsInBunches = new Set();
        allBunches.forEach(bunch => {
          bunch.classroomIds?.forEach(id => classroomIdsInBunches.add(id));
        });
        setClassrooms(allClassrooms.filter(c => !classroomIdsInBunches.has(c.classroomId)));
        setBunches(allBunches);

        if (examList.length === 0) {
          setLoadError('No exams found. Please add exams first, or the server may be waking up — try closing and reopening this modal.');
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Populate form for edit mode
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && schedule) {
      setForm({
        examId: schedule.examId || schedule.subjectId || '',
        examName: schedule.examName || schedule.subjectName || '',
        scheduleDate: schedule.scheduleDate || '',
        classroom: schedule.classroom || schedule.venueName || '',
        multiDay: (schedule.daySlots?.length || 0) > 1,
        daySlots: schedule.daySlots || [],
      });
    } else {
      setForm(EMPTY_EXAM_FORM);
    }
  }, [isOpen, mode, schedule]);

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
    if (!form.examId) e.examId = 'Please select an exam.';
    if (!form.scheduleDate) {
      e.scheduleDate = 'Date is required.';
    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const picked = new Date(form.scheduleDate);
      if (picked < today) e.scheduleDate = 'Date cannot be in the past.';
    }
    if (!form.daySlots.length) e.daySlots = 'Select at least one day.';
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
          <h3>{mode === 'edit' ? 'Edit Exam Schedule' : 'Add Exam Schedule'}</h3>
          <button className="books-modal-close" onClick={onClose} disabled={saving}>×</button>
        </div>
        {loading ? (
          <div className="books-modal-body" style={{ textAlign: 'center', padding: 32 }}>
            <p>Loading exams...</p>
          </div>
        ) : loadError ? (
          <div className="books-modal-body" style={{ padding: 24 }}>
            <div className="books-alert books-alert-error" style={{ marginBottom: 12 }}>
              <span>{loadError}</span>
            </div>
            <button className="books-btn books-btn-ghost" style={{ fontSize: 13 }}
              onClick={() => { setLoadError(''); setLoading(true);
                const p1 = springGet('/exams').then(r => Array.isArray(r) ? r : (r?.content ?? r?.data ?? [])).catch(() => []);
                const p2 = springGet('/classrooms', { params: { page: 0, size: 1000 } }).then(r => Array.isArray(r) ? r : (r?.content ?? [])).catch(() => []);
                const p3 = springGet('/classroom-bunches').then(r => Array.isArray(r) ? r : []).catch(() => []);
                Promise.all([p1, p2, p3]).then(([el, cl, bl]) => {
                  el.sort((a, b) => (a.examId||'').localeCompare(b.examId||'')); setExams(el);
                  const ids = new Set(); bl.forEach(b => b.classroomIds?.forEach(id => ids.add(id)));
                  setClassrooms(cl.filter(c => !ids.has(c.classroomId))); setBunches(bl);
                  if (el.length === 0) setLoadError('Still no exams found. Please add exams in the Exam module first.');
                }).finally(() => setLoading(false));
              }}>↻ Retry</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="books-form-group">
                <label className="books-form-label">Exam <span style={{ color: '#dc2626' }}>*</span></label>
                <select className={`books-form-control ${errors.examId ? 'err' : ''}`} value={form.examId}
                  onChange={e => {
                    const eid = e.target.value;
                    const ex = exams.find(x => x.examId === eid);
                    setForm(f => ({ ...f, examId: eid, examName: ex?.subject ?? '' }));
                    setErrors(er => ({ ...er, examId: '' }));
                  }}>
                  <option value="">— Select Exam —</option>
                  {exams.map(ex => (
                    <option key={ex.examId} value={ex.examId}>
                      {ex.examId} — {ex.subject} {ex.academicYear ? `(${ex.academicYear})` : ''}
                    </option>
                  ))}
                </select>
                {errors.examId && <p className="books-form-err">{errors.examId}</p>}
              </div>

              <div className="books-form-group">
                <label className="books-form-label">Date <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="date" className={`books-form-control ${errors.scheduleDate ? 'err' : ''}`}
                  value={form.scheduleDate}
                  onChange={e => { setForm(f => ({ ...f, scheduleDate: e.target.value })); setErrors(er => ({ ...er, scheduleDate: '' })); }} />
                {errors.scheduleDate && <p className="books-form-err">{errors.scheduleDate}</p>}
              </div>

              <div className="books-form-group">
                <label className="books-form-label">Classroom</label>
                <select className="books-form-control" value={form.classroom}
                  onChange={e => setForm(f => ({ ...f, classroom: e.target.value }))}>
                  <option value="">— Select Classroom —</option>
                  
                  {/* Classroom Bunches */}
                  {bunches.length > 0 && (
                    <optgroup label="Classroom Bunches">
                      {bunches.map(bunch => (
                        <option key={bunch.bunchId} value={bunch.bunchName}>
                          {bunch.bunchName} ({bunch.totalClassrooms} rooms, {bunch.totalCapacity} capacity)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* Individual Classrooms (not in any bunch) */}
                  {classrooms.length > 0 && (
                    <optgroup label="Individual Classrooms">
                      {classrooms.map(c => (
                        <option key={c.classroomId} value={c.classroomName}>
                          {c.classroomName} (Capacity: {c.capacity})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input type="checkbox" id="multiDay" checked={form.multiDay}
                  onChange={e => {
                    const isMulti = e.target.checked;
                    setForm(f => ({ ...f, multiDay: isMulti, daySlots: !isMulti && f.daySlots.length > 1 ? [f.daySlots[0]] : f.daySlots }));
                  }} />
                <label htmlFor="multiDay" style={{ fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Multiple Days</label>
              </div>

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
                              <input type="time" className="books-form-control" style={{ width: 120, padding: '4px 8px' }}
                                value={slot.startTime} onChange={e => updateSlotTime(key, 'startTime', e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <label style={{ fontSize: 12, color: '#6b7280' }}>End</label>
                              <input type="time" className="books-form-control" style={{ width: 120, padding: '4px 8px' }}
                                value={slot.endTime} onChange={e => updateSlotTime(key, 'endTime', e.target.value)} />
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
                {saving ? 'Saving...' : mode === 'edit' ? 'Update Exam Schedule' : 'Add Exam Schedule'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Class Schedule Modal
function ClassScheduleModal({ isOpen, mode = 'add', schedule = null, onSave, onClose, saving }) {
  const [form, setForm] = useState(EMPTY_CLASS_FORM);
  const [errors, setErrors] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [venues, setVenues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && schedule) {
      setForm({
        department: schedule.department || '',
        semester: schedule.semester || '',
        subjectId: schedule.subjectId || '',
        subjectName: schedule.subjectName || '',
        facultyId: schedule.facultyId || '',
        facultyName: schedule.facultyName || '',
        venueId: schedule.venueId || '',
        venueName: schedule.venueName || '',
        scheduleDate: schedule.scheduleDate ? schedule.scheduleDate.split('T')[0] : '',
        daySlots: schedule.daySlots || [],
      });
    } else {
      setForm(EMPTY_CLASS_FORM);
    }
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
    if (!form.department.trim()) e.department = 'Department is required.';
    if (!form.semester.trim()) e.semester = 'Semester is required.';
    if (!form.subjectId) e.subjectId = 'Subject is required.';
    if (!form.facultyId) e.facultyId = 'Faculty is required.';
    if (!form.venueId) e.venueId = 'Venue is required.';
    if (!form.scheduleDate) e.scheduleDate = 'Date is required.';
    if (!form.daySlots.length) e.daySlots = 'Select at least one day.';
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
      <div className="books-modal" style={{ maxWidth: 560 }}>
        <div className="books-modal-head">
          <h3>{mode === 'edit' ? 'Edit Class Schedule' : 'Add Class Schedule'}</h3>
          <button className="books-modal-close" onClick={onClose} disabled={saving}>×</button>
        </div>
        {loading ? (
          <div className="books-modal-body" style={{ textAlign: 'center', padding: 32 }}>
            <p>Loading data...</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="club-form-row">
                <div className="books-form-group">
                  <label className="books-form-label">Department *</label>
                  <select className={`books-form-control ${errors.department ? 'err' : ''}`} value={form.department}
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
                  <input className={`books-form-control ${errors.semester ? 'err' : ''}`} value={form.semester}
                    placeholder="e.g. Semester 3"
                    onChange={e => { setForm(f => ({ ...f, semester: e.target.value })); setErrors(er => ({ ...er, semester: '' })); }} />
                  {errors.semester && <p className="books-form-err">{errors.semester}</p>}
                </div>
              </div>

              <div className="club-form-row">
                <div className="books-form-group">
                  <label className="books-form-label">Subject *</label>
                  <select className={`books-form-control ${errors.subjectId ? 'err' : ''}`} value={form.subjectId}
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
                  <select className={`books-form-control ${errors.facultyId ? 'err' : ''}`} value={form.facultyId}
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

              <div className="books-form-group">
                <label className="books-form-label">Venue *</label>
                <select className={`books-form-control ${errors.venueId ? 'err' : ''}`} value={form.venueId}
                  onChange={e => {
                    const vid = e.target.value;
                    const ven = venues.find(v => v.venueId === vid);
                    setForm(f => ({ ...f, venueId: vid, venueName: ven?.name ?? '' }));
                    setErrors(er => ({ ...er, venueId: '' }));
                  }}>
                  <option value="">— Select Venue —</option>
                  {venues.map(v => (
                    <option key={v.venueId} value={v.venueId}>{v.name} ({v.venueId})</option>
                  ))}
                </select>
                {errors.venueId && <p className="books-form-err">{errors.venueId}</p>}
              </div>

              <div className="books-form-group">
                <label className="books-form-label">Date *</label>
                <input type="date" className={`books-form-control ${errors.scheduleDate ? 'err' : ''}`}
                  value={form.scheduleDate}
                  onChange={e => { setForm(f => ({ ...f, scheduleDate: e.target.value })); setErrors(er => ({ ...er, scheduleDate: '' })); }} />
                {errors.scheduleDate && <p className="books-form-err">{errors.scheduleDate}</p>}
              </div>

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
                              <input type="time" className="books-form-control" style={{ width: 120, padding: '4px 8px' }}
                                value={slot.startTime} onChange={e => updateSlotTime(key, 'startTime', e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <label style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>End</label>
                              <input type="time" className="books-form-control" style={{ width: 120, padding: '4px 8px' }}
                                value={slot.endTime} onChange={e => updateSlotTime(key, 'endTime', e.target.value)} />
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
                {saving ? 'Saving...' : mode === 'edit' ? 'Update Class Schedule' : 'Add Class Schedule'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Schedule Mobile Card (accordion — same pattern as BookMobileCard)
function ScheduleMobileCard({ sch, index, activeTab, isExpanded, onToggle, onView, onEdit, onDelete, deleting }) {
  const isExam = activeTab === 'exam';

  // Header title and subtitle
  const title = isExam ? (sch.examName || sch.subjectName || '—') : (sch.subjectName || '—');
  const subtitle = isExam ? (sch.examId || '—') : (sch.department || '—');

  // Day pills
  const dayPills = (sch.daySlots || []).map(s => s.day).join(', ') || '—';

  // Formatted date
  const fmtDate = sch.scheduleDate
    ? new Date(sch.scheduleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="sch-mob-card">
      <button type="button" className="sch-mob-header" onClick={onToggle} aria-expanded={isExpanded}>
        <div className="sch-mob-summary">
          <span className="sch-mob-num">{index + 1}</span>
          <div className="sch-mob-title-wrap">
            <span className="sch-mob-title">{title}</span>
            <span className="sch-mob-sub">{subtitle}</span>
          </div>
        </div>
        <span className="sch-mob-chevron">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="sch-mob-details">
          {/* Schedule ID */}
          <div className="sch-mob-row">
            <span className="sch-mob-label">Schedule id</span>
            <span className="code-badge">{sch.scheduleId || '—'}</span>
          </div>

          {isExam ? (
            <>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Exam</span>
                <span className="sch-mob-value">{sch.examName || sch.subjectName || '—'}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Exam id</span>
                {sch.examId ? <span className="code-badge">{sch.examId}</span> : <span className="sch-mob-value">—</span>}
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Start time</span>
                <span className="sch-mob-value">{sch.daySlots?.[0]?.startTime || '—'}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Date</span>
                <span className="sch-mob-value">{fmtDate}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Days</span>
                <span className="sch-mob-value">{dayPills}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Classroom</span>
                <span className="sch-mob-value">{sch.classroom || sch.venueName || 'TBA'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Department</span>
                <span className="sch-mob-value">{sch.department || '—'}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Semester</span>
                <span className="sch-mob-value">{sch.semester || '—'}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Subject</span>
                <span className="sch-mob-value">{sch.subjectName || '—'}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Faculty</span>
                <span className="sch-mob-value">{sch.facultyName || '—'}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Start time</span>
                <span className="sch-mob-value">{sch.daySlots?.[0]?.startTime || '—'}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Date</span>
                <span className="sch-mob-value">{fmtDate}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Days</span>
                <span className="sch-mob-value">{dayPills}</span>
              </div>
              <div className="sch-mob-row">
                <span className="sch-mob-label">Venue</span>
                <span className="sch-mob-value">{sch.venueName || sch.venueId || '—'}</span>
              </div>
            </>
          )}

          <div className="sch-mob-actions">
            <button className="books-btn books-btn-sm books-btn-ghost" onClick={() => onView(sch)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                View
              </span>
            </button>
            <button className="books-btn books-btn-sm books-btn-warning" onClick={() => onEdit(sch)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </span>
            </button>
            <button
              className="books-btn books-btn-sm books-btn-danger"
              onClick={() => onDelete(sch)}
              disabled={deleting === sch.scheduleId}
            >
              {deleting === sch.scheduleId ? '...' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Delete
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Page
export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState('exam'); // 'exam' or 'schedule'
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [delSch, setDelSch] = useState(null);
  const [search, setSearch] = useState('');
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examModalMode, setExamModalMode] = useState('add');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classModalMode, setClassModalMode] = useState('add');
  const [selectedClassSchedule, setSelectedClassSchedule] = useState(null);
  const [viewSchedule, setViewSchedule] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null); // mobile accordion

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await springGet('/schedules', { params: { page: 0, size: 1000 } });
      const list = Array.isArray(res) ? res : (res?.content ?? res?.data?.content ?? []);
      setSchedules(list);
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load schedules.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openExamAdd = () => {
    setSelectedSchedule(null);
    setExamModalMode('add');
    setExamModalOpen(true);
  };

  const openExamEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setExamModalMode('edit');
    setExamModalOpen(true);
  };

  const openClassAdd = () => {
    setSelectedClassSchedule(null);
    setClassModalMode('add');
    setClassModalOpen(true);
  };

  const openClassEdit = (schedule) => {
    setSelectedClassSchedule(schedule);
    setClassModalMode('edit');
    setClassModalOpen(true);
  };

  const handleExamSave = async (form) => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        examId: form.examId,
        examName: form.examName,
        department: 'Exam',
        semester: 'All',
        subjectId: form.examId,
        subjectName: form.examName,
        facultyId: 'EXAM',
        facultyName: 'Exam Schedule',
        venueId: form.classroom || 'TBA',
        venueName: form.classroom || 'To Be Announced',
      };
      
      if (examModalMode === 'edit' && selectedSchedule) {
        await springApi.put(`/schedules/${selectedSchedule.scheduleId}`, payload);
        setSuccess('Exam schedule updated successfully.');
      } else {
        await springApi.post('/schedules', payload);
        setSuccess('Exam schedule added successfully.');
      }
      
      setExamModalOpen(false);
      await load(true);
    } catch (err) {
      setError(err.message || 'Failed to save exam schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleClassSave = async (form) => {
    setSaving(true);
    try {
      if (classModalMode === 'edit' && selectedClassSchedule) {
        await springApi.put(`/schedules/${selectedClassSchedule.scheduleId}`, form);
        setSuccess('Class schedule updated successfully.');
      } else {
        await springApi.post('/schedules', form);
        setSuccess('Class schedule added successfully.');
      }
      setClassModalOpen(false);
      await load(true);
    } catch (err) {
      setError(err.message || 'Failed to save class schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (sch) => {
    setDelSch(sch);
  };

  const confirmDelete = async () => {
    if (!delSch) return;
    setDeleting(delSch.scheduleId);
    try {
      await springApi.delete(`/schedules/${delSch.scheduleId}`);
      setSuccess('Schedule deleted.');
      setDelSch(null);
      await load(true);
    } catch {
      setError('Failed to delete schedule.');
    } finally {
      setDeleting(null);
    }
  };

  // Filter schedules based on active tab
  // Exam schedules: examId is a non-empty string
  // Class schedules: examId is null, undefined, or empty string
  const tabSchedules = schedules.filter(s => {
    if (activeTab === 'exam') return s.examId && s.examId.trim() !== '';
    return !s.examId || s.examId.trim() === '';
  });

  const filteredSchedules = tabSchedules.filter(s => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (s.scheduleId && s.scheduleId.toLowerCase().includes(q)) ||
      (s.examName && s.examName.toLowerCase().includes(q)) ||
      (s.examId && s.examId.toLowerCase().includes(q)) ||
      (s.subjectName && s.subjectName.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.facultyName && s.facultyName.toLowerCase().includes(q)) ||
      (s.classroom && s.classroom.toLowerCase().includes(q)) ||
      (s.venueName && s.venueName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Schedule</h1>
          <p className="page-subtitle">Manage exam and class schedules</p>
        </div>
        <div className="feature-page-header-actions">
          <button className="books-btn books-btn-primary" onClick={openExamAdd}>
            <span className="desk-only-text">+ Add Exam Schedule</span>
            <span className="mob-only-text">+ Add Exam</span>
          </button>
          <button className="books-btn books-btn-primary" onClick={openClassAdd}>
            <span className="desk-only-text">+ Add Class Schedule</span>
            <span className="mob-only-text">+ Add Class</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginTop: 16, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('exam')}
          style={{
            padding: '10px 24px',
            border: '1px solid #d1d5db',
            borderRadius: '6px 0 0 6px',
            background: activeTab === 'exam' ? '#111827' : '#f3f4f6',
            color: activeTab === 'exam' ? '#ffffff' : '#6b7280',
            fontWeight: activeTab === 'exam' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Exam
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '10px 24px',
            border: '1px solid #d1d5db',
            borderLeft: 'none',
            borderRadius: '0 6px 6px 0',
            background: activeTab === 'schedule' ? '#111827' : '#f3f4f6',
            color: activeTab === 'schedule' ? '#ffffff' : '#6b7280',
            fontWeight: activeTab === 'schedule' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Class Schedule
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
      ) : tabSchedules.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {activeTab === 'exam' ? '📝' : '🗓️'}
          </div>
          <p style={{ fontSize: 15, marginBottom: 16 }}>
            {activeTab === 'exam' ? 'No exam schedules yet.' : 'No class schedules yet.'}
          </p>
          <button
            className="books-btn books-btn-primary"
            onClick={() => activeTab === 'exam' ? openExamAdd() : openClassAdd()}
          >
            + Add {activeTab === 'exam' ? 'Exam Schedule' : 'Class Schedule'}
          </button>
        </div>
      ) : (
        <div className="card table-card" style={{ padding: '1rem', marginTop: '1.25rem' }}>
          {/* Search + count INSIDE the card */}
          <div className="table-controls-bar">
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                className="search-input"
                placeholder={activeTab === 'exam' ? "Search by Schedule ID, Exam, or Venue..." : "Search by Schedule ID, Dept, Subject, Faculty, Venue..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
            <div
              className="table-stats-badge"
              style={{ width: 'fit-content', alignSelf: 'flex-end', marginLeft: 'auto' }}
            >
              Total: <strong>{filteredSchedules.length}</strong>{' '}
              {filteredSchedules.length === 1 ? 'Schedule' : 'Schedules'}
            </div>
          </div>

          {filteredSchedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-secondary)' }}>
              <p>No schedules matched your search.</p>
            </div>
          ) : (
            <>
              {/* ── Desktop table (hidden on mobile) ── */}
              <div className="sch-desk-table">
              <div className="books-table-wrap">
                <table className="books-table">
              <thead>
                <tr>
                  <th style={{ width: 42 }}>#</th>
                  <th>Schedule id</th>
                  {activeTab === 'exam' ? (
                    <>
                      <th>Exam</th>
                      <th>Exam id</th>
                      <th>Start time</th>
                      <th>Date</th>
                      <th>Days</th>
                      <th>Classroom</th>
                    </>
                  ) : (
                    <>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Subject</th>
                      <th>Faculty</th>
                      <th>Start time</th>
                      <th>Date</th>
                      <th>Days</th>
                      <th>Venue</th>
                    </>
                  )}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((sch, i) => (
                  <tr key={sch.scheduleId}>
                    <td style={{ color: '#9ca3af', fontSize: 13 }}>{i + 1}</td>
                    <td>
                      <span className="code-badge">
                        {sch.scheduleId}
                      </span>
                    </td>
                    {activeTab === 'exam' ? (
                      <>
                        <td style={{ fontWeight: 500 }}>{sch.examName || sch.subjectName}</td>
                        <td>{sch.examId ? <span className="code-badge">{sch.examId}</span> : '—'}</td>
                        <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                          {sch.daySlots?.[0]?.startTime || '—'}
                        </td>
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
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 500 }}>{sch.department}</td>
                        <td style={{ fontSize: 13 }}>{sch.semester}</td>
                        <td style={{ fontSize: 13 }}>{sch.subjectName}</td>
                        <td style={{ fontSize: 13 }}>{sch.facultyName}</td>
                        <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                          {sch.daySlots?.[0]?.startTime || '—'}
                        </td>
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
                      </>
                    )}
                    <td>
                      <div className="books-actions" style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="books-btn books-btn-sm books-btn-ghost"
                          onClick={() => setViewSchedule(sch)}
                          title="View"
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                            View
                          </span>
                        </button>
                        {activeTab === 'exam' ? (
                          <button
                            type="button"
                            className="books-btn books-btn-sm books-btn-warning"
                            onClick={() => openExamEdit(sch)}
                            title="Edit"
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="books-btn books-btn-sm books-btn-warning"
                            onClick={() => openClassEdit(sch)}
                            title="Edit"
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="books-btn books-btn-sm books-btn-danger"
                          onClick={() => handleDelete(sch)}
                          disabled={deleting === sch.scheduleId}
                          title="Delete"
                        >
                          {deleting === sch.scheduleId ? '...' : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                              Delete
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>{/* end sch-desk-table */}

          {/* ── Mobile accordion cards (hidden on desktop) ── */}
          <div className="sch-mob-list">
            {filteredSchedules.map((sch, i) => (
              <ScheduleMobileCard
                key={sch.scheduleId}
                sch={sch}
                index={i}
                activeTab={activeTab}
                isExpanded={expandedId === sch.scheduleId}
                onToggle={() => setExpandedId(expandedId === sch.scheduleId ? null : sch.scheduleId)}
                onView={() => setViewSchedule(sch)}
                onEdit={() => activeTab === 'exam' ? openExamEdit(sch) : openClassEdit(sch)}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
          </div>
          </>
        )}
        </div>
      )}

      <ExamScheduleModal 
        isOpen={examModalOpen} 
        mode={examModalMode}
        schedule={selectedSchedule}
        onSave={handleExamSave} 
        onClose={() => setExamModalOpen(false)} 
        saving={saving} 
      />
      <ClassScheduleModal
        isOpen={classModalOpen}
        mode={classModalMode}
        schedule={selectedClassSchedule}
        onSave={handleClassSave}
        onClose={() => setClassModalOpen(false)}
        saving={saving}
      />

      <ViewDetailModal
        isOpen={!!viewSchedule}
        title={viewSchedule?.examId ? 'Exam Schedule Details' : 'Class Schedule Details'}
        subtitle={viewSchedule?.scheduleId}
        rows={viewSchedule ? (viewSchedule.examId ? [
          { label: 'Schedule ID', value: viewSchedule.scheduleId },
          { label: 'Exam Name', value: viewSchedule.examName || viewSchedule.subjectName },
          { label: 'Exam ID', value: viewSchedule.examId },
          { label: 'Start Time', value: viewSchedule.daySlots?.[0]?.startTime },
          { label: 'Date', value: viewSchedule.scheduleDate ? new Date(viewSchedule.scheduleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
          { label: 'Days', value: viewSchedule.daySlots?.map(d => d.day).join(', ') },
          { label: 'Classroom', value: viewSchedule.classroom || viewSchedule.venueName || 'TBA' },
        ] : [
          { label: 'Schedule ID', value: viewSchedule.scheduleId },
          { label: 'Department', value: viewSchedule.department },
          { label: 'Semester', value: viewSchedule.semester },
          { label: 'Subject', value: viewSchedule.subjectName },
          { label: 'Faculty', value: viewSchedule.facultyName },
          { label: 'Start Time', value: viewSchedule.daySlots?.[0]?.startTime },
          { label: 'Date', value: viewSchedule.scheduleDate ? new Date(viewSchedule.scheduleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
          { label: 'Days', value: viewSchedule.daySlots?.map(d => d.day).join(', ') },
          { label: 'Venue', value: viewSchedule.venueName || viewSchedule.venueId || '—' },
        ]) : []}
        onClose={() => setViewSchedule(null)}
      />

      <ConfirmDialog
        isOpen={!!delSch}
        title="Delete Schedule"
        description={`Are you sure you want to delete schedule "${delSch?.scheduleId}"? This action will permanently remove the record.`}
        itemName={delSch?.examName || delSch?.subjectName || delSch?.scheduleId}
        itemSubtext={delSch?.examId ? `Exam: ${delSch.examId}` : `Dept: ${delSch?.department || 'Class'}`}
        itemBadge={delSch?.scheduleId}
        onConfirm={confirmDelete}
        onCancel={() => setDelSch(null)}
        loading={!!deleting}
      />
    </div>
  );
}
