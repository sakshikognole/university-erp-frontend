import { useState, useEffect } from 'react';

const EMPTY = {
  teamId:      '',
  teamName:    '',
  sportId:     '',
  coachName:   '',
  members:     '',   // comma-separated in the form, converted to array on save
  status:      'ACTIVE',
  description: '',
};

export default function SportTeamModal({ isOpen, mode, team, onSave, onClose, loading }) {
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
    if (!form.teamId.trim())    e.teamId    = 'Required';
    if (!form.teamName.trim())  e.teamName  = 'Required';
    if (!form.sportId.trim())   e.sportId   = 'Required';
    if (!form.coachName.trim()) e.coachName = 'Required';
    if (!form.status)           e.status    = 'Required';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    // Convert comma-separated string to clean array
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
                  className={`books-form-control ${errors.teamId ? 'err' : ''}`}
                  name="teamId" value={form.teamId} onChange={change}
                  placeholder="e.g. TM001"
                  disabled={mode === 'edit'}
                />
                {errors.teamId && <p className="books-form-err">{errors.teamId}</p>}
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
                <input
                  className={`books-form-control ${errors.sportId ? 'err' : ''}`}
                  name="sportId" value={form.sportId} onChange={change}
                  placeholder="e.g. SPT001"
                />
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
              {loading ? 'Saving...' : mode === 'add' ? 'Add Team' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
