import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  UserCheck,
  UserX,
  Users,
  Download,
  Send,
  RotateCcw,
} from 'lucide-react';

const _IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const AttendanceReview = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Data passed from Attendance.jsx via navigate state ───────────────────
  const { session, students } = location.state || {};

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [feedback, setFeedback]     = useState({ type: '', message: '' });
  const [submitResult, setSubmitResult] = useState(null);

  // Guard: if someone lands here directly without state, send them back
  if (!session || !students) {
    return (
      <div className="page-container">
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
          <p style={{ marginBottom: '1rem' }}>No attendance data found.</p>
          <button
            type="button"
            className="attendance-submit-btn"
            onClick={() => navigate('/attendance')}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const presentStudents = students.filter((s) => s.present);
  const absentCount     = students.length - presentStudents.length;

  // ── Submit to backend ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...session, students }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit attendance');
      setSubmitResult(data);
      setSubmitted(true);
      setFeedback({ type: 'success', message: 'Attendance submitted successfully.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Export present students as .txt ───────────────────────────────────────
  const handleExport = () => {
    const list = submitResult ? submitResult.presentStudents : presentStudents;

    const lines = [
      '============================================================',
      '              ATTENDANCE REPORT — PRESENT STUDENTS',
      '============================================================',
      `Venue       : ${session.venue}`,
      `Date        : ${session.date}`,
      `Time        : ${session.time}`,
      `Subject     : ${session.subjectName}`,
      '------------------------------------------------------------',
      `Total Students : ${students.length}`,
      `Present        : ${list.length}`,
      `Absent         : ${students.length - list.length}`,
      '------------------------------------------------------------',
      '',
      'Roll No       Name',
      '------------------------------------------------------------',
      ...list.map((s) => `${s.rollNo.padEnd(14)}${s.name}`),
      '',
      '============================================================',
      `Generated on : ${new Date().toLocaleString()}`,
      '============================================================',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `attendance_${session.subjectName.replace(/\s+/g, '_')}_${session.date}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 150);
  };

  return (
    <div className="page-container">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/attendance')}
            title="Back to Attendance"
            disabled={submitted}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Review Attendance</h1>
            <p className="page-subtitle">
              Verify the present students below, then submit to save the record
            </p>
          </div>
        </div>
      </div>

      {/* ── Session summary card ─────────────────────────────────────────── */}
      <div className="card att-session-card" style={{ marginBottom: '1.5rem' }}>
        <div className="att-session-titlebar">
          <div className="att-session-titlebar-left">
            <div className="att-session-dot" />
            <span>Session Details</span>
          </div>
          {submitted && (
            <span className="att-submitted-badge">
              <CheckCircle2 size={12} /> Submitted
            </span>
          )}
        </div>

        {/* Read-only info tiles */}
        <div className="att-session-grid">
          <div className="att-session-tile att-session-tile--locked">
            <div className="att-session-tile-header"><MapPin size={14} /><span>Venue</span></div>
            <p className="att-review-value">{session.venue}</p>
          </div>
          <div className="att-session-tile att-session-tile--locked">
            <div className="att-session-tile-header"><BookOpen size={14} /><span>Subject Name</span></div>
            <p className="att-review-value">{session.subjectName}</p>
          </div>
          <div className="att-session-tile att-session-tile--locked">
            <div className="att-session-tile-header"><Calendar size={14} /><span>Date</span></div>
            <p className="att-review-value">{session.date}</p>
          </div>
          <div className="att-session-tile att-session-tile--locked">
            <div className="att-session-tile-header"><Clock size={14} /><span>Time</span></div>
            <p className="att-review-value">{session.time}</p>
          </div>
        </div>
      </div>

      {/* ── Summary chips ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div className="attendance-chip attendance-chip--total">
          <Users size={13} /><span>Total: <strong>{students.length}</strong></span>
        </div>
        <div className="attendance-chip attendance-chip--present">
          <UserCheck size={13} /><span>Present: <strong>{presentStudents.length}</strong></span>
        </div>
        <div className="attendance-chip attendance-chip--absent">
          <UserX size={13} /><span>Absent: <strong>{absentCount}</strong></span>
        </div>
      </div>

      {/* ── Present students list ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden' }}>

        {/* Table header */}
        <div className="attendance-table-header">
          <span className="attendance-col-index">#</span>
          <span className="attendance-col-roll">Roll No</span>
          <span className="attendance-col-name">
            <span className="attendance-header-desktop">Student Name</span>
            <span className="attendance-header-mobile">Student Details</span>
          </span>
          <span className="attendance-col-action" style={{ textAlign: 'center' }}>Status</span>
        </div>

        {presentStudents.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
            }}
          >
            <UserX size={28} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
            No students marked present. Go back and mark attendance.
          </div>
        ) : (
          presentStudents.map((student, index) => (
            <div
              key={student.rollNo}
              className={`attendance-row attendance-row--present ${
                index % 2 === 0 ? 'attendance-row--even' : ''
              }`}
            >
              <span className="attendance-col-index attendance-review-index">
                {index + 1}
              </span>
              <span className="attendance-col-roll attendance-roll">
                {student.rollNo}
              </span>
              <span className="attendance-col-name">
                <span className="attendance-student-name">{student.name}</span>
                <span className="attendance-roll-mobile">
                  #{index + 1} • Roll No: {student.rollNo}
                </span>
              </span>
              <span className="attendance-col-action">
                <span className="att-present-pill">
                  <CheckCircle2 size={13} /> Present
                </span>
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── Feedback banner — below the list ─────────────────────────────── */}
      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ marginBottom: '1rem' }}
        >
          {feedback.type === 'success'
            ? <CheckCircle2 size={18} />
            : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          paddingBottom: '2rem',
        }}
      >
        {/* Export — always available */}
        <button
          type="button"
          className="attendance-export-btn"
          onClick={handleExport}
          title="Export present students as .txt"
        >
          <Download size={16} />
          Export Present (.txt)
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {submitted ? (
            /* After submit — offer to start a new session */
            <button
              type="button"
              className="attendance-reset-btn"
              onClick={() => navigate('/attendance')}
            >
              <RotateCcw size={16} />
              Start New Session
            </button>
          ) : (
            /* Before submit */
            <button
              type="button"
              className="attendance-submit-btn"
              onClick={handleSubmit}
              disabled={submitting || presentStudents.length === 0}
            >
              {submitting ? (
                <><Loader2 size={16} className="spin-animate" /> Submitting…</>
              ) : (
                <><Send size={16} /> Submit Attendance</>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default AttendanceReview;
