import { useState, useEffect, useCallback } from 'react';
import { springApi, springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import SportModal from './SportModal';
import ViewSportModal from './ViewSportModal';

export default function SportsPage() {
  const [sports,     setSports]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [pageError,  setPageError]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalMode,  setModalMode]  = useState('add');
  const [selSport,   setSelSport]   = useState(null);
  const [viewOpen,   setViewOpen]   = useState(false);
  const [viewSport,  setViewSport]  = useState(null);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');

  // silent=true means refresh without showing loading spinner (no flicker)
  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await springGet('/sports');
      setSports(Array.isArray(res) ? res : (res.data ?? res ?? []));
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load sports.');
      else setError('Failed to refresh sports.');
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

  const openAdd  = ()       => { setSelSport(null); setModalMode('add');  setModalOpen(true); };
  const openEdit = (sport)  => { setSelSport(sport); setModalMode('edit'); setModalOpen(true); };
  const openView = (sport)  => { setViewSport(sport); setViewOpen(true); };

  const handleSave = async (form) => {
    setSaving(true);
    // Show a hint after 3 seconds if still saving (free tier cold start)
    const slowTimer = setTimeout(() => {
      setError('Server is waking up (free tier). Please wait a moment...');
    }, 3000);
    try {
      if (modalMode === 'add') {
        const isDuplicate = sports.some(
          (s) => s.sportId.trim().toUpperCase() === form.sportId.trim().toUpperCase()
        );
        if (isDuplicate) {
          clearTimeout(slowTimer);
          setError(`Sport ID "${form.sportId}" already exists. Please use a different Sport ID.`);
          setSaving(false);
          return;
        }
        await springApi.post('/sports', form);
        clearTimeout(slowTimer);
        setError('');
        setSuccess('Sport added successfully.');
      } else {
        await springApi.put(`/sports/${selSport.sportId}`, form);
        clearTimeout(slowTimer);
        setError('');
        setSuccess('Sport updated successfully.');
      }
      setModalOpen(false);
      load(true);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.message || 'Failed to save sport.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sport) => {
    if (!window.confirm(`Delete "${sport.sportName}"?`)) return;
    setDeleting(sport.sportId);
    try {
      await springApi.delete(`/sports/${sport.sportId}`);
      setSuccess('Sport deleted successfully.');
      load(true); // silent refresh — no flicker
    } catch {
      setError('Failed to delete sport.');
    } finally {
      setDeleting(null);
    }
  };

  // Truncate description to 100 characters
  const truncate = (text) => {
    if (!text) return '';
    return text.length > 100 ? text.slice(0, 100) + '...' : text;
  };

  return (
    <div className="page-container">

      {/* Header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Sports</h1>
          <p className="stu-page-sub">Manage all university sports</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={openAdd}>
          + Add Sport
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

      {/* Cards */}
      {loading ? (
        <PageLoader message="Loading sports..." />
      ) : pageError ? (
        <PageError message={pageError} onRetry={load} />
      ) : sports.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p className="stu-info-text">No sports added yet. Click "+ Add Sport" to get started.</p>
        </div>
      ) : (
        <div className="sport-grid">
          {sports.map((sport) => (
            <div
              key={sport.sportId}
              className="sport-card"
              onClick={() => openView(sport)}
              style={{ cursor: 'pointer' }}
            >
              {/* Top strip */}
              <div className={`sport-card-strip ${sport.status === 'ACTIVE' ? 'sport-strip-active' : 'sport-strip-inactive'}`} />

              <div className="sport-card-body">

                {/* Header */}
                <div className="sport-card-header">
                  <div>
                    <p className="sport-card-id">{sport.sportId}</p>
                    <h3 className="sport-card-name">{sport.sportName}</h3>
                  </div>
                  <span className={`sport-status-badge ${sport.status === 'ACTIVE' ? 'sport-badge-active' : 'sport-badge-inactive'}`}>
                    {sport.status}
                  </span>
                </div>

                {/* Details */}
                <div className="sport-card-details">
                  <div className="sport-detail-item">
                    <span className="sport-detail-label">Capacity</span>
                    <span className="sport-detail-value">{sport.capacity}</span>
                  </div>
                  <div className="sport-detail-item">
                    <span className="sport-detail-label">Venue ID</span>
                    <span className="sport-detail-value">{sport.venueId}</span>
                  </div>
                </div>

                {/* Description — 100 chars max on card */}
                {sport.description && (
                  <p className="sport-card-desc">{truncate(sport.description)}</p>
                )}

              </div>

              {/* Footer — stop propagation so card click doesn't fire */}
              <div className="sport-card-footer" onClick={(e) => e.stopPropagation()}>
                <button
                  className="books-btn books-btn-sm books-btn-ghost"
                  onClick={() => openEdit(sport)}
                >
                  Edit
                </button>
                <button
                  className="books-btn books-btn-sm books-btn-danger"
                  onClick={() => handleDelete(sport)}
                  disabled={deleting === sport.sportId}
                >
                  {deleting === sport.sportId ? 'Deleting...' : 'Delete'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      <SportModal
        isOpen={modalOpen}
        mode={modalMode}
        sport={selSport}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        loading={saving}
      />

      <ViewSportModal
        isOpen={viewOpen}
        sport={viewSport}
        onClose={() => setViewOpen(false)}
      />

    </div>
  );
}
