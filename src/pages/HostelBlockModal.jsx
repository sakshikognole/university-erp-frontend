import { springApi } from '../services/api';
import { useState, useEffect } from 'react';

const EMPTY = { hostelName: '', type: 'BOYS', active: true };

// D1/D3: validate hostel name
function validateHostelName(name) {
  const trimmed = name.trim();
  if (!trimmed)
    return 'Hostel name is required.';
  if (!/^[A-Za-z\s]+$/.test(trimmed))
    return 'Hostel name must contain only letters and spaces. No numbers or special characters.';
  if (/\s{2,}/.test(trimmed))
    return 'Hostel name must not contain double spaces.';
  if (trimmed.length < 2)
    return 'Hostel name must be at least 2 characters.';
  if (trimmed.length > 50)
    return 'Hostel name must not exceed 50 characters.';
  return '';
}

export default function HostelBlockModal({ isOpen, block, onClose, onSaved }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  const isEdit = !!block;

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setForm({
        hostelName: block.hostelName ?? '',
        type:       block.type       ?? 'BOYS',
        // D4: read active value correctly (may come as boolean or string)
        active:     block.active === true || block.active === 'true',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setApiErr('');
  }, [isOpen, block, isEdit]);

  if (!isOpen) return null;

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    // D4: ensure checkbox value is stored as boolean
    const newVal = type === 'checkbox' ? checked : value;
    setForm((f) => ({ ...f, [name]: newVal }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    const nameErr = validateHostelName(form.hostelName);
    if (nameErr) e.hostelName = nameErr;
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiErr('');
    try {
      const payload = {
        hostelName: form.hostelName.trim(),
        type:       form.type,
        active:     form.active,  // D4: always send actual boolean
      };
      if (isEdit) {
        await springApi.put(`/hostel-blocks/${block.blockId}`, payload);
        onSaved('Hostel block updated successfully.');
      } else {
        await springApi.post('/hostel-blocks', payload);
        onSaved('Hostel block added successfully.');
      }
    } catch (err) {
      setApiErr(err.message || 'Failed to save hostel block.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 440 }}>

        <div className="books-modal-head">
          <h3>{isEdit ? 'Edit Hostel Block' : 'Add Hostel Block'}</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={submit}>
          <div className="books-modal-body">

            {apiErr && (
              <div className="books-alert books-alert-error" style={{ marginBottom: 12 }}>
                <span>{apiErr}</span>
              </div>
            )}

            {/* D1/D3: Hostel Name with validation */}
            <div className="books-form-group">
              <label className="books-form-label">
                Hostel Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className={`books-form-control ${errors.hostelName ? 'err' : ''}`}
                name="hostelName"
                value={form.hostelName}
                onChange={change}
                placeholder="e.g. Shivaji Block"
                maxLength={50}
              />
              {errors.hostelName && (
                <p className="books-form-err">{errors.hostelName}</p>
              )}
            </div>

            {/* Type dropdown */}
            <div className="books-form-group">
              <label className="books-form-label">Type *</label>
              <select
                className="books-form-control"
                name="type"
                value={form.type}
                onChange={change}
              >
                <option value="BOYS">Boys</option>
                <option value="GIRLS">Girls</option>
              </select>
            </div>

            {/* D4: Active checkbox — correctly bound to boolean */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <input
                type="checkbox"
                id="hst-active"
                name="active"
                checked={form.active}
                onChange={change}
                className="pay-checkbox"
              />
              <label htmlFor="hst-active" style={{
                fontSize: 14, cursor: 'pointer', color: 'var(--text-primary)'
              }}>
                Active
              </label>
            </div>

            {/* Show current status for clarity */}
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
              This hostel block will be created as{' '}
              <strong style={{ color: form.active ? '#16a34a' : '#6b7280' }}>
                {form.active ? 'Active' : 'Inactive'}
              </strong>
            </p>

          </div>

          <div className="books-modal-foot">
            <button type="button" className="books-btn books-btn-ghost"
                    onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="books-btn books-btn-primary"
                    disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Block'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
