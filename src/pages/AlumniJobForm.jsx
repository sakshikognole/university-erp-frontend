---import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, Check, X } from 'lucide-react';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = `${_NODE_URL}/api`;

const toInputDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
};

const AlumniJobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Alumni ID validation state
  const [alumniIdStatus, setAlumniIdStatus] = useState('idle'); // idle | checking | valid | invalid
  const [alumniIdTimer, setAlumniIdTimer] = useState(null);

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

  useEffect(() => { if (isEdit) loadJob(); }, [id]);

  const loadJob = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni-jobs/${id}`, { headers: authHeader() });
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
      // Alumni ID already confirmed valid in edit mode
      setAlumniIdStatus('valid');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally { setFetching(false); }
  };

  // Debounced alumni ID lookup
  const validateAlumniId = (value) => {
    if (alumniIdTimer) clearTimeout(alumniIdTimer);
    if (!value.trim()) { setAlumniIdStatus('idle'); return; }

    setAlumniIdStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/alumni/${value.trim().toUpperCase()}`, { headers: authHeader() });
        setAlumniIdStatus(res.ok ? 'valid' : 'invalid');
      } catch {
        setAlumniIdStatus('invalid');
      }
    }, 500);
    setAlumniIdTimer(timer);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'alumniId') validateAlumniId(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!form.jobId.trim() || !form.alumniId.trim() || !form.company.trim() || !form.role.trim()) {
      setFeedback({ type: 'error', message: 'Job ID, Alumni ID, Company, and Role are required.' });
      return;
    }
    if (alumniIdStatus === 'invalid') {
      setFeedback({ type: 'error', message: `Alumni ID '${form.alumniId}' does not exist. Please enter a valid Alumni ID.` });
      return;
    }
    if (alumniIdStatus === 'checking') {
      setFeedback({ type: 'error', message: 'Please wait -----" verifying Alumni ID...' });
      return;
    }
    if (form.datePosted && form.dateOfExpiry && new Date(form.dateOfExpiry) < new Date(form.datePosted)) {
      setFeedback({ type: 'error', message: 'Expiry date must be after the posted date.' });
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
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: authHeader(), body: JSON.stringify(payload) });
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
    if (alumniIdStatus === 'valid') return <Check size={16} style={{ color: '#16a34a' }} />;
    if (alumniIdStatus === 'invalid') return <X size={16} style={{ color: '#ef4444' }} />;
    return null;
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="btn-back" onClick={() => navigate('/alumni-jobs')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{isEdit ? 'Edit Job Posting' : 'Add Job Posting'}</h1>
            <p className="page-subtitle">{isEdit ? 'Update alumni job details' : 'Add a new job opportunity from an alumni'}</p>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`} style={{ marginBottom: '1.5rem' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="card" style={{ maxWidth: '820px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading job details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-section">
              <h3 className="form-section-title">Job Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Job ID <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="jobId" className="form-input" placeholder="e.g. JOB2024001"
                    value={form.jobId} onChange={handleChange} required disabled={isEdit} />
                </div>
                <div className="form-group">
                  <label className="form-label">Alumni ID <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="alumniId"
                      className="form-input"
                      placeholder="e.g. ALM0001"
                      value={form.alumniId}
                      onChange={handleChange}
                      required
                      style={{
                        paddingRight: '2.25rem',
                        borderColor: alumniIdStatus === 'valid' ? '#16a34a' : alumniIdStatus === 'invalid' ? '#ef4444' : undefined,
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
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="company" className="form-input" placeholder="e.g. Amazon"
                    value={form.company} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="role" className="form-input" placeholder="e.g. Backend Developer"
                    value={form.role} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Application Link</label>
                <input type="url" name="applicationLink" className="form-input" placeholder="https://careers.company.com/apply/12345"
                  value={form.applicationLink} onChange={handleChange} />
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Dates</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Status is calculated automatically -----" jobs are shown as <strong>Active</strong> until the expiry date passes.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date Posted</label>
                  <input type="date" name="datePosted" className="form-input"
                    value={form.datePosted} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Expiry</label>
                  <input type="date" name="dateOfExpiry" className="form-input"
                    value={form.dateOfExpiry} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-actions-row" style={{ marginTop: '2rem' }}>
              <button type="button" className="books-btn books-btn-ghost" onClick={() => navigate('/alumni-jobs')} disabled={loading}>Cancel</button>
              <button type="submit" className="books-btn books-btn-primary" disabled={loading || alumniIdStatus === 'checking'}>
                {loading ? <><Loader2 size={16} className="spin-animate" /><span>Saving...</span></> : <><Save size={16} /><span>{isEdit ? 'Update Job' : 'Save Job'}</span></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AlumniJobForm;
