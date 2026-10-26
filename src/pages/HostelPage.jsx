import { springApi } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import Pagination from '../components/Pagination';
import HostelBlockModal from './HostelBlockModal';
import HostelBlockDetails from './HostelBlockDetails';

const DEFAULT_PAGE = {
  pageNumber: 0, pageSize: 6, totalElements: 0,
  totalPages: 0, first: true, last: true,
};

export default function HostelPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ?block=HB001 → shows HostelBlockDetails; no param → shows list
  const viewBlockId = searchParams.get('block');

  const [blocks,    setBlocks]    = useState([]);
  const [pageData,  setPageData]  = useState(DEFAULT_PAGE);
  const [page,      setPage]      = useState(0);
  const [size,      setSize]      = useState(6);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBlock, setEditBlock] = useState(null);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await springApi.get('/hostel-blocks', {
        params: { page, size },
      });
      const pd = res;
      setBlocks(pd.content ?? []);
      setPageData({
        pageNumber:    pd.number       ?? 0,
        pageSize:      pd.size         ?? size,
        totalElements: pd.totalElements ?? 0,
        totalPages:    pd.totalPages    ?? 0,
        first:         pd.first        ?? true,
        last:          pd.last         ?? true,
      });
    } catch {
      setError('Failed to load hostel blocks.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, size]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = ()      => { setEditBlock(null);  setModalOpen(true); };
  const openEdit = (block) => { setEditBlock(block); setModalOpen(true); };
  // Navigate to detail by putting blockId in URL — survives refresh
  const openView = (block) => setSearchParams({ block: block.blockId });
  const goBack   = ()      => { setSearchParams({}); load(true); };

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

  // ── Detail view — URL driven so refresh restores the same block ──
  if (viewBlockId) {
    // Try to find block in loaded list first
    // If blocks haven't loaded yet (page refresh), pass just { blockId }
    // HostelBlockDetails will fetch the full block from the API itself
    const blockObj = blocks.find(b => b.blockId === viewBlockId)
                  || { blockId: viewBlockId };
    return (
      <HostelBlockDetails
        block={blockObj}
        onBack={goBack}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── Page Header ── */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Hostel Management</h1>
          <p className="page-subtitle">Manage hostel blocks, rooms and student allotments</p>
        </div>
        <div className="header-actions-group">
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={openAdd}
          >
            <Plus size={16} />
            <span>Add Hostel Block</span>
          </button>
        </div>
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
        /* Skeleton loader — no blank screen while loading */
        <div className="hst-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hst-card" style={{ opacity: 0.6 }}>
              <div style={{ height: 12, width: '40%', borderRadius: 4, marginBottom: 10,
                background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
                backgroundSize: '200% 100%', animation: 'books-shimmer 1.4s infinite' }} />
              <div style={{ height: 14, width: '60%', borderRadius: 4, marginBottom: 8,
                background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
                backgroundSize: '200% 100%', animation: 'books-shimmer 1.4s infinite' }} />
              <div style={{ height: 12, width: '80%', borderRadius: 4,
                background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
                backgroundSize: '200% 100%', animation: 'books-shimmer 1.4s infinite' }} />
            </div>
          ))}
        </div>
      ) : blocks.length === 0 ? (
        <div className="hst-empty">
          <p>No hostel blocks yet. Click "+ Add Hostel Block" to get started.</p>
        </div>
      ) : (
        <div className="hst-grid">
          {blocks.map((block) => (
            <div key={block.blockId} className="hst-card">

              <div className="hst-card-top">
                <span className={`hst-badge hst-badge-${block.type?.toLowerCase()}`}>
                  {block.type}
                </span>
                <span className="hst-status">
                  <span className={`hst-status-dot ${block.active ? 'active' : 'inactive'}`} />
                  {block.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="hst-card-id">{block.blockId}</div>
              <div className="hst-card-name">{block.hostelName}</div>

              <div className="hst-card-footer" style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
                <button
                  type="button"
                  className="action-btn view-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  title="View Details"
                  onClick={() => openView(block)}
                >
                  <Eye size={14} /><span className="action-label">View</span>
                </button>
                <button
                  type="button"
                  className="action-btn edit-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  title="Edit Block"
                  onClick={() => openEdit(block)}
                >
                  <Edit size={14} /><span className="action-label">Edit</span>
                </button>
                <button
                  type="button"
                  className="action-btn delete-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  title="Delete Block"
                  onClick={() => handleDelete(block)}
                >
                  <Trash2 size={14} /><span className="action-label">Delete</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      <Pagination
        pageData={pageData}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />

      <HostelBlockModal
        isOpen={modalOpen}
        block={editBlock}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

    </div>
  );
}
