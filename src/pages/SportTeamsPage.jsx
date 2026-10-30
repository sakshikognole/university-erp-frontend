import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';
import { springApi, springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import SportTeamModal from './SportTeamModal';
import ViewSportTeamModal from './ViewSportTeamModal';
import ConfirmDialog from '../components/ConfirmDialog';
// ── Status badge ──────────────────────────────────────────────────────────────
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

// ── Defect 1: Mobile accordion card (shown only on ≤768px) ───────────────────
// ── Mobile accordion card — same pattern as BooksPage ──────────────
function MobileTeamCard({ team, index, onView, onEdit, onDelete, deleting }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="book-mob-card">
      <button type="button" className="book-mob-header" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <div className="book-mob-summary">
          <span className="book-mob-num">{index + 1}</span>
          <div className="book-mob-title-wrap">
            <span className="book-mob-title">{team.teamName}</span>
            <span className="book-mob-author">Team ID: {team.teamId}</span>
          </div>
        </div>
        <span className="book-mob-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="book-mob-details">
          <div className="book-mob-row"><span className="book-mob-label">Team ID</span><span className="code-badge">{team.teamId}</span></div>
          <div className="book-mob-row"><span className="book-mob-label">Sport ID</span><span className="book-mob-value">{team.sportId}</span></div>
          <div className="book-mob-row"><span className="book-mob-label">Coach</span><span className="book-mob-value">{team.coachName}</span></div>
          <div className="book-mob-row"><span className="book-mob-label">Members</span><span className="book-mob-value">{Array.isArray(team.members) ? team.members.length : 0}</span></div>
          <div className="book-mob-row"><span className="book-mob-label">Status</span><span className="book-mob-value"><StatusBadge status={team.status} /></span></div>
          {team.description && <div className="book-mob-row"><span className="book-mob-label">Description</span><span className="book-mob-value">{team.description}</span></div>}
          <div className="book-mob-actions">
            <button
              type="button"
              className="action-btn view-btn"
              style={{ flex: 1, justifyContent: 'center' }}
              title="View Team"
              onClick={() => onView(team)}
            >
              <Eye size={14} /><span className="action-label">View</span>
            </button>
            <button
              type="button"
              className="action-btn edit-btn"
              style={{ flex: 1, justifyContent: 'center' }}
              title="Edit Team"
              onClick={() => onEdit(team)}
            >
              <Edit size={14} /><span className="action-label">Edit</span>
            </button>
            <button
              type="button"
              className="action-btn delete-btn"
              style={{ flex: 1, justifyContent: 'center' }}
              title="Delete Team"
              onClick={() => onDelete(team)}
              disabled={deleting === team.teamId}
            >
              <Trash2 size={14} /><span className="action-label">{deleting === team.teamId ? '...' : 'Delete'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SportTeamsPage() {
  const [teams,     setTeams]     = useState([]);
  const [sports,    setSports]    = useState([]);  // for Sport ID dropdown
  const [loading,   setLoading]   = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [delTeam,   setDelTeam]   = useState(null);
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

  // Fetch sports list for Sport ID dropdown
  useEffect(() => {
    springGet('/sports')
      .then((res) => setSports(Array.isArray(res) ? res : (res.data ?? [])))
      .catch(() => {});
  }, []);

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
      load();
    } catch (err) {
      setError(err.message || 'Failed to save team.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (team) => {
    setDelTeam(team);
  };

  const confirmDeleteTeam = async () => {
    if (!delTeam) return;
    setDeleting(delTeam.teamId);
    try {
      await springApi.delete(`/sport-teams/${delTeam.teamId}`);
      setSuccess('Team deleted successfully.');
      setDelTeam(null);
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
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Sport Teams</h1>
          <p className="page-subtitle">Manage all university sport teams</p>
        </div>
        <div className="feature-page-header-actions">
          <button className="books-btn books-btn-primary" onClick={openAdd}>
            + Add Team
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Table card */}
      <div className="card" style={{ padding: '1rem', overflow: 'hidden' }}>

        {/* Search + count */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="search-box-wrapper" style={{ maxWidth: 380 }}>
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by Team Name, Sport ID, or Coach..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{filtered.length}</strong>{' '}
            {filtered.length === 1 ? 'Team' : 'Teams'}
          </div>
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
            {/* ── Defect 1: Mobile accordion (≤768px) ── */}
            <div className="sport-team-mob">
              {filtered.map((team, idx) => (
                <MobileTeamCard
                  key={team.teamId}
                  team={team}
                  index={idx}
                  onView={openView}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              ))}
            </div>

            {/* ── Desktop table (>768px) ── */}
            <div className="sport-team-desk">
              <div className="books-table-wrap" style={{ overflowX: 'auto' }}>
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team id</th>
                      <th>Team name</th>
                      <th>Sport id</th>
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
                          <span className="code-badge">
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
                          {team.description || '—'}
                        </td>
                        <td>
                          <div className="books-actions">
                            <button
                              type="button"
                              className="action-btn view-btn"
                              title="View Team"
                              onClick={() => openView(team)}
                            >
                              <Eye size={14} /><span className="action-label">View</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              title="Edit Team"
                              onClick={() => openEdit(team)}
                            >
                              <Edit size={14} /><span className="action-label">Edit</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              title="Delete Team"
                              onClick={() => handleDelete(team)}
                              disabled={deleting === team.teamId}
                            >
                              <Trash2 size={14} /><span className="action-label">{deleting === team.teamId ? 'Deleting...' : 'Delete'}</span>
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
        sports={sports}
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

      <ConfirmDialog
        isOpen={!!delTeam}
        title="Delete Sport Team"
        description="Are you sure you want to delete this sport team? This action will permanently remove the record."
        itemName={delTeam?.teamName}
        itemSubtext={delTeam?.coachName ? `Coach: ${delTeam.coachName}` : 'Sport Team Record'}
        itemBadge={delTeam?.teamId}
        onConfirm={confirmDeleteTeam}
        onCancel={() => setDelTeam(null)}
        loading={!!deleting}
      />

    </div>
  );
}
