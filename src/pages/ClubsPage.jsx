import { useState, useEffect, useCallback } from 'react';
import { springApi, springGet } from '../services/api';
import PageError  from '../components/PageError';
import ClubModal from './ClubModal';
import ViewClubModal from './ViewClubModal';

export default function ClubsPage() {
  const [clubs,      setClubs]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [pageError,  setPageError]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null); // holds id being deleted
  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalMode,  setModalMode]  = useState('add');
  const [selClub,    setSelClub]    = useState(null);
  const [viewOpen,   setViewOpen]   = useState(false);
  const [viewClub,   setViewClub]   = useState(null);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [dupError,   setDupError]   = useState(''); // shown inside modal

  // silent=true means refresh without showing loading spinner (no flicker)
  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await springGet('/clubs');
      setClubs(Array.isArray(res) ? res : (res.data ?? res ?? []));
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load clubs.');
      else setError('Failed to refresh clubs.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const openAdd  = ()      => { setSelClub(null); setModalMode('add');  setDupError(''); setModalOpen(true); };
  const openEdit = (club)  => { setSelClub(club); setModalMode('edit'); setDupError(''); setModalOpen(true); };
  const openView = (club)  => { setViewClub(club); setViewOpen(true); };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modalMode === 'add') {
        // Defect 4: Duplicate Club ID check — compare against loaded clubs
        const isDuplicate = clubs.some(
          (c) => c.clubId.trim().toUpperCase() === form.clubId.trim().toUpperCase()
        );
        if (isDuplicate) {
          setDupError(`Club ID "${form.clubId}" already exists. Please use a different Club ID.`);
          setSaving(false);
          return;
        }
        await springApi.post('/clubs', form);
        setSuccess('Club added successfully.');
      } else {
        await springApi.put(`/clubs/${selClub.id}`, form);
        setSuccess('Club updated successfully.');
      }
      setModalOpen(false);
      load(true);
    } catch (err) {
      // Fixed: use err.message (interceptor converts all errors to Error objects)
      setError(err.message || 'Failed to save club.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (club) => {
    if (!window.confirm(`Delete "${club.clubName}"?`)) return;
    setDeleting(club.id);
    try {
      await springApi.delete(`/clubs/${club.id}`);
      setSuccess('Club deleted successfully.');
      load(true); // silent refresh — no flicker
    } catch {
      setError('Failed to delete club.');
    } finally {
      setDeleting(null);
    }
  };

  // Only independent clubs shown in parent dropdown
  const parentClubs = clubs.filter((c) => !c.parentClubId);

  // Group: parent clubs first, then sub-clubs under their parent
  const parentList = clubs.filter((c) => !c.parentClubId);
  const subMap     = clubs
    .filter((c) => c.parentClubId)
    .reduce((acc, c) => {
      if (!acc[c.parentClubId]) acc[c.parentClubId] = [];
      acc[c.parentClubId].push(c);
      return acc;
    }, {});

  // Final ordered list: parent + its sub-clubs, then next parent...
  const ordered = [];
  parentList.forEach((p) => {
    ordered.push(p);
    (subMap[p.clubId] || []).forEach((s) => ordered.push(s));
  });
  // Any sub-club whose parent doesn't exist yet — show at end
  clubs
    .filter((c) => c.parentClubId && !parentList.find((p) => p.clubId === c.parentClubId))
    .forEach((c) => ordered.push(c));

  const getParentName = (parentClubId) => {
    const p = clubs.find((c) => c.clubId === parentClubId);
    return p ? p.clubName : parentClubId;
  };

  // Skeleton shimmer helper — returns inline style for a shimmer placeholder
  const skel = (width, height, margin = 0, borderRadius = 4) => ({
    width,
    height,
    margin,
    borderRadius,
    background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
    backgroundSize: '200% 100%',
    animation: 'books-shimmer 1.4s infinite',
  });

  return (
    <div className="page-container">

      {/* Page header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Clubs</h1>
          <p className="stu-page-sub">Manage clubs and sub-clubs</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={openAdd}>
          + Add Club
        </button>
      </div>

      {/* Notifications */}
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

      {/* Content */}
      {loading ? (
        /* Skeleton cards — same layout as real club cards so the wait feels
           intentional. Render free tier cold starts take 5-6s on first load. */
        <div className="club-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="club-card" style={{ pointerEvents: 'none' }}>
              <div className="club-card-top" style={{ padding: '14px 16px 10px' }}>
                <div style={skel(80, 13)} />
                <div style={skel(50, 13)} />
              </div>
              <div className="club-card-body" style={{ padding: '0 16px 14px' }}>
                <div style={skel('70%', 16, '0 0 8px')} />
                <div style={skel('90%', 11)} />
                <div style={{ ...skel('60%', 11), marginTop: 4 }} />
                <div style={{ display:'flex', gap:8, marginTop:12 }}>
                  <div style={skel(70, 28, 0, 6)} />
                  <div style={skel(70, 28, 0, 6)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : pageError ? (
        <PageError message={pageError} onRetry={load} />
      ) : ordered.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p className="stu-info-text">No clubs added yet. Click "+ Add Club" to get started.</p>
        </div>
      ) : (
        <div className="club-grid">
          {ordered.map((club) => (
            <div
              key={club.id}
              className={`club-card ${club.parentClubId ? 'club-card-sub' : ''}`}
              onClick={() => openView(club)}
              style={{ cursor: 'pointer' }}
            >
              {/* Card top strip — colored by status */}
              <div className={`club-card-strip ${club.status === 'Active' ? 'strip-active' : 'strip-inactive'}`} />

              <div className="club-card-body">

                {/* Header row */}
                <div className="club-card-header">
                  <div>
                    <p className="club-card-id">{club.clubId}</p>
                    <h3 className="club-card-name">{club.clubName}</h3>
                  </div>
                  <span className={`club-status-badge ${club.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                    {club.status}
                  </span>
                </div>

                {/* Sub-club tag */}
                {club.parentClubId && (
                  <p className="club-parent-tag">
                    Sub-club of: {getParentName(club.parentClubId)}
                  </p>
                )}

                {/* Category */}
                {club.clubCategory && (
                  <p className="club-category">{club.clubCategory}</p>
                )}

                {/* Description — truncated to 100 chars on card */}
                {club.description && (
                  <p className="club-description">
                    {club.description.length > 100
                      ? club.description.slice(0, 100) + '...'
                      : club.description}
                  </p>
                )}

                <div className="club-divider" />

                {/* Details grid */}
                <div className="club-details-grid">
                  {club.facultyCoordinator && (
                    <div className="club-detail-item">
                      <span className="club-detail-label">Faculty</span>
                      <span className="club-detail-value">{club.facultyCoordinator}</span>
                    </div>
                  )}
                  {club.activeMembers != null && (
                    <div className="club-detail-item">
                      <span className="club-detail-label">Members</span>
                      <span className="club-detail-value">{club.activeMembers}</span>
                    </div>
                  )}
                  {club.studentLeadName && (
                    <div className="club-detail-item">
                      <span className="club-detail-label">Student Lead</span>
                      <span className="club-detail-value">
                        {club.studentLeadName}
                        {club.studentLeadRole && ` — ${club.studentLeadRole}`}
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Card actions */}
              <div className="club-card-footer" onClick={(e) => e.stopPropagation()}>
                <button
                  className="books-btn books-btn-sm books-btn-ghost"
                  onClick={() => openEdit(club)}
                >
                  Edit
                </button>
                <button
                  className="books-btn books-btn-sm books-btn-danger"
                  onClick={() => handleDelete(club)}
                  disabled={deleting === club.id}
                >
                  {deleting === club.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      <ClubModal
        isOpen={modalOpen}
        mode={modalMode}
        club={selClub}
        parentClubs={parentClubs}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setDupError(''); }}
        loading={saving}
        dupError={dupError}
        onDupOk={() => setDupError('')}
      />

      <ViewClubModal
        isOpen={viewOpen}
        club={viewClub}
        parentClubs={clubs}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
