import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const _IS_PROD_SUB = window.location.hostname !== 'localhost';
const NODE_URL = _IS_PROD_SUB ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const Submission = () => {
  const { announcementId } = useParams();

  const [announcement, setAnnouncement] = useState(null);
  const [file, setFile] = useState(null);
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!announcementId) {
      setError('No assignment selected.');
      setLoading(false);
      return;
    }
    const fetchAnnouncement = async () => {
      try {
        const response = await fetch(`${NODE_URL}/announcements/single/${announcementId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch announcement');
        setAnnouncement(data.announcement);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncement();
  }, [announcementId]);

  useEffect(() => {
    if (!announcementId) return;
    const fetchStudentSubmission = async () => {
      try {
        const response = await fetch(`${NODE_URL}/submissions/${announcementId}/student/student123`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch your submission');
        setStudentSubmission(data.submission);
        if (data.submission) setSubmitted(true);
      } catch (err) {
        console.error('Fetch student submission error:', err);
      }
    };
    fetchStudentSubmission();
  }, [announcementId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) { setFile(selectedFile); setError(''); }
  };

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
      const response = await fetch(`${NODE_URL}/submissions/${announcementId}/submit`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Submission failed');
      setStudentSubmission(data.submission);
      setSubmitted(true);
      setFile(null);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><p>Loading assignment...</p></div>;
  }

  if (error && !announcement) {
    return <div className="page-container"><div className="error-message">{error}</div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assignment Submission</h1>
          <p className="subject-name">{announcement.subject}</p>
        </div>
      </div>

      <div className="card announcement-card">
        <div className="announcement-header">
          <div>
            <h2>{announcement.title}</h2>
            <p className="subject-name">{announcement.subject}</p>
          </div>
          <span className="announcement-date">
            {new Date(announcement.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p>{announcement.description}</p>
        <div className="announcement-footer">
          <span>Deadline: <strong>{new Date(announcement.deadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong></span>
        </div>
      </div>

      <div className="card submission-card">
        <h2>Your Submission</h2>
        {submitted || studentSubmission ? (
          <div className="submission-success">
            <h3>✓ Assignment Submitted</h3>
            <p>Your assignment has been submitted successfully.</p>
            {studentSubmission && (
              <>
                <p>Submitted At: <strong>{new Date(studentSubmission.submittedAt).toLocaleString('en-IN')}</strong></p>
                <p>Status: <strong>{studentSubmission.status}</strong></p>
                <p>Marks: <strong>{studentSubmission.marks !== null && studentSubmission.marks !== undefined ? studentSubmission.marks : 'Not evaluated yet'}</strong></p>
                <div className="form-actions">
                  <a href={studentSubmission.file} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">View Submitted File</a>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Upload Assignment</label>
              <input type="file" onChange={handleFileChange} />
            </div>
            {file && <div className="selected-file"><p>Selected file: <strong> {file.name}</strong></p></div>}
            {error && <p className="error-message">{error}</p>}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Submission;
