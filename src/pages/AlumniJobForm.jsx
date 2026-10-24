import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const toInputDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
};

const JOB_ID_RE = /^[A-Z0-9]{3,20}$/;
const validateJobId = (raw) => {
  const v = raw.trim().toUpperCase();
  if (!v) return 'Job ID is required.';
  if (!JOB_ID_RE.test(v)) return 'Job ID must be 3–20 uppercase letters or digits with no spaces (e.g. JOB2024001).';
  return null;
};
const LETTER_RE = /[A-Za-z]/;
const validateCompany = (raw) => {
  const v = raw.trim();
  if (!v) return 'Company name is required.';
  if (v.length < 2) return 'Company name must be at least 2 characters.';
  if (!LETTER_RE.test(v)) return 'Company name must contain at least one letter.';
  return null;
};
const validateRole = (raw) => {
  const v = raw.trim();
  if (!v) return 'Role is required.';
  if (v.length < 2) return 'Role must be at least 2 characters.';
  if (!LETTER_RE.test(v)) return 'Role must contain at least one letter.';
  return null;
};
const validateApplicationLink = (raw) => {
  const v = raw.trim();
  if (!v) return 'Application Link is required.';
  try {
    const url = new URL(v);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'Application Link must use http or https.';
  } catch { return 'Application Link must be a valid URL (e.g. https://careers.example.com/apply).'; }
  return null;
};
const validateForm = (form, isEdit) => {
  const errors = {};
  if (!isEdit) { const e = validateJobId(form.jobId); if (e) errors.jobId = e; }
  const ce = validateCompany(form.company); if (ce) errors.company = ce;
  const re = validateRole(form.role); if (re) errors.role = re;
  const le = validateApplicationLink(form.applicationLink); if (le) errors.applicationLink = le;
  if (form.datePosted && form.dateOfExpiry && new Date(form.dateOfExpiry) < new Date(form.datePosted))
    errors.dateOfExpiry = 'Expiry date must be after the posted date.';
  return errors;
};

const FieldError = ({ msg }) =>
  msg ? <p className="sf-field-error"><AlertCircle size={12} style={{ flexShrink: 0 }} />{msg}</p> : null;

