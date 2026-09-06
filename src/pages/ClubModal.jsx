import { useState, useEffect } from 'react';

const EMPTY = {
  clubId:             '',
  clubName:           '',
  clubCategory:       '',
  parentClubId:       '',
  description:        '',
  facultyCoordinator: '',
  studentLeadName:    '',
  studentLeadId:      '',
  studentLeadRole:    '',
  activeMembers:      '',
  status:             'Active',
};

export default function ClubModal({ isOpen, mode, club, parentClubs, onSave, onClose, loading, dupError, onDupOk }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && club) {
      setForm({
        clubId:             club.clubId             ?? '',
        clubName:           club.clubName           ?? '',
        clubCategory:       club.clubCategory       ?? '',
        parentClubId:       club.parentClubId       ?? '',
        description:        club.description        ?? '',
        facultyCoordinator: club.facultyCoordinator ?? '',
        studentLeadName:    club.studentLeadName    ?? '',
        studentLeadId:      club.studentLeadId      ?? '',
        studentLeadRole:    club.studentLeadRole    ?? '',
        activeMembers:      club.activeMembers      ?? '',
        status:             club.status             ?? 'Active',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [isOpen, mode, club]);

  if (!isOpen) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};

    // ── Club ID: must contain BOTH letters AND numbers, no special characters ──
    // Defects 2, 3: blocks special chars, blocks only-letters, blocks only-numbers
    const clubIdRegex = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]+$/;
    if (!form.clubId.trim()) {
      e.clubId = 'Club ID is required';
    } else if (/[^A-Za-z0-9]/.test(form.clubId.trim())) {
      e.clubId = 'Club ID must not contain special characters (letters and numbers only).';
    } else if (!/[0-9]/.test(form.clubId.trim())) {
      e.clubId = 'Club ID must contain at least one number (e.g. CLB001).';
    } else if (!/[A-Za-z]/.test(form.clubId.trim())) {
      e.clubId = 'Club ID must contain at least one letter (e.g. CLB001).';
    }

    // ── Club Name: only letters and spaces, no numbers or special characters ──
    // Defects 1, 5: blocks numbers, special chars — in both add and edit mode
    if (!form.clubName.trim()) {
      e.clubName = 'Club name is required';
    } else if (/\d/.test(form.clubName)) {
      e.clubName = 'Club name must not contain numbers.';
    } else if (!/^[A-Za-z\s]+$/.test(form.clubName.trim())) {
      e.clubName = 'Club name must contain only letters and spaces. Special characters are not allowed.';
    }

    if (!form.status) e.status = 'Required';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      activeMembers: form.activeMembers === '' ? null : Number(form.activeMembers),
      parentClubId:  form.parentClubId.trim() || null,
    });
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 540 }}>

        <div className="books-modal-head">
          <h3>{mode === 'add' ? 'Add Club' : 'Edit Club'}</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={submit}>
          <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

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

            {/* Row 1 — Club ID + Club Name */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Club ID *</label>
                <input
                  className={`books-form-control ${errors.clubId ? 'err' : ''}`}
                  name="clubId" value={form.clubId} onChange={change}
                  placeholder="e.g. CLB001"
                  disabled={mode === 'edit'}
                />
                {errors.clubId && <p className="books-form-err">{errors.clubId}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Club Name *</label>
                <input
                  className={`books-form-control ${errors.clubName ? 'err' : ''}`}
                  name="clubName" value={form.clubName} onChange={change}
                  placeholder="e.g. Coding Club"
                />
                {errors.clubName && <p className="books-form-err">{errors.clubName}</p>}
              </div>
            </div>

            {/* Row 2 — Category + Status */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Club Category</label>
                <input
                  className="books-form-control"
                  name="clubCategory" value={form.clubCategory} onChange={change}
                  placeholder="e.g. Technical, Sports, Cultural"
                />
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Status *</label>
                <select
                  className={`books-form-control ${errors.status ? 'err' : ''}`}
                  name="status" value={form.status} onChange={change}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && <p className="books-form-err">{errors.status}</p>}
              </div>
            </div>

            {/* Parent Club — optional, only for sub-clubs */}
            <div className="books-form-group">
              <label className="books-form-label">
                Parent Club
                <span className="club-optional-tag">optional — leave empty for independent club</span>
              </label>
              <select
                className="books-form-control"
                name="parentClubId" value={form.parentClubId} onChange={change}
              >
                <option value="">-- Independent Club (no parent) --</option>
                {parentClubs
                  .filter((c) => c.clubId !== form.clubId)
                  .map((c) => (
                    <option key={c.clubId} value={c.clubId}>
                      {c.clubName} ({c.clubId})
                    </option>
                  ))}
              </select>
            </div>

            {/* Description */}
            <div className="books-form-group">
              <label className="books-form-label">Description</label>
              <textarea
                className="books-form-control"
                name="description" value={form.description} onChange={change}
                placeholder="Brief description of the club..."
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {/* Faculty Coordinator + Active Members */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Faculty Coordinator</label>
                <input
                  className="books-form-control"
                  name="facultyCoordinator" value={form.facultyCoordinator} onChange={change}
                  placeholder="e.g. Prof. A. Sharma"
                />
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Active Members</label>
                <input
                  className="books-form-control"
                  name="activeMembers" type="number" min="0"
                  value={form.activeMembers} onChange={change}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Student Lead */}
            <p className="club-section-label">Student Lead</p>
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Name</label>
                <input
                  className="books-form-control"
                  name="studentLeadName" value={form.studentLeadName} onChange={change}
                  placeholder="Student name"
                />
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Student ID</label>
                <input
                  className="books-form-control"
                  name="studentLeadId" value={form.studentLeadId} onChange={change}
                  placeholder="e.g. STU001"
                />
              </div>
            </div>
            <div className="books-form-group">
              <label className="books-form-label">Role</label>
              <input
                className="books-form-control"
                name="studentLeadRole" value={form.studentLeadRole} onChange={change}
                placeholder="e.g. President, Captain"
              />
            </div>

          </div>

          <div className="books-modal-foot">
            <button type="button" className="books-btn books-btn-ghost"
              onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Add Club' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
