/**
 * Alumni.jsx — Alumni Profiles listing page
 *
 * Defects fixed:
 *   D1  Download button right-aligned, content-sized on mobile
 *   D2  Add Alumni right-aligned, content-sized on mobile
 *   D3  Bulk Upload right-aligned, content-sized on mobile
 *   D7  Empty CSV guard → "No Alumni records available to download."
 *   D8  Empty TXT guard → same message
 *   D9  Empty PDF guard → same message
 *   Perf AbortController prevents stale-response race conditions; loading
 *       state always cleared; error + retry surface; list refreshed after
 *       every mutation without full-page reload
 *   Imp-C  Replaced Profile Links column with Email and Phone columns;
 *          profile links remain accessible via Edit
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Download, Search, ChevronDown, FileText, FileSpreadsheet,
  Printer, AlertCircle, CheckCircle2, Loader2, ChevronLeft, ChevronRight,
  Upload, Edit, Trash2, X, AlertTriangle, RefreshCw,
} from 'lucide-react';

const _IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';
const NO_RECORDS_MSG = 'No Alumni records available to download.';

// ── Export helpers ────────────────────────────────────────────────────────────
const triggerDownload = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 150);
};

// D7: guard added — no download when rows is empty
const exportCSV = (rows, setFeedback) => {
  if (!rows || rows.length === 0) {
    setFeedback({ type: 'error', message: NO_RECORDS_MSG });
    return;
  }
  const headers = [
    'Alumni ID', 'Name', 'Graduation Year', 'Job Title', 'Current Company',
    'Email', 'Phone', 'LinkedIn', 'GitHub', 'Portfolio',
  ];
  const body = rows.map(a => [
    a.alumniId, a.name, a.graduationYear, a.jobTitle, a.currentCompany,
    a.email, a.phone,
    a.socialLinks?.linkedin, a.socialLinks?.github, a.socialLinks?.portfolio,
  ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));
  triggerDownload(
    [headers.join(','), ...body].join('\r\n'),
    `alumni_${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8;',
  );
};

// D8: guard added
const exportTXT = (rows, setFeedback) => {
  if (!rows || rows.length === 0) {
    setFeedback({ type: 'error', message: NO_RECORDS_MSG });
    return;
  }
  const sep   = '='.repeat(90);
  const lines = [
    'UNIVERSITY ERP — ALUMNI DIRECTORY',
    `Generated: ${new Date().toLocaleString()}   Total: ${rows.length}`,
    sep,
    'ID         NAME                         YEAR   JOB TITLE                   COMPANY',
    '-'.repeat(90),
    ...rows.map(a =>
      `${(a.alumniId||'').padEnd(10)} ${(a.name||'').padEnd(28)} ${String(a.graduationYear||'').padEnd(6)} ${(a.jobTitle||'').padEnd(27)} ${a.currentCompany||''}`
    ),
    sep, 'End of Report',
  ];
  triggerDownload(
    lines.join('\r\n'),
    `alumni_${new Date().toISOString().slice(0, 10)}.txt`,
    'text/plain',
  );
};

// D9: guard added
const exportPDF = (rows, setFeedback) => {
  if (!rows || rows.length === 0) {
    setFeedback({ type: 'error', message: NO_RECORDS_MSG });
    return;
  }
  const rowsHtml = rows.map((a, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
      <td>${i+1}</td><td>${a.alumniId||''}</td><td>${a.name||''}</td>
      <td>${a.graduationYear||''}</td><td>${a.jobTitle||''}</td>
      <td>${a.currentCompany||''}</td><td>${a.email||''}</td><td>${a.phone||''}</td>
    </tr>`).join('');
  const html = `<html><head><title>Alumni</title><style>
    body{font-family:Arial,sans-serif;font-size:11px;margin:24px}
    h2{font-size:16px;margin-bottom:4px}p{margin:2px 0 12px;color:#555;font-size:10px}
    table{width:100%;border-collapse:collapse}
    th{background:#111;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
    td{padding:5px 8px;border-bottom:1px solid #e5e5e5}
  </style></head><body>
    <h2>Alumni Directory</h2>
    <p>Generated: ${new Date().toLocaleString()} &bull; Total: ${rows.length}</p>
    <table><thead><tr>
      <th>#</th><th>ID</th><th>Name</th><th>Year</th>
      <th>Job Title</th><th>Company</th><th>Email</th><th>Phone</th>
    </tr></thead><tbody>${rowsHtml}</tbody></table>
  </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
};
// ─────────────────────────────────────────────────────────────────────────────

// Mobile accordion card
function AlmMobCard({ a, num, onEdit, onDelete, expanded, onToggle }) {
  return (
    <div className="mob-card">
      <button type="button" className="mob-card-header" onClick={onToggle} aria-expanded={expanded}>
        <div className="mob-card-summary">
          <span className="mob-card-num">{num}</span>
          <div className="mob-card-title-wrap">
            <span className="mob-card-title">{a.name}</span>
            <span className="mob-card-sub">{a.alumniId} — {a.graduationYear}</span>
          </div>
        </div>
        <span className="mob-card-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mob-card-details">
          <div className="mob-card-row"><span className="mob-card-label">Alumni ID</span><span className="mob-card-value mono">{a.alumniId}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Year</span><span className="mob-card-value">{a.graduationYear || '—'}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Job Title</span><span className="mob-card-value">{a.jobTitle || '—'}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Company</span><span className="mob-card-value">{a.currentCompany || '—'}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Email</span><span className="mob-card-value">{a.email || '—'}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Phone</span><span className="mob-card-value">{a.phone || '—'}</span></div>
          <div className="mob-card-actions">
            <button type="button" className="action-btn edit-btn" onClick={onEdit}><Edit size={15} /><span className="action-label">Edit</span></button>
            <button type="button" className="action-btn delete-btn" onClick={onDelete}><Trash2 size={15} /><span className="action-label">Delete</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

const Alumni = () => {
  const navigate = useNavigate();

  const [alumni,    setAlumni]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(null);   // distinct from "empty list"
  const [deleting,  setDeleting]  = useState(false);
  const [search,    setSearch]    = useState('');
  const [feedback,  setFeedback]  = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [deleteConfirm,    setDeleteConfirm]    = useState(null);
  const [almExpanded, setAlmExpanded] = useState(null);
  const downloadMenuRef = useRef(null);

  // Performance: keep a ref to the active fetch so we can abort on unmount /
  // re-fetch, preventing stale responses from landing in state after the
  // component has moved on.
  const fetchControllerRef = useRef(null);

  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const authHeader = useCallback(() => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, []);

  // Performance: fetchAlumni is stable (useCallback) so it can be called from
  // anywhere without triggering spurious re-renders.
  const fetchAlumni = useCallback(async () => {
    // Cancel any in-flight request before starting a new one
    if (fetchControllerRef.current) fetchControllerRef.current.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni`, {
        headers: authHeader(),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setAlumni(data);
      setFeedback({ type: '', message: '' });
    } catch (err) {
      if (err.name === 'AbortError') return; // navigated away — do nothing
      setLoadError(err.message || 'Failed to load alumni');
      setFeedback({ type: 'error', message: 'Failed to load alumni from server. Check your connection and retry.' });
      setAlumni([]);
    } finally {
      // Only clear loading if this controller is still the active one
      if (fetchControllerRef.current === controller) setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchAlumni();
    return () => { if (fetchControllerRef.current) fetchControllerRef.current.abort(); };
  }, [fetchAlumni]);

  useEffect(() => {
    const handler = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target))
        setShowDownloadMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/alumni/${id}`, { method: 'DELETE', headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setFeedback({ type: 'success', message: data.message });
      fetchAlumni(); // refresh list without full-page reload
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  // D7-D9: pass setFeedback into export functions so they can show the message
  const handleExport = (fmt) => {
    setShowDownloadMenu(false);
    setFeedback({ type: '', message: '' });
    if (fmt === 'csv') exportCSV(filteredAlumni, setFeedback);
    if (fmt === 'txt') exportTXT(filteredAlumni, setFeedback);
    if (fmt === 'pdf') exportPDF(filteredAlumni, setFeedback);
  };

  const filteredAlumni = alumni.filter((a) => {
    const q = search.toLowerCase().trim();
    return !q ||
      (a.name||'').toLowerCase().includes(q) ||
      (a.alumniId||'').toLowerCase().includes(q) ||
      (a.jobTitle||'').toLowerCase().includes(q) ||
      (a.currentCompany||'').toLowerCase().includes(q) ||
      (a.email||'').toLowerCase().includes(q) ||
      (a.phone||'').includes(q) ||
      String(a.graduationYear||'').includes(q);
  });

  const totalPages   = Math.ceil(filteredAlumni.length / itemsPerPage) || 1;
  const startIndex   = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredAlumni.slice(startIndex, startIndex + itemsPerPage);

  return (
    // D1-D3: alumni-page scope for CSS overrides
    <div className="page-container alumni-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Alumni Profiles</h1>
          <p className="page-subtitle">Manage alumni records, professional info, and social links</p>
        </div>

        {/* D1/D2/D3: alumni-header-actions keeps buttons right-aligned + content-sized on mobile */}
        <div className="header-actions-group alumni-header-actions">
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button type="button" className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
              <Download size={16} /><span>Download</span><ChevronDown size={14} />
            </button>
            {showDownloadMenu && (
              <div className="download-dropdown-menu">
                <div className="dropdown-menu-header">Select Export Format</div>
                <button type="button" className="dropdown-menu-item" onClick={() => handleExport('csv')}>
                  <FileSpreadsheet size={15} /><span>CSV Spreadsheet (.csv)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => handleExport('txt')}>
                  <FileText size={15} /><span>Text Document (.txt)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => handleExport('pdf')}>
                  <Printer size={15} /><span>Printable PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          <button type="button" className="btn btn-secondary"
            onClick={() => navigate('/alumni/bulk-upload')}>
            <Upload size={16} /><span>Bulk Upload</span>
          </button>

          <button type="button" className="books-btn books-btn-primary"
            onClick={() => navigate('/alumni/add')}>
            <Plus size={16} /><span>Add Alumni</span>
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ margin: '1rem 0' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          {/* Performance: retry button when load fails */}
          {loadError && (
            <button type="button"
              style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px',
                       background: 'transparent', border: '1px solid currentColor', borderRadius: '4px',
                       padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer', color: 'inherit' }}
              onClick={fetchAlumni}>
              <RefreshCw size={13} /><span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Table Card */}
      <div className="card table-card" style={{ marginTop: '1.25rem' }}>
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input type="text" className="search-input"
              placeholder="Search by Name, ID, Email, Job Title, or Company…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>Clear</button>
            )}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{filteredAlumni.length}</strong> Alumni
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" /><p>Loading alumni…</p>
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div className="table-empty-state">
              <Users size={36} className="empty-icon" />
              <h3>No alumni found</h3>
              <p>
                {loadError
                  ? 'Could not load alumni from the server. Use Retry above.'
                  : search
                    ? `No alumni matched "${search}".`
                    : 'Get started by adding your first alumni profile.'}
              </p>
              {!loadError && !search && (
                <button type="button" className="books-btn books-btn-primary"
                  style={{ marginTop: '1rem' }} onClick={() => navigate('/alumni/add')}>
                  <Plus size={16} /><span>Add Alumni</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="alm-desk-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th style={{ width: '110px' }}>Alumni ID</th>
                    <th>Name</th>
                    <th style={{ width: '90px' }}>Year</th>
                    <th>Job Title</th>
                    <th>Company</th>
                    {/* Improvement C: Email + Phone instead of Profile Links */}
                    <th style={{ width: '170px' }}>Email</th>
                    <th style={{ width: '120px' }}>Phone</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((a, i) => (
                    <tr key={a._id || a.alumniId}>
                      <td className="text-secondary">{startIndex + i + 1}</td>
                      <td><span className="code-badge">{a.alumniId}</span></td>
                      <td><span className="dept-name-cell">{a.name}</span></td>
                      <td>{a.graduationYear}</td>
                      <td>{a.jobTitle || '—'}</td>
                      <td>{a.currentCompany || '—'}</td>
                      {/* Improvement C: Email cell */}
                      <td style={{ fontSize: '0.8125rem', color: a.email ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {a.email
                          ? <a href={`mailto:${a.email}`} style={{ color: 'inherit', textDecoration: 'none' }}
                              title={a.email}>{a.email}</a>
                          : '—'}
                      </td>
                      {/* Improvement C: Phone cell */}
                      <td style={{ fontSize: '0.8125rem', color: a.phone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {a.phone || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button type="button" className="action-btn edit-btn" title="Edit"
                            onClick={() => navigate(`/alumni/edit/${a._id || a.alumniId}`)}>
                            <Edit size={15} /><span className="action-label">Edit</span>
                          </button>
                          <button type="button" className="action-btn delete-btn" title="Delete"
                            onClick={() => setDeleteConfirm({ id: a._id || a.alumniId, name: a.name })}>
                            <Trash2 size={15} /><span className="action-label">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="alm-mob-list">
                {currentItems.map((a, i) => (
                  <AlmMobCard
                    key={a._id || a.alumniId}
                    a={a}
                    num={startIndex + i + 1}
                    onEdit={() => navigate(`/alumni/edit/${a._id || a.alumniId}`)}
                    onDelete={() => setDeleteConfirm({ id: a._id || a.alumniId, name: a.name })}
                    expanded={almExpanded === (a._id || a.alumniId)}
                    onToggle={() => setAlmExpanded(prev => prev === (a._id || a.alumniId) ? null : (a._id || a.alumniId))}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAlumni.length)} of {filteredAlumni.length} alumni
                  </div>
                  <div className="pagination-buttons">
                    <button type="button" className="pagination-btn"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft size={16} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        return <button key={p} type="button"
                          className={`pagination-btn${p === currentPage ? ' active' : ''}`}
                          onClick={() => setCurrentPage(p)}>{p}</button>;
                      if (p === currentPage - 2 || p === currentPage + 2)
                        return <span key={p} className="pagination-dots">…</span>;
                      return null;
                    })}
                    <button type="button" className="pagination-btn"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="items-per-page">
                    <span>Items per page:</span>
                    <select value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="items-per-page-select">
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

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={e => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon"><AlertTriangle size={22} /></div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Alumni Profile</h3>
                <p className="delete-dialog-desc">This will permanently remove the alumni record.</p>
              </div>
              <button type="button" className="close-modal-btn"
                onClick={() => !deleting && setDeleteConfirm(null)} disabled={deleting}>
                <X size={18} />
              </button>
            </div>
            <div className="delete-item-preview">
              <div className="delete-item-name">{deleteConfirm.name}</div>
            </div>
            <div className="delete-warning-note">
              <AlertCircle size={14} /><span>This action cannot be undone.</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="books-btn books-btn-ghost"
                onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)} disabled={deleting}>
                {deleting
                  ? <><Loader2 size={16} className="spin-animate" /><span>Deleting…</span></>
                  : <><Trash2 size={16} /><span><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Delete</span></span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alumni;
