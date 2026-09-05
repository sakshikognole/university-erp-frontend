import { springApi } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import TeamForm from './TeamForm';
import TeamDetails from './TeamDetails';

export default function SportTeamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ?team=T001 → shows TeamDetails; no param → shows list
  const viewTeamId = searchParams.get('team');

  const [teams,    setTeams]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [selTeam,  setSelTeam]  = useState(null);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await springApi.get('/sport-teams');
      setTeams(Array.isArray(res) ? res : (res ?? []));
    } catch {
      setError('Failed to load sport teams.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const openAdd  = ()     => { setSelTeam(null); setFormMode('add');  setFormOpen(true); };
  const openEdit = (team) => { setSelTeam(team); setFormMode('edit'); setFormOpen(true); };
  // Navigate to detail view by setting URL param
  const openView = (team) => setSearchParams({ team: team.teamId });
  const goBack   = ()     => { setSearchParams({}); load(true); };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (formMode === 'add') {
        await springApi.post('/sport-teams', form);
        setSuccess('Team created successfully.');
      } else {
        await springApi.put(`/sport-teams/${selTeam.teamId}`, form);
        setSuccess('Team updated successfully.');
      }
      setFormOpen(false);
      load(true);
    } catch (err) {
      setError(err.message || 'Failed to save team.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (team) => {
    if (!window.confirm(`Delete team "${team.teamId} — ${team.sportName}"?`)) return;
    setDeleting(team.teamId);
    try {
      await springApi.delete(`/sport-teams/${team.teamId}`);
      setSuccess('Team deleted successfully.');
      load(true);
    } catch {
      setError('Failed to delete team.');
    } finally {
      setDeleting(null);
    }
  };

  // ── Detail view — survives refresh because teamId is in the URL ──
  if (viewTeamId) {
    return (
      <TeamDetails
        teamId={viewTeamId}
        onBack={goBack}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────
  return (
    <div className="page-container">

      <div className="st-page-header">
        <div>
          <h1 className="page-title">Sport Teams</h1>
          <p className="st-page-sub">Manage university sport teams and rosters</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={openAdd}>
          + Add Team
        </button>
      </div>

      {success && (
        <div className="books-alert books-alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>x</button>
        </div>
      )}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>x</button>
        </div>
      )}

      {loading ? (
        <p className="books-loading">Loading sport teams...</p>
      ) : teams.length === 0 ? (
        <p className="st-empty">No sport teams yet. Click "+ Add Team" to get started.</p>
      ) : (
        <div className="books-table-wrap">
          <table className="books-table">
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Sport Name</th>
                <th>Coach Name</th>
                <th>Captain Name</th>
                <th>Roster</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.teamId}>
                  <td>{team.teamId}</td>
                  <td>{team.sportName}</td>
                  <td>{team.coachName}</td>
                  <td>{team.captainName}</td>
                  <td>{team.roster ? team.roster.length : 0} student(s)</td>
                  <td>
                    <div className="books-actions">
                      <button
                        className="books-btn books-btn-sm books-btn-ghost"
                        onClick={() => openView(team)}
                      >
                        View
                      </button>
                      <button
                        className="books-btn books-btn-sm books-btn-ghost"
                        onClick={() => openEdit(team)}
                      >
                        Edit
                      </button>
                      <button
                        className="books-btn books-btn-sm books-btn-danger"
                        onClick={() => handleDelete(team)}
                        disabled={deleting === team.teamId}
                      >
                        {deleting === team.teamId ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TeamForm
        isOpen={formOpen}
        mode={formMode}
        team={selTeam}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
        loading={saving}
      />

    </div>
  );
}
