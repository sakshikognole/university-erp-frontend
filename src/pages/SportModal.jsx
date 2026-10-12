import { useState, useEffect } from 'react';

const EMPTY = {
  sportId:     '',
  sportName:   '',
  capacity:    '',
  status:      'ACTIVE',
  description: '',
  venueId:     '',
};

export default function SportModal({ isOpen, mode, sport, onSave, onClose, loading, dupError, onDupOk }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && sport) {
      setForm({
        sportId:     sport.sportId     ?? '',
        sportName:   sport.sportName   ?? '',
        capacity:    sport.capacity    ?? '',
        status:      sport.status      ?? 'ACTIVE',
        description: sport.description ?? '',
        venueId:     sport.venueId     ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [isOpen, mode, sport]);

  if (!isOpen) return null;

  const change = (e) => {
    const { name, value } = e.target;
    // Defect 3: auto-uppercase Venue ID as user types
    const finalValue = name === 'venueId' ? value.toUpperCase() : value;
    setForm((f) => ({ ...f, [name]: finalValue }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};

    // ── Sport ID validation ──────────────────────────────────────────────
    const sportIdRegex = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]+$/;
    if (!form.sportId.trim()) {
      e.sportId = 'Sport ID is required';
    } else if (!sportIdRegex.test(form.sportId.trim())) {
      e.sportId = 'Invalid Sport ID. Please enter a valid Sport ID (e.g., SPT001).';
    }

    // ── Sport Name validation ────────────────────────────────────────────
    const sportNameRegex = /^[A-Za-z\s]+$/;
    if (!form.sportName.trim()) {
      e.sportName = 'Sport name is required';
    } else if (!sportNameRegex.test(form.sportName.trim())) {
      e.sportName = 'Invalid Sport Name. Please enter a valid Sport Name (e.g., Cricket).';
    }

    // ── Capacity validation ──────────────────────────────────────────────
    if (form.capacity === '') {
      e.capacity = 'Required';
    } else if (Number(form.capacity) < 1) {
      e.capacity = 'Must be greater than 0';
    }

    // ── Status validation ────────────────────────────────────────────────
    if (!form.status) e.status = 'Required';

    // ── Venue ID validation ──────────────────────────────────────────────
    const venueIdRegex = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9\-]+$/;
    if (!form.venueId.trim()) {
      e.venueId = 'Venue ID is required';
    } else if (!venueIdRegex.test(form.venueId.trim())) {
      e.venueId = 'Invalid Venue ID. Please enter a valid Venue ID (e.g., VEN001).';
    }

    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, capacity: Number(form.capacity) });
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 480 }}>

        <div className="books-modal-head">
          <h3>{mode === 'add' ? 'Add Sport' : 'Edit Sport'}</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={submit}>
          <div className="books-modal-body">

            {/* Duplicate ID popup — shown inside modal with OK button */}
            {dupError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                  <p style={{ color: '#dc2626', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    {dupError}
                  </p>
                </div>
                <button type="button" onClick={onDupOk} style={{
                  alignSelf: 'flex-end', padding: '6px 24px',
                  background: '#dc2626', color: '#fff', border: 'none',
                  borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                }}>
                  OK
                </button>
              </div>
            )}

            {/* Sport ID + Sport Name */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Sport ID *</label>
                <input
                  className={`books-form-control ${errors.sportId ? 'err' : ''}`}
                  name="sportId" value={form.sportId} onChange={change}
                  placeholder="e.g. SPT001"
                  disabled={mode === 'edit'}
                />
                {errors.sportId && <p className="books-form-err">{errors.sportId}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Sport Name *</label>
                <input
                  className={`books-form-control ${errors.sportName ? 'err' : ''}`}
                  name="sportName" value={form.sportName} onChange={change}
                  placeholder="e.g. Cricket"
                />
                {errors.sportName && <p className="books-form-err">{errors.sportName}</p>}
              </div>
            </div>

            {/* Capacity + Status */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Capacity *</label>
                <input
                  className={`books-form-control ${errors.capacity ? 'err' : ''}`}
                  name="capacity" type="number" min="1"
                  value={form.capacity} onChange={change}
                  placeholder="e.g. 50"
                />
                {errors.capacity && <p className="books-form-err">{errors.capacity}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Status *</label>
                <select
                  className={`books-form-control ${errors.status ? 'err' : ''}`}
                  name="status" value={form.status} onChange={change}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                {errors.status && <p className="books-form-err">{errors.status}</p>}
              </div>
            </div>

            {/* Venue ID */}
            <div className="books-form-group">
              <label className="books-form-label">Venue ID *</label>
              <input
                className={`books-form-control ${errors.venueId ? 'err' : ''}`}
                name="venueId" value={form.venueId} onChange={change}
                placeholder="e.g. VEN001"
              />
              {errors.venueId && <p className="books-form-err">{errors.venueId}</p>}
            </div>

            {/* Description */}
            <div className="books-form-group">
              <label className="books-form-label">Description</label>
              <textarea
                className="books-form-control"
                name="description" value={form.description} onChange={change}
                placeholder="Brief description of the sport..."
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

          </div>

          <div className="books-modal-foot">
            <button type="button" className="books-btn books-btn-ghost"
              onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Add Sport' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
