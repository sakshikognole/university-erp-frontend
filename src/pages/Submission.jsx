import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const _IS_PROD_SUB = window.location.hostname !== 'localhost';
const NODE_URL = _IS_PROD_SUB ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const Submission = () => {
  const { announcementId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentStudent = user?.username || user?.email || user?.prn || 'student123';

  // State for single announcement submission mode
  const [announcement, setAnnouncement] = useState(null);
  const [file, setFile] = useState(null);
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for submissions list mode (when no announcementId)
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. If announcementId is present, fetch single announcement; otherwise fetch all announcements
  useEffect(() => {
    if (!announcementId) {
      // List mode
      setLoading(true);
      fetch(`${NODE_URL}/announcements`)
        .then((r) => r.json())
        .then((d) => {
          setAnnouncementsList(d.announcements || []);
        })
        .catch((err) => setError(err.message || 'Failed to load assignments'))
        .finally(() => setLoading(false));
      return;
    }

    // Single assignment mode
    setLoading(true);
    setError('');
    fetch(`${NODE_URL}/announcements/single/${announcementId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.announcement) throw new Error('Assignment not found');
        setAnnouncement(d.announcement);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [announcementId]);

  // Fetch student submission for this announcement
  useEffect(() => {
    if (!announcementId) return;
    fetch(`${NODE_URL}/submissions/${announcementId}/student/${currentStudent}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.submission) {
          setStudentSubmission(d.submission);
          setSubmitted(true);
        } else {
          setStudentSubmission(null);
          setSubmitted(false);
        }
      })
      .catch((err) => console.error('Fetch student submission error:', err));
  }, [announcementId, currentStudent]);

  const handleSubmit = async () => {
    setError('');
    if (!file) { setError('Please select a file before submitting.'); return; }
    if (!announcement) { setError('Assignment information is not available.'); return; }
    if (new Date() > new Date(announcement.deadline)) { setError('Submission deadline has passed.'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('student', currentStudent);
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

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcementsList;
    const q = searchQuery.toLowerCase();
    return announcementsList.filter(
      (a) =>
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.subject && a.subject.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q))
    );
  }, [announcementsList, searchQuery]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p className="stu-info-text">Loading...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MODE 1: All Submissions List (when no ID)
  // ==========================================
  if (!announcementId) {
    return (
      <div className="page-container">
        {/* Header */}
        <div className="books-page-header">
          <div>
            <h1 className="page-title">Submissions</h1>
            <p className="page-subtitle">View active assignments, check submission deadlines, and submit your work</p>
          </div>
        </div>

        {error && (
          <div className="books-alert books-alert-error" style={{ marginBottom: '1.25rem' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by assignment title or subject..."
              className="books-form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            {searchQuery && (
              <button
                className="books-btn books-btn-ghost books-btn-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Assignments Cards List */}
        {filteredAnnouncements.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <FileText size={48} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
              No assignments available
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {searchQuery ? 'No assignments match your search query.' : 'There are currently no assignments or announcements posted.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredAnnouncements.map((ann) => {
              const isPastDeadline = ann.deadline && new Date() > new Date(ann.deadline);
              return (
                <div
                  key={ann._id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span className="code-badge" style={{ fontSize: '0.75rem' }}>
                        {ann.subject || 'General'}
                      </span>
                      {isPastDeadline ? (
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>
                          Deadline Passed
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>
                          Active
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
                      {ann.title}
                    </h3>

                    {ann.description && (
                      <p style={{ color: '#4b5563', fontSize: '0.875rem', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                        {ann.description.length > 140 ? `${ann.description.slice(0, 140)}...` : ann.description}
                      </p>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                      <Clock size={14} />
                      <span>
                        Deadline: <strong style={{ color: '#1f2937' }}>
                          {ann.deadline ? new Date(ann.deadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No deadline'}
                        </strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="books-btn books-btn-primary books-btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => navigate(`/submissions/${ann._id}`)}
                      >
                        {isPastDeadline ? 'View Submission / Details' : 'Submit Assignment'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // MODE 2: Single Assignment Submission View
  // ==========================================
  if (error && !announcement) {
    return (
      <div className="page-container">
        <div className="books-page-header">
          <button className="btn-back" onClick={() => navigate('/submissions')} title="Back to Submissions">
            <ArrowLeft size={18} />
          </button>
        </div>
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
        <button className="btn-back" onClick={() => navigate('/submissions')} title="Back to Submissions">
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Assignment Details Card */}
      {announcement && (
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
      )}

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
