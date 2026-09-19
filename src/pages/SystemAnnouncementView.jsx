import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  BellRing,
  Calendar,
  User,
  Building2,
  FileText,
  Download,
  Edit,
} from 'lucide-react';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = `${_NODE_URL}/api`;

const SystemAnnouncementView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // ── auth ────────────────────────────────────────────────────────────────────
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

  const canEdit = () => {
    const u = getUser();
    if (!u) return false;
    const role = (u.adminType || u.role || '').toUpperCase();
    return ['SUPER_ADMIN', 'SUB_ADMIN', 'TEACHER', 'FACULTY'].includes(role);
  };

  // ── fetch announcement ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/system-announcements/${id}`, {
          headers: authHeader(),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || 'Announcement not found.');
        }
        const data = await res.json();
        setAnnouncement(data);
      } catch (err) {
        setError(err.message || 'Failed to load announcement.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── helpers ──────────────────────────────────────────────────────────────────
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '—';
    }
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url) || url.includes('/image/upload/');
  };

  // Download a file via the backend proxy.
  // The backend fetches the file server-side from Cloudinary (bypassing CORS and
  // raw-file delivery restrictions) and streams it to the browser.
  const downloadFile = async (url) => {
    if (!url) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const proxyUrl = `${API_BASE_URL}/system-announcements/download-proxy?url=${encodeURIComponent(url)}`;

      const res = await fetch(proxyUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = decodeURIComponent(url.split('/').pop().split('?')[0]) || 'attachment';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Last-resort fallback: open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header row */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/system-announcements')}
            title="Back to Announcements"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              Announcement Details
            </h1>
            <p className="page-subtitle">Full view of the system announcement</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem',
            color: 'var(--text-secondary)',
            gap: '0.75rem',
          }}
        >
          <Loader2 size={32} className="spin-animate" />
          <p>Loading announcement...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="feedback-banner feedback-error" style={{ margin: '1rem 0' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Announcement card */}
      {!loading && !error && announcement && (
        <div className="card" style={{ maxWidth: '820px', padding: '2rem 2.25rem' }}>

          {/* ── Title row ───────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            {/* Title */}
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.35,
                flex: 1,
              }}
            >
              <BellRing
                size={20}
                style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary, #6366f1)' }}
              />
              {announcement.title}
            </h2>

            {/* Date & time — top right */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-secondary)',
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Calendar size={14} />
              <span>{formatDateTime(announcement.createdAt)}</span>
            </div>
          </div>

          {/* ── Divider ─────────────────────────────────────────────────────── */}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color, #e5e7eb)', margin: '0 0 1.25rem' }} />

          {/* ── Meta: Created By ────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <User size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Created by</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {announcement.createdBy?.name || announcement.createdBy?.email || 'Unknown'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '2px 10px',
                  borderRadius: '20px',
                  background: 'var(--primary-light, #eef2ff)',
                  color: 'var(--primary, #6366f1)',
                  letterSpacing: '0.01em',
                }}
              >
                {announcement.announcementId}
              </span>
            </div>
          </div>

          {/* ── Departments ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '0.6rem' }}>
              <Building2 size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Departments
              </span>
            </div>

            {(!announcement.departments || announcement.departments.length === 0) ? (
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 12px',
                  borderRadius: '20px',
                  background: 'var(--hover-bg, #f3f4f6)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}
              >
                All Departments
              </span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {announcement.departments.map((dept) => (
                  <span
                    key={dept._id || dept}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: 'var(--primary-light, #eef2ff)',
                      color: 'var(--primary, #6366f1)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    <Building2 size={13} />
                    {dept.name || dept}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Content: description or file attachment ──────────────────────── */}
          {announcement.description && announcement.description.trim() && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.6rem',
                }}
              >
                Description
              </p>
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  background: 'var(--hover-bg, #f9fafb)',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  fontSize: '0.9375rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {announcement.description}
              </div>
            </div>
          )}

          {announcement.fileUrl && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.6rem',
                }}
              >
                Attachment
              </p>

              {isImageUrl(announcement.fileUrl) ? (
                <div
                  style={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    maxWidth: '560px',
                  }}
                >
                  <img
                    src={announcement.fileUrl}
                    alt="Announcement attachment"
                    style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '400px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div
                    style={{
                      padding: '8px 14px',
                      borderTop: '1px solid var(--border-color, #e5e7eb)',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <a
                      href={announcement.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.8125rem',
                        color: 'var(--primary, #6366f1)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      <ExternalLink size={13} />
                      Open full image
                    </a>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => downloadFile(announcement.fileUrl)}
                  disabled={downloading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    background: 'var(--hover-bg, #f9fafb)',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    color: downloading ? 'var(--text-secondary)' : 'var(--primary, #6366f1)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: downloading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {downloading
                    ? <Loader2 size={18} className="spin-animate" />
                    : <Download size={18} />}
                  <span>{downloading ? 'Downloading…' : 'Download Attachment'}</span>
                </button>
              )}
            </div>
          )}

          {/* ── Edit button (role-gated) ─────────────────────────────────────── */}
          {canEdit() && (
            <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color, #e5e7eb)', display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="books-btn books-btn-primary"
                onClick={() => navigate(`/system-announcements/edit/${announcement._id}`)}
              >
                <Edit size={15} />
                <span>Edit Announcement</span>
              </button>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/system-announcements')}
              >
                Back to List
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemAnnouncementView;
