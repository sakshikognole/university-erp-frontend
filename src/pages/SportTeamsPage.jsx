import { useState, useEffect, useCallback } from 'react';
import { springApi, springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import SportTeamModal from './SportTeamModal';
import ViewSportTeamModal from './ViewSportTeamModal';

// â--â-- Status badge â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
function StatusBadge({ status }) {
  const styles = {
    ACTIVE:   { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
    INACTIVE: { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' },
  };
  const s = styles[status] || styles.INACTIVE;
  return (
    <span style={{
      ...s, padding: '3px 10px', borderRadius: 9999,
      fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
    }}>{status}</span>
  );
}

// â--â-- Defect 1: Mobile accordion card (shown only on â-¤768px) â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
function MobileTeamCard({ team, onView, onEdit, onDelete, deleting }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 10,
      marginBottom: 8, overflow: 'hidden', background: '#fff',
    }}>
      {/* Tap to expand */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '12px 14px',
          background: 'none', border: 'none', cursor: 'pointer', gap: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
          <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            {team.teamName}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>
            {team.teamId}
          </span>
        </div>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af', flexShrink: 0 }}>
          {open ? 'â-²' : 'â-¼'}
        </span>
      </button>

      {/* Expanded details */}
      {open && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 14px 10px' }}>
          {[
            ['Sport ID',  team.sportId],
            ['Coach',     team.coachName],
            ['Members',   Array.isArray(team.members) ? team.members.length : 0],
            ['Status',    <StatusBadge key="s" status={team.status} />],
            ['Description', team.description || 'â--'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', padding: '5px 0',
              borderBottom: '1px solid #f9fafb', fontSize: '0.85rem' }}>
              <span style={{ color: '#6b7280', fontWeight: 500, flexShrink: 0, marginRight: 8 }}>{label}</span>
              <span style={{ color: '#111827', textAlign: 'right' }}>{val}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="books-btn books-btn-sm books-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onView(team)}>View</button>
            <button className="books-btn books-btn-sm books-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onEdit(team)}>Edit</button>
            <button className="books-btn books-btn-sm books-btn-danger" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onDelete(team)} disabled={deleting === team.teamId}>
              {deleting === team.teamId ? '...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
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
  const [dupError,  setDupError]  = useState(''); // Defect 6: inside modal

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

  const openAdd  = ()     => { setSelTeam(null); setModalMode('add');  setDupError(''); setModalOpen(true); };
  const openEdit = (team) => { setSelTeam(team); setModalMode('edit'); setDupError(''); setModalOpen(true); };
  const openView = (team) => { setViewTeam(team); setViewOpen(true); };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modalMode === 'add') {
        // Defect 6: duplicate check
        const isDuplicate = teams.some(
          (t) => t.teamId.trim().toUpperCase() === form.teamId.trim().toUpperCase()
        );
        if (isDuplicate) {
          setDupError(`Team ID "${form.teamId}" already exists. Please use a different Team ID.`);
          setSaving(false);
          return;
        }
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

      {/* Header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Sport Teams</h1>
          <p className="stu-page-sub">Manage all university sport teams</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={openAdd}>
          + Add Team
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="books-alert books-alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>Ã-</button>
        </div>
      )}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>Ã-</button>
        </div>
      )}

      {/* Table card */}
      <div className="card" style={{ padding: '1.5rem' }}>

        {/* Search + count */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
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

        {loading ? (
          <PageLoader message="Loading sport teams..." />
        ) : pageError ? (
          <PageError message={pageError} onRetry={load} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#9ca3af' }}>
            <p style={{ fontSize: '0.95rem' }}>
              {search ? `No teams matched "${search}".` : 'No teams added yet. Click "+ Add Team" to get started.'}
            </p>
          </div>
        ) : (
          <>
            {/* â--â-- Defect 1: Mobile accordion (â-¤768px) â--â-- */}
            <div className="sport-team-mob">
              {filtered.map((team) => (
                <MobileTeamCard
                  key={team.teamId}
                  team={team}
                  onView={openView}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              ))}
            </div>

            {/* â--â-- Desktop table (>768px) â--â-- */}
            <div className="sport-team-desk">
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
                        <td style={{ maxWidth: 180, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {team.description || 'â--'}
                        </td>
                        <td>
                          <div className="books-actions">
                            <button className="books-btn books-btn-sm books-btn-ghost"
                              onClick={() => openView(team)}>View</button>
                            <button className="books-btn books-btn-sm books-btn-ghost"
                              onClick={() => openEdit(team)}>Edit</button>
                            <button className="books-btn books-btn-sm books-btn-danger"
                              onClick={() => handleDelete(team)}
                              disabled={deleting === team.teamId}>
                              {deleting === team.teamId ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <SportTeamModal
        isOpen={modalOpen}
        mode={modalMode}
        team={selTeam}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setDupError(''); }}
        loading={saving}
        dupError={dupError}
        onDupOk={() => setDupError('')}
      />

      <ViewSportTeamModal
        isOpen={viewOpen}
        team={viewTeam}
        onClose={() => setViewOpen(false)}
      />

    </div>
  );
}
