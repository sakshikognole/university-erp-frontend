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

// Letters, spaces, dots, commas, hyphens, ampersands (for names/trust)
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

// Address: letters, numbers, spaces, commas, hyphens, dots, slashes
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

// Phone: must be +91-XXXX-XXXXXX format (exactly 10 digits after +91)
function validatePhone(val) {
  if (!val) return ''; // empty = optional, skip
  if (!val.trim() || /^\s+$/.test(val)) return 'Phone cannot be spaces only.';
  // Allow format: +91-XXXXXXXXXX or +91-XXXX-XXXXXX
  if (!/^\+91[-\s]?\d{4,5}[-\s]?\d{5,6}$/.test(val.trim()))
    return 'Phone must be in +91-XXXX-XXXXXX format with exactly 10 digits after +91.';
  // Count digits after +91
  const digits = val.replace(/^\+91/, '').replace(/[-\s]/g, '');
  if (digits.length !== 10) return 'Phone must have exactly 10 digits after +91.';
  return '';
}

// Toll Free: format XXXX-XXX-XXXX (11 digits with hyphen)
function validateTollFree(val) {
  if (!val) return ''; // empty = optional
  if (!val.trim() || /^\s+$/.test(val)) return 'Toll Free cannot be spaces only.';
  if (!/^\d{4}-\d{3}-\d{4}$/.test(val.trim()))
    return 'Toll Free must be in XXXX-XXX-XXXX format (e.g. 1800-000-0000).';
  const digits = val.replace(/-/g, '');
  if (digits.length !== 11) return 'Toll Free must have exactly 11 digits.';
  return '';
}

// Fax: +91-XXXX-XXXXXX format
function validateFax(val) {
  if (!val) return ''; // empty = optional
  if (!val.trim() || /^\s+$/.test(val)) return 'Fax cannot be spaces only.';
  if (!/^\+91[-\s]?\d{4,5}[-\s]?\d{5,6}$/.test(val.trim()))
    return 'Fax must be in +91-STD-Number format (e.g. +91-0000-000001).';
  return '';
}

// Website: must start with www. or http
function validateWebsite(val) {
  if (!val) return ''; // empty = optional
  if (!val.trim() || /^\s+$/.test(val)) return 'Website cannot be spaces only.';
  if (/^\d+$/.test(val.trim())) return 'Website cannot be numbers only.';
  if (/^[^A-Za-z0-9]+$/.test(val.trim())) return 'Website must contain letters.';
  if (!/^(https?:\/\/|www\.)[A-Za-z0-9]/.test(val.trim()))
    return 'Website must start with www. or http:// (e.g. www.university.edu).';
  return '';
}

// Email: standard format, lowercase enforced, no consecutive dots
function validateEmail(val) {
  if (!val) return ''; // empty = optional
  if (!val.trim() || /^\s+$/.test(val)) return 'Email cannot be spaces only.';
  // No consecutive dots, must have @ with domain
  if (/\.{2,}/.test(val.trim())) return 'Email must not contain consecutive dots.';
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(val.trim()))
    return 'Enter a valid email address in lowercase (e.g. contact@university.edu).';
  return '';
}

// Logo text: letters/numbers only, max 8 chars
function validateLogo(val) {
  if (!val) return ''; // empty = optional
  if (!val.trim() || /^\s+$/.test(val)) return 'Logo text cannot be spaces only.';
  if (/^[^A-Za-z0-9]+$/.test(val.trim())) return 'Logo text must contain letters or numbers.';
  if (val.trim().length > 8) return 'Logo text must not exceed 8 characters.';
  return '';
}

