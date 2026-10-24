import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

export function validateDepartmentId(raw) {
  const val = (raw || '').trim();
  if (!val) return 'Department ID is required.';
  if (val.length < 2) return 'Department ID must be at least 2 characters.';
  if (/^-?\d+$/.test(val)) return 'Department ID must be alphanumeric (e.g. CS-101). Purely numeric values are not allowed.';
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(val)) return 'Department ID may only contain letters, digits, and hyphens (e.g. CS-101).';
  return null;
}

export function validateDepartmentName(raw) {
  const val = (raw || '').trim();
  if (!val) return 'Department Name is required.';
  if (val.length < 5) return 'Please enter the full descriptive department name (minimum 5 characters).';
  if (!/^[A-Za-z]/.test(val)) return 'Please enter a valid department name.';
  if (/\d/.test(val)) return 'Please enter a valid department name in the specified format. Digits are not allowed.';
  if (!/^[A-Za-z\s&\-(). /,'\u0026]+$/.test(val)) return 'Only letters, spaces, and standard punctuation are allowed.';
  if (/^[A-Z]{1,4}$/.test(val)) return 'Please enter the full descriptive department name (e.g. "Computer Science" instead of "CS").';
  return null;
}

// ---------------------------------------------------------------------------
// DepartmentFormModal
// Props: isOpen, deptId (null=Add, string=Edit), onClose, onSuccess
// ---------------------------------------------------------------------------
const DepartmentFormModal = ({ isOpen, deptId, onClose, onSuccess }) => {
  const isEditMode = Boolean(deptId);
  const { authLoading } = useAuth();

  const [formData, setFormData] = useState({ departmentId: '', name: '' });
  const [fieldErrors, setFieldErrors] = useState({ departmentId: '', name: '' });
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const reset = useCallback(() => {
    setFormData({ departmentId: '', name: '' });
    setFieldErrors({ departmentId: '', name: '' });
    setFeedback({ type: '', message: '' });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    reset();
    if (isEditMode) loadDept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, deptId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  const loadDept = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/departments`, { headers: authHeader() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const found = data.find((d) => d._id === deptId || d.departmentId === deptId);
      if (found) {
        setFormData({ departmentId: found.departmentId || found.code || '', name: found.name || '' });
      } else {
        setFeedback({ type: 'error', message: 'Department not found.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Unable to load department details.' });
    } finally {
      setFetching(false);
    }
  };

  const validateField = (name, value) => {
    if (name === 'departmentId') return validateDepartmentId(value) || '';
    if (name === 'name') return validateDepartmentName(value) || '';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processed = name === 'departmentId' ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: processed }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, processed) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const processed = name === 'departmentId' ? value.toUpperCase() : value;
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, processed) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    const idErr   = validateDepartmentId(formData.departmentId) || '';
    const nameErr = validateDepartmentName(formData.name) || '';
    setFieldErrors({ departmentId: idErr, name: nameErr });
    if (idErr || nameErr) return;

    setLoading(true);
    try {
      const url    = isEditMode ? `${API_BASE_URL}/super-admin/departments/${deptId}` : `${API_BASE_URL}/super-admin/departments`;
      const method = isEditMode ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: authHeader(), body: JSON.stringify({ departmentId: formData.departmentId.trim(), name: formData.name.trim() }) });
      const data   = await res.json();
      if (!res.ok) { setFeedback({ type: 'error', message: data.message || 'Failed to save department.' }); return; }

      setFeedback({ type: 'success', message: isEditMode ? 'Department updated successfully.' : 'Department created successfully.' });
      setTimeout(() => onSuccess(), 900);
    } catch {
      setFeedback({ type: 'error', message: 'Unable to connect to the server.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || authLoading) return null;

  return (
    <div className="sf-overlay" role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="sf-modal" style={{ maxWidth: '520px' }}>

        <div className="sf-header">
          <div className="sf-header-left">
            <div className="sf-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <h2 className="sf-title">{isEditMode ? 'Edit Department' : 'Add New Department'}</h2>
              <p className="sf-subtitle">{isEditMode ? 'Update department ID and name' : 'Register a new academic department'}</p>
            </div>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="sf-body">
          {feedback.message && (
            <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
              <span>{feedback.message}</span>
            </div>
          )}
          {fetching ? (
            <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading department details…</p></div>
          ) : (
            <form id="dept-form" onSubmit={handleSubmit} className="sf-form" noValidate>
              <div className="sf-section-label">Department Information</div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="dept-departmentId">Department ID <span className="sf-required">*</span></label>
                  <input id="dept-departmentId" name="departmentId" type="text"
                    className={`sf-input${fieldErrors.departmentId ? ' sf-input-error' : ''}`}
                    placeholder="e.g. CS-101, IT-102"
                    value={formData.departmentId} onChange={handleChange} onBlur={handleBlur} autoComplete="off" />
                  {fieldErrors.departmentId && <p className="sf-field-error"><AlertCircle size={12} />{fieldErrors.departmentId}</p>}
                  {!fieldErrors.departmentId && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Letters, digits, hyphens. Must be unique.</p>}
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="dept-name">Department Name <span className="sf-required">*</span></label>
                  <input id="dept-name" name="name" type="text"
                    className={`sf-input${fieldErrors.name ? ' sf-input-error' : ''}`}
                    placeholder="e.g. Computer Science & Engineering"
                    value={formData.name} onChange={handleChange} onBlur={handleBlur} autoComplete="off" />
                  {fieldErrors.name && <p className="sf-field-error"><AlertCircle size={12} />{fieldErrors.name}</p>}
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="dept-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></> : <><Save size={15} /><span>{isEditMode ? 'Save Changes' : 'Create Department'}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentFormModal;
