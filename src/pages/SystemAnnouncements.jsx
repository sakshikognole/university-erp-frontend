import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  Plus,
  Search,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  X,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const SystemAnnouncements = () => {
  const navigate = useNavigate();

  // Auth helpers
  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('erp_user') || 'null');
    } catch {
      return null;
    }
  };

  const canWrite = () => {
    const u = getUser();
    if (!u) return false;
    const role = (u.adminType || u.role || '').toUpperCase();
    return ['SUPER_ADMIN', 'SUB_ADMIN', 'TEACHER', 'FACULTY'].includes(role);
  };

  const canDelete = () => {
    const u = getUser();
    if (!u) return false;
    const role = (u.adminType || u.role || '').toUpperCase();
    return ['SUPER_ADMIN', 'SUB_ADMIN'].includes(role);
  };

  // List state
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, itemsPerPage]);

  // Debounce search so we don't hammer the server on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchAnnouncements(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAnnouncements = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: itemsPerPage,
      });
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`${API_BASE_URL}/system-announcements?${params}`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Failed to load announcements');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
      setTotalItems(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setFeedback({ type: '', message: '' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to load announcements from server.' });
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/system-announcements/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setFeedback({ type: 'success', message: data.message || 'Announcement deleted successfully.' });
      setDeleteConfirm(null);
      // Go back a page if we just deleted the only item on this page
      const newTotal = totalItems - 1;
      const newTotalPages = Math.ceil(newTotal / itemsPerPage) || 1;
      const safePage = Math.min(currentPage, newTotalPages);
      if (safePage !== currentPage) {
        setCurrentPage(safePage);
      } else {
        fetchAnnouncements(safePage);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete announcement.' });
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="page-container">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">System Announcements</h1>
          <p className="page-subtitle">Publish and manage official announcements for departments and students</p>
        </div>

        <div className="header-actions-group">
          {canWrite() && (
            <button
              type="button"
              className="books-btn books-btn-primary"
              onClick={() => navigate('/system-announcements/add')}
            >
              <Plus size={16} />
              <span>Add Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Feedback Banner ──────────────────────────────────────────────────── */}
      {feedback.message && (
        <div
          className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ margin: '1rem 0' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          <button
            type="button"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setFeedback({ type: '', message: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <div className="card table-card" style={{ marginTop: '1.25rem' }}>
        {/* Controls bar */}
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>
                Clear
              </button>
            )}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{totalItems}</strong> {totalItems === 1 ? 'Announcement' : 'Announcements'}
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" />
              <p>Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="table-empty-state">
              <BellRing size={36} className="empty-icon" />
              <h3>No announcements found</h3>
              <p>
                {search
                  ? `No announcements matched "${search}".`
                  : 'Get started by publishing your first system announcement.'}
              </p>
              {!search && canWrite() && (
                <button
                  type="button"
                  className="books-btn books-btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/system-announcements/add')}
                >
                  <Plus size={16} />
                  <span>Add Announcement</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th style={{ width: '130px' }}>ID</th>
                    <th>Title</th>
                    <th style={{ width: '130px' }}>Date</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((ann, i) => (
                    <tr
                      key={ann._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/system-announcements/view/${ann._id}`)}
                    >
                      <td className="text-secondary">{startIndex + i + 1}</td>
                      <td>
                        <span className="code-badge">{ann.announcementId}</span>
                      </td>
                      <td>
                        <span className="dept-name-cell">{ann.title}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {formatDate(ann.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          className="action-buttons-cell"
                          style={{ justifyContent: 'flex-end' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="View"
                            onClick={() => navigate(`/system-announcements/view/${ann._id}`)}
                          >
                            <Eye size={15} />
                            <span className="action-label">View</span>
                          </button>
                          {canDelete() && (
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              title="Delete"
                              onClick={() => setDeleteConfirm({ id: ann._id, title: ann.title })}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {startIndex + 1} to{' '}
                    {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} announcements
                  </div>
                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (
                        p === 1 ||
                        p === totalPages ||
                        (p >= currentPage - 1 && p <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={p}
                            type="button"
                            className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </button>
                        );
                      } else if (p === currentPage - 2 || p === currentPage + 2) {
                        return (
                          <span key={p} className="pagination-dots">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="items-per-page">
                    <span>Items per page:</span>
                    <select
                      className="items-per-page-select"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon">
                <AlertTriangle size={22} />
              </div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Announcement</h3>
                <p className="delete-dialog-desc">
                  This will permanently remove the announcement and any uploaded file.
                </p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => !deleting && setDeleteConfirm(null)}
                disabled={deleting}
              >
                <X size={18} />
              </button>
            </div>
            <div className="delete-item-preview">
              <div className="delete-item-name">{deleteConfirm.title}</div>
            </div>
            <div className="delete-warning-note">
              <AlertCircle size={14} />
              <span>This action cannot be undone.</span>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="spin-animate" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAnnouncements;
