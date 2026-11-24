import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Loader2,
  AlertCircle,
  Calendar,
  ArrowLeft,
  X,
  User,
  Building2,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Detail modal
  const [viewAnn, setViewAnn] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewDownloading, setViewDownloading] = useState(false);

  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const now = new Date();
    const dt = new Date(d);
    const diffMs = now - dt;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(d);
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url) || url.includes('/image/upload/');
  };

  const fetchNotifications = async (page = currentPage) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page, limit: itemsPerPage });
      const res = await fetch(`${API_BASE_URL}/system-announcements?${params}`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(data.announcements || []);
      setTotalItems(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Open detail modal
  const openView = async (id) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/system-announcements/${id}`, {
        headers: authHeader(),
      });
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
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(objectUrl); }, 150);
    } catch {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = '';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 150);
    } finally {
      setViewDownloading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header — matches BulkUploadStudents */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate(-1)}
          title="Go back"
          style={{ marginBottom: '0.5rem' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', whiteSpace: 'nowrap' }}>
            All Notifications
          </h1>
          <p className="page-subtitle">
            System announcements and updates
          </p>
        </div>
      </div>

      {/* Total count badge */}
      {!loading && !error && totalItems > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <span style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
            padding: '4px 14px',
            borderRadius: 20,
            border: '1px solid var(--border-color)',
          }}>
            Total: {totalItems} Notification{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-secondary)' }}>
          <Loader2 size={24} className="spin-animate" />
          <span>Loading notifications…</span>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
          <AlertCircle size={32} style={{ marginBottom: '0.75rem' }} />
          <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Unable to load notifications</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{error}</p>
          <button
            type="button"
            className="books-btn books-btn-ghost"
            onClick={() => fetchNotifications()}
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--text-secondary)',
        }}>
          <Bell size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No notifications yet</p>
          <p style={{ fontSize: '0.85rem' }}>You're all caught up!</p>
        </div>
      ) : (
        <>
          {/* Notification cards */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {notifications.map((n, idx) => (
              <button
                key={n._id}
                type="button"
                onClick={() => openView(n._id)}
                style={{
                  display: 'flex',
                  gap: '0.875rem',
                  alignItems: 'flex-start',
                  padding: '1rem 1.25rem',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderBottom: idx < notifications.length - 1 ? '1px solid var(--border-color)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                className="notif-card-item"
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#eef2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <BellRing size={16} style={{ color: '#6366f1' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    color: 'var(--text-primary)',
                    marginBottom: '0.2rem',
                    lineHeight: 1.4,
                  }}>
                    {n.title}
                  </div>
                  {n.description && (
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '0.35rem',
                      whiteSpace: 'pre-wrap',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {n.description}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    opacity: 0.8,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={11} />
                      {timeAgo(n.createdAt)}
                    </span>
                    {n.announcementId && (
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 500,
                        padding: '1px 8px',
                        borderRadius: 12,
                        background: '#eef2ff',
                        color: '#6366f1',
                      }}>
                        {n.announcementId}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1.5rem',
              flexWrap: 'wrap',
            }}>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ padding: '6px 10px' }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === '...' ? (
                    <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text-secondary)' }}>…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePageChange(item)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: item === currentPage ? '1px solid var(--color-black, #111)' : '1px solid var(--border-color)',
                        background: item === currentPage ? 'var(--color-black, #111)' : 'var(--bg-primary)',
                        color: item === currentPage ? '#fff' : 'var(--text-primary)',
                        fontWeight: item === currentPage ? 700 : 400,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                type="button"
                className="books-btn books-btn-ghost"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ padding: '6px 10px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal — reuses ann-view-overlay / ann-view-modal classes */}
      {viewOpen && (
        <div className="ann-view-overlay" onClick={() => setViewOpen(false)}>
          <div className="ann-view-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="ann-view-modal-header">
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Notification Details
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
                  <p>Could not load notification.</p>
                </div>
              ) : (
                <>
                  {/* Title + date */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, flex: 1, margin: 0, minWidth: 0 }}>
                      <BellRing size={17} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: '#6366f1' }} />
                      {viewAnn.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: '0.8rem', flexShrink: 0 }}>
                      <Calendar size={13} />
                      <span>{formatDateTime(viewAnn.createdAt)}</span>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 1rem' }} />

                  {/* Meta */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Created by</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {viewAnn.createdBy?.name || viewAnn.createdBy?.email || 'System'}
                      </span>
                    </div>
                    {viewAnn.announcementId && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: '#eef2ff', color: '#6366f1' }}>
                        {viewAnn.announcementId}
                      </span>
                    )}
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

export default NotificationsPage;
