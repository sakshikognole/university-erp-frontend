import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateGraduationYear,
} from '../utils/alumniValidation';
const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const FieldError = ({ message }) =>
  message ? (
    <p className="sf-field-error" role="alert">
      <AlertCircle size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
      {message}
    </p>
  ) : null;

// ---------------------------------------------------------------------------
// AlumniFormModal — Props: isOpen, alumniId (null=Add), onClose, onSuccess
// ---------------------------------------------------------------------------
const AlumniFormModal = ({ isOpen, alumniId, onClose, onSuccess }) => {
  const isEdit = Boolean(alumniId);

  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const fetchControllerRef = useRef(null);

  const emptyForm = {
    alumniId: '', name: '', graduationYear: '',
    jobTitle: '', currentCompany: '',
    email: '', phone: '',
    linkedin: '', instagram: '', twitter: '',
    github: '', portfolio: '', other: '',
  };
  const [form, setForm] = useState(emptyForm);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const reset = useCallback(() => {
    setForm(emptyForm);
    setFieldErrors({});
    setFeedback({ type: '', message: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    reset();
    if (isEdit) loadAlumni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, alumniId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  const loadAlumni = async () => {
    if (fetchControllerRef.current) fetchControllerRef.current.abort();
    const ctrl = new AbortController();
    fetchControllerRef.current = ctrl;
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni/${alumniId}`, {
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
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    if ((name === 'email' || name === 'phone') && fieldErrors._contact)
      setFieldErrors((prev) => ({ ...prev, _contact: undefined }));
  };

  const validate = () => {
    const errs = {};
    // alumniId: optional in add mode, but if filled must be alphanumeric (one hyphen allowed)
    if (!isEdit && form.alumniId.trim()) {
      const id = form.alumniId.trim();
      if (id.length > 30) errs.alumniId = 'Alumni ID must not exceed 30 characters.';
      else if (!/^[A-Za-z0-9]+(-[A-Za-z0-9]+)?$/.test(id))
        errs.alumniId = 'Alumni ID may only contain letters, digits, and one hyphen (e.g. ALM001, ALM-2024).';
    }
    const nameErr = validateName(form.name);
    if (nameErr) errs.name = nameErr;
    const yearErr = validateGraduationYear(form.graduationYear);
    if (yearErr) errs.graduationYear = yearErr;
    // Email is required
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else {
      const emailErr = validateEmail(form.email);
      if (emailErr) errs.email = emailErr;
    }
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const url    = isEdit ? `${API_BASE_URL}/alumni/${alumniId}` : `${API_BASE_URL}/alumni`;
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method, headers: authHeader(),
        body: JSON.stringify({
          alumniId:       form.alumniId.trim().toUpperCase() || undefined,
          name:           form.name.trim(),
          graduationYear: Number(form.graduationYear),
          jobTitle:       form.jobTitle.trim(),
          currentCompany: form.currentCompany.trim(),
          email:          form.email.trim().toLowerCase(),
          phone:          form.phone.trim(),
          socialLinks: {
            linkedin:  form.linkedin.trim(),
            instagram: form.instagram.trim(),
            twitter:   form.twitter.trim(),
            github:    form.github.trim(),
            portfolio: form.portfolio.trim(),
            other:     form.other.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setFeedback({ type: 'success', message: data.message || (isEdit ? 'Alumni updated.' : 'Alumni added.') });
      setTimeout(() => onSuccess(), 900);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sf-overlay" role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="sf-modal">

        {/* Header */}
        <div className="sf-header">
          <div className="sf-header-left">
            <h2 className="sf-title">{isEdit ? 'Edit Alumni' : 'Add Alumni'}</h2>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="sf-body">
          {feedback.message && (
            <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {fetching ? (
            <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading alumni details…</p></div>
          ) : (
            <form id="alumni-form" onSubmit={handleSubmit} className="sf-form" noValidate>

              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-alumniId">Alumni ID</label>
                  <input id="al-alumniId" name="alumniId" type="text" className={`sf-input${fieldErrors.alumniId ? ' sf-input-error' : ''}${isEdit ? ' sf-input-readonly' : ''}`}
                    placeholder="e.g. ALM001, ALM-2024" value={form.alumniId}
                    onChange={handleChange} readOnly={isEdit} disabled={isEdit} autoComplete="off" maxLength={30} />
                  {isEdit && <small className="sf-field-hint">Alumni ID cannot be changed after creation.</small>}
                  {!isEdit && <small className="sf-field-hint">Optional — leave blank to auto-generate.</small>}
                  <FieldError message={fieldErrors.alumniId} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-name">Name <span className="sf-required">*</span></label>
                  <input id="al-name" name="name" type="text"
                    className={`sf-input${fieldErrors.name ? ' sf-input-error' : ''}`}
                    placeholder="First and last name" value={form.name}
                    onChange={handleChange} autoComplete="off" />
                  <FieldError message={fieldErrors.name} />
                </div>
              </div>

              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-graduationYear">Graduation Year <span className="sf-required">*</span></label>
                  <input id="al-graduationYear" name="graduationYear" type="number"
                    className={`sf-input${fieldErrors.graduationYear ? ' sf-input-error' : ''}`}
                    placeholder="e.g. 2022" min="1950" max={new Date().getFullYear() + 5}
                    value={form.graduationYear} onChange={handleChange} />
                  <FieldError message={fieldErrors.graduationYear} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-jobTitle">Job Title <span className="sf-optional">optional</span></label>
                  <input id="al-jobTitle" name="jobTitle" type="text" className="sf-input"
                    placeholder="e.g. Software Engineer" value={form.jobTitle} onChange={handleChange} autoComplete="off" />
                </div>
              </div>

              <div className="sf-row">
                <div className="sf-group sf-group-full">
                  <label className="sf-label" htmlFor="al-currentCompany">Current Company <span className="sf-optional">optional</span></label>
                  <input id="al-currentCompany" name="currentCompany" type="text" className="sf-input"
                    placeholder="e.g. Google" value={form.currentCompany} onChange={handleChange} autoComplete="off" />
                </div>
              </div>

              {/* Contact */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-email">Email <span className="sf-required">*</span></label>
                  <input id="al-email" name="email" type="email"
                    className={`sf-input${fieldErrors.email ? ' sf-input-error' : ''}`}
                    placeholder="alumni@example.com" value={form.email}
                    onChange={handleChange} autoComplete="off" inputMode="email" />
                  <FieldError message={fieldErrors.email} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-phone">Phone</label>
                  <input id="al-phone" name="phone" type="text"
                    className={`sf-input${fieldErrors.phone ? ' sf-input-error' : ''}`}
                    placeholder="10-digit number" value={form.phone}
                    onChange={handleChange} autoComplete="off" inputMode="numeric" maxLength={10} />
                  <FieldError message={fieldErrors.phone} />
                </div>
              </div>

              {/* Social Links */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-linkedin">LinkedIn</label>
                  <input id="al-linkedin" name="linkedin" type="url" className="sf-input"
                    placeholder="https://linkedin.com/in/username" value={form.linkedin} onChange={handleChange} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-github">GitHub</label>
                  <input id="al-github" name="github" type="url" className="sf-input"
                    placeholder="https://github.com/username" value={form.github} onChange={handleChange} />
                </div>
              </div>

              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-instagram">Instagram</label>
                  <input id="al-instagram" name="instagram" type="url" className="sf-input"
                    placeholder="https://instagram.com/username" value={form.instagram} onChange={handleChange} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-twitter">Twitter / X</label>
                  <input id="al-twitter" name="twitter" type="url" className="sf-input"
                    placeholder="https://twitter.com/username" value={form.twitter} onChange={handleChange} />
                </div>
              </div>

              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-portfolio">Portfolio / Website</label>
                  <input id="al-portfolio" name="portfolio" type="url" className="sf-input"
                    placeholder="https://myportfolio.com" value={form.portfolio} onChange={handleChange} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="al-other">Other URL</label>
                  <input id="al-other" name="other" type="url" className="sf-input"
                    placeholder="Any other profile link" value={form.other} onChange={handleChange} />
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="alumni-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></> : <><Save size={15} /><span>{isEdit ? 'Update Alumni' : 'Save Alumni'}</span></>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AlumniFormModal;
