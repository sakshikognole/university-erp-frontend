import { useState, useEffect, useCallback } from 'react';
import { springApi, springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import SportTeamModal from './SportTeamModal';
import ViewSportTeamModal from './ViewSportTeamModal';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    ACTIVE:   { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
    INACTIVE: { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' },
  };
  const s = styles[status] || styles.INACTIVE;
  return (
    <span style={{
      ...s,
      padding: '3px 10px',
      borderRadius: 9999,
      fontSize: '0.78rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

export default function SportTeamsPage() {
  const [teams,     setTeams]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [pageError, setPageError] = useState('');
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
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await springGet('/sport-teams');
      setTeams(Array.isArray(res) ? res : (res.data ?? []));
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load sport teams.');
      else setError('Failed to refresh sport teams.');
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
      setError(err.message || 'Failed to save team.');
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

      {/* ── Table card ── */}
      <div className="card" style={{ padding: '1.5rem' }}>

        {/* Search + count row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            className="books-form-control"
            style={{ maxWidth: 340 }}
            placeholder="Search by team name, sport ID, or coach..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '0.82rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
            Total: {filtered.length} team{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <PageLoader message="Loading sport teams..." />
        ) : pageError ? (
          <PageError message={pageError} onRetry={load} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#9ca3af' }}>
            <p style={{ fontSize: '0.95rem' }}>
              {search
                ? `No teams matched "${search}".`
                : 'No teams added yet. Click "+ Add Team" to get started.'}
            </p>
          </div>
        ) : (
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team ID</th>
                  <th>Team Name</th>
                  <th>Sport ID</th>
                  <th>Coach</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((team, idx) => (
                  <tr key={team.teamId}>
                    <td style={{ color: '#9ca3af' }}>{idx + 1}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                        {team.teamId}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#111827' }}>{team.teamName}</td>
                    <td>{team.sportId}</td>
                    <td>{team.coachName}</td>
                    <td style={{ textAlign: 'center' }}>
                      {Array.isArray(team.members) ? team.members.length : 0}
                    </td>
                    <td><StatusBadge status={team.status} /></td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {team.description || '—'}
                    </td>
                    <td>
                      <div className="books-actions">
                        <button
                          className="books-btn books-btn-sm books-btn-ghost"
                          onClick={() => openView(team)}
                          title="View"
                        >
                          View
                        </button>
                        <button
                          className="books-btn books-btn-sm books-btn-ghost"
                          onClick={() => openEdit(team)}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          className="books-btn books-btn-sm books-btn-danger"
                          onClick={() => handleDelete(team)}
                          disabled={deleting === team.teamId}
                          title="Delete"
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
      </div>

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
