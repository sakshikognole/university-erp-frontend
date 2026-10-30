import { useState, useEffect, useCallback } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { springApi, springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import SportModal from './SportModal';
import ViewSportModal from './ViewSportModal';
import ConfirmDialog from '../components/ConfirmDialog';

const _IS_PROD_SP = window.location.hostname !== 'localhost';
const NODE_API = _IS_PROD_SP ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

export default function SportsPage() {
  const [sports,     setSports]     = useState([]);
  const [venues,     setVenues]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [pageError,  setPageError]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [delSport,   setDelSport]   = useState(null);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalMode,  setModalMode]  = useState('add');
  const [selSport,   setSelSport]   = useState(null);
  const [viewOpen,   setViewOpen]   = useState(false);
  const [viewSport,  setViewSport]  = useState(null);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');
  const [dupError,   setDupError]   = useState(''); // shown inside modal

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

  // Fetch venues for dropdown
  useEffect(() => {
    fetch(`${NODE_API}/venues`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('erp_token')}` },
    })
      .then((r) => r.json())
      .then((d) => setVenues(Array.isArray(d) ? d : (d.venues ?? [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const openAdd  = ()       => { setSelSport(null); setModalMode('add');  setDupError(''); setModalOpen(true); };
  const openEdit = (sport)  => { setSelSport(sport); setModalMode('edit'); setDupError(''); setModalOpen(true); };
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
          setDupError(`Sport ID "${form.sportId}" already exists.`);
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

  const handleDelete = (sport) => {
    setDelSport(sport);
  };

  const confirmDeleteSport = async () => {
    if (!delSport) return;
    setDeleting(delSport.sportId);
    try {
      await springApi.delete(`/sports/${delSport.sportId}`);
      setSuccess('Sport deleted successfully.');
      setDelSport(null);
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
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Sports</h1>
          <p className="page-subtitle">Manage all university sports</p>
        </div>
        <div className="feature-page-header-actions">
          <button className="books-btn books-btn-primary" onClick={openAdd}>
            + Add Sport
          </button>
        </div>
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
              {/* Card top strip removed */}

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
                  type="button"
                  className="action-btn view-btn"
                  title="View Details"
                  onClick={() => openView(sport)}
                >
                  <Eye size={14} /><span className="action-label">View</span>
                </button>
                <button
                  type="button"
                  className="action-btn edit-btn"
                  title="Edit Sport"
                  onClick={() => openEdit(sport)}
                >
                  <Edit size={14} /><span className="action-label">Edit</span>
                </button>
                <button
                  type="button"
                  className="action-btn delete-btn"
                  title="Delete Sport"
                  onClick={() => handleDelete(sport)}
                  disabled={deleting === sport.sportId}
                >
                  <Trash2 size={14} /><span className="action-label">{deleting === sport.sportId ? 'Deleting...' : 'Delete'}</span>
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
        venues={venues}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setDupError(''); }}
        loading={saving}
        dupError={dupError}
        onDupOk={() => setDupError('')}
      />

      <ViewSportModal
        isOpen={viewOpen}
        sport={viewSport}
        onClose={() => setViewOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!delSport}
        title="Delete Sport"
        description="Are you sure you want to delete this sport? This action will permanently remove the record."
        itemName={delSport?.sportName}
        itemSubtext={delSport?.venueId ? `Venue: ${delSport.venueId}` : 'Sport Record'}
        itemBadge={delSport?.sportId}
        onConfirm={confirmDeleteSport}
        onCancel={() => setDelSport(null)}
        loading={!!deleting}
      />

    </div>
  );
}
