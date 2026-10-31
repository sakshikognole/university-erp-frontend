import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const _IS_PROD_AR = window.location.hostname !== 'localhost';
const NODE_URL = _IS_PROD_AR ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

// Mobile accordion card
function ResMobCard({ res, num, nodeUrl, onDelete, expanded, onToggle }) {
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const openFile = async () => {
    const url = res.fileUrl.startsWith('/api') ? `${nodeUrl.replace('/api','')}${res.fileUrl}` : res.fileUrl;
    try {
      const resp = await fetch(url);
      if (!resp.ok) { alert('File not available. Please delete this entry and re-upload the file.'); }
      else { window.open(url, '_blank'); }
    } catch { alert('Could not open file. Please try again.'); }
  };
  return (
    <div className="mob-card">
      <button type="button" className="mob-card-header" onClick={onToggle} aria-expanded={expanded}>
        <div className="mob-card-summary">
          <span className="mob-card-num">{num}</span>
          <div className="mob-card-title-wrap">
            <span className="mob-card-title">{res.title}</span>
            <span className="mob-card-sub">{res.subject}</span>
          </div>
        </div>
        <span className="mob-card-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mob-card-details">
          <div className="mob-card-row"><span className="mob-card-label">Title</span><span className="mob-card-value">{res.title}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Subject</span><span className="mob-card-value mono">{res.subject}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Uploaded on</span><span className="mob-card-value">{fmtDate(res.createdAt)}</span></div>
          <div className="mob-card-actions">
            <button className="books-btn books-btn-sm books-btn-ghost" onClick={openFile}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Open</span></button>
            <button className="books-btn books-btn-sm books-btn-danger" onClick={() => onDelete(res)}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg><span className="action-label">Delete</span></span></button>
          </div>
        </div>
      )}
    </div>
  );
}
const AcademicResources = () => {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');
  const [resExpanded, setResExpanded] = useState(null);
  const [error, setError] = useState('');
  const [delRes, setDelRes] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchResources(); }, []);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const fetchResources = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${NODE_URL}/resources`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch resources');
      setResources(data.resources || []);
    } catch (err) { setError(err.message); }
    finally { setFetching(false); }
  };

  const handleUpload = async () => {
    setSuccess(''); setError('');
    if (!subject || !title || !file) { setError('Please fill in all fields and choose a file.'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('title', title);
      formData.append('file', file);
      const res = await fetch(`${NODE_URL}/resources`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload resource');
      setResources((prev) => [data.resource, ...prev]);
      setSubject(''); setTitle(''); setFile(null);
      const fi = document.getElementById('ar-file');
      if (fi) fi.value = '';
      setSuccess('Academic resource uploaded successfully!');
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = (res) => {
    setDelRes(res);
  };

  const confirmDelete = async () => {
    if (!delRes) return;
    setDeleting(true);
    try {
      const res = await fetch(`${NODE_URL}/resources/${delRes._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete resource');
      setResources((prev) => prev.filter((r) => r._id !== delRes._id));
      setSuccess('Academic resource deleted successfully!');
      setDelRes(null);
    } catch (err) { setError(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="page-container">

      {/* Header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Academic Resources</h1>
          <p className="page-subtitle">Upload and manage study materials for your subjects</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={() => { setShowForm(!showForm); setSuccess(''); setError(''); }}>
          + Upload Resource
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

      {/* Upload Form — Modal */}
      {showForm && (
        <div className="books-overlay">
          <div className="books-modal" style={{ maxWidth: 520 }}>
            <div className="books-modal-head">
              <h3>Upload Academic Resource</h3>
              <button className="books-modal-close" onClick={() => { setShowForm(false); setSubject(''); setTitle(''); setFile(null); }}>x</button>
            </div>
            <div className="books-modal-body">
              <div className="club-form-row">
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
                  <label className="books-form-label">Resource Title *</label>
                  <input className="books-form-control" type="text" placeholder="Enter resource title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Upload File * (.pdf, .doc, .docx, .ppt, .pptx)</label>
                <input id="ar-file" className="books-form-control" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setError(''); } }} />
                {file && (
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>
                    {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    <button type="button" onClick={() => { setFile(null); const fi = document.getElementById('ar-file'); if (fi) fi.value = ''; }}
                      style={{ marginLeft: 8, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem' }}>
                      Remove
                    </button>
                  </p>
                )}
              </div>
            </div>
            <div className="books-modal-foot">
              <button className="books-btn books-btn-ghost" onClick={() => { setShowForm(false); setSubject(''); setTitle(''); setFile(null); }}>Cancel</button>
              <button className="books-btn books-btn-primary" onClick={handleUpload} disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Resource'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resources List */}
      {fetching ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p className="stu-info-text">Loading academic resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</p>
          <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>No Academic Resources Yet</h3>
          <p className="stu-info-text">Upload study materials, notes, and presentations for your subjects.</p>
          <button className="books-btn books-btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
            + Upload First Resource
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="res-desk-table">
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Title</th>
                  <th>Subject</th>
                  <th style={{ width: 120 }}>Uploaded on</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res, i) => (
                  <tr key={res._id}>
                    <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={15} style={{ color: '#6b7280', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: '#111827' }}>{res.title}</span>
                      </div>
                    </td>
                    <td><span className="code-badge">{res.subject}</span></td>
                    <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      {new Date(res.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div className="books-actions">
        <button
                          className="books-btn books-btn-sm books-btn-ghost"
                          onClick={async () => {
                            const url = res.fileUrl.startsWith('/api')
                              ? `${NODE_URL.replace('/api','')}${res.fileUrl}`
                              : res.fileUrl;
                            try {
                              const resp = await fetch(url);
                              if (!resp.ok) {
                                alert('File not available. Please delete this entry and re-upload the file.');
                              } else {
                                window.open(url, '_blank');
                              }
                            } catch {
                              alert('Could not open file. Please try again.');
                            }
                          }}
                        >Open</button>
                        <button className="books-btn books-btn-sm books-btn-danger" onClick={() => handleDelete(res)}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
          <div className="res-mob-list">
            {resources.map((res, i) => (
              <ResMobCard
                key={res._id}
                res={res}
                num={i + 1}
                nodeUrl={NODE_URL}
                onDelete={handleDelete}
                expanded={resExpanded === res._id}
                onToggle={() => setResExpanded(prev => prev === res._id ? null : res._id)}
              />
            ))}
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!delRes}
        title="Delete Academic Resource"
        description="Are you sure you want to delete this academic resource? This action will permanently remove the record."
        itemName={delRes?.title}
        itemSubtext={delRes?.subject ? `Subject: ${delRes.subject}` : 'Academic Resource'}
        itemBadge={delRes?.subject}
        onConfirm={confirmDelete}
        onCancel={() => setDelRes(null)}
        loading={deleting}
      />
    </div>
  );
};

export default AcademicResources;
