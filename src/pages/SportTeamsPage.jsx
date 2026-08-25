import { useState, useEffect, useCallback } from 'react';
import { springApi } from '../services/api';
import SportTeamModal from './SportTeamModal';
import ViewSportTeamModal from './ViewSportTeamModal';

export default function SportTeamsPage() {
  const [teams,     setTeams]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selTeam,   setSelTeam]   = useState(null);
  const [viewOpen,  setViewOpen]  = useState(false);
  const [viewTeam,  setViewTeam]  = useState(null);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await springApi.get('/sport-teams');
      setTeams(Array.isArray(res) ? res : (res.data ?? []));
    } catch {
      setError('Failed to load sport teams.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-clear notifications after 4 s
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const openAdd  = ()     => { setSelTeam(null); setModalMode('add');  setModalOpen(true); };
  const openEdit = (team) => { setSelTeam(team); setModalMode('edit'); setModalOpen(true); };
  const openView = (team) => { setViewTeam(team); setViewOpen(true); };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await springApi.post('/sport-teams', form);
        setSuccess('Team added successfully.');
      } else {
        await springApi.put(`/sport-teams/${selTeam.teamId}`, form);
        setSuccess('Team updated successfully.');
      }
      setModalOpen(false);
      load(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save team.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (team) => {
    if (!window.confirm(`Delete team "${team.teamName}"?`)) return;
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

  // Filter by search
  const filtered = teams.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.teamName  || '').toLowerCase().includes(q) ||
      (t.teamId    || '').toLowerCase().includes(q) ||
      (t.sportId   || '').toLowerCase().includes(q) ||
      (t.coachName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Sport Teams</h1>
          <p className="stu-page-sub">Manage all university sport teams</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={openAdd}>
          + Add Team
        </button>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 20 }}>
        <input
          className="books-form-control"
          style={{ maxWidth: 360 }}
          placeholder="Search by team name, sport ID, or coach..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Notifications ── */}
      {success && (
        <div className="books-alert books-alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <p className="books-loading">Loading sport teams...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p className="stu-info-text">
            {search
              ? `No teams matched "${search}".`
              : 'No teams added yet. Click "+ Add Team" to get started.'}
          </p>
        </div>
      ) : (
        <div className="sport-grid">
          {filtered.map((team) => (
            <div
              key={team.teamId}
              className="sport-card"
              onClick={() => openView(team)}
              style={{ cursor: 'pointer' }}
            >
              {/* Top colour strip */}
              <div className={`sport-card-strip ${
                team.status === 'ACTIVE' ? 'sport-strip-active' : 'sport-strip-inactive'
              }`} />

              <div className="sport-card-body">

                {/* Card header */}
                <div className="sport-card-header">
                  <div>
                    <p className="sport-card-id">{team.teamId}</p>
                    <h3 className="sport-card-name">{team.teamName}</h3>
                  </div>
                  <span className={`sport-status-badge ${
                    team.status === 'ACTIVE' ? 'sport-badge-active' : 'sport-badge-inactive'
                  }`}>
                    {team.status}
                  </span>
                </div>

                {/* Details */}
                <div className="sport-card-details">
                  <div className="sport-detail-item">
                    <span className="sport-detail-label">Sport ID</span>
                    <span className="sport-detail-value">{team.sportId}</span>
                  </div>
                  <div className="sport-detail-item">
                    <span className="sport-detail-label">Coach</span>
                    <span className="sport-detail-value">{team.coachName}</span>
                  </div>
                  <div className="sport-detail-item">
                    <span className="sport-detail-label">Members</span>
                    <span className="sport-detail-value">
                      {Array.isArray(team.members) ? team.members.length : 0}
                    </span>
                  </div>
                </div>

                {/* Description preview */}
                {team.description && (
                  <p className="sport-card-desc">
                    {team.description.length > 90
                      ? team.description.slice(0, 90) + '...'
                      : team.description}
                  </p>
                )}

              </div>

              {/* Footer actions — stopPropagation so card click doesn't fire */}
              <div className="sport-card-footer" onClick={(e) => e.stopPropagation()}>
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

            </div>
          ))}
        </div>
      )}

      <SportTeamModal
        isOpen={modalOpen}
        mode={modalMode}
        team={selTeam}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        loading={saving}
      />

      <ViewSportTeamModal
        isOpen={viewOpen}
        team={viewTeam}
        onClose={() => setViewOpen(false)}
      />

    </div>
  );
}