// ---------------------------------------------------------------------------
// AlumniJobFormModal — Props: isOpen, jobId (null=Add), onClose, onSuccess
// ---------------------------------------------------------------------------
const AlumniJobFormModal = ({ isOpen, jobId, onClose, onSuccess }) => {
  const isEdit = Boolean(jobId);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [alumniIdStatus, setAlumniIdStatus] = useState('idle');
  const alumniTimerRef = useRef(null);

  const emptyForm = { jobId: '', alumniId: '', company: '', role: '', applicationLink: '', datePosted: '', dateOfExpiry: '' };
  const [form, setForm] = useState(emptyForm);

  const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('erp_token')}` });

  const reset = useCallback(() => {
    setForm(emptyForm);
    setFieldErrors({});
    setFeedback({ type: '', message: '' });
    setAlumniIdStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    reset();
    if (isEdit) loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, jobId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  useEffect(() => () => { if (alumniTimerRef.current) clearTimeout(alumniTimerRef.current); }, []);

  const loadJob = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni-jobs/${jobId}`, { headers: authHeader() });
      if (!res.ok) throw new Error('Job not found');
      const j = await res.json();
      setForm({ jobId: j.jobId || '', alumniId: j.alumniId || '', company: j.company || '', role: j.role || '', applicationLink: j.applicationLink || '', datePosted: toInputDate(j.datePosted), dateOfExpiry: toInputDate(j.dateOfExpiry) });
      setAlumniIdStatus('valid');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally { setFetching(false); }
  };

  const scheduleAlumniCheck = (value) => {
    if (alumniTimerRef.current) clearTimeout(alumniTimerRef.current);
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) { setAlumniIdStatus('idle'); return; }
    setAlumniIdStatus('checking');
    alumniTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/alumni/${encodeURIComponent(trimmed)}`, { headers: authHeader() });
        if (res.ok) { const d = await res.json(); setAlumniIdStatus(d?.alumniId ? 'valid' : 'invalid'); }
        else setAlumniIdStatus('invalid');
      } catch { setAlumniIdStatus('invalid'); }
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: undefined }));
    if (name === 'alumniId') scheduleAlumniCheck(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    const errors = validateForm(form, isEdit);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    if (!form.alumniId.trim()) { setFieldErrors((p) => ({ ...p, alumniId: 'Alumni ID is required.' })); return; }
    if (alumniIdStatus === 'invalid') { setFeedback({ type: 'error', message: `Alumni ID '${form.alumniId.trim().toUpperCase()}' does not exist.` }); return; }
    if (alumniIdStatus === 'checking') { setFeedback({ type: 'error', message: 'Please wait — verifying Alumni ID...' }); return; }
    if (alumniIdStatus === 'idle') { setFeedback({ type: 'error', message: 'Please enter a valid Alumni ID.' }); return; }

    setLoading(true);
    try {
      const url = isEdit ? `${API_BASE_URL}/alumni-jobs/${jobId}` : `${API_BASE_URL}/alumni-jobs`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST', headers: authHeader(),
        body: JSON.stringify({ jobId: form.jobId.trim().toUpperCase(), alumniId: form.alumniId.trim().toUpperCase(), company: form.company.trim(), role: form.role.trim(), applicationLink: form.applicationLink.trim(), datePosted: form.datePosted || null, dateOfExpiry: form.dateOfExpiry || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setFeedback({ type: 'success', message: data.message });
      setTimeout(() => onSuccess(), 900);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally { setLoading(false); }
  };

  const ic = (f) => `sf-input${fieldErrors[f] ? ' sf-input-error' : ''}`;

  if (!isOpen) return null;

  const alumniAdornment = () => {
    if (alumniIdStatus === 'checking') return <Loader2 size={15} className="spin-animate" style={{ color: '#9ca3af' }} />;
    if (alumniIdStatus === 'valid')    return <Check size={15} style={{ color: '#16a34a' }} />;
    if (alumniIdStatus === 'invalid')  return <X size={15} style={{ color: '#ef4444' }} />;
    return null;
  };

  return (
    <div className="sf-overlay" role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="sf-modal">
        <div className="sf-header">
          <div className="sf-header-left">
            <div className="sf-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div>
              <h2 className="sf-title">{isEdit ? 'Edit Job Posting' : 'Add Job Posting'}</h2>
              <p className="sf-subtitle">{isEdit ? 'Update alumni job details' : 'Add a new job opportunity from an alumni'}</p>
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
            <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading job details…</p></div>
          ) : (
            <form id="alumni-job-form" onSubmit={handleSubmit} className="sf-form" noValidate>

              <div className="sf-section-label">Job Information</div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="aj-jobId">Job ID {!isEdit && <span className="sf-required">*</span>}</label>
                  <input id="aj-jobId" name="jobId" type="text" className={ic('jobId')}
                    placeholder="e.g. JOB2024001" value={form.jobId}
                    onChange={handleChange} disabled={isEdit} autoComplete="off" maxLength={20} />
                  <FieldError msg={fieldErrors.jobId} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="aj-alumniId">Alumni ID <span className="sf-required">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input id="aj-alumniId" name="alumniId" type="text"
                      className={`sf-input${alumniIdStatus === 'invalid' || fieldErrors.alumniId ? ' sf-input-error' : alumniIdStatus === 'valid' ? ' sf-input-valid' : ''}`}
                      style={{ paddingRight: '2.25rem', borderColor: alumniIdStatus === 'valid' ? '#16a34a' : alumniIdStatus === 'invalid' ? '#ef4444' : undefined }}
                      placeholder="e.g. ALM0001" value={form.alumniId}
                      onChange={handleChange} autoComplete="off" />
                    <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                      {alumniAdornment()}
                    </div>
                  </div>
                  {alumniIdStatus === 'valid'   && <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem' }}>Alumni verified.</p>}
                  {alumniIdStatus === 'invalid' && <p style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.2rem' }}>Alumni ID not found.</p>}
                  <FieldError msg={fieldErrors.alumniId} />
                </div>
              </div>

              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="aj-company">Company <span className="sf-required">*</span></label>
                  <input id="aj-company" name="company" type="text" className={ic('company')}
                    placeholder="e.g. Amazon, TCS" value={form.company}
                    onChange={handleChange} autoComplete="off" maxLength={100} />
                  <FieldError msg={fieldErrors.company} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="aj-role">Role <span className="sf-required">*</span></label>
                  <input id="aj-role" name="role" type="text" className={ic('role')}
                    placeholder="e.g. Backend Developer" value={form.role}
                    onChange={handleChange} autoComplete="off" maxLength={100} />
                  <FieldError msg={fieldErrors.role} />
                </div>
              </div>

              <div className="sf-row">
                <div className="sf-group sf-group-full">
                  <label className="sf-label" htmlFor="aj-applicationLink">Application Link <span className="sf-required">*</span></label>
                  <input id="aj-applicationLink" name="applicationLink" type="url" className={ic('applicationLink')}
                    placeholder="https://careers.company.com/apply" value={form.applicationLink}
                    onChange={handleChange} autoComplete="off" />
                  <FieldError msg={fieldErrors.applicationLink} />
                </div>
              </div>

              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>Dates <span className="sf-optional">optional</span></div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="aj-datePosted">Date Posted</label>
                  <input id="aj-datePosted" name="datePosted" type="date" className="sf-input"
                    value={form.datePosted} onChange={handleChange} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="aj-dateOfExpiry">Date of Expiry</label>
                  <input id="aj-dateOfExpiry" name="dateOfExpiry" type="date" className={ic('dateOfExpiry')}
                    value={form.dateOfExpiry} onChange={handleChange} />
                  <FieldError msg={fieldErrors.dateOfExpiry} />
                </div>
              </div>

            </form>
          )}
        </div>

        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="alumni-job-form" className="sf-btn-save" disabled={loading || fetching || alumniIdStatus === 'checking'}>
            {loading ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></> : <><Save size={15} /><span>{isEdit ? 'Update Job' : 'Save Job'}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlumniJobFormModal;
