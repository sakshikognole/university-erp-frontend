import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = ${_NODE_URL}/api;

const AlumniForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [form, setForm] = useState({
    alumniId: '',
    name: '',
    graduationYear: '',
    jobTitle: '',
    currentCompany: '',
    email: '',
    phone: '',
    linkedin: '',
    instagram: '',
    twitter: '',
    github: '',
    portfolio: '',
    other: '',
  });

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (isEdit) loadAlumni();
  }, [id]);

  const loadAlumni = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni/${id}`, { headers: authHeader() });
      if (!res.ok) throw new Error('Alumni not found');
      const a = await res.json();
      setForm({
        alumniId: a.alumniId || '',
        name: a.name || '',
        graduationYear: a.graduationYear || '',
        jobTitle: a.jobTitle || '',
        currentCompany: a.currentCompany || '',
        email: a.email || '',
        phone: a.phone || '',
        linkedin: a.socialLinks?.linkedin || '',
        instagram: a.socialLinks?.instagram || '',
        twitter: a.socialLinks?.twitter || '',
        github: a.socialLinks?.github || '',
        portfolio: a.socialLinks?.portfolio || '',
        other: a.socialLinks?.other || '',
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!form.name.trim() || !form.graduationYear) {
      setFeedback({ type: 'error', message: 'Name and Graduation Year are required.' });
      return;
    }

    const year = Number(form.graduationYear);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 5) {
      setFeedback({ type: 'error', message: 'Enter a valid graduation year.' });
      return;
    }

    setLoading(true);

    const payload = {
      alumniId: form.alumniId.trim().toUpperCase() || undefined,
      name: form.name.trim(),
      graduationYear: year,
      jobTitle: form.jobTitle.trim(),
      currentCompany: form.currentCompany.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      socialLinks: {
        linkedin: form.linkedin.trim(),
        instagram: form.instagram.trim(),
        twitter: form.twitter.trim(),
        github: form.github.trim(),
        portfolio: form.portfolio.trim(),
        other: form.other.trim(),
      },
    };

    try {
      const url = isEdit ? `${API_BASE_URL}/alumni/${id}` : `${API_BASE_URL}/alumni`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeader(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setFeedback({ type: 'success', message: data.message });
      setTimeout(() => navigate('/alumni'), 1200);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="btn-back" onClick={() => navigate('/alumni')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{isEdit ? 'Edit Alumni' : 'Add Alumni'}</h1>
            <p className="page-subtitle">{isEdit ? 'Update alumni profile details' : 'Add a new alumni profile to the directory'}</p>
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
            <p>Loading alumni details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            {/* Basic Info */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Alumni ID</label>
                  <input type="text" name="alumniId" className="form-input" placeholder="e.g. ALM0001 (auto-generated if blank)"
                    value={form.alumniId} onChange={handleChange}
                    disabled={isEdit} />
                  {!isEdit && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Leave blank to auto-generate.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="name" className="form-input" placeholder="Full name"
                    value={form.name} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Graduation Year <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="number" name="graduationYear" className="form-input" placeholder="e.g. 2022"
                    min="1950" max={new Date().getFullYear() + 5}
                    value={form.graduationYear} onChange={handleChange} required />
                </div>
                <div className="form-group" />
              </div>              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input type="text" name="jobTitle" className="form-input" placeholder="e.g. Software Engineer"
                    value={form.jobTitle} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Company</label>
                  <input type="text" name="currentCompany" className="form-input" placeholder="e.g. Google"
                    value={form.currentCompany} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-input" placeholder="alumni@example.com"
                    value={form.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" name="phone" className="form-input" placeholder="+91 9876543210"
                    value={form.phone} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Social / Profile URLs */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Social &amp; Profile Links</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">LinkedIn URL</label>
                  <input type="url" name="linkedin" className="form-input" placeholder="https://linkedin.com/in/username"
                    value={form.linkedin} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input type="url" name="github" className="form-input" placeholder="https://github.com/username"
                    value={form.github} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Instagram URL</label>
                  <input type="url" name="instagram" className="form-input" placeholder="https://instagram.com/username"
                    value={form.instagram} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Twitter / X URL</label>
                  <input type="url" name="twitter" className="form-input" placeholder="https://twitter.com/username"
                    value={form.twitter} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Portfolio / Website URL</label>
                  <input type="url" name="portfolio" className="form-input" placeholder="https://myportfolio.com"
                    value={form.portfolio} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Other URL</label>
                  <input type="url" name="other" className="form-input" placeholder="Any other profile link"
                    value={form.other} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-actions-row" style={{ marginTop: '2rem' }}>
              <button type="button" className="books-btn books-btn-ghost" onClick={() => navigate('/alumni')} disabled={loading}>Cancel</button>
              <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
                {loading ? <><Loader2 size={16} className="spin-animate" /><span>Saving...</span></> : <><Save size={16} /><span>{isEdit ? 'Update Alumni' : 'Save Alumni'}</span></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AlumniForm;
