import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Loader2, MapPin, Calendar, Clock, BookOpen,
  UserCheck, UserX, Users, ChevronLeft, ChevronRight, Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
});

// ── Draft persistence ─────────────────────────────────────────────────────────
const ATT_DRAFT_KEY = 'att_draft_v2';
const saveDraft     = (session, students) => { try { sessionStorage.setItem(ATT_DRAFT_KEY, JSON.stringify({ session, students })); } catch { /* noop */ } };
const loadDraft     = ()                   => { try { return JSON.parse(sessionStorage.getItem(ATT_DRAFT_KEY) || 'null'); } catch { return null; } };
export const clearAttendanceDraft = ()     => { try { sessionStorage.removeItem(ATT_DRAFT_KEY); } catch { /* noop */ } };

// ─────────────────────────────────────────────────────────────────────────────
const Attendance = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT' || user?.adminType === 'STUDENT';
  const navigate  = useNavigate();

  const [loading, setLoading]     = useState(true);
  const [feedback, setFeedback]   = useState({ type: '', message: '' });

  const [session, setSession]     = useState({ venue: '', date: '', time: '', subjectName: '', department: '' });
  const [students, setStudents]   = useState([]);
  const [departments, setDepartments] = useState([]);

  // pagination
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Fetch session (and optionally filter by department) ─────────────
  const fetchSession = useCallback(async (department = '') => {
    setLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const params = new URLSearchParams();
      if (department) params.set('department', department);

      const res = await fetch(`${API_BASE_URL}/attendance/session?${params}`, { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to load session data');
      const data = await res.json();

      if (data.departments) setDepartments(data.departments);

      // Restore draft if same session context
      const draft = loadDraft();
      const matchesDraft =
        draft &&
        draft.session?.department === (department || '') &&
        Array.isArray(draft.students) &&
        draft.students.length === data.students.length;

      if (matchesDraft) {
        const marksMap = {};
        draft.students.forEach((s) => { marksMap[s.rollNo] = s.present; });
        setSession(draft.session);
        setStudents(data.students.map((s) => ({ ...s, present: s.rollNo in marksMap ? marksMap[s.rollNo] : false })));
      } else {
        clearAttendanceDraft();
        setSession({ ...data.session, department: department || '' });
        setStudents(data.students.map((s) => ({ ...s, present: false })));
      }
      setCurrentPage(1);
    } catch {
      setFeedback({ type: 'error', message: 'Could not load session data. Please refresh.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  // Auto-save draft
  useEffect(() => {
    if (!loading && students.length > 0) saveDraft(session, students);
  }, [students, session, loading]);

  // ── Department change ─────────────────────────────────────────────────
  const handleDepartmentChange = (dept) => {
    setSession((p) => ({ ...p, department: dept }));
    fetchSession(dept);
  };

  // ── Toggle / mark ─────────────────────────────────────────────────────
  const togglePresent = (rollNo) =>
    setStudents((prev) => prev.map((s) => s.rollNo === rollNo ? { ...s, present: !s.present } : s));

  const markAll = (value) => setStudents((prev) => prev.map((s) => ({ ...s, present: value })));

  // ── Counts ────────────────────────────────────────────────────────────
  const presentCount = students.filter((s) => s.present).length;
  const absentCount  = students.length - presentCount;

  // ── Pagination ────────────────────────────────────────────────────────
  const totalPages      = Math.ceil(students.length / itemsPerPage);
  const startIndex      = (currentPage - 1) * itemsPerPage;
  const currentStudents = students.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };
  const handleItemsPerPageChange = (v) => { setItemsPerPage(v); setCurrentPage(1); };

  // ── Show/Review ───────────────────────────────────────────────────────
  const handleShowAttendance = () => {
    if (!session.venue || !session.date || !session.time || !session.subjectName) {
      setFeedback({ type: 'error', message: 'Please fill in Venue, Subject, Date and Time before continuing.' });
      return;
    }
    saveDraft(session, students);
    navigate('/attendance/review', { state: { session, students } });
  };

  // 24-h time normaliser
  const to24h = (t) => {
    if (!t) return '';
    if (/^\d{2}:\d{2}$/.test(t)) return t;
    try { const d = new Date(`1970-01-01 ${t}`); return isNaN(d) ? t : d.toTimeString().slice(0, 5); }
    catch { return t; }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="spin-animate" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <p>Loading attendance session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Mark student attendance, then review before submitting</p>
        </div>
        <div className="header-actions-group">
          <button type="button" className="books-btn books-btn-primary" onClick={() => navigate('/attendance/history')}>
            <Eye size={15} /><span>View Attendance</span>
          </button>
        </div>
      </div>

      {/* Session Header Card */}
      <div className="card att-session-card" style={{ marginBottom: '1.5rem' }}>
        <div className="att-session-titlebar">
          <div className="att-session-titlebar-left">
            <div className="att-session-dot" />
            <span>Session Details</span>
          </div>
        </div>

        <div className="att-session-grid">
          {/* Department selector */}
          {!isStudent && (
            <div className="att-session-tile">
              <div className="att-session-tile-header"><Users size={14} /><span>Department</span></div>
              <select
                className="att-session-tile-input"
                value={session.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                aria-label="Department"
              >
                <option value="">— All Departments —</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Venue */}
          <div className="att-session-tile">
            <div className="att-session-tile-header"><MapPin size={14} /><span>Venue</span></div>
            <input
              className="att-session-tile-input" type="text"
              value={session.venue}
              onChange={(e) => !isStudent && setSession((p) => ({ ...p, venue: e.target.value }))}
              readOnly={isStudent} placeholder="e.g. Lecture Hall – A101" aria-label="Venue"
            />
          </div>

          {/* Subject */}
          <div className="att-session-tile">
            <div className="att-session-tile-header"><BookOpen size={14} /><span>Subject Name</span></div>
            <input
              className="att-session-tile-input" type="text"
              value={session.subjectName}
              onChange={(e) => !isStudent && setSession((p) => ({ ...p, subjectName: e.target.value }))}
              readOnly={isStudent} placeholder="e.g. Data Structures & Algorithms" aria-label="Subject Name"
            />
          </div>

          {/* Date */}
          <div className="att-session-tile">
            <div className="att-session-tile-header"><Calendar size={14} /><span>Date</span></div>
            <input
              className="att-session-tile-input" type="date"
              value={session.date}
              onChange={(e) => !isStudent && setSession((p) => ({ ...p, date: e.target.value }))}
              readOnly={isStudent} aria-label="Date"
            />
          </div>

          {/* Time */}
          <div className="att-session-tile">
            <div className="att-session-tile-header"><Clock size={14} /><span>Time</span></div>
            <input
              className="att-session-tile-input" type="time"
              value={to24h(session.time)}
              onChange={(e) => !isStudent && setSession((p) => ({ ...p, time: e.target.value }))}
              readOnly={isStudent} aria-label="Time"
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="att-toolbar att-toolbar--sticky">
        <div className="att-chips-row">
          <div className="attendance-chip attendance-chip--total"><Users size={13} /><span>Total: <strong>{students.length}</strong></span></div>
          <div className="attendance-chip attendance-chip--present"><UserCheck size={13} /><span>Present: <strong>{presentCount}</strong></span></div>
          <div className="attendance-chip attendance-chip--absent"><UserX size={13} /><span>Absent: <strong>{absentCount}</strong></span></div>
        </div>
        {!isStudent && (
          <div className="att-bulk-row">
            <button type="button" className="attendance-bulk-btn" onClick={() => markAll(true)}>Mark All Present</button>
            <button type="button" className="attendance-bulk-btn attendance-bulk-btn--ghost" onClick={() => markAll(false)}>Clear All</button>
          </div>
        )}
      </div>

      {/* Student list */}
      <div className="card att-list-card" style={{ marginBottom: '1rem' }}>
        <div className="attendance-table-header">
          <span className="attendance-col-roll">Roll No / PRN</span>
          <span className="attendance-col-name">
            <span className="attendance-header-desktop">Student Name</span>
            <span className="attendance-header-mobile">Student Details</span>
          </span>
          <span className="attendance-col-action" style={{ textAlign: 'center' }}>Attendance</span>
        </div>

        {students.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={32} style={{ opacity: 0.3, margin: '0 auto 0.75rem', display: 'block' }} />
            <p>No students found{session.department ? ` in the "${session.department}" department` : ''}.</p>
            {session.department && (
              <button type="button" className="books-btn books-btn-ghost" style={{ marginTop: '0.75rem' }} onClick={() => handleDepartmentChange('')}>
                Show all students
              </button>
            )}
          </div>
        ) : (
          currentStudents.map((student, index) => (
            <div
              key={student.rollNo}
              className={`attendance-row ${student.present ? 'attendance-row--present' : ''} ${index % 2 === 0 ? 'attendance-row--even' : ''}`}
            >
              <span className="attendance-col-roll attendance-roll">{student.rollNo}</span>
              <span className="attendance-col-name">
                <span className="attendance-student-name">{student.name}</span>
                <span className="attendance-roll-mobile">PRN: {student.rollNo}</span>
              </span>
              <span className="attendance-col-action">
                <button
                  type="button"
                  className={`attendance-toggle-btn ${student.present ? 'attendance-toggle-btn--present' : 'attendance-toggle-btn--absent'}`}
                  onClick={() => !isStudent && togglePresent(student.rollNo)}
                  disabled={isStudent}
                  aria-label={`${student.present ? 'Present' : 'Absent'} — click to toggle`}
                  aria-pressed={student.present}
                >
                  {student.present ? <><UserCheck size={15} /> Present</> : <><UserX size={15} /> Absent</>}
                </button>
              </span>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, students.length)} of {students.length} students
            </div>
            <div className="pagination-buttons">
              <button type="button" className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={16} /></button>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  return <button key={p} type="button" className={`pagination-btn${p === currentPage ? ' active' : ''}`} onClick={() => handlePageChange(p)}>{p}</button>;
                } else if (p === currentPage - 2 || p === currentPage + 2) {
                  return <span key={p} className="pagination-dots">…</span>;
                }
                return null;
              })}
              <button type="button" className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={16} /></button>
            </div>
            <div className="items-per-page">
              <span>Per page:</span>
              <select value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(Number(e.target.value))} className="items-per-page-select">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'error' ? 'feedback-error' : 'feedback-success'}`} style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} /><span>{feedback.message}</span>
        </div>
      )}

      {/* Submit button */}
      {!isStudent && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
          <button type="button" className="attendance-submit-btn" onClick={handleShowAttendance}>
            <Eye size={16} />Show Attendance
          </button>
        </div>
      )}

    </div>
  );
};

export default Attendance;
