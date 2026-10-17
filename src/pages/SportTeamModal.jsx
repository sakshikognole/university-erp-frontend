import { useState, useEffect } from 'react';

const EMPTY = {
  teamId:      '',
  teamName:    '',
  sportId:     '',
  coachName:   '',
  members:     '',
  status:      'ACTIVE',
  description: '',
};

export default function SportTeamModal({ isOpen, mode, team, sports = [], onSave, onClose, loading, dupError, onDupOk }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && team) {
      setForm({
        teamId:      team.teamId      ?? '',
        teamName:    team.teamName    ?? '',
        sportId:     team.sportId     ?? '',
        coachName:   team.coachName   ?? '',
        members:     Array.isArray(team.members) ? team.members.join(', ') : '',
        status:      team.status      ?? 'ACTIVE',
        description: team.description ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [isOpen, mode, team]);

  if (!isOpen) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};

    // ── Team ID validation — allow letters, numbers, or combination. Reject only special chars.
    if (!form.teamId.trim()) {
      e.teamId = 'Team ID is required.';
    } else if (/[^A-Za-z0-9]/.test(form.teamId.trim())) {
      e.teamId = 'Invalid ID. Please enter a valid ID.';
    }

    // Team Name
    if (!form.teamName.trim()) e.teamName = 'Team Name is required.';

    // Sport ID
    if (!form.sportId.trim()) e.sportId = 'Sport ID is required.';

    if (!form.coachName.trim()) {
      e.coachName = 'Coach Name is required.';
    } else if (/\d/.test(form.coachName) || !/^[A-Za-z\s.]+$/.test(form.coachName.trim())) {
      e.coachName = 'Invalid Coach Name. Please enter a valid name.';
    }

    if (!form.status) e.status = 'Required';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const membersArray = form.members
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    onSave({ ...form, members: membersArray });
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 520 }}>

        <div className="books-modal-head">
          <h3>{mode === 'add' ? 'Add Sport Team' : 'Edit Sport Team'}</h3>
          <button className="books-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={submit}>
          <div className="books-modal-body">

            {/* Team ID + Team Name */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Team ID *</label>
                <input
                  className={`books-form-control ${errors.teamId || dupError ? 'err' : ''}`}
                  name="teamId" value={form.teamId} onChange={(e) => { change(e); if (onDupOk) onDupOk(); }}
                  placeholder="e.g. TM001"
                  disabled={mode === 'edit'}
                />
                {errors.teamId && <p className="books-form-err">{errors.teamId}</p>}
                {dupError && <p className="books-form-err">{dupError}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Team Name *</label>
                <input
                  className={`books-form-control ${errors.teamName ? 'err' : ''}`}
                  name="teamName" value={form.teamName} onChange={change}
                  placeholder="e.g. Cricket Warriors"
                />
                {errors.teamName && <p className="books-form-err">{errors.teamName}</p>}
              </div>
            </div>

            {/* Sport ID + Coach Name */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Sport ID *</label>
                {sports.length > 0 ? (
                  <select
                    className={`books-form-control ${errors.sportId ? 'err' : ''}`}
                    name="sportId" value={form.sportId} onChange={change}
                  >
                    <option value="">-- Select Sport --</option>
                    {sports.map((s) => (
                      <option key={s.sportId} value={s.sportId}>
                        {s.sportId} — {s.sportName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`books-form-control ${errors.sportId ? 'err' : ''}`}
                    name="sportId" value={form.sportId} onChange={change}
                    placeholder="e.g. SPT001"
                  />
                )}
                {errors.sportId && <p className="books-form-err">{errors.sportId}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Coach Name *</label>
                <input
                  className={`books-form-control ${errors.coachName ? 'err' : ''}`}
                  name="coachName" value={form.coachName} onChange={change}
                  placeholder="e.g. Mr. Sharma"
                />
                {errors.coachName && <p className="books-form-err">{errors.coachName}</p>}
              </div>
            </div>

            {/* Status */}
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

            {/* Members */}
            <div className="books-form-group">
              <label className="books-form-label">Members (comma-separated)</label>
              <textarea
                className="books-form-control"
                name="members" value={form.members} onChange={change}
                placeholder="e.g. Rahul Patil, Arjun Mehta, Priya Sharma"
                rows={2}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                Separate each member name or PRN with a comma
              </p>
            </div>

            {/* Description */}
            <div className="books-form-group">
              <label className="books-form-label">Description</label>
              <textarea
                className="books-form-control"
                name="description" value={form.description} onChange={change}
                placeholder="Brief description of the team..."
                rows={2}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

          </div>

          <div className="books-modal-foot">
            <button type="button" className="books-btn books-btn-ghost"
              onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Add Team' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
