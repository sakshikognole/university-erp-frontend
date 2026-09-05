import { useState, useEffect } from 'react';

const EMPTY = {
  sportId:     '',
  sportName:   '',
  capacity:    '',
  status:      'ACTIVE',
  description: '',
  venueId:     '',
};

export default function SportModal({ isOpen, mode, sport, onSave, onClose, loading }) {
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
    // Defects 1, 2, 3:
    // - Must NOT be only alphabets   (e.g. "SPT" is invalid)
    // - Must NOT be only numbers     (e.g. "001" is invalid)
    // - Must NOT contain special chars (e.g. "SPT@01" is invalid)
    // - Must contain BOTH letters AND numbers, no special characters
    const sportIdRegex = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]+$/;
    if (!form.sportId.trim()) {
      e.sportId = 'Sport ID is required';
    } else if (!sportIdRegex.test(form.sportId.trim())) {
      e.sportId = 'Sport ID must contain both letters and numbers (e.g. SPT001). No special characters allowed.';
    }

    // ── Sport Name validation ────────────────────────────────────────────
    // Defects 2, 4, 5, 7, 8:
    // - Must NOT accept numbers alone, combined with letters, or special chars
    // - Only letters (A-Z, a-z) and spaces allowed
    const sportNameRegex = /^[A-Za-z\s]+$/;
    if (!form.sportName.trim()) {
      e.sportName = 'Sport name is required';
    } else if (/\d/.test(form.sportName)) {
      e.sportName = 'Sport name must not contain numbers.';
    } else if (!sportNameRegex.test(form.sportName.trim())) {
      e.sportName = 'Sport name must contain only letters and spaces. Special characters are not allowed.';
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
    // Defects 4-8 (edit mode): validation applies in BOTH add and edit modes.
    // Venue ID is editable in edit mode so must be validated every time.
    // - Must NOT be only alphabets, only numbers, or contain special chars
    // - Must contain BOTH letters AND numbers; hyphens allowed
    const venueIdRegex = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9\-]+$/;
    if (!form.venueId.trim()) {
      e.venueId = 'Venue ID is required';
    } else if (!venueIdRegex.test(form.venueId.trim())) {
      if (/[^A-Za-z0-9\-]/.test(form.venueId.trim())) {
        e.venueId = 'Venue ID must not contain special characters (only letters, numbers, hyphens).';
      } else if (!/[0-9]/.test(form.venueId.trim())) {
        e.venueId = 'Venue ID must contain at least one number (e.g. VEN001).';
      } else if (!/[A-Za-z]/.test(form.venueId.trim())) {
        e.venueId = 'Venue ID must contain at least one letter (e.g. VEN001).';
      } else {
        e.venueId = 'Venue ID must contain both letters and numbers (e.g. VEN001).';
      }
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
