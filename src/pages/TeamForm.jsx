import { springApi } from '../services/api';
import { useState, useEffect } from 'react';

const EMPTY = {
  teamId:      '',
  sportId:     '',
  sportName:   '',
  coachName:   '',
  captainName: '',
};

export default function TeamForm({ isOpen, mode, team, onSave, onClose, loading }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sports, setSports] = useState([]);

  // Load active sports for the dropdown
  useEffect(() => {
    if (!isOpen) return;
    springApi.get('/sports')
      .then((res) => {
        const sports = Array.isArray(res) ? res : (res.data ?? res ?? []);
        setSports(sports.filter((s) => s.status === 'ACTIVE'));
      })
      .catch(() => setSports([]));
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && team) {
      setForm({
        teamId:      team.teamId      ?? '',
        sportId:     team.sportId     ?? '',
        sportName:   team.sportName   ?? '',
        coachName:   team.coachName   ?? '',
        captainName: team.captainName ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [isOpen, mode, team]);

  if (!isOpen) return null;

  const handleSportChange = (e) => {
    const selectedSportId = e.target.value;
    const selectedSport   = sports.find((s) => s.sportId === selectedSportId);
    setForm((f) => ({
      ...f,
      sportId:   selectedSportId,
      sportName: selectedSport ? selectedSport.sportName : '',
    }));
    setErrors((er) => ({ ...er, sportId: '' }));
  };

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.teamId.trim())      e.teamId      = 'Team ID is required.';
    if (!form.sportId)            e.sportId     = 'Sport is required.';
    if (!form.coachName.trim())   e.coachName   = 'Coach Name is required.';
    if (!form.captainName.trim()) e.captainName = 'Captain Name is required.';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form });
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 480 }}>

        <div className="books-modal-head">
          <h3>{mode === 'add' ? 'Add Team' : 'Edit Team'}</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={submit}>
          <div className="books-modal-body">

            {/* Team ID + Sport */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Team ID *</label>
                <input
                  className={`books-form-control ${errors.teamId ? 'err' : ''}`}
                  name="teamId"
                  value={form.teamId}
                  onChange={change}
                  placeholder="e.g. T001"
                  disabled={mode === 'edit'}
                />
                {errors.teamId && <p className="books-form-err">{errors.teamId}</p>}
              </div>

              <div className="books-form-group">
                <label className="books-form-label">Sport *</label>
                <select
                  className={`books-form-control ${errors.sportId ? 'err' : ''}`}
                  value={form.sportId}
                  onChange={handleSportChange}
                >
                  <option value="">— Select Sport —</option>
                  {sports.map((s) => (
                    <option key={s.sportId} value={s.sportId}>
                      {s.sportName}
                    </option>
                  ))}
                </select>
                {errors.sportId && <p className="books-form-err">{errors.sportId}</p>}
              </div>
            </div>

            {/* Coach + Captain */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Coach Name *</label>
                <input
                  className={`books-form-control ${errors.coachName ? 'err' : ''}`}
                  name="coachName"
                  value={form.coachName}
                  onChange={change}
                  placeholder="e.g. Rahul Patil"
                />
                {errors.coachName && <p className="books-form-err">{errors.coachName}</p>}
              </div>

              <div className="books-form-group">
                <label className="books-form-label">Captain Name *</label>
                <input
                  className={`books-form-control ${errors.captainName ? 'err' : ''}`}
                  name="captainName"
                  value={form.captainName}
                  onChange={change}
                  placeholder="e.g. Akash Jadhav"
                />
                {errors.captainName && <p className="books-form-err">{errors.captainName}</p>}
              </div>
            </div>

          </div>

          <div className="books-modal-foot">
            <button
              type="button"
              className="books-btn books-btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="books-btn books-btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Save' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
