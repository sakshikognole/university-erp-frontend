import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const _IS_PROD_ANN = window.location.hostname !== 'localhost';
const NODE_URL = _IS_PROD_ANN ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const Announcements = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [editingDeadlineId, setEditingDeadlineId] = useState(null);
  const [editingDeadline, setEditingDeadline] = useState('');
  const [updatingDeadline, setUpdatingDeadline] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [marksInput, setMarksInput] = useState({});
  const [savingMarksId, setSavingMarksId] = useState(null);

  useEffect(() => {
    fetch(`${NODE_URL}/announcements`)
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.announcements || []))
      .catch((err) => console.error('Error fetching announcements:', err));
  }, []);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const handlePublish = async () => {
    setSuccess(''); setError('');
    if (!subject || !title || !description || !deadline) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${NODE_URL}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, subject, teacher: 'teacher123', deadline }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create announcement');
      setAnnouncements((prev) => [data.announcement, ...prev]);
      setSubject(''); setTitle(''); setDescription(''); setDeadline('');
      setSuccess('Announcement published successfully!');
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleUpdateDeadline = async () => {
    setSuccess(''); setError('');
    if (!editingDeadline) { setError('Please select a deadline.'); return; }
    setUpdatingDeadline(true);
    try {
      const res = await fetch(`${NODE_URL}/announcements/${editingDeadlineId}/deadline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: editingDeadline }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update deadline');
      setAnnouncements((prev) => prev.map((a) => a._id === editingDeadlineId ? data.announcement : a));
      setEditingDeadlineId(null); setEditingDeadline('');
      setSuccess('Deadline updated successfully!');
    } catch (err) { setError(err.message); }
    finally { setUpdatingDeadline(false); }
  };

  const handleViewSubmissions = async (announcementId) => {
    if (viewingSubmissionsId === announcementId) { setViewingSubmissionsId(null); setSubmissions([]); return; }
    setLoadingSubmissions(true); setError('');
    try {
      const res = await fetch(`${NODE_URL}/submissions/${announcementId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch submissions');
      setSubmissions(data.submissions || []);
      setViewingSubmissionsId(announcementId);
      const existingMarks = {};
      (data.submissions || []).forEach((s) => { if (s.marks != null) existingMarks[s._id] = s.marks; });
      setMarksInput(existingMarks);
    } catch (err) { setError(err.message); }
    finally { setLoadingSubmissions(false); }
  };

  const handleSaveMarks = async (submissionId) => {
    const marks = marksInput[submissionId];
    if (marks === undefined || marks === '') { setError('Please enter marks.'); return; }
    if (Number(marks) < 0) { setError('Marks cannot be negative.'); return; }
    setSavingMarksId(submissionId); setError(''); setSuccess('');
    try {
      const res = await fetch(`${NODE_URL}/submissions/${submissionId}/marks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks: Number(marks) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save marks');
      setSubmissions((prev) => prev.map((s) => s._id === submissionId ? { ...s, marks: data.submission.marks } : s));
      setSuccess('Marks saved successfully!');
    } catch (err) { setError(err.message); }
    finally { setSavingMarksId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await fetch(`${NODE_URL}/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete');
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      setSuccess('Announcement deleted successfully!');
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page-container">

      {/* Header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Manage and publish assignment announcements</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={() => { setShowForm(!showForm); setSuccess(''); setError(''); }}>
          + New Announcement
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

      {/* Create Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>
            Create New Announcement
          </h2>
          <div className="books-form-group">
            <label className="books-form-label">Subject *</label>
            <select className="books-form-control" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Select Subject</option>
              <option value="Database Management System">Database Management System</option>
              <option value="Operating System">Operating System</option>
              <option value="Computer Networks">Computer Networks</option>
              <option value="Data Structures">Data Structures</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
            </select>
          </div>
          <div className="books-form-group">
            <label className="books-form-label">Title *</label>
            <input className="books-form-control" type="text" placeholder="Enter announcement title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="books-form-group">
            <label className="books-form-label">Description *</label>
            <textarea className="books-form-control" placeholder="Write your announcement..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div className="books-form-group">
            <label className="books-form-label">Submission Deadline *</label>
            <input className="books-form-control" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="books-modal-foot" style={{ padding: 0, marginTop: '1rem' }}>
            <button className="books-btn books-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="books-btn books-btn-primary" onClick={handlePublish} disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p className="stu-info-text">No announcements yet. Click "+ New Announcement" to get started.</p>
        </div>
      ) : (
        announcements.map((ann) => (
          <div className="card" key={ann._id} style={{ marginBottom: '1rem', padding: '1.25rem' }}>

            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>{ann.title}</h2>
                <span className="code-badge" style={{ marginTop: 4, display: 'inline-block' }}>{ann.subject}</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <p style={{ color: '#374151', fontSize: '0.875rem', margin: '0.5rem 0 0.75rem' }}>{ann.description}</p>

            {/* Deadline / Edit Deadline */}
            {editingDeadlineId === ann._id ? (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem' }}>
                <div className="books-form-group">
                  <label className="books-form-label">New Deadline</label>
                  <input className="books-form-control" type="datetime-local" value={editingDeadline} onChange={(e) => setEditingDeadline(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="books-btn books-btn-ghost books-btn-sm" onClick={() => { setEditingDeadlineId(null); setEditingDeadline(''); }} disabled={updatingDeadline}>Cancel</button>
                  <button className="books-btn books-btn-primary books-btn-sm" onClick={handleUpdateDeadline} disabled={updatingDeadline}>
                    {updatingDeadline ? 'Saving...' : 'Save Deadline'}
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Deadline: <strong style={{ color: '#111827' }}>
                  {new Date(ann.deadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </strong>
              </p>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="books-btn books-btn-sm books-btn-ghost" onClick={() => { setEditingDeadlineId(ann._id); setEditingDeadline(formatDateTimeLocal(ann.deadline)); }}>Edit Deadline</button>
              <button className="books-btn books-btn-sm books-btn-ghost" onClick={() => navigate(`/submission/${ann._id}`)}>View Assignment</button>
              <button className="books-btn books-btn-sm books-btn-ghost" onClick={() => handleViewSubmissions(ann._id)}>
                {viewingSubmissionsId === ann._id ? 'Hide Submissions' : 'View Submissions'}
              </button>
              <button className="books-btn books-btn-sm books-btn-danger" onClick={() => handleDelete(ann._id)}>Delete</button>
            </div>

            {/* Submissions Section */}
            {viewingSubmissionsId === ann._id && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#111827' }}>Student Submissions</h3>
                {loadingSubmissions ? (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading submissions...</p>
                ) : submissions.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No students have submitted this assignment yet.</p>
                ) : (
                  <div className="books-table-wrap">
                    <table className="books-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Submitted at</th>
                          <th>Status</th>
                          <th>Marks</th>
                          <th>File</th>
                          <th>Save marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub) => (
                          <tr key={sub._id}>
                            <td style={{ fontWeight: 600 }}>{sub.student}</td>
                            <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(sub.submittedAt).toLocaleString('en-IN')}</td>
                            <td><span className="code-badge">{sub.status}</span></td>
                            <td>{sub.marks != null ? sub.marks : '—'}</td>
                            <td>
                              <a href={sub.file} target="_blank" rel="noopener noreferrer" className="books-btn books-btn-sm books-btn-ghost">View File</a>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input
                                  type="number" min="0" placeholder="Marks"
                                  value={marksInput[sub._id] ?? ''}
                                  onChange={(e) => setMarksInput((prev) => ({ ...prev, [sub._id]: e.target.value }))}
                                  className="books-form-control"
                                  style={{ width: 80, padding: '4px 8px' }}
                                />
                                <button className="books-btn books-btn-sm books-btn-primary" onClick={() => handleSaveMarks(sub._id)} disabled={savingMarksId === sub._id}>
                                  {savingMarksId === sub._id ? '...' : 'Save'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Announcements;
