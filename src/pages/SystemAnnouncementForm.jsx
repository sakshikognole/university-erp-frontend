import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2, Upload, FileText, ChevronDown, Building2 } from 'lucide-react';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { validateAnnouncementTitle } from '../utils/announcementValidation';
const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

// ---------------------------------------------------------------------------
// SystemAnnouncementFormModal — Props: isOpen, annId (null=Add), onClose, onSuccess
// ---------------------------------------------------------------------------
const SystemAnnouncementFormModal = ({ isOpen, annId, onClose, onSuccess }) => {
  const isEdit = Boolean(annId);

  const authHeader = (isJson = true) => {
    const h = { Authorization: `Bearer ${localStorage.getItem('erp_token')}` };
    if (isJson) h['Content-Type'] = 'application/json';
    return h;
  };

  const [title,          setTitle]          = useState('');
  const [titleError,     setTitleError]      = useState('');
  const [contentMode,    setContentMode]    = useState('description');
  const [description,    setDescription]    = useState('');
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [fileError,      setFileError]      = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingFileUrl,setExistingFileUrl]= useState('');
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [downloading,    setDownloading]    = useState(false);
  const [allDepartments, setAllDepartments] = useState([]);
  const [selectedDepts,  setSelectedDepts]  = useState([]);
  const [deptDropOpen,   setDeptDropOpen]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const deptDropRef = useRef(null);

  // Close dept dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (deptDropRef.current && !deptDropRef.current.contains(e.target)) setDeptDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Lock scroll
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);

  // Escape key
  useEffect(() => {
    const f = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); };
    document.addEventListener('keydown', f);
    return () => document.removeEventListener('keydown', f);
  }, [isOpen, loading, onClose]);

  // Reset + load when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setTitle(''); setTitleError(''); setContentMode('description'); setDescription('');
    setSelectedFile(null); setFileError(''); setUploadProgress(0); setExistingFileUrl('');
    setFilePreviewUrl(''); setSelectedDepts([]); setFeedback({ type: '', message: '' });
    loadDepartments();
    if (isEdit) loadAnnouncement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, annId]);

  const loadDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/departments`, { headers: authHeader() });
      if (res.ok) { const d = await res.json(); setAllDepartments(Array.isArray(d) ? d : d.departments || []); }
    } catch { /* non-fatal */ }
  };

  const loadAnnouncement = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/system-announcements/${annId}`, { headers: authHeader() });
      if (!res.ok) throw new Error('Announcement not found');
      const a = await res.json();
      setTitle(a.title || '');
      setDescription(a.description || '');
      setSelectedDepts((a.departments || []).map((d) => d._id || d));
      if (a.fileUrl) { setExistingFileUrl(a.fileUrl); setContentMode('file'); }
      else setContentMode('description');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally { setFetching(false); }
  };

  const downloadFile = async (url) => {
    if (!url) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/system-announcements/download-proxy?url=${encodeURIComponent(url)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('erp_token')}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = decodeURIComponent(url.split('/').pop().split('?')[0]) || 'attachment';
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 150);
    } catch { window.open(url, '_blank', 'noopener,noreferrer'); }
    finally { setDownloading(false); }
  };

  const handleFileChange = (fileOrEvent) => {
    const file = fileOrEvent instanceof File ? fileOrEvent : fileOrEvent.target?.files?.[0];
    if (!file) return;
    setFileError('');
    if (file.size > MAX_FILE_BYTES) { setFileError('File size must be under 10 MB.'); return; }
    if (!ALLOWED_TYPES.has(file.type)) { setFileError('Unsupported file type. Use JPG, PNG, PDF, DOC, or DOCX.'); return; }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) { const r = new FileReader(); r.onload = (ev) => setFilePreviewUrl(ev.target.result); r.readAsDataURL(file); }
    else setFilePreviewUrl('');
  };

  const clearFile = () => { setSelectedFile(null); setFilePreviewUrl(''); setExistingFileUrl(''); setFileError(''); setUploadProgress(0); };
  const toggleDept = (id) => setSelectedDepts((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);
  const getDeptLabel = () => {
    if (!selectedDepts.length || selectedDepts.length === allDepartments.length) return 'All Departments';
    const names = selectedDepts.map((id) => allDepartments.find((d) => d._id === id)?.name).filter(Boolean);
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    const titleErr = validateAnnouncementTitle(title);
    if (titleErr) { setTitleError(titleErr); return; }
    setTitleError('');
    const hasDesc = contentMode === 'description' && description.trim().length > 0;
    const hasNewFile = contentMode === 'file' && selectedFile;
    const hasExisting = contentMode === 'file' && existingFileUrl;
    if (!hasDesc && !hasNewFile && !hasExisting) { setFeedback({ type: 'error', message: 'Please provide a description or upload a file.' }); return; }
    if (selectedFile && selectedFile.size > MAX_FILE_BYTES) { setFileError('File exceeds 10 MB.'); return; }

    setLoading(true); setUploadProgress(0);
    try {
      let fileUrl = existingFileUrl || null;
      if (contentMode === 'file' && selectedFile) {
        try { fileUrl = await uploadToCloudinary(selectedFile, 'system-announcements', (pct) => setUploadProgress(pct)); }
        catch (err) { setFeedback({ type: 'error', message: `Upload failed: ${err.message}` }); return; }
      }
      const url = isEdit ? `${API_BASE_URL}/system-announcements/${annId}` : `${API_BASE_URL}/system-announcements`;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('erp_token')}` }, body: JSON.stringify({ title: title.trim(), description: contentMode === 'description' ? description.trim() : '', departments: selectedDepts, fileUrl: contentMode === 'file' ? fileUrl : null }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
      setFeedback({ type: 'success', message: data.message || (isEdit ? 'Announcement updated.' : 'Announcement created.') });
      setTimeout(() => onSuccess(), 900);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally { setLoading(false); setUploadProgress(0); }
  };

  if (!isOpen) return null;

  return (
    <div className="sf-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="sf-modal">
        <div className="sf-header">
          <div className="sf-header-left">
            <div className="sf-header-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg></div>
            <div><h2 className="sf-title">{isEdit ? 'Edit Announcement' : 'New Announcement'}</h2><p className="sf-subtitle">{isEdit ? 'Update announcement details' : 'Publish to selected departments'}</p></div>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="sf-body">
          {feedback.message && (
            <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
              <span>{feedback.message}</span>
              <button type="button" onClick={() => setFeedback({ type: '', message: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
            </div>
          )}

          {fetching ? <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading announcement…</p></div> : (
            <form id="ann-form" onSubmit={handleSubmit} className="sf-form" noValidate>

              <div className="sf-section-label">Title</div>
              <div className="sf-row"><div className="sf-group sf-group-full">
                <label className="sf-label" htmlFor="ann-title">Title <span className="sf-required">*</span></label>
                <input id="ann-title" type="text" className={`sf-input${titleError ? ' sf-input-error' : ''}`}
                  placeholder="e.g. University Closed on Republic Day"
                  value={title} onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(validateAnnouncementTitle(e.target.value) || ''); }}
                  onBlur={() => setTitleError(validateAnnouncementTitle(title) || '')} />
                {titleError && <p className="sf-field-error"><AlertCircle size={12} style={{ flexShrink: 0 }} />{titleError}</p>}
              </div></div>

              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>Target Departments <span className="sf-optional">leave blank for all</span></div>
              <div className="sf-row"><div className="sf-group sf-group-full">
                <div ref={deptDropRef} style={{ position: 'relative' }}>
                  <button type="button" className="sf-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }} onClick={() => setDeptDropOpen((o) => !o)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: selectedDepts.length === 0 ? '#9ca3af' : 'inherit' }}><Building2 size={14} />{getDeptLabel()}</span>
                    <ChevronDown size={15} style={{ transform: deptDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
                  </button>
                  {deptDropOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto' }}>
                      {allDepartments.length === 0 ? <div style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem', textAlign: 'center' }}>No departments</div> : (
                        <>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontWeight: 600, fontSize: '0.875rem' }}>
                            <input type="checkbox" checked={selectedDepts.length === allDepartments.length && allDepartments.length > 0} onChange={(e) => setSelectedDepts(e.target.checked ? allDepartments.map((d) => d._id) : [])} style={{ width: 15, height: 15 }} />All Departments
                          </label>
                          {allDepartments.map((d) => (
                            <label key={d._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.875rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                              <input type="checkbox" checked={selectedDepts.includes(d._id)} onChange={() => toggleDept(d._id)} style={{ width: 15, height: 15 }} />{d.name}
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div></div>

              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>Content</div>
              <div style={{ display: 'flex', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e5e7eb', width: 'fit-content', marginBottom: '1rem' }}>
                {['description', 'file'].map((m) => (
                  <button key={m} type="button" onClick={() => setContentMode(m)}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', border: 'none', borderRight: m === 'description' ? '1px solid #e5e7eb' : 'none', background: contentMode === m ? '#111827' : 'transparent', color: contentMode === m ? '#fff' : '#6b7280', transition: 'all 0.15s' }}>
                    {m === 'description' ? 'Write Description' : 'Upload File'}
                  </button>
                ))}
              </div>

              {contentMode === 'description' && (
                <div className="sf-row"><div className="sf-group sf-group-full">
                  <label className="sf-label" htmlFor="ann-desc">Description <span className="sf-required">*</span></label>
                  <textarea id="ann-desc" className="sf-input" rows={5} placeholder="Write the full announcement details here…"
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '110px', fontFamily: 'inherit' }} />
                </div></div>
              )}

              {contentMode === 'file' && (
                <div className="sf-row"><div className="sf-group sf-group-full">
                  <label className="sf-label">Attachment <span className="sf-required">*</span></label>
                  <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 0.5rem' }}>JPG, PNG, PDF, DOC, DOCX — max 10 MB</p>

                  {!selectedFile && existingFileUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', borderRadius: '0.5rem', background: '#f9fafb', border: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
                      <FileText size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
                      <button type="button" onClick={() => downloadFile(existingFileUrl)} disabled={downloading} style={{ background: 'none', border: 'none', cursor: downloading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', color: '#6366f1', flex: 1, textAlign: 'left', padding: 0 }}>
                        {downloading ? <><Loader2 size={13} className="spin-animate" style={{ display: 'inline', marginRight: 4 }} />Downloading…</> : 'Download current file'}
                      </button>
                      <button type="button" className="action-btn delete-btn" onClick={clearFile}><X size={14} /></button>
                    </div>
                  )}

                  {!selectedFile ? (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.75rem', border: `2px dashed ${fileError ? '#ef4444' : '#d1d5db'}`, borderRadius: '0.625rem', cursor: 'pointer', textAlign: 'center' }}
                      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFileChange(f); }}>
                      <Upload size={24} style={{ color: '#9ca3af' }} />
                      <span style={{ fontWeight: 500, color: '#374151' }}>Click or drag &amp; drop</span>
                      <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>JPG, PNG, PDF, DOC, DOCX — max 10 MB</span>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} />
                    </label>
                  ) : (
                    <div style={{ borderRadius: '0.625rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                      {filePreviewUrl ? <img src={filePreviewUrl} alt="Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} /> : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem', background: '#f9fafb' }}>
                          <FileText size={18} style={{ color: '#6366f1' }} />
                          <span style={{ fontSize: '0.875rem', flex: 1, wordBreak: 'break-all' }}>{selectedFile.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{(selectedFile.size / 1024).toFixed(0)} KB</span>
                        </div>
                      )}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div style={{ padding: '0.375rem 0.875rem', borderTop: '1px solid #e5e7eb' }}>
                          <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${uploadProgress}%`, background: '#6366f1', transition: 'width 0.2s' }} /></div>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.875rem', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{selectedFile.name}</span>
                        <button type="button" className="action-btn delete-btn" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem' }} onClick={clearFile}><X size={13} /><span>Remove</span></button>
                      </div>
                    </div>
                  )}
                  {fileError && <p className="sf-field-error" style={{ marginTop: '0.25rem' }}><AlertCircle size={12} style={{ flexShrink: 0 }} />{fileError}</p>}
                </div></div>
              )}

            </form>
          )}
        </div>

        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="ann-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></> : <><Save size={15} /><span>{isEdit ? 'Update Announcement' : 'Publish'}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemAnnouncementFormModal;
