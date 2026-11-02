import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Search,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Calendar,
  User,
  Building2,
  Download,
  ExternalLink,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

// ---------------------------------------------------------------------------
// SystemAnnouncementsBoard
//
// View-only list of system announcements. Mirrors the System Announcements UI
// but exposes no add / edit / delete actions — users can only browse the list
// and open an announcement to read it.
// ---------------------------------------------------------------------------

// Mobile accordion card — view only, no edit/delete
function AnnMobCard({ ann, num, formatDate, onView }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className="mob-card">
      <button
        type="button"
        className="mob-card-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="mob-card-summary">
          <span className="mob-card-num">{num}</span>
          <div className="mob-card-title-wrap">
            <span className="mob-card-title">{ann.title}</span>
            <span className="mob-card-sub">{ann.announcementId}</span>
          </div>
        </div>
        <span className="mob-card-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mob-card-details">
          <div className="mob-card-row">
            <span className="mob-card-label">Date</span>
            <span className="mob-card-value">{formatDate(ann.createdAt)}</span>
          </div>
          <div className="mob-card-actions" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="action-btn view-btn"
              style={{ flex: '0 0 auto' }}
              onClick={onView}
            >
              <Eye size={14} /><span className="action-label">View</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SystemAnnouncementsBoard = () => {
  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  // List state
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // View modal state
  const [viewAnn, setViewAnn] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewDownloading, setViewDownloading] = useState(false);

  const openView = async (id) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/system-announcements/${id}`, { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setViewAnn(data);
    } catch {
      setViewAnn(null);
    } finally {
      setViewLoading(false);
    }
  };

  const downloadFile = async (url) => {
    if (!url) return;
    setViewDownloading(true);
    try {
      const proxyUrl = `${API_BASE_URL}/system-announcements/download-proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = decodeURIComponent(url.split('/').pop().split('?')[0]) || 'attachment';
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(objectUrl); }, 150);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setViewDownloading(false);
    }
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url) || url.includes('/image/upload/');
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  // Debounce search so we don't hammer the server on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchAnnouncements(1);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <p className="page-subtitle">Browse official announcements for departments and students</p>
        </div>
      </div>

      {/* ── Feedback Banner ──────────────────────────────────────────────────── */}
      {feedback.message && (
        <div
          className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ margin: '1rem 0' }}
        >
          {feedback.type === 'success' ? <AlertCircle size={18} /> : <AlertCircle size={18} />}
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
                  : 'There are no system announcements to display right now.'}
              </p>
            </div>
          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="ann-desk-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th style={{ width: '130px' }}>ID</th>
                    <th>Title</th>
                    <th style={{ width: '130px' }}>Date</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((ann, i) => (
                    <tr
                      key={ann._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => openView(ann._id)}
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
                      <td style={{ textAlign: 'center' }}>
                        <div
                          className="action-buttons-cell"
                          style={{ justifyContent: 'center' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="action-btn view-btn"
                            title="View"
                            onClick={() => openView(ann._id)}
                          >
                            <Eye size={14} />
                            <span className="action-label">View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* ── Mobile card list ── */}
              <div className="ann-mob-list" style={{ padding: '0.5rem 0.75rem' }}>
                {announcements.map((ann, i) => (
                  <AnnMobCard
                    key={ann._id}
                    ann={ann}
                    num={startIndex + i + 1}
                    formatDate={formatDate}
                    onView={() => openView(ann._id)}
                  />
                ))}
              </div>

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

      {/* ── Inline View Modal ─────────────────────────────────────────────── */}
      {viewOpen && (
        <div className="ann-view-overlay" onClick={() => setViewOpen(false)}>
          <div className="ann-view-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="ann-view-modal-header">
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Announcement Details
              </h2>
              <button type="button" className="close-modal-btn" onClick={() => setViewOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="ann-view-modal-body">
              {viewLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Loader2 size={24} className="spin-animate" />
                  <span>Loading...</span>
                </div>
              ) : !viewAnn ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={28} style={{ color: '#ef4444', margin: '0 auto 0.5rem' }} />
                  <p>Could not load announcement.</p>
                </div>
              ) : (
                <>
                  {/* Title + date */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, flex: 1, margin: 0 }}>
                      <BellRing size={17} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: '#6366f1' }} />
                      {viewAnn.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: '0.8rem', flexShrink: 0 }}>
                      <Calendar size={13} />
                      <span>{formatDate(viewAnn.createdAt)}</span>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 1rem' }} />

                  {/* Meta */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Created by</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {viewAnn.createdBy?.name || viewAnn.createdBy?.email || 'Unknown'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: '#eef2ff', color: '#6366f1' }}>
                      {viewAnn.announcementId}
                    </span>
                  </div>

                  {/* Departments */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                      <Building2 size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Departments</span>
                    </div>
                    {(!viewAnn.departments || viewAnn.departments.length === 0) ? (
                      <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>All Departments</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {viewAnn.departments.map(dept => (
                          <span key={dept._id || dept} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: '#eef2ff', color: '#6366f1', fontSize: '0.8125rem', fontWeight: 500 }}>
                            <Building2 size={12} />{dept.name || dept}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {viewAnn.description && viewAnn.description.trim() && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Description</p>
                      <div style={{ padding: '0.875rem 1rem', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {viewAnn.description}
                      </div>
                    </div>
                  )}

                  {/* Attachment */}
                  {viewAnn.fileUrl && (
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Attachment</p>
                      {isImageUrl(viewAnn.fileUrl) ? (
                        <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', maxWidth: 480 }}>
                          <img src={viewAnn.fileUrl} alt="Attachment" style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 300 }} onError={e => { e.target.style.display = 'none'; }} />
                          <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                            <a href={viewAnn.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                              <ExternalLink size={12} />Open full image
                            </a>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => downloadFile(viewAnn.fileUrl)} disabled={viewDownloading}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: viewDownloading ? 'var(--text-secondary)' : '#6366f1', fontSize: '0.875rem', fontWeight: 500, cursor: viewDownloading ? 'not-allowed' : 'pointer' }}>
                          {viewDownloading ? <Loader2 size={16} className="spin-animate" /> : <Download size={16} />}
                          <span>{viewDownloading ? 'Downloading…' : 'Download Attachment'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="ann-view-modal-footer">
              <button type="button" className="books-btn books-btn-ghost" onClick={() => setViewOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAnnouncementsBoard;
