import { useState, useEffect } from 'react';
import { springApi, springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';

const EMPTY = {
  trustName:   '',
  collegeName: '',
  address:     '',
  phone:       '',
  tollFree:    '',
  fax:         '',
  website:     '',
  email:       '',
  logoText:    '',
};

// ── Validation helpers ────────────────────────────────────────────────────────

function validateName(val, label) {
  const t = val.trim();
  if (!t) return `${label} is required.`;
  if (/^\s+$/.test(val)) return `${label} cannot be spaces only.`;
  if (!/^[A-Za-z\s.,\-&()'/]+$/.test(t))
    return `${label} must contain only letters and standard punctuation.`;
  if (t.length < 2) return `${label} must be at least 2 characters.`;
  if (t.length > 150) return `${label} must not exceed 150 characters.`;
  return '';
}

function validateAddress(val) {
  const t = val.trim();
  if (!t) return 'Address is required.';
  if (/^\s+$/.test(val)) return 'Address cannot be spaces only.';
  if (/^[0-9\s,.\-/]+$/.test(t) && !/[A-Za-z]/.test(t))
    return 'Address must contain letters.';
  if (/^[^A-Za-z0-9]+$/.test(t))
    return 'Address must contain letters or numbers.';
  if (t.length < 5) return 'Address must be at least 5 characters.';
  return '';
}

// Phone: exactly 10 digits (stored without formatting)
function validatePhone(val) {
  if (!val) return '';
  const digits = val.replace(/-/g, '');
  if (digits.length !== 10) return 'Phone must have exactly 10 digits.';
  return '';
}

// Toll Free: exactly 11 digits
function validateTollFree(val) {
  if (!val) return '';
  const digits = val.replace(/-/g, '');
  if (digits.length !== 11) return 'Toll Free must have exactly 11 digits.';
  return '';
}

// Fax: 4 digits + hyphen + remaining digits
function validateFax(val) {
  if (!val) return '';
  const digits = val.replace(/-/g, '');
  if (!/^\d+$/.test(digits)) return 'Fax must contain only numbers.';
  if (digits.length < 8) return 'Fax must have at least 8 digits.';
  return '';
}

// Website: must be a valid URL
function validateWebsite(val) {
  if (!val) return '';
  if (!val.trim() || /^\s+$/.test(val)) return 'Website cannot be spaces only.';
  if (/^\d+$/.test(val.trim())) return 'Invalid website URL. Please enter a valid website URL (e.g., www.university.edu).';
  if (/^[^A-Za-z0-9]+$/.test(val.trim())) return 'Invalid website URL. Please enter a valid website URL (e.g., www.university.edu).';
  if (/^[A-Za-z]+$/.test(val.trim())) return 'Invalid website URL. Please enter a valid website URL (e.g., www.university.edu).';
  if (!/^(https?:\/\/|www\.)[A-Za-z0-9]/.test(val.trim()))
    return 'Invalid website URL. Please enter a valid website URL (e.g., www.university.edu).';
  return '';
}

// Email: standard format
function validateEmail(val) {
  if (!val) return '';
  if (!val.trim() || /^\s+$/.test(val)) return 'Email cannot be spaces only.';
  if (/\.{2,}/.test(val.trim())) return 'Invalid email. Please enter a valid email (e.g., contact@university.edu).';
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(val.trim()))
    return 'Invalid email. Please enter a valid email (e.g., contact@university.edu).';
  return '';
}

// Logo text: letters/numbers only, max 8 chars
function validateLogo(val) {
  if (!val) return '';
  if (!val.trim() || /^\s+$/.test(val)) return 'Logo text cannot be spaces only.';
  if (/^[^A-Za-z0-9]+$/.test(val.trim())) return 'Logo text must contain letters or numbers.';
  if (val.trim().length > 8) return 'Logo text must not exceed 8 characters.';
  return '';
}

// Check if a field value is valid for live preview
function isValidForPreview(val, type) {
  if (!val || !val.trim()) return false;
  switch (type) {
    case 'phone':    return /^\d{10}$/.test(val.replace(/-/g, ''));
    case 'tollFree': return /^\d{11}$/.test(val.replace(/-/g, ''));
    case 'fax':      return val.replace(/-/g, '').length >= 8;
    case 'website':  return /^(https?:\/\/|www\.)[A-Za-z0-9]/.test(val.trim());
    case 'email':    return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(val.trim());
    default:         return val.trim().length > 0;
  }
}

function validateAll(form) {
  const e = {};
  const trust = validateName(form.trustName, 'Trust / Management Name');
  if (trust) e.trustName = trust;
  const college = validateName(form.collegeName, 'College / Institute Name');
  if (college) e.collegeName = college;
  const address = validateAddress(form.address);
  if (address) e.address = address;
  const phone = validatePhone(form.phone);
  if (phone) e.phone = phone;
  const tollFree = validateTollFree(form.tollFree);
  if (tollFree) e.tollFree = tollFree;
  const fax = validateFax(form.fax);
  if (fax) e.fax = fax;
  const website = validateWebsite(form.website);
  if (website) e.website = website;
  const email = validateEmail(form.email);
  if (email) e.email = email;
  const logo = validateLogo(form.logoText);
  if (logo) e.logoText = logo;
  return e;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LetterHeadEditorPage() {
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    springGet('/letterhead')
      .then((res) => setForm({ ...EMPTY, ...(res || {}) }))
      .catch((err) => setLoadErr(err.message || 'Failed to load letterhead settings.'))
      .finally(() => setLoading(false));
  }, []);

  function change(e) {
    const { name, value } = e.target;
    const newVal = name === 'email' ? value.toLowerCase() : value;
    if (name === 'logoText' && value.length > 8) return;
    setForm((f) => ({ ...f, [name]: newVal }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setSuccess('');
  }

  // Phone: only digits, max 10, auto-format as XX-XXXXX-XXXXX
  function handlePhoneChange(e) {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    // Format: XXXXX-XXXXX (5-5)
    let formatted = digits;
    if (digits.length > 5) formatted = digits.slice(0, 5) + '-' + digits.slice(5);
    setForm(f => ({ ...f, phone: formatted }));
    setErrors(er => ({ ...er, phone: '' }));
    setSuccess('');
  }

  // Toll Free: only digits, max 11, auto-format XXXX-XXX-XXXX
  function handleTollFreeChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 7) {
      formatted = digits.slice(0, 4) + '-' + digits.slice(4, 7) + '-' + digits.slice(7);
    } else if (digits.length > 4) {
      formatted = digits.slice(0, 4) + '-' + digits.slice(4);
    }
    setForm(f => ({ ...f, tollFree: formatted }));
    setErrors(er => ({ ...er, tollFree: '' }));
    setSuccess('');
  }

  // Fax: only digits, auto-insert hyphen after 4 digits (XXXX-XXXXXXXX)
  function handleFaxChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = digits.slice(0, 4) + '-' + digits.slice(4);
    }
    setForm(f => ({ ...f, fax: formatted }));
    setErrors(er => ({ ...er, fax: '' }));
    setSuccess('');
  }

  async function handleSave(e) {
    e.preventDefault();
    const errs = validateAll(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true); setSuccess('');
    try {
      await springApi.put('/letterhead', {
        ...form,
        email: form.email.toLowerCase(),
      });
      setSuccess('Letterhead saved. It will appear on all new certificates.');
    } catch {
      setErrors(er => ({ ...er, _form: 'Failed to save. Please try again.' }));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader message="Loading letterhead settings..." />;
  if (loadErr) return <PageError message={loadErr} onRetry={() => {
    setLoadErr(''); setLoading(true);
    springGet('/letterhead').then(r => setForm({ ...EMPTY, ...(r||{}) }))
      .catch(e => setLoadErr(e.message)).finally(() => setLoading(false));
  }} />;

  const err = (field) => errors[field]
    ? <p className="books-form-err" style={{ marginTop: 3 }}>{errors[field]}</p>
    : null;

  // Preview values — only show valid ones
  const preview = {
    phone:    isValidForPreview(form.phone, 'phone')    ? form.phone    : '',
    tollFree: isValidForPreview(form.tollFree,'tollFree')? form.tollFree : '',
    fax:      isValidForPreview(form.fax, 'fax')         ? form.fax      : '',
    website:  isValidForPreview(form.website, 'website') ? form.website  : '',
    email:    isValidForPreview(form.email, 'email')     ? form.email    : '',
  };

  return (
    <div className="page-container">
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Letterhead Editor</h1>
          <p className="page-subtitle">
            These details appear on every generated certificate PDF.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Edit form ── */}
        <form onSubmit={handleSave} noValidate style={{ flex: '1 1 380px' }}>
          <div className="card stu-form-card" style={{ maxWidth: '100%' }}>

            {errors._form && (
              <div className="books-alert books-alert-error" style={{ marginBottom: 12 }}>
                <span>{errors._form}</span>
              </div>
            )}
            {success && (
              <div className="books-alert books-alert-success" style={{ marginBottom: 12 }}>
                <span>{success}</span>
              </div>
            )}

            <p className="lh-section-title">Institution Details</p>

            <div className="stu-form-group">
              <label className="stu-form-label">
                Trust / Management Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className={`stu-input ${errors.trustName ? 'err' : ''}`}
                name="trustName" value={form.trustName} onChange={change}
                placeholder="e.g. ABC Educational Trust"
              />
              {err('trustName')}
            </div>

            <div className="stu-form-group">
              <label className="stu-form-label">
                College / Institute Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className={`stu-input ${errors.collegeName ? 'err' : ''}`}
                name="collegeName" value={form.collegeName} onChange={change}
                placeholder="e.g. XYZ Institute of Technology"
              />
              {err('collegeName')}
            </div>

            <div className="stu-form-group">
              <label className="stu-form-label">
                Address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className={`stu-input ${errors.address ? 'err' : ''}`}
                name="address" value={form.address} onChange={change}
                placeholder="e.g. 123 College Road, City - 000000, State, India"
              />
              {err('address')}
            </div>

            {/* Logo Text — no hint text */}
            <div className="stu-form-group">
              <label className="stu-form-label">Logo Text</label>
              <input
                className={`stu-input ${errors.logoText ? 'err' : ''}`}
                name="logoText" value={form.logoText} onChange={change}
                placeholder="e.g. LOGO"
                maxLength={8}
              />
              {err('logoText')}
            </div>

            <p className="lh-section-title" style={{ marginTop: 8 }}>Contact Details</p>

            <div className="lh-two-col">
              {/* Phone — only digits, max 10, no hint */}
              <div className="stu-form-group">
                <label className="stu-form-label">Phone</label>
                <input
                  className={`stu-input ${errors.phone ? 'err' : ''}`}
                  name="phone" value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="e.g. 98765-43210"
                />
                {err('phone')}
              </div>

              {/* Toll Free — only digits, max 11, auto-format, no hint */}
              <div className="stu-form-group">
                <label className="stu-form-label">Toll Free</label>
                <input
                  className={`stu-input ${errors.tollFree ? 'err' : ''}`}
                  name="tollFree" value={form.tollFree}
                  onChange={handleTollFreeChange}
                  placeholder="e.g. 1800-000-0000"
                />
                {err('tollFree')}
              </div>
            </div>

            <div className="lh-two-col">
              {/* Fax — only digits, auto-insert hyphen after 4, no hint */}
              <div className="stu-form-group">
                <label className="stu-form-label">Fax</label>
                <input
                  className={`stu-input ${errors.fax ? 'err' : ''}`}
                  name="fax" value={form.fax}
                  onChange={handleFaxChange}
                  placeholder="e.g. 0000-00000001"
                />
                {err('fax')}
              </div>

              {/* Website — no hint */}
              <div className="stu-form-group">
                <label className="stu-form-label">Website</label>
                <input
                  className={`stu-input ${errors.website ? 'err' : ''}`}
                  name="website" value={form.website} onChange={change}
                  placeholder="www.university.edu"
                />
                {err('website')}
              </div>
            </div>

            {/* Email — no hint */}
            <div className="stu-form-group">
              <label className="stu-form-label">Email</label>
              <input
                className={`stu-input ${errors.email ? 'err' : ''}`}
                name="email" value={form.email} onChange={change}
                placeholder="contact@university.edu"
                style={{ textTransform: 'lowercase' }}
              />
              {err('email')}
            </div>

            <div className="stu-button-row">
              <button className="stu-btn stu-btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Letterhead'}
              </button>
            </div>
          </div>
        </form>

        {/* ── Live preview — only valid values shown ── */}
        <div style={{ flex: '1 1 320px' }}>
          <div className="card stu-form-card" style={{ maxWidth: '100%' }}>
            <p className="lh-section-title">Live Preview</p>
            <p className="stu-hint" style={{ marginBottom: 12 }}>
              This is how the header will look on certificates.
            </p>
            <div className="lh-preview-box">
              <div className="lh-preview-topbar" />
              <div className="lh-preview-inner">
                <div className="lh-preview-logo">
                  {form.logoText || 'LOGO'}
                </div>
                <div className="lh-preview-text">
                  {form.trustName && (
                    <p className="lh-preview-trust">{form.trustName}</p>
                  )}
                  <p className="lh-preview-college">
                    {form.collegeName || 'College Name'}
                  </p>
                  {form.address && (
                    <p className="lh-preview-small">{form.address}</p>
                  )}
                  {(preview.phone || preview.tollFree || preview.fax) && (
                    <p className="lh-preview-small">
                      {[
                        preview.phone    && `Tel: ${preview.phone}`,
                        preview.tollFree && `Toll Free: ${preview.tollFree}`,
                        preview.fax      && `Fax: ${preview.fax}`,
                      ].filter(Boolean).join('  |  ')}
                    </p>
                  )}
                  {(preview.website || preview.email) && (
                    <p className="lh-preview-small">
                      {[
                        preview.website && `Web: ${preview.website}`,
                        preview.email   && `Email: ${preview.email}`,
                      ].filter(Boolean).join('  |  ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="lh-preview-bottombar">
                <div className="lh-preview-line1" />
                <div className="lh-preview-line2" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
