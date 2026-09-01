import { springApi } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import Pagination from '../components/Pagination';
import HostelBlockModal from './HostelBlockModal';
import HostelBlockDetails from './HostelBlockDetails';

const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 6, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

export default function HostelPage() {
  const [blocks,       setBlocks]       = useState([]);
  const [pageData,     setPageData]     = useState(DEFAULT_PAGE);
  const [page,         setPage]         = useState(0);
  const [size,         setSize]         = useState(6);
  const [loading,      setLoading]      = useState(true);

  // modal
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editBlock,    setEditBlock]    = useState(null);

  // detail view — pass full block object
  const [viewBlock,    setViewBlock]    = useState(null);

  // feedback
  const [success,      setSuccess]      = useState('');
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Load blocks ───────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await springApi.get('/hostel-blocks', {
        params: { page, size },
      });
      const pd = res.data;
      setBlocks(pd.content);
      setPageData({
        pageNumber:    pd.number       ?? 0,
        pageSize:      pd.size         ?? size,
        totalElements: pd.totalElements,
        totalPages:    pd.totalPages,
        first:         pd.first,
        last:          pd.last,
      });
    } catch {
      setError('Failed to load hostel blocks.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, size]);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const openAdd  = ()      => { setEditBlock(null); setModalOpen(true); };
  const openEdit = (block) => { setEditBlock(block); setModalOpen(true); };

  const handleDelete = async (block) => {
    if (!window.confirm(`Delete "${block.hostelName}"?`)) return;
    try {
      await springApi.delete(`/hostel-blocks/${block.blockId}`);
      setSuccess('Hostel block deleted.');
      load(true);
    } catch (err) {
      setError(err.message || 'Failed to delete block.');
    }
  };

  const handleSaved = (msg) => {
    setSuccess(msg);
    setModalOpen(false);
    load(true);
  };

  // ── Detail view ───────────────────────────────────────────────────────
  if (viewBlock) {
    return (
      <HostelBlockDetails
        block={viewBlock}
        onBack={() => { setViewBlock(null); load(true); }}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* Header */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Hostel Management</h1>
          <p className="hst-page-sub">Manage hostel blocks, rooms and student allotments</p>
        </div>
        <button className="books-btn books-btn-primary" onClick={openAdd}>
          + Add Hostel Block
        </button>
      </div>

      {/* Alerts */}
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
        <p className="books-loading">Loading hostel blocks...</p>
      ) : blocks.length === 0 ? (
        <div className="hst-empty">
          <p>No hostel blocks yet. Click "+ Add Hostel Block" to get started.</p>
        </div>
      ) : (
        <div className="hst-grid">
          {blocks.map((block) => (
            <div key={block.blockId} className="hst-card">

              {/* Top: type badge + active status */}
              <div className="hst-card-top">
                <span className={`hst-badge hst-badge-${block.type?.toLowerCase()}`}>
                  {block.type}
                </span>
                <span className="hst-status">
                  <span className={`hst-status-dot ${block.active ? 'active' : 'inactive'}`} />
                  {block.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Block info */}
              <div className="hst-card-id">{block.blockId}</div>
              <div className="hst-card-name">{block.hostelName}</div>

              {/* Footer actions */}
              <div className="hst-card-footer">
                <button
                  className="books-btn books-btn-sm books-btn-primary"
                  onClick={() => setViewBlock(block)}
                >
                  View
                </button>
                <button
                  className="books-btn books-btn-sm books-btn-ghost"
                  onClick={() => openEdit(block)}
                >
                  Edit
                </button>
                <button
                  className="books-btn books-btn-sm books-btn-danger"
                  onClick={() => handleDelete(block)}
                >
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        pageData={pageData}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />

      {/* Add / Edit modal */}
      <HostelBlockModal
        isOpen={modalOpen}
        block={editBlock}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

    </div>
  );
}
