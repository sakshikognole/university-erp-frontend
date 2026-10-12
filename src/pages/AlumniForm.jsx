/**
 * AlumniForm.jsx — Add / Edit Alumni
 *
 * Defects fixed:
 *   D5  Form fields contained within card on mobile (alumni-form-card CSS)
 *   D6  Alumni ID placeholder shortened so it fits narrow viewports
 *   D10 Name validated with shared validateName (rejects numbers-only, etc.)
 *   D13 Email validated with shared validateEmail
 *   D14 Phone validated with shared validatePhone (10 digits)
 *   Imp-A  Job Title + Current Company marked optional (no mandatory change —
 *          see report: making them mandatory conflicts with valid alumni states)
 *   Imp-B  At least one contact method required (email or phone)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateContactRequired,
  validateGraduationYear,
} from '../utils/alumniValidation';

const _IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const AlumniForm = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isEdit    = Boolean(id);

  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchControllerRef = useRef(null);

  const [form, setForm] = useState({
    alumniId: '', name: '', graduationYear: '',
    jobTitle: '', currentCompany: '',
    email: '', phone: '',
    linkedin: '', instagram: '', twitter: '',
    github: '', portfolio: '', other: '',
  });

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (isEdit) loadAlumni();
    return () => { if (fetchControllerRef.current) fetchControllerRef.current.abort(); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAlumni = async () => {
    if (fetchControllerRef.current) fetchControllerRef.current.abort();
    const ctrl = new AbortController();
    fetchControllerRef.current = ctrl;

    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni/${id}`, {
        headers: authHeader(), signal: ctrl.signal,
      });
      if (!res.ok) throw new Error('Alumni not found');
      const a = await res.json();
      setForm({
        alumniId:       a.alumniId         || '',
        name:           a.name             || '',
        graduationYear: a.graduationYear   || '',
        jobTitle:       a.jobTitle         || '',
        currentCompany: a.currentCompany   || '',
        email:          a.email            || '',
        phone:          a.phone            || '',
        linkedin:       a.socialLinks?.linkedin   || '',
        instagram:      a.socialLinks?.instagram  || '',
        twitter:        a.socialLinks?.twitter    || '',
        github:         a.socialLinks?.github     || '',
        portfolio:      a.socialLinks?.portfolio  || '',
        other:          a.socialLinks?.other      || '',
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setFeedback({ type: 'error', message: err.message });
    } finally {
      if (fetchControllerRef.current === ctrl) setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    // Clear cross-field contact error when either field changes
    if ((name === 'email' || name === 'phone') && fieldErrors._contact)
      setFieldErrors(prev => ({ ...prev, _contact: undefined }));
  };

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};

    const nameErr = validateName(form.name);
    if (nameErr) errs.name = nameErr;

    const yearErr = validateGraduationYear(form.graduationYear);
    if (yearErr) errs.graduationYear = yearErr;

    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;

    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;

    // Improvement B: require at least one contact method
    if (!errs.email && !errs.phone) {
      const contactErr = validateContactRequired(form.email, form.phone);
      if (contactErr) errs._contact = contactErr;
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFeedback({ type: 'error', message: 'Please fix the highlighted errors before saving.' });
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const payload = {
      alumniId: form.alumniId.trim().toUpperCase() || undefined,
      name: form.name.trim(),
      graduationYear: Number(form.graduationYear),
      jobTitle: form.jobTitle.trim(),
      currentCompany: form.currentCompany.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      socialLinks: {
        linkedin:  form.linkedin.trim(),
        instagram: form.instagram.trim(),
        twitter:   form.twitter.trim(),
        github:    form.github.trim(),
        portfolio: form.portfolio.trim(),
        other:     form.other.trim(),
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

  // Render an inline error below a field
  const FieldError = ({ name }) =>
    fieldErrors[name]
      ? <p className="form-field-error" style={{ marginTop: '0.25rem' }}>{fieldErrors[name]}</p>
      : null;

  return (
    <div className="page-container">
      {/* D5: back arrow + heading — stacks correctly on mobile via existing CSS */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="btn-back" onClick={() => navigate('/alumni')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEdit ? 'Edit Alumni' : 'Add Alumni'}
            </h1>
            <p className="page-subtitle">
              {isEdit ? 'Update alumni profile details' : 'Add a new alumni profile to the directory'}
            </p>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ marginBottom: '1.5rem' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* D5: alumni-form-card scopes responsive single-column collapse */}
      <div className="card alumni-form-card" style={{ maxWidth: '820px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading alumni details…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout" noValidate>

            {/* Basic Info */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Alumni ID</label>
                  {/* D6: shorter placeholder so it fits narrow inputs */}
                  <input type="text" name="alumniId" className="form-input"
                    placeholder="e.g. ALM0001 (auto if blank)"
                    value={form.alumniId} onChange={handleChange}
                    disabled={isEdit} />
                  {!isEdit && (
                    <p className="form-field-hint">Leave blank to auto-generate.</p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" name="name"
                    className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
                    placeholder="First and last name"
                    value={form.name} onChange={handleChange} />
                  <FieldError name="name" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Graduation Year <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="number" name="graduationYear"
                    className={`form-input${fieldErrors.graduationYear ? ' input-error' : ''}`}
                    placeholder="e.g. 2022" min="1950" max={new Date().getFullYear() + 5}
                    value={form.graduationYear} onChange={handleChange} />
                  <FieldError name="graduationYear" />
                </div>
                <div className="form-group" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input type="text" name="jobTitle" className="form-input"
                    placeholder="e.g. Software Engineer"
                    value={form.jobTitle} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Company</label>
                  <input type="text" name="currentCompany" className="form-input"
                    placeholder="e.g. Google"
                    value={form.currentCompany} onChange={handleChange} />
                </div>
              </div>

              {/* Improvement B: contact required — show cross-field error above both fields */}
              {fieldErrors._contact && (
                <div className="feedback-banner feedback-error" style={{ marginBottom: '0.75rem', padding: '0.625rem 0.875rem' }}>
                  <AlertCircle size={15} />
                  <span>{fieldErrors._contact}</span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="text" name="email"
                    className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
                    placeholder="alumni@example.com"
                    value={form.email} onChange={handleChange} />
                  <FieldError name="email" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" name="phone"
                    className={`form-input${fieldErrors.phone ? ' input-error' : ''}`}
                    placeholder="10-digit number, e.g. 9876543210"
                    value={form.phone} onChange={handleChange} />
                  <FieldError name="phone" />
                  <p className="form-field-hint">10 digits (without country code)</p>
                </div>
              </div>
            </div>

            {/* Social / Profile URLs */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Social &amp; Profile Links</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">LinkedIn URL</label>
                  <input type="url" name="linkedin" className="form-input"
                    placeholder="https://linkedin.com/in/username"
                    value={form.linkedin} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input type="url" name="github" className="form-input"
                    placeholder="https://github.com/username"
                    value={form.github} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Instagram URL</label>
                  <input type="url" name="instagram" className="form-input"
                    placeholder="https://instagram.com/username"
                    value={form.instagram} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Twitter / X URL</label>
                  <input type="url" name="twitter" className="form-input"
                    placeholder="https://twitter.com/username"
                    value={form.twitter} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Portfolio / Website</label>
                  <input type="url" name="portfolio" className="form-input"
                    placeholder="https://myportfolio.com"
                    value={form.portfolio} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Other URL</label>
                  <input type="url" name="other" className="form-input"
                    placeholder="Any other profile link"
                    value={form.other} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-actions-row alumni-form-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="books-btn books-btn-ghost"
                onClick={() => navigate('/alumni')} disabled={loading}>Cancel</button>
              <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
                {loading
                  ? <><Loader2 size={16} className="spin-animate" /><span>Saving…</span></>
                  : <><Save size={16} /><span>{isEdit ? 'Update Alumni' : 'Save Alumni'}</span></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AlumniForm;
