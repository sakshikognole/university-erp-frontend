import { springApi } from '../services/api';
import { useState, useEffect } from 'react';

const EMPTY = { hostelName: '', type: 'BOYS', active: true };

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
        active:     block.active     ?? true,
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
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.hostelName.trim()) e.hostelName = 'Hostel name is required.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiErr('');
    try {
      if (isEdit) {
        await springApi.put(`/hostel-blocks/${block.blockId}`, form);
        onSaved('Hostel block updated successfully.');
      } else {
        await springApi.post('/hostel-blocks', form);
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

            {/* Hostel Name */}
            <div className="books-form-group">
              <label className="books-form-label">Hostel Name *</label>
              <input
                className={`books-form-control ${errors.hostelName ? 'err' : ''}`}
                name="hostelName"
                value={form.hostelName}
                onChange={change}
                placeholder="e.g. Shivaji Block"
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

            {/* Active checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <input
                type="checkbox"
                id="hst-active"
                name="active"
                checked={form.active}
                onChange={change}
                className="pay-checkbox"
              />
              <label htmlFor="hst-active" style={{ fontSize: 14, cursor: 'pointer',
                                                    color: 'var(--text-primary)' }}>
                Active
              </label>
            </div>

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
