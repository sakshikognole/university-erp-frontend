import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, Check, X } from 'lucide-react';

const _IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const toInputDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
};

// ── Validation helpers ────────────────────────────────────────────────────────

// D7: Job IDs are manually entered. Format: 3–20 uppercase alphanumeric characters.
// Matches existing records (e.g. JOB2024001). No spaces, no special characters.
const JOB_ID_RE = /^[A-Z0-9]{3,20}$/;

const validateJobId = (raw) => {
  const v = raw.trim().toUpperCase();
  if (!v) return 'Job ID is required.';
  if (!JOB_ID_RE.test(v))
    return 'Job ID must be 3–20 uppercase letters or digits with no spaces or special characters (e.g. JOB2024001).';
  return null;
};

// D9: Company must contain at least one letter; allows digits and common punctuation.
// Accepts: TCS, 3M, 7-Eleven, AT&T, Amazon.com, O'Reilly, S&P Global
// Rejects: blank, whitespace-only, numbers-only, special-char-only
const COMPANY_LETTER_RE = /[A-Za-z]/;
const validateCompany = (raw) => {
  const v = raw.trim();
  if (!v) return 'Company name is required.';
  if (v.length < 2) return 'Company name must be at least 2 characters.';
  if (v.length > 100) return 'Company name must not exceed 100 characters.';
  if (!COMPANY_LETTER_RE.test(v))
    return 'Company name must contain at least one letter (e.g. TCS, 3M, 7-Eleven).';
  return null;
};

// D10: Role must contain at least one letter; allows C++, R&D, QA, Full-Stack, etc.
const validateRole = (raw) => {
  const v = raw.trim();
  if (!v) return 'Role / Job Title is required.';
  if (v.length < 2) return 'Role must be at least 2 characters.';
  if (v.length > 100) return 'Role must not exceed 100 characters.';
  if (!COMPANY_LETTER_RE.test(v))
    return 'Role must contain at least one letter (e.g. C++ Developer, QA Engineer).';
  return null;
};

// D11: Application Link is mandatory; only http/https allowed.
const validateApplicationLink = (raw) => {
  const v = raw.trim();
  if (!v) return 'Application Link is required.';
  try {
    const url = new URL(v);
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      return 'Application Link must use http or https (e.g. https://careers.example.com/apply).';
  } catch {
    return 'Application Link must be a valid URL (e.g. https://careers.example.com/apply).';
  }
  return null;
};

// Run all field validations and return an errors object
const validateForm = (form, isEdit) => {
  const errors = {};
  if (!isEdit) {
    const jobIdErr = validateJobId(form.jobId);
    if (jobIdErr) errors.jobId = jobIdErr;
  }
  const companyErr = validateCompany(form.company);
  if (companyErr) errors.company = companyErr;
  const roleErr = validateRole(form.role);
  if (roleErr) errors.role = roleErr;
  const linkErr = validateApplicationLink(form.applicationLink);
  if (linkErr) errors.applicationLink = linkErr;
  if (form.datePosted && form.dateOfExpiry && new Date(form.dateOfExpiry) < new Date(form.datePosted))
    errors.dateOfExpiry = 'Expiry date must be after the posted date.';
  return errors;
};
// ─────────────────────────────────────────────────────────────────────────────

const AlumniJobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Alumni ID validation state
  const [alumniIdStatus, setAlumniIdStatus] = useState('idle'); // idle | checking | valid | invalid
  const alumniIdTimerRef = useRef(null);

  const [form, setForm] = useState({
    jobId: '',
    alumniId: '',
    company: '',
    role: '',
    applicationLink: '',
    datePosted: '',
    dateOfExpiry: '',
  });

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => { if (alumniIdTimerRef.current) clearTimeout(alumniIdTimerRef.current); };
  }, []);

  // Performance: abort controller for the edit-mode job load fetch
  const loadControllerRef = useRef(null);

  useEffect(() => {
    if (isEdit) loadJob();
    return () => {
      if (loadControllerRef.current) loadControllerRef.current.abort();
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadJob = async () => {
    if (loadControllerRef.current) loadControllerRef.current.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;

    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni-jobs/${id}`, {
        headers: authHeader(),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Job not found');
      const j = await res.json();
      setForm({
        jobId: j.jobId || '',
        alumniId: j.alumniId || '',
        company: j.company || '',
        role: j.role || '',
        applicationLink: j.applicationLink || '',
        datePosted: toInputDate(j.datePosted),
        dateOfExpiry: toInputDate(j.dateOfExpiry),
      });
      // Alumni ID already saved as valid — mark verified so user can immediately submit
      setAlumniIdStatus('valid');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setFeedback({ type: 'error', message: err.message });
    } finally {
      if (loadControllerRef.current === controller) setFetching(false);
    }
  };

  // D8: Debounced alumni ID lookup — queries the actual Alumni collection via
  // GET /api/alumni/:id (alumniController.getById handles both ObjectId and alumniId
  // string lookups via findOne({ alumniId: id.toUpperCase() })). This correctly
  // verifies any ALM0001, ALM0002, ALM0003 … record that exists in the database.
  const scheduleAlumniIdCheck = (value) => {
    if (alumniIdTimerRef.current) clearTimeout(alumniIdTimerRef.current);
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) { setAlumniIdStatus('idle'); return; }

    setAlumniIdStatus('checking');
    alumniIdTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/alumni/${encodeURIComponent(trimmed)}`,
          { headers: authHeader() },
        );
        // Only accept a 200 response with a valid body as "verified"
        if (res.ok) {
          const data = await res.json();
          setAlumniIdStatus(data && data.alumniId ? 'valid' : 'invalid');
        } else {
          setAlumniIdStatus('invalid');
        }
      } catch {
        setAlumniIdStatus('invalid');
      }
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear the field-level error as the user types
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    // D8: trigger alumni ID check on change
    if (name === 'alumniId') scheduleAlumniIdCheck(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    // D7/D9/D10/D11: run all field validations
    const errors = validateForm(form, isEdit);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({ type: 'error', message: 'Please fix the highlighted errors before saving.' });
      return;
    }

    // D8: Alumni ID must be verified before submit
    if (!form.alumniId.trim()) {
      setFieldErrors(prev => ({ ...prev, alumniId: 'Alumni ID is required.' }));
      setFeedback({ type: 'error', message: 'Please fix the highlighted errors before saving.' });
      return;
    }
    if (alumniIdStatus === 'invalid') {
      setFeedback({ type: 'error', message: `Alumni ID '${form.alumniId.trim().toUpperCase()}' does not exist. Please enter a valid Alumni ID.` });
      return;
    }
    if (alumniIdStatus === 'checking') {
      setFeedback({ type: 'error', message: 'Please wait — verifying Alumni ID...' });
      return;
    }
    if (alumniIdStatus === 'idle') {
      setFeedback({ type: 'error', message: 'Please enter a valid Alumni ID before saving.' });
      return;
    }

    setLoading(true);
    const payload = {
      jobId: form.jobId.trim().toUpperCase(),
      alumniId: form.alumniId.trim().toUpperCase(),
      company: form.company.trim(),
      role: form.role.trim(),
      applicationLink: form.applicationLink.trim(),
      datePosted: form.datePosted || null,
      dateOfExpiry: form.dateOfExpiry || null,
    };

    try {
      const url = isEdit ? `${API_BASE_URL}/alumni-jobs/${id}` : `${API_BASE_URL}/alumni-jobs`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeader(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setFeedback({ type: 'success', message: data.message });
      setTimeout(() => navigate('/alumni-jobs'), 1200);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally { setLoading(false); }
  };

  const alumniIdAdornment = () => {
    if (alumniIdStatus === 'checking') return <Loader2 size={16} className="spin-animate" style={{ color: 'var(--text-secondary)' }} />;
    if (alumniIdStatus === 'valid')    return <Check size={16} style={{ color: '#16a34a' }} />;
    if (alumniIdStatus === 'invalid')  return <X size={16} style={{ color: '#ef4444' }} />;
    return null;
  };

  const inputBorder = (field) =>
    fieldErrors[field] ? '#ef4444' : undefined;

  return (
    // D6/D12: scoped class so CSS can collapse the 2-column form-row on narrow screens
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="btn-back" onClick={() => navigate('/alumni-jobs')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEdit ? 'Edit Job Posting' : 'Add Job Posting'}
            </h1>
            <p className="page-subtitle">
              {isEdit ? 'Update alumni job details' : 'Add a new job opportunity from an alumni'}
            </p>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ marginBottom: '1.5rem' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* D6/D12: alumni-job-form-card scopes the responsive grid fix in CSS */}
      <div className="card alumni-job-form-card" style={{ maxWidth: '820px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading job details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout" noValidate>
            <div className="form-section">
              <h3 className="form-section-title">Job Information</h3>
              <div className="form-row">
                {/* D7: Job ID */}
                <div className="form-group">
                  <label className="form-label">
                    Job ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="jobId"
                    className={`form-input${fieldErrors.jobId ? ' input-error' : ''}`}
                    placeholder="e.g. JOB2024001"
                    value={form.jobId}
                    onChange={handleChange}
                    disabled={isEdit}
                    style={{ borderColor: inputBorder('jobId') }}
                    maxLength={20}
                  />
                  {fieldErrors.jobId && (
                    <p className="form-field-error">{fieldErrors.jobId}</p>
                  )}
                  {!isEdit && !fieldErrors.jobId && (
                    <p className="form-field-hint">
                      3–20 uppercase letters and/or digits, no spaces (e.g. JOB2024001).
                    </p>
                  )}
                </div>

                {/* D8: Alumni ID */}
                <div className="form-group">
                  <label className="form-label">
                    Alumni ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="alumniId"
                      className={`form-input${fieldErrors.alumniId ? ' input-error' : ''}`}
                      placeholder="e.g. ALM0001"
                      value={form.alumniId}
                      onChange={handleChange}
                      style={{
                        paddingRight: '2.25rem',
                        borderColor:
                          alumniIdStatus === 'valid'   ? '#16a34a' :
                          alumniIdStatus === 'invalid' ? '#ef4444' :
                          fieldErrors.alumniId         ? '#ef4444' : undefined,
                      }}
                    />
                    <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                      {alumniIdAdornment()}
                    </div>
                  </div>
                  {alumniIdStatus === 'invalid' && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem', color: '#ef4444' }}>
                      Alumni ID not found in the system.
                    </p>
                  )}
                  {alumniIdStatus === 'valid' && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem', color: '#16a34a' }}>
                      Alumni verified.
                    </p>
                  )}
                  {fieldErrors.alumniId && alumniIdStatus !== 'invalid' && (
                    <p className="form-field-error">{fieldErrors.alumniId}</p>
                  )}
                </div>
              </div>

              <div className="form-row">
                {/* D9: Company */}
                <div className="form-group">
                  <label className="form-label">
                    Company <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    className={`form-input${fieldErrors.company ? ' input-error' : ''}`}
                    placeholder="e.g. Amazon, TCS, 7-Eleven"
                    value={form.company}
                    onChange={handleChange}
                    maxLength={100}
                    style={{ borderColor: inputBorder('company') }}
                  />
                  {fieldErrors.company && (
                    <p className="form-field-error">{fieldErrors.company}</p>
                  )}
                </div>

                {/* D10: Role */}
                <div className="form-group">
                  <label className="form-label">
                    Role <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="role"
                    className={`form-input${fieldErrors.role ? ' input-error' : ''}`}
                    placeholder="e.g. Backend Developer, C++ Engineer"
                    value={form.role}
                    onChange={handleChange}
                    maxLength={100}
                    style={{ borderColor: inputBorder('role') }}
                  />
                  {fieldErrors.role && (
                    <p className="form-field-error">{fieldErrors.role}</p>
                  )}
                </div>
              </div>

              {/* D11: Application Link — now mandatory */}
              <div className="form-group">
                <label className="form-label">
                  Application Link <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="applicationLink"
                  className={`form-input${fieldErrors.applicationLink ? ' input-error' : ''}`}
                  placeholder="https://careers.company.com/apply/12345"
                  value={form.applicationLink}
                  onChange={handleChange}
                  style={{ borderColor: inputBorder('applicationLink') }}
                />
                {fieldErrors.applicationLink && (
                  <p className="form-field-error">{fieldErrors.applicationLink}</p>
                )}
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Dates</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Status is calculated automatically — jobs are shown as <strong>Active</strong> until the expiry date passes.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date Posted</label>
                  <input
                    type="date"
                    name="datePosted"
                    className="form-input"
                    value={form.datePosted}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Expiry</label>
                  <input
                    type="date"
                    name="dateOfExpiry"
                    className={`form-input${fieldErrors.dateOfExpiry ? ' input-error' : ''}`}
                    value={form.dateOfExpiry}
                    onChange={handleChange}
                    style={{ borderColor: inputBorder('dateOfExpiry') }}
                  />
                  {fieldErrors.dateOfExpiry && (
                    <p className="form-field-error">{fieldErrors.dateOfExpiry}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions-row" style={{ marginTop: '2rem' }}>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/alumni-jobs')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="books-btn books-btn-primary"
                disabled={loading || alumniIdStatus === 'checking'}
              >
                {loading
                  ? <><Loader2 size={16} className="spin-animate" /><span>Saving...</span></>
                  : <><Save size={16} /><span>{isEdit ? 'Update Job' : 'Save Job'}</span></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AlumniJobForm;
