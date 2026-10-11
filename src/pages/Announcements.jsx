import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const _IS_PROD_ANN = window.location.hostname !== 'localhost';
const NODE_URL = _IS_PROD_ANN ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const Announcements = () => {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachment, setAttachment] = useState(null);

  const [editingDeadlineId, setEditingDeadlineId] = useState(null);
  const [editingDeadline, setEditingDeadline] = useState('');
  const [updatingDeadline, setUpdatingDeadline] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  useEffect(() => {
    fetch(`${NODE_URL}/announcements`)
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements(data.announcements);
      })
      .catch((err) => {
        console.error('Error fetching announcements:', err);
      });
  }, []);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [marksInput, setMarksInput] = useState({});
  const [savingMarksId, setSavingMarksId] = useState(null);

  const handlePublish = async () => {
    setMessage('');
    setError('');
    if (!subject || !title || !description || !deadline) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${NODE_URL}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, subject, teacher: 'teacher123', deadline }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create announcement');
      setAnnouncements((prev) => [data.announcement, ...prev]);
      setSubject(''); setTitle(''); setDescription(''); setDeadline(''); setAttachment(null);
      setMessage('Announcement published successfully!');
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
  };

  const handleEditDeadline = (announcement) => {
    setMessage(''); setError('');
    setEditingDeadlineId(announcement._id);
    setEditingDeadline(formatDateTimeLocal(announcement.deadline));
  };

  const handleUpdateDeadline = async () => {
    setMessage(''); setError('');
    if (!editingDeadline) { setError('Please select a deadline.'); return; }
    setUpdatingDeadline(true);
    try {
      const response = await fetch(`${NODE_URL}/announcements/${editingDeadlineId}/deadline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: editingDeadline }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update deadline');
      setAnnouncements((prev) =>
        prev.map((a) => a._id === editingDeadlineId ? data.announcement : a)
      );
      setEditingDeadlineId(null); setEditingDeadline('');
      setMessage('Deadline updated successfully!');
    } catch (err) {
      console.error(err); setError(err.message);
    } finally {
      setUpdatingDeadline(false);
    }
  };

  const handleViewSubmissions = async (announcementId) => {
    if (viewingSubmissionsId === announcementId) {
      setViewingSubmissionsId(null); setSubmissions([]); return;
    }
    setLoadingSubmissions(true); setError('');
    try {
      const response = await fetch(`${NODE_URL}/submissions/${announcementId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch submissions');
      setSubmissions(data.submissions || []);
      setViewingSubmissionsId(announcementId);
      const existingMarks = {};
      (data.submissions || []).forEach((s) => {
        if (s.marks !== null && s.marks !== undefined) existingMarks[s._id] = s.marks;
      });
      setMarksInput(existingMarks);
    } catch (err) {
      console.error(err); setError(err.message);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSaveMarks = async (submissionId) => {
    const marks = marksInput[submissionId];
    if (marks === undefined || marks === '') { setError('Please enter marks.'); return; }
    if (Number(marks) < 0) { setError('Marks cannot be negative.'); return; }
    setSavingMarksId(submissionId); setError(''); setMessage('');
    try {
      const response = await fetch(`${NODE_URL}/submissions/${submissionId}/marks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks: Number(marks) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save marks');
      setSubmissions((prev) =>
        prev.map((s) => s._id === submissionId ? { ...s, marks: data.submission.marks } : s)
      );
      setMessage('Marks saved successfully!');
    } catch (err) {
      console.error(err); setError(err.message);
    } finally {
      setSavingMarksId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${NODE_URL}/announcements/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete announcement');
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      setMessage('Announcement deleted successfully!');
    } catch (err) {
      console.error(err); setError(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Announcements</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setMessage(''); setError(''); }}>
          + New Announcement
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="card announcement-form">
          <h2>Create New Announcement</h2>
          <div className="form-group">
            <label>Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Select Subject</option>
              <option value="Database Management System">Database Management System</option>
              <option value="Operating System">Operating System</option>
              <option value="Computer Networks">Computer Networks</option>
            </select>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input type="text" placeholder="Enter announcement title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea placeholder="Write your announcement..." rows="4" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Submission Deadline</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Attach File</label>
            <input type="file" onChange={(e) => { const f = e.target.files[0]; if (f) { setAttachment(f); setError(''); } }} />
            {attachment && (
              <div className="selected-file">
                <span>Selected file: <strong>{attachment.name}</strong></span>
                <button type="button" className="btn btn-secondary" onClick={() => setAttachment(null)}>Remove</button>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePublish} disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      )}

      <div className="announcement-list">
        {announcements.map((announcement) => (
          <div className="card announcement-card" key={announcement._id}>
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
              {editingDeadlineId === announcement._id ? (
                <div className="deadline-edit">
                  <div className="form-group">
                    <label>New Deadline</label>
                    <input type="datetime-local" value={editingDeadline} onChange={(e) => setEditingDeadline(e.target.value)} />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => { setEditingDeadlineId(null); setEditingDeadline(''); }} disabled={updatingDeadline}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleUpdateDeadline} disabled={updatingDeadline}>
                      {updatingDeadline ? 'Saving...' : 'Save Deadline'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span>Deadline: <strong>{new Date(announcement.deadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong></span>
                  <div>
                    <button className="btn btn-secondary" onClick={() => handleEditDeadline(announcement)}>Edit Deadline</button>
                    <button className="btn btn-primary" onClick={() => navigate(`/submission/${announcement._id}`)}>View Assignment</button>
                    <button className="btn btn-secondary" onClick={() => handleViewSubmissions(announcement._id)}>
                      {viewingSubmissionsId === announcement._id ? 'Hide Submissions' : 'View Submissions'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {viewingSubmissionsId === announcement._id && (
              <div className="submissions-section">
                <h3>Student Submissions</h3>
                {loadingSubmissions ? <p>Loading submissions...</p> : submissions.length === 0 ? (
                  <p>No students have submitted this assignment yet.</p>
                ) : (
                  <div className="submissions-list">
                    {submissions.map((submission) => (
                      <div key={submission._id} className="submission-item">
                        <div className="submission-details">
                          <h4>{submission.student}</h4>
                          <p>Submitted: {new Date(submission.submittedAt).toLocaleString('en-IN')}</p>
                          <p>Status: <strong>{submission.status}</strong></p>
                          <p>Current Marks: <strong>{submission.marks !== null && submission.marks !== undefined ? submission.marks : 'Not evaluated yet'}</strong></p>
                        </div>
                        <div className="submission-actions">
                          <a href={submission.file} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">View Submitted File</a>
                          <input type="number" min="0" placeholder="Enter marks" value={marksInput[submission._id] ?? ''} onChange={(e) => setMarksInput((prev) => ({ ...prev, [submission._id]: e.target.value }))} />
                          <button className="btn btn-primary" onClick={() => handleSaveMarks(submission._id)} disabled={savingMarksId === submission._id}>
                            {savingMarksId === submission._id ? 'Saving...' : 'Save Marks'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className="btn btn-danger" onClick={() => { if (window.confirm('Are you sure you want to delete this announcement?')) handleDelete(announcement._id); }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
