import { springApi, springGet } from '../services/api';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Edit, Trash2, Search } from 'lucide-react';
import TeamForm from './TeamForm';
import TeamDetails from './TeamDetails';

// ── Inline Add Roster Modal ────────────────────────────────────────────────────
function AddRosterModal({ isOpen, teamId, onClose, onSuccess }) {
  const [prnInput,    setPrnInput]    = useState('');
  const [namePreview, setNamePreview] = useState('');
  const [prnList,     setPrnList]     = useState([]);
  const [adding,      setAdding]      = useState(false);
  const [error,       setError]       = useState('');
  const lookupTimer = useRef(null);

  useEffect(() => {
    if (!isOpen) { setPrnInput(''); setNamePreview(''); setPrnList([]); setError(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrn = (e) => {
    const val = e.target.value;
    if (val.endsWith(',')) {
      const typed = val.slice(0, -1).trim();
      if (typed && namePreview && namePreview !== 'Looking up...' && namePreview !== 'Not found') {
        if (!prnList.some((p) => p.prn === typed)) {
          setPrnList((prev) => [...prev, { prn: typed, studentName: namePreview }]);
        }
      }
      setPrnInput(''); setNamePreview(''); clearTimeout(lookupTimer.current); return;
    }
    setPrnInput(val);
    clearTimeout(lookupTimer.current);
    const trimmed = val.trim();
    if (!trimmed) { setNamePreview(''); return; }
    setNamePreview('Looking up...');
    lookupTimer.current = setTimeout(async () => {
      try {
        const res = await springApi.get(`/students/by-prn/${trimmed}`);
        setNamePreview(res?.studentName || res?.data?.studentName || 'Not found');
      } catch { setNamePreview('Not found'); }
    }, 400);
  };

  const saveRoster = async () => {
    if (prnList.length === 0) { setError('Add at least one student.'); return; }
    setAdding(true); setError('');
    let added = 0; const errs = [];
    for (const p of prnList) {
      try {
        await springApi.post(`/sport-teams/${teamId}/roster/add`, { studentPrn: p.prn, studentName: p.studentName });
        added++;
      } catch (err) { errs.push(err.message || `Failed: ${p.prn}`); }
    }
    setAdding(false);
    if (added > 0) { onSuccess(added); onClose(); }
    if (errs.length) setError(errs.join(' | '));
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 480 }}>
        <div className="books-modal-head">
          <h3>Add Roster — {teamId}</h3>
          <button className="books-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="books-modal-body">
          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 10 }}>{error}</p>}

          <div className="club-form-row">
            <div className="books-form-group">
              <label className="books-form-label">PRN</label>
              <input className="books-form-control" value={prnInput}
                onChange={handlePrn} placeholder="Enter PRN (press , to add)" />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                Type PRN → name auto-fills → press <strong>,</strong> to add
              </p>
            </div>
            <div className="books-form-group">
              <label className="books-form-label">Student Name</label>
              <input className="books-form-control" readOnly
                value={namePreview === 'Not found' ? 'Student not found' : namePreview}
                placeholder="Auto-filled"
                style={{
                  background: '#f9fafb', cursor: 'default',
                  color: namePreview === 'Not found' ? '#dc2626'
                    : namePreview && namePreview !== 'Looking up...' ? '#166534' : '#374151',
                  fontWeight: namePreview && namePreview !== 'Looking up...' && namePreview !== 'Not found' ? 600 : 400,
                }}
              />
            </div>
          </div>

          {prnList.length > 0 && (
            <div className="books-table-wrap" style={{ marginTop: 8 }}>
              <table className="books-table">
                <thead><tr><th>Prn</th><th>Student name</th><th style={{width:60}}>Del</th></tr></thead>
                <tbody>
                  {prnList.map((p) => (
                    <tr key={p.prn}>
                      <td style={{ fontFamily: 'monospace' }}>{p.prn}</td>
                      <td style={{ fontWeight: 500 }}>{p.studentName}</td>
                      <td>
                        <button className="books-btn books-btn-sm books-btn-danger"
                          onClick={() => setPrnList((prev) => prev.filter((x) => x.prn !== p.prn))}>
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="books-modal-foot">
          <button className="books-btn books-btn-ghost" onClick={onClose} disabled={adding}>Cancel</button>
          <button className="books-btn books-btn-primary" onClick={saveRoster} disabled={adding || prnList.length === 0}>
            {adding ? 'Adding...' : `Add ${prnList.length} Student(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile accordion card — same pattern as BooksPage ──────────────
function SportTeamMobileCard({ team, index, isExpanded, onToggle, onView, onEdit, onDelete, deleting }) {
  return (
    <div className="book-mob-card">
      {/* Tap header to expand/collapse */}
      <button
        type="button"
        className="book-mob-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="book-mob-summary">
          <span className="book-mob-num">{index + 1}</span>
          <div className="book-mob-title-wrap">
            <span className="book-mob-title">{team.sportName || team.teamId}</span>
            <span className="book-mob-author">Team ID: {team.teamId}</span>
          </div>
        </div>
        <span className="book-mob-chevron">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="book-mob-details">
          <div className="book-mob-row">
            <span className="book-mob-label">Team ID</span>
            <span className="book-mob-value mono">{team.teamId}</span>
          </div>
          <div className="book-mob-row">
            <span className="book-mob-label">Sport Name</span>
            <span className="book-mob-value">{team.sportName || '—'}</span>
          </div>
          <div className="book-mob-row">
            <span className="book-mob-label">Coach Name</span>
            <span className="book-mob-value">{team.coachName || '—'}</span>
          </div>
          <div className="book-mob-row">
            <span className="book-mob-label">Captain Name</span>
            <span className="book-mob-value">{team.captainName || '—'}</span>
          </div>
          <div className="book-mob-row">
            <span className="book-mob-label">Roster</span>
            <span className="book-mob-value">{team.roster ? team.roster.length : 0} student(s)</span>
          </div>
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
  const [dupError, setDupError] = useState('');
  const [rosterOpen,   setRosterOpen]   = useState(false);
  const [rosterTeamId, setRosterTeamId] = useState('');
  const [search,       setSearch]       = useState('');

  // Mobile accordion — only one team expanded at a time (same as BooksPage)
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  // Filter teams based on search input
  const filteredTeams = teams.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.teamId || '').toLowerCase().includes(q) ||
      (t.sportName || '').toLowerCase().includes(q) ||
      (t.coachName || '').toLowerCase().includes(q) ||
      (t.captainName || '').toLowerCase().includes(q)
    );
  });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await springGet('/sport-teams');
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

  const openAdd  = ()     => { setSelTeam(null); setFormMode('add');  setDupError(''); setFormOpen(true); };
  const openEdit = (team) => { setSelTeam(team); setFormMode('edit'); setDupError(''); setFormOpen(true); };
  // Navigate to detail view by setting URL param
  const openView = (team) => setSearchParams({ team: team.teamId });
  const goBack   = ()     => { setSearchParams({}); load(true); };

  const handleSave = async (form) => {
    setSaving(true);
    const slowTimer = setTimeout(() => {
      setError('Server is waking up (free tier). Please wait a moment...');
    }, 3000);
    try {
      if (formMode === 'add') {
        await springApi.post('/sport-teams', form);
        clearTimeout(slowTimer);
        setError('');
        setSuccess('Team created successfully.');
      } else {
        await springApi.put(`/sport-teams/${selTeam.teamId}`, form);
        clearTimeout(slowTimer);
        setError('');
        setSuccess('Team updated successfully.');
      }
      setFormOpen(false);
      load(true);
    } catch (err) {
      clearTimeout(slowTimer);
      const msg = err.message || 'Failed to save team.';
      // If it's a duplicate team ID error, show it inside the modal
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        setDupError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (team) => {
    if (!window.confirm(`Delete team "${team.teamId} — ${team.sportName}"?`)) return;
    setDeleting(team.teamId);
    const slowTimer = setTimeout(() => {
      setError('Server is processing deletion, please wait...');
    }, 4000);
    try {
      await springApi.delete(`/sport-teams/${team.teamId}`);
      clearTimeout(slowTimer);
      setError('');
      setSuccess('Team deleted successfully.');
      load(true);
    } catch {
      clearTimeout(slowTimer);
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
          <p className="page-subtitle">Manage university sport teams and rosters</p>
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

      {/* ── Table Card Container (border & styling matching Book feature) ── */}
      <div className="card">
        {/* ── Toolbar: Search + Total Count Badge (like Book feature) ── */}
        <div className="books-toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by Team ID, Sport, Coach, or Captain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="table-stats-badge" style={{ marginLeft: 'auto' }}>
            Total: <strong>{filteredTeams.length}</strong>{' '}
            {filteredTeams.length === 1 ? 'Team' : 'Teams'}
          </div>
        </div>

        {loading ? (
          /* Skeleton loader — same layout as table */
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th>Team id</th><th>Sport name</th><th>Coach name</th>
                  <th>Captain name</th><th>Roster</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[80, 110, 120, 120, 60, 120].map((w, j) => (
                      <td key={j}>
                        <div style={{
                          width: w, height: 13, borderRadius: 4,
                          background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'books-shimmer 1.4s infinite',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredTeams.length === 0 ? (
          <p className="st-empty" style={{ textAlign: 'center', padding: '2.5rem 0', color: '#9ca3af' }}>
            {search ? `No teams matched "${search}".` : 'No sport teams yet. Click "+ Add Team" to get started.'}
          </p>
        ) : (
          <>
            {/* ── Mobile view — accordion cards (same as BooksPage, hidden on tablet/desktop) ── */}
            <div className="book-mob-list">
              {filteredTeams.map((team, i) => (
                <SportTeamMobileCard
                  key={team.teamId}
                  team={team}
                  index={i}
                  isExpanded={expandedId === team.teamId}
                  onToggle={() => toggleExpand(team.teamId)}
                  onView={openView}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              ))}
            </div>

            {/* ── Desktop/tablet view — full table (hidden on mobile) ── */}
            <div className="book-desk-table">
              <div className="books-table-wrap">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>Team id</th>
                      <th>Sport name</th>
                      <th>Coach name</th>
                      <th>Captain name</th>
                      <th>Roster</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team) => (
                      <tr key={team.teamId}>
                        <td>{team.teamId}</td>
                        <td>{team.sportName}</td>
                        <td>{team.coachName}</td>
                        <td>{team.captainName}</td>
                        <td>{team.roster ? team.roster.length : 0} student(s)</td>
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

      <TeamForm
        isOpen={formOpen}
        mode={formMode}
        team={selTeam}
        onSave={handleSave}
        onClose={() => { setFormOpen(false); setDupError(''); }}
        loading={saving}
        dupError={dupError}
        onDupOk={() => setDupError('')}
      />

      <AddRosterModal
        isOpen={rosterOpen}
        teamId={rosterTeamId}
        onClose={() => setRosterOpen(false)}
        onSuccess={(count) => {
          setSuccess(`${count} student(s) added to roster successfully.`);
          load(true);
        }}
      />

    </div>
  );
}