// Run all validations and return errors object
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
    // D16: auto-lowercase email
    const newVal = name === 'email' ? value.toLowerCase() : value;
    // D18: max 8 chars for logoText
    if (name === 'logoText' && value.length > 8) return;
    setForm((f) => ({ ...f, [name]: newVal }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setSuccess('');
  }

  // D5/D6: Phone country code helper — prepend +91- if user starts typing digits
  function handlePhoneChange(e) {
    let val = e.target.value;
    if (val && !val.startsWith('+')) val = '+91-' + val;
    setForm(f => ({ ...f, phone: val }));
    setErrors(er => ({ ...er, phone: '' }));
  }

  // D11/D12: Fax country code helper
  function handleFaxChange(e) {
    let val = e.target.value;
    if (val && !val.startsWith('+')) val = '+91-' + val;
    setForm(f => ({ ...f, fax: val }));
    setErrors(er => ({ ...er, fax: '' }));
  }

  async function handleSave(e) {
    e.preventDefault();
    // D2: validate all fields, show errors below each field
    const errs = validateAll(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true); setSuccess('');
    try {
      await springApi.put('/letterhead', {
        ...form,
        // D16: ensure email is lowercase before saving
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

  return (
    <div className="page-container">
      <h1 className="page-title">Letterhead Editor</h1>
      <p className="stu-page-sub">
        These details appear on every generated certificate PDF.
      </p>

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

            {/* D1/D19/Imp2: Trust Name — now mandatory with asterisk */}
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

            {/* D2/D3: College Name — mandatory, shown below field */}
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

            {/* D4/Imp2: Address — now mandatory */}
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

            {/* D17/D18: Logo Text — max 8 chars, no special chars */}
            <div className="stu-form-group">
              <label className="stu-form-label">Logo Text</label>
              <input
                className={`stu-input ${errors.logoText ? 'err' : ''}`}
                name="logoText" value={form.logoText} onChange={change}
                placeholder="e.g. LOGO (max 8 characters)"
                maxLength={8}
              />
              <span className="stu-hint">
                Letters and numbers only · max 8 characters
                {form.logoText ? ` · ${form.logoText.length}/8` : ''}
              </span>
              {err('logoText')}
            </div>

            <p className="lh-section-title" style={{ marginTop: 8 }}>Contact Details</p>

            {/* D5/D6/D7/Imp1: Phone — +91 prefix auto-added, 10 digits */}
            <div className="lh-two-col">
              <div className="stu-form-group">
                <label className="stu-form-label">Phone</label>
                <input
                  className={`stu-input ${errors.phone ? 'err' : ''}`}
                  name="phone" value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="+91-0000-000000"
                />
                <span className="stu-hint">Format: +91-XXXX-XXXXXX (10 digits)</span>
                {err('phone')}
              </div>

              {/* D8/D9/D10: Toll Free — XXXX-XXX-XXXX, 11 digits */}
              <div className="stu-form-group">
                <label className="stu-form-label">Toll Free</label>
                <input
                  className={`stu-input ${errors.tollFree ? 'err' : ''}`}
                  name="tollFree" value={form.tollFree} onChange={change}
                  placeholder="1800-000-0000"
                />
                <span className="stu-hint">Format: XXXX-XXX-XXXX (11 digits)</span>
                {err('tollFree')}
              </div>
            </div>

            {/* D11/D12/Imp3: Fax — +91 prefix, STD format */}
            <div className="lh-two-col">
              <div className="stu-form-group">
                <label className="stu-form-label">Fax</label>
                <input
                  className={`stu-input ${errors.fax ? 'err' : ''}`}
                  name="fax" value={form.fax}
                  onChange={handleFaxChange}
                  placeholder="+91-0000-000001"
                />
                <span className="stu-hint">Format: +91-STD-Number</span>
                {err('fax')}
              </div>

              {/* D13: Website */}
              <div className="stu-form-group">
                <label className="stu-form-label">Website</label>
                <input
                  className={`stu-input ${errors.website ? 'err' : ''}`}
                  name="website" value={form.website} onChange={change}
                  placeholder="www.university.edu"
                />
                <span className="stu-hint">Must start with www. or http://</span>
                {err('website')}
              </div>
            </div>

            {/* D14/D15/D16: Email — format + lowercase */}
            <div className="stu-form-group">
              <label className="stu-form-label">Email</label>
              <input
                className={`stu-input ${errors.email ? 'err' : ''}`}
                name="email" value={form.email} onChange={change}
                placeholder="contact@university.edu"
                style={{ textTransform: 'lowercase' }}
              />
              <span className="stu-hint">Lowercase only · e.g. contact@university.edu</span>
              {err('email')}
            </div>

            <div className="stu-button-row">
              <button className="stu-btn stu-btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Letterhead'}
              </button>
            </div>
          </div>
        </form>

        {/* ── Live preview ── */}
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
                  {(form.phone || form.tollFree || form.fax) && (
                    <p className="lh-preview-small">
                      {[
                        form.phone    && `Tel: ${form.phone}`,
                        form.tollFree && `Toll Free: ${form.tollFree}`,
                        form.fax      && `Fax: ${form.fax}`,
                      ].filter(Boolean).join('  |  ')}
                    </p>
                  )}
                  {(form.website || form.email) && (
                    <p className="lh-preview-small">
                      {[
                        form.website && `Web: ${form.website}`,
                        form.email   && `Email: ${form.email}`,
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
