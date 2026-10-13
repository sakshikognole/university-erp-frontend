import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const _IS_PROD_SUB = window.location.hostname !== 'localhost';
const NODE_URL = _IS_PROD_SUB ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const Submission = () => {
  const { announcementId } = useParams();
  const navigate = useNavigate();

  const [announcement, setAnnouncement] = useState(null);
  const [file, setFile] = useState(null);
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!announcementId) { setError('No assignment selected.'); setLoading(false); return; }
    fetch(`${NODE_URL}/announcements/single/${announcementId}`)
      .then((r) => r.json())
      .then((d) => { if (!d.announcement) throw new Error('Not found'); setAnnouncement(d.announcement); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [announcementId]);

  useEffect(() => {
    if (!announcementId) return;
    fetch(`${NODE_URL}/submissions/${announcementId}/student/student123`)
      .then((r) => r.json())
      .then((d) => { if (d.submission) { setStudentSubmission(d.submission); setSubmitted(true); } })
      .catch((err) => console.error('Fetch student submission error:', err));
  }, [announcementId]);

  const handleSubmit = async () => {
    setError('');
    if (!file) { setError('Please select a file before submitting.'); return; }
    if (!announcement) { setError('Assignment information is not available.'); return; }
    if (new Date() > new Date(announcement.deadline)) { setError('Submission deadline has passed.'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('student', 'student123');
      formData.append('file', file);
      const res = await fetch(`${NODE_URL}/submissions/${announcementId}/submit`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setStudentSubmission(data.submission);
      setSubmitted(true);
      setFile(null);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p className="stu-info-text">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error && !announcement) {
    return (
      <div className="page-container">
        <div className="books-alert books-alert-error"><span>{error}</span></div>
      </div>
    );
  }

  return (
    <div className="page-container">

      {/* Header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Assignment Submission</h1>
          <p className="page-subtitle">Submit your assignment for the selected announcement</p>
        </div>
        <button className="books-btn books-btn-ghost" onClick={() => navigate(-1)}>← Back</button>
      </div>

      {/* Assignment Details Card */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>{announcement.title}</h2>
            <span className="code-badge" style={{ marginTop: 4, display: 'inline-block' }}>{announcement.subject}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
            {new Date(announcement.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p style={{ color: '#374151', fontSize: '0.875rem', margin: '0.5rem 0 0.75rem' }}>{announcement.description}</p>
        <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>
          Deadline: <strong style={{ color: '#111827' }}>
            {new Date(announcement.deadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </strong>
        </p>
      </div>

      {/* Submission Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Your Submission</h2>

        {submitted || studentSubmission ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>Assignment Submitted</span>
            </div>
            {studentSubmission && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Submitted At: <strong>{new Date(studentSubmission.submittedAt).toLocaleString('en-IN')}</strong>
                </p>
                <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Status: <span className="code-badge">{studentSubmission.status}</span>
                </p>
                <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Marks: <strong>{studentSubmission.marks != null ? studentSubmission.marks : 'Not evaluated yet'}</strong>
                </p>
                <div style={{ marginTop: 8 }}>
                  <a href={studentSubmission.file} target="_blank" rel="noopener noreferrer" className="books-btn books-btn-ghost books-btn-sm">
                    View Submitted File
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="books-form-group">
              <label className="books-form-label">Upload Assignment</label>
              <input type="file" className="books-form-control" onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setError(''); } }} />
            </div>
            {file && (
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Selected: <strong>{file.name}</strong>
              </p>
            )}
            {error && (
              <div className="books-alert books-alert-error" style={{ marginBottom: '0.75rem' }}>
                <span>{error}</span>
              </div>
            )}
            <button className="books-btn books-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Submission;
