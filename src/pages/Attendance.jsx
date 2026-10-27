import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  UserCheck,
  UserX,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const Attendance = () => {
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [session, setSession] = useState({
    venue: '',
    date: '',
    time: '',
    subjectName: '',
  });

  const [students, setStudents] = useState([]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => { fetchSession(); }, []);

  const fetchSession = async () => {
    setLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/session`);
      if (!res.ok) throw new Error('Failed to load session data');
      const data = await res.json();
      setSession(data.session);
      setStudents(data.students);
      setCurrentPage(1);
    } catch {
      setFeedback({ type: 'error', message: 'Could not load session data. Please refresh.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle ────────────────────────────────────────────────────────────────
  const togglePresent = (rollNo) =>
    setStudents((prev) =>
      prev.map((s) => (s.rollNo === rollNo ? { ...s, present: !s.present } : s))
    );

  const markAll = (value) =>
    setStudents((prev) => prev.map((s) => ({ ...s, present: value })));

  // ── Counts ────────────────────────────────────────────────────────────────
  const presentCount = students.filter((s) => s.present).length;
  const absentCount  = students.length - presentCount;

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages      = Math.ceil(students.length / itemsPerPage);
  const startIndex      = (currentPage - 1) * itemsPerPage;
  const endIndex        = startIndex + itemsPerPage;
  const currentStudents = students.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val);
    setCurrentPage(1);
  };

  // ── Show Attendance — validate then navigate to review page ───────────────
  const handleShowAttendance = () => {
    if (!session.venue || !session.date || !session.time || !session.subjectName) {
      setFeedback({
        type: 'error',
        message: 'Please fill in all session details (Venue, Subject, Date, Time) before continuing.',
      });
      return;
    }
    // Pass everything through navigation state — no extra API call needed
    navigate('/attendance/review', { state: { session, students } });
  };

  // ── Time normaliser for <input type="time"> ───────────────────────────────
  const to24h = (t) => {
    if (!t) return '';
    if (/^\d{2}:\d{2}$/.test(t)) return t;
    try {
      const d = new Date(`1970-01-01 ${t}`);
      return isNaN(d) ? t : d.toTimeString().slice(0, 5);
    } catch { return t; }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container">
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="spin-animate" style={{ margin: '0 auto 1rem' }} />
          <p>Loading attendance session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Attendance</h1>
            <p className="page-subtitle">Mark student attendance, then review before submitting</p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SESSION HEADER CARD
      ════════════════════════════════════════════════════════════════════ */}
      <div className="card att-session-card" style={{ marginBottom: '1.5rem' }}>
        <div className="att-session-titlebar">
          <div className="att-session-titlebar-left">
            <div className="att-session-dot" />
            <span>Session Details</span>
          </div>
        </div>

        <div className="att-session-grid">
          {/* Venue */}
          <div className="att-session-tile">
            <div className="att-session-tile-header"><MapPin size={14} /><span>Venue</span></div>
            <input
              className="att-session-tile-input"
              type="text"
              value={session.venue}
              onChange={(e) => setSession((p) => ({ ...p, venue: e.target.value }))}
              placeholder="e.g. Lecture Hall – A101"
              aria-label="Venue"
            />
          </div>

          {/* Subject */}
          <div className="att-session-tile">
            <div className="att-session-tile-header"><BookOpen size={14} /><span>Subject Name</span></div>
            <input
              className="att-session-tile-input"
              type="text"
              value={session.subjectName}
              onChange={(e) => setSession((p) => ({ ...p, subjectName: e.target.value }))}
              placeholder="e.g. Data Structures & Algorithms"
              aria-label="Subject Name"
            />
          </div>

          {/* Date */}
          <div className="att-session-tile">
            <div className="att-session-tile-header"><Calendar size={14} /><span>Date</span></div>
            <input
              className="att-session-tile-input"
              type="date"
              value={session.date}
              onChange={(e) => setSession((p) => ({ ...p, date: e.target.value }))}
              aria-label="Date"
            />
          </div>

          {/* Time */}
          <div className="att-session-tile">
            <div className="att-session-tile-header"><Clock size={14} /><span>Time</span></div>
            <input
              className="att-session-tile-input"
              type="time"
              value={to24h(session.time)}
              onChange={(e) => setSession((p) => ({ ...p, time: e.target.value }))}
              aria-label="Time"
            />
          </div>
        </div>
      </div>

      {/* ── Toolbar: chips + bulk buttons ────────────────────────────────── */}
      <div className="att-toolbar">
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="attendance-chip attendance-chip--total">
            <Users size={13} /><span>Total: <strong>{students.length}</strong></span>
          </div>
          <div className="attendance-chip attendance-chip--present">
            <UserCheck size={13} /><span>Present: <strong>{presentCount}</strong></span>
          </div>
          <div className="attendance-chip attendance-chip--absent">
            <UserX size={13} /><span>Absent: <strong>{absentCount}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="attendance-bulk-btn" onClick={() => markAll(true)}>
            Mark All Present
          </button>
          <button
            type="button"
            className="attendance-bulk-btn attendance-bulk-btn--ghost"
            onClick={() => markAll(false)}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* ── Student List ─────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
        {/* Table header */}
        <div className="attendance-table-header">
          <span className="attendance-col-roll">Roll No</span>
          <span className="attendance-col-name">
            <span className="attendance-header-desktop">Student Name</span>
            <span className="attendance-header-mobile">Student Details</span>
          </span>
          <span className="attendance-col-action" style={{ textAlign: 'center' }}>Attendance</span>
        </div>

        {/* Rows */}
        {currentStudents.map((student, index) => (
          <div
            key={student.rollNo}
            className={`attendance-row ${student.present ? 'attendance-row--present' : ''} ${
              index % 2 === 0 ? 'attendance-row--even' : ''
            }`}
          >
            <span className="attendance-col-roll attendance-roll">
              {student.rollNo}
            </span>
            <span className="attendance-col-name">
              <span className="attendance-student-name">{student.name}</span>
              <span className="attendance-roll-mobile">Roll No: {student.rollNo}</span>
            </span>
            <span className="attendance-col-action">
              <button
                type="button"
                className={`attendance-toggle-btn ${
                  student.present ? 'attendance-toggle-btn--present' : 'attendance-toggle-btn--absent'
                }`}
                onClick={() => togglePresent(student.rollNo)}
                title={student.present ? 'Mark as Absent' : 'Mark as Present'}
                aria-label={`${student.present ? 'Present' : 'Absent'} — click to toggle`}
                aria-pressed={student.present}
              >
                {student.present
                  ? <><UserCheck size={15} /> Present</>
                  : <><UserX size={15} /> Absent</>}
              </button>
            </span>
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {startIndex + 1}–{Math.min(endIndex, students.length)} of {students.length} students
            </div>

            <div className="pagination-buttons">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-btn${pageNum === currentPage ? ' active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="pagination-dots">…</span>;
                }
                return null;
              })}

              <button
                type="button"
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="items-per-page">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="items-per-page-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Feedback banner — sits BELOW the student list ────────────────── */}
      {feedback.message && (
        <div
          className={`feedback-banner ${feedback.type === 'error' ? 'feedback-error' : 'feedback-success'}`}
          style={{ marginBottom: '1rem' }}
        >
          <AlertCircle size={18} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingBottom: '2rem',
        }}
      >
        <button
          type="button"
          className="attendance-submit-btn"
          onClick={handleShowAttendance}
        >
          <Eye size={16} />
          Show Attendance
        </button>
      </div>

    </div>
  );
};

export default Attendance;
