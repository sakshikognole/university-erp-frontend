/**
 * SystemAnnouncementForm.jsx — Add / Edit System Announcement
 *
 * Fixes applied:
 *   D1/D2  Title validation (Add + Edit) using shared validateAnnouncementTitle
 *   D3     Cloudinary upload — same cloudinaryUpload.js used by other modules;
 *          the error is caused by missing VITE_ env vars — see cloudinaryUpload.js
 *          comments and the manual-config note in the final report.
 *          File-type validation (ALLOWED_TYPES) and progress indicator added.
 *   D4     10 MB file-size guard shown inline below the upload area (was already
 *          coded; now also shows a field-level error, not just a top banner)
 *   UI-1   Cancel button mobile layout fixed via sa-form-actions CSS class
 *   UI-4   Cancel button in Edit also fixed by the same class
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  FileText,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { validateAnnouncementTitle } from '../utils/announcementValidation';

const _IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const SystemAnnouncementForm = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isEdit    = Boolean(id);

  // ── auth ─────────────────────────────────────────────────────────────────
  const authHeader = (isJson = true) => {
    const token = localStorage.getItem('erp_token');
    const h = { Authorization: `Bearer ${token}` };
    if (isJson) h['Content-Type'] = 'application/json';
    return h;
  };

  // ── form state ────────────────────────────────────────────────────────────
  const [title,           setTitle]           = useState('');
  const [titleError,      setTitleError]      = useState('');
  const [contentMode,     setContentMode]     = useState('description'); // 'description' | 'file'
  const [description,     setDescription]     = useState('');
  const [selectedFile,    setSelectedFile]    = useState(null);
  const [fileError,       setFileError]       = useState('');
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [existingFileUrl, setExistingFileUrl] = useState('');
  const [filePreviewUrl,  setFilePreviewUrl]  = useState('');
  const [downloading,     setDownloading]     = useState(false);

  // departments
  const [allDepartments, setAllDepartments] = useState([]);
  const [selectedDepts,  setSelectedDepts]  = useState([]);
  const [deptDropOpen,   setDeptDropOpen]   = useState(false);
  const deptDropRef = useRef(null);

  // ui state
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(false);
  const [feedback,  setFeedback]  = useState({ type: '', message: '' });

  // ── close dept dropdown on outside click ─────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (deptDropRef.current && !deptDropRef.current.contains(e.target))
        setDeptDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── load departments ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/super-admin/departments`, { headers: authHeader() });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAllDepartments(Array.isArray(data) ? data : data.departments || []);
      } catch { /* non-fatal */ }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── load existing record in edit mode ─────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setFetching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/system-announcements/${id}`, { headers: authHeader() });
        if (!res.ok) throw new Error('Announcement not found');
        const ann = await res.json();
        setTitle(ann.title || '');
        setDescription(ann.description || '');
        setSelectedDepts((ann.departments || []).map((d) => d._id || d));
        if (ann.fileUrl) { setExistingFileUrl(ann.fileUrl); setContentMode('file'); }
        else               { setContentMode('description'); }
      } catch (err) {
        setFeedback({ type: 'error', message: err.message || 'Failed to load announcement.' });
      } finally { setFetching(false); }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── download proxy (for existing file in edit mode) ───────────────────────
  const downloadFile = async (url) => {
    if (!url) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const res   = await fetch(
        `${API_BASE_URL}/system-announcements/download-proxy?url=${encodeURIComponent(url)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob      = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = decodeURIComponent(url.split('/').pop().split('?')[0]) || 'attachment';
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(objectUrl); }, 150);
    } catch { window.open(url, '_blank', 'noopener,noreferrer'); }
    finally   { setDownloading(false); }
  };

  // ── title change — live validation ────────────────────────────────────────
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    // Clear error as soon as user starts typing (re-validate on blur / submit)
    if (titleError) setTitleError(validateAnnouncementTitle(val) || '');
  };

  const handleTitleBlur = () => {
    setTitleError(validateAnnouncementTitle(title) || '');
  };

  // ── file input handler ─────────────────────────────────────────────────────
  const handleFileChange = (fileOrEvent) => {
    const file = fileOrEvent instanceof File ? fileOrEvent : fileOrEvent.target?.files?.[0];
    if (!file) return;
    setFileError('');

    // D4: size guard — rejected before any upload attempt
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File size must be under 10 MB. Please choose a smaller file.');
      return;
    }

    // Type guard
    if (!ALLOWED_TYPES.has(file.type)) {
      setFileError('Unsupported file type. Please upload JPG, PNG, WEBP, GIF, PDF, DOC, or DOCX.');
      return;
    }

    setSelectedFile(file);
    setFeedback({ type: '', message: '' });
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreviewUrl(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl('');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl('');
    setExistingFileUrl('');
    setFileError('');
    setUploadProgress(0);
  };

  // ── dept multi-select helpers ──────────────────────────────────────────────
  const toggleDept = (deptId) =>
    setSelectedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );

  const getDeptLabel = () => {
    if (selectedDepts.length === 0 || selectedDepts.length === allDepartments.length)
      return 'All Departments';
    const names = selectedDepts
      .map((sid) => allDepartments.find((d) => d._id === sid)?.name)
      .filter(Boolean);
    return names.length <= 2
      ? names.join(', ')
      : `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  };

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    // D1/D2: title validation — run shared validator
    const titleErr = validateAnnouncementTitle(title);
    if (titleErr) {
      setTitleError(titleErr);
      setFeedback({ type: 'error', message: titleErr });
      return;
    }
    setTitleError('');

    const hasDescription  = contentMode === 'description' && description.trim().length > 0;
    const hasNewFile      = contentMode === 'file' && selectedFile;
    const hasExistingFile = contentMode === 'file' && existingFileUrl;

    if (!hasDescription && !hasNewFile && !hasExistingFile) {
      setFeedback({ type: 'error', message: 'Please provide a description or upload a file.' });
      return;
    }

    // D4: re-check file size in case file was somehow swapped
    if (selectedFile && selectedFile.size > MAX_FILE_BYTES) {
      setFileError('File size must be under 10 MB. Please choose a smaller file.');
      setFeedback({ type: 'error', message: 'File exceeds the 10 MB limit.' });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Step 1: upload new file to Cloudinary if one was chosen
      // D3: The upload itself is handled by cloudinaryUpload.js which already
      //     validates env vars (VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET)
      //     and emits a console.warn if they are missing.  See manual-config note.
      let fileUrl = existingFileUrl || null;
      if (contentMode === 'file' && selectedFile) {
        try {
          fileUrl = await uploadToCloudinary(
            selectedFile,
            'system-announcements',
            (pct) => setUploadProgress(pct),
          );
        } catch (uploadErr) {
          setFeedback({ type: 'error', message: `File upload failed: ${uploadErr.message}` });
          setLoading(false);
          setUploadProgress(0);
          return;
        }
      }

      // Step 2: send JSON to backend
      const payload = {
        title: title.trim(),
        description: contentMode === 'description' ? description.trim() : '',
        departments: selectedDepts,
        fileUrl: contentMode === 'file' ? fileUrl : null,
      };

      const url    = isEdit ? `${API_BASE_URL}/system-announcements/${id}` : `${API_BASE_URL}/system-announcements`;
      const method = isEdit ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('erp_token')}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);

      setFeedback({
        type:    'success',
        message: data.message || (isEdit ? 'Announcement updated.' : 'Announcement created.'),
      });
      setTimeout(() => navigate('/system-announcements'), 1200);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save announcement.' });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="btn-back" onClick={() => navigate('/system-announcements')} title="Back to Announcements">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEdit ? 'Edit Announcement' : 'New System Announcement'}
            </h1>
            <p className="page-subtitle">
              {isEdit
                ? 'Update the announcement details'
                : 'Publish an official announcement to selected departments'}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ flex: 1 }}>{feedback.message}</span>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setFeedback({ type: '', message: '' })}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="card sa-form-card" style={{ maxWidth: '780px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ display: 'block', margin: '0 auto 0.75rem' }} />
            <p>Loading announcement...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout" noValidate>

            {/* ── Title ─────────────────────────────────────────────────── */}
            <div className="form-section">
              <h3 className="form-section-title">Announcement Details</h3>
              <div className="form-group">
                <label className="form-label">
                  Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`form-input${titleError ? ' input-error' : ''}`}
                  placeholder="e.g. University Closed on Republic Day"
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                />
                {/* D1/D2: inline field-level error */}
                {titleError && (
                  <p className="form-field-error" style={{ marginTop: '0.25rem' }}>
                    {titleError}
                  </p>
                )}
              </div>
            </div>

            {/* ── Department multi-select ──────────────────────────────── */}
            <div className="form-section" style={{ marginTop: '1.5rem' }}>
              <h3 className="form-section-title">Target Departments</h3>
              <div className="form-group">
                <label className="form-label">Select Departments</label>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Leave unselected to target all departments.
                </p>
                <div className="dept-multiselect-wrapper" ref={deptDropRef} style={{ position: 'relative' }}>
                  <button type="button" className="form-input"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', background: 'var(--input-bg, #fff)' }}
                    onClick={() => setDeptDropOpen((o) => !o)}>
                    <span style={{ color: selectedDepts.length === 0 ? 'var(--text-secondary)' : 'inherit' }}>
                      <Building2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                      {getDeptLabel()}
                    </span>
                    <ChevronDown size={16} style={{ transition: 'transform 0.15s', transform: deptDropOpen ? 'rotate(180deg)' : 'none', flexShrink: 0, marginLeft: '8px' }} />
                  </button>
                  {deptDropOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: '240px', overflowY: 'auto' }}>
                      {allDepartments.length === 0 ? (
                        <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>No departments found</div>
                      ) : (
                        <>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-color, #e5e7eb)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <input type="checkbox"
                              checked={selectedDepts.length === allDepartments.length && allDepartments.length > 0}
                              onChange={(e) => setSelectedDepts(e.target.checked ? allDepartments.map((d) => d._id) : [])}
                              style={{ width: '15px', height: '15px', accentColor: 'var(--primary, #6366f1)' }} />
                            All Departments
                          </label>
                          {allDepartments.map((dept) => (
                            <label key={dept._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)', transition: 'background 0.12s' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg, #f3f4f6)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                              <input type="checkbox" checked={selectedDepts.includes(dept._id)} onChange={() => toggleDept(dept._id)}
                                style={{ width: '15px', height: '15px', accentColor: 'var(--primary, #6366f1)' }} />
                              {dept.name}
                              {dept.departmentId && (
                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{dept.departmentId}</span>
                              )}
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {selectedDepts.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {selectedDepts.map((dId) => {
                      const dept = allDepartments.find((d) => d._id === dId);
                      if (!dept) return null;
                      return (
                        <span key={dId} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: 'var(--primary-light, #eef2ff)', color: 'var(--primary, #6366f1)', fontSize: '0.8125rem', fontWeight: 500 }}>
                          {dept.name}
                          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'inherit' }} onClick={() => toggleDept(dId)} title={`Remove ${dept.name}`}>
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Content: description OR file ─────────────────────────── */}
            <div className="form-section" style={{ marginTop: '1.5rem' }}>
              <h3 className="form-section-title">Content</h3>
              <div style={{ display: 'flex', gap: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color, #e5e7eb)', width: 'fit-content', marginBottom: '1.25rem' }}>
                <button type="button" onClick={() => setContentMode('description')}
                  style={{ padding: '7px 20px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', border: 'none', borderRight: '1px solid var(--border-color, #e5e7eb)', background: contentMode === 'description' ? 'var(--primary, #6366f1)' : 'transparent', color: contentMode === 'description' ? '#fff' : 'var(--text-secondary)', transition: 'background 0.15s, color 0.15s' }}>
                  Write Description
                </button>
                <button type="button" onClick={() => setContentMode('file')}
                  style={{ padding: '7px 20px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: contentMode === 'file' ? 'var(--primary, #6366f1)' : 'transparent', color: contentMode === 'file' ? '#fff' : 'var(--text-secondary)', transition: 'background 0.15s, color 0.15s' }}>
                  Upload File
                </button>
              </div>

              {contentMode === 'description' && (
                <div className="form-group">
                  <label className="form-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea className="form-input" rows={6} placeholder="Write the full announcement details here..."
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '120px', fontFamily: 'inherit' }} />
                </div>
              )}

              {contentMode === 'file' && (
                <div className="form-group">
                  <label className="form-label">Attachment <span style={{ color: '#ef4444' }}>*</span></label>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Supported: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX. Max 10 MB.
                  </p>

                  {!selectedFile && existingFileUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'var(--hover-bg, #f9fafb)', border: '1px solid var(--border-color, #e5e7eb)', marginBottom: '0.75rem' }}>
                      <FileText size={18} style={{ color: 'var(--primary, #6366f1)', flexShrink: 0 }} />
                      <button type="button" onClick={() => downloadFile(existingFileUrl)} disabled={downloading}
                        style={{ background: 'none', border: 'none', cursor: downloading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', color: downloading ? 'var(--text-secondary)' : 'var(--primary, #6366f1)', wordBreak: 'break-all', flex: 1, textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {downloading ? <><Loader2 size={14} className="spin-animate" /> Downloading…</> : 'Download current file'}
                      </button>
                      <button type="button" className="action-btn delete-btn" title="Remove current file" onClick={clearFile}><X size={14} /></button>
                    </div>
                  )}

                  {!selectedFile ? (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '2rem', border: `2px dashed ${fileError ? '#ef4444' : 'var(--border-color, #d1d5db)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', textAlign: 'center' }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFileChange(f); }}>
                      <Upload size={28} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>Click or drag &amp; drop to upload</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>JPG, PNG, PDF, DOC, DOCX — max 10 MB</span>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} />
                    </label>
                  ) : (
                    <div style={{ borderRadius: '10px', border: '1px solid var(--border-color, #e5e7eb)', overflow: 'hidden' }}>
                      {filePreviewUrl ? (
                        <img src={filePreviewUrl} alt="Preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'var(--hover-bg, #f9fafb)' }}>
                          <FileText size={20} style={{ color: 'var(--primary, #6366f1)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1, wordBreak: 'break-all' }}>{selectedFile.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{(selectedFile.size / 1024).toFixed(0)} KB</span>
                        </div>
                      )}
                      {/* Upload progress bar */}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div style={{ padding: '6px 14px', background: 'var(--card-bg, #fff)', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
                          <div style={{ height: '4px', background: 'var(--border-color, #e5e7eb)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary, #6366f1)', transition: 'width 0.2s' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Uploading… {uploadProgress}%</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--card-bg, #fff)', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {filePreviewUrl ? selectedFile.name : 'Ready to upload'}
                        </span>
                        <button type="button" className="action-btn delete-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }} onClick={clearFile}>
                          <X size={14} /><span>Remove</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* D4: inline file error */}
                  {fileError && (
                    <p className="form-field-error" style={{ marginTop: '0.375rem' }}>{fileError}</p>
                  )}
                </div>
              )}
            </div>

            {/* ── Actions — sa-form-actions fixes Cancel visibility on mobile ── */}
            <div className="form-actions-row sa-form-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="books-btn books-btn-ghost"
                onClick={() => navigate('/system-announcements')} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
                {loading
                  ? <><Loader2 size={16} className="spin-animate" /><span>Saving...</span></>
                  : <><Save size={16} /><span>{isEdit ? 'Update Announcement' : 'Publish Announcement'}</span></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SystemAnnouncementForm;
