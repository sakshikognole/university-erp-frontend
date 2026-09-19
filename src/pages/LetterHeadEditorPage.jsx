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

export default function LetterHeadEditorPage() {
  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    springGet('/letterhead')
      .then((res) => {
        setForm({ ...EMPTY, ...(res || {}) });
      })
      .catch((err) => setError(err.message || 'Failed to load letterhead settings.'))
      .finally(() => setLoading(false));
  }, []);

  function change(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setSuccess(''); setError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.collegeName.trim()) { setError('College name is required.'); return; }
    setSaving(true); setSuccess(''); setError('');
    try {
      await springApi.put('/letterhead', form);
      setSuccess('Letterhead saved. It will appear on all new certificates.');
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader message="Loading letterhead settings..." />;
  if (error && !form.collegeName) return <PageError message={error} onRetry={() => { setError(''); setLoading(true); springGet('/letterhead').then(r => setForm({ ...EMPTY, ...(r||{}) })).catch(e => setError(e.message)).finally(() => setLoading(false)); }} />;

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
            <p className="lh-section-title">Institution Details</p>

            <div className="stu-form-group">
              <label className="stu-form-label">Trust / Management Name</label>
              <input className="stu-input" name="trustName"
                value={form.trustName} onChange={change}
                placeholder="e.g. ABC Educational Trust" />
            </div>

            <div className="stu-form-group">
              <label className="stu-form-label">College / Institute Name *</label>
              <input className="stu-input" name="collegeName"
                value={form.collegeName} onChange={change}
                placeholder="e.g. XYZ Institute of Technology" />
            </div>

            <div className="stu-form-group">
              <label className="stu-form-label">Address</label>
              <input className="stu-input" name="address"
                value={form.address} onChange={change}
                placeholder="e.g. 123 College Road, City - 000000, State, India" />
            </div>

            <div className="stu-form-group">
              <label className="stu-form-label">Logo Text</label>
              <input className="stu-input" name="logoText"
                value={form.logoText} onChange={change}
                placeholder="Short text shown in logo box on PDF (e.g. LOGO)" />
              <span className="stu-hint">
                Keep it short — 4 to 8 characters works best.
              </span>
            </div>

            <p className="lh-section-title" style={{ marginTop: 8 }}>Contact Details</p>

            <div className="lh-two-col">
              <div className="stu-form-group">
                <label className="stu-form-label">Phone</label>
                <input className="stu-input" name="phone"
                  value={form.phone} onChange={change}
                  placeholder="+91-0000-000000" />
              </div>
              <div className="stu-form-group">
                <label className="stu-form-label">Toll Free</label>
                <input className="stu-input" name="tollFree"
                  value={form.tollFree} onChange={change}
                  placeholder="1800-000-0000" />
              </div>
            </div>

            <div className="lh-two-col">
              <div className="stu-form-group">
                <label className="stu-form-label">Fax</label>
                <input className="stu-input" name="fax"
                  value={form.fax} onChange={change}
                  placeholder="+91-0000-000001" />
              </div>
              <div className="stu-form-group">
                <label className="stu-form-label">Website</label>
                <input className="stu-input" name="website"
                  value={form.website} onChange={change}
                  placeholder="www.university.edu" />
              </div>
            </div>

            <div className="stu-form-group">
              <label className="stu-form-label">Email</label>
              <input className="stu-input" name="email"
                value={form.email} onChange={change}
                placeholder="contact@university.edu" />
            </div>

            {error   && <p className="stu-error-text">{error}</p>}
            {success && <p className="stu-success-text">{success}</p>}

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
              {/* Top border accent */}
              <div className="lh-preview-topbar" />

              <div className="lh-preview-inner">
                {/* Logo */}
                <div className="lh-preview-logo">
                  {form.logoText || 'LOGO'}
                </div>

                {/* Text */}
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

              {/* Double border bottom */}
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
