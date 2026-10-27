import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Download, Search, ChevronDown, FileText, FileSpreadsheet,
  Printer, AlertCircle, CheckCircle2, Loader2, ChevronLeft, ChevronRight,
  Edit, Trash2, X, AlertTriangle, ExternalLink,
} from 'lucide-react';

import AlumniJobFormModal from './AlumniJobForm';
const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

// ── Export helpers ─────────────────────────────────────────────────────────────
const triggerDownload = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 150);
};

// D2: Guard against empty dataset before generating CSV
const exportCSV = (rows, setFeedback) => {
  if (!rows || rows.length === 0) {
    setFeedback({ type: 'error', message: 'No Alumni Job Records available to download or export.' });
    return;
  }
  const headers = ['Job ID', 'Alumni ID', 'Company', 'Role', 'Status', 'Date Posted', 'Expiry Date', 'Application Link'];
  const body = rows.map(j => [
    j.jobId, j.alumniId, j.company, j.role, getJobStatus(j),
    j.datePosted ? new Date(j.datePosted).toLocaleDateString() : '',
    j.dateOfExpiry ? new Date(j.dateOfExpiry).toLocaleDateString() : '',
    j.applicationLink,
  ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));
  triggerDownload(
    [headers.join(','), ...body].join('\r\n'),
    `alumni_jobs_${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8;',
  );
};

// D3: Guard against empty dataset before generating TXT
const exportTXT = (rows, setFeedback) => {
  if (!rows || rows.length === 0) {
    setFeedback({ type: 'error', message: 'No Alumni Job Records available to download or export.' });
    return;
  }
  const sep = '='.repeat(100);
  const lines = [
    'UNIVERSITY ERP — ALUMNI JOB POSTINGS',
    `Generated: ${new Date().toLocaleString()}   Total: ${rows.length}`,
    sep,
    'JOB ID     ALUMNI ID  COMPANY                  ROLE                     STATUS   EXPIRY',
    '-'.repeat(100),
    ...rows.map(j =>
      `${(j.jobId || '').padEnd(10)} ${(j.alumniId || '').padEnd(10)} ${(j.company || '').padEnd(24)} ${(j.role || '').padEnd(24)} ${(getJobStatus(j) || '').padEnd(8)} ${j.dateOfExpiry ? new Date(j.dateOfExpiry).toLocaleDateString() : 'N/A'}`
    ),
    sep,
    'End of Report',
  ];
  triggerDownload(
    lines.join('\r\n'),
    `alumni_jobs_${new Date().toISOString().slice(0, 10)}.txt`,
    'text/plain',
  );
};

// D4: Guard against empty dataset before opening print window
const exportPDF = (rows, setFeedback) => {
  if (!rows || rows.length === 0) {
    setFeedback({ type: 'error', message: 'No Alumni Job Records available to print.' });
    return;
  }
  const rowsHtml = rows.map((j, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
      <td>${i + 1}</td><td>${j.jobId || ''}</td><td>${j.alumniId || ''}</td>
      <td>${j.company || ''}</td><td>${j.role || ''}</td>
      <td><span style="padding:2px 6px;border-radius:4px;font-size:10px;background:${getJobStatus(j) === 'ACTIVE' ? '#d1fae5' : '#fee2e2'}">${getJobStatus(j)}</span></td>
      <td>${j.dateOfExpiry ? new Date(j.dateOfExpiry).toLocaleDateString() : 'N/A'}</td>
    </tr>`).join('');
  const html = `<html><head><title>Alumni Jobs</title><style>
    body{font-family:Arial,sans-serif;font-size:11px;margin:24px}
    h2{font-size:16px}p{color:#555;font-size:10px}
    table{width:100%;border-collapse:collapse}
    th{background:#111;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
    td{padding:5px 8px;border-bottom:1px solid #e5e5e5}
  </style></head><body>
    <h2>Alumni Job Postings</h2><p>Generated: ${new Date().toLocaleString()} &bull; Total: ${rows.length}</p>
    <table><thead><tr><th>#</th><th>Job ID</th><th>Alumni ID</th><th>Company</th><th>Role</th><th>Status</th><th>Expiry</th></tr></thead>
    <tbody>${rowsHtml}</tbody></table>
  </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
};
// ─────────────────────────────────────────────────────────────────────────────

const getJobStatus = (job) => {
  if (!job.dateOfExpiry) return 'ACTIVE';
  return new Date(job.dateOfExpiry) < new Date() ? 'EXPIRED' : 'ACTIVE';
};

const STATUS_CLASSES = {
  ACTIVE: 'status-pill status-pill-upcoming',
  EXPIRED: 'status-pill status-pill-completed',
};

// Mobile accordion card for AlumniJobs
function AjbMobCard({ j, num, fmtDate, isExpired, getJobStatus, STATUS_CLASSES, onEdit, onDelete, expanded, onToggle }) {
  const status = getJobStatus(j);
  return (
    <div className="mob-card">
      <button type="button" className="mob-card-header" onClick={onToggle} aria-expanded={expanded}>
        <div className="mob-card-summary">
          <span className="mob-card-num">{num}</span>
          <div className="mob-card-title-wrap">
            <span className="mob-card-title">{j.role} @ {j.company}</span>
            <span className="mob-card-sub">{j.jobId}</span>
          </div>
        </div>
        <span className="mob-card-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mob-card-details">
          <div className="mob-card-row"><span className="mob-card-label">Job ID</span><span className="mob-card-value mono">{j.jobId}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Alumni ID</span><span className="mob-card-value mono">{j.alumniId}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Company</span><span className="mob-card-value">{j.company}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Role</span><span className="mob-card-value">{j.role}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Status</span><span className="mob-card-value"><span className={STATUS_CLASSES[status] || 'status-pill'}>{status}</span></span></div>
          <div className="mob-card-row"><span className="mob-card-label">Posted</span><span className="mob-card-value">{fmtDate(j.datePosted)}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Expiry</span><span className="mob-card-value" style={{color: isExpired(j.dateOfExpiry) ? '#ef4444' : 'inherit'}}>{fmtDate(j.dateOfExpiry)}</span></div>
          {j.applicationLink && <div className="mob-card-row"><span className="mob-card-label">Apply</span><span className="mob-card-value"><a href={j.applicationLink} target="_blank" rel="noopener noreferrer">Link</a></span></div>}
          <div className="mob-card-actions">
            <button type="button" className="action-btn edit-btn" onClick={onEdit}><Edit size={14} /><span className="action-label">Edit</span></button>
            <button type="button" className="action-btn delete-btn" onClick={onDelete}><Trash2 size={14} /><span className="action-label">Delete</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

const AlumniJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [ajbExpanded, setAjbExpanded] = useState(null);
  const downloadMenuRef = useRef(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editJobId,   setEditJobId]   = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  // Performance: keep a ref to the current in-flight fetch controller so we can
  // cancel it if the component unmounts or a second fetch fires before the first
  // completes (e.g. rapid page navigations).
  const fetchControllerRef = useRef(null);

  useEffect(() => {
    fetchJobs();
    return () => {
      // Cancel any in-flight request on unmount to prevent state updates on
      // an unmounted component and avoid stale-response races.
      if (fetchControllerRef.current) fetchControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchJobs = async () => {
    // Cancel any previous in-flight request before starting a new one
    if (fetchControllerRef.current) fetchControllerRef.current.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni-jobs`, {
        headers: authHeader(),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Failed to load jobs');
      setJobs(await res.json());
    } catch (err) {
      // AbortError is expected on unmount / re-fetch — do not treat as a load error
      if (err.name === 'AbortError') return;
      // Preserve distinction between load error and genuinely empty list
      setLoadError(err.message || 'Failed to load alumni jobs from server');
      setFeedback({ type: 'error', message: 'Failed to load alumni jobs from server' });
      setJobs([]);
    } finally {
      // Only clear the loading state if this controller is still the active one
      if (fetchControllerRef.current === controller) setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni-jobs/${id}`, { method: 'DELETE', headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setFeedback({ type: 'success', message: data.message });
      fetchJobs();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally { setDeleting(false); setDeleteConfirm(null); }
  };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      (j.jobId || '').toLowerCase().includes(q) ||
      (j.alumniId || '').toLowerCase().includes(q) ||
      (j.company || '').toLowerCase().includes(q) ||
      (j.role || '').toLowerCase().includes(q);
    const computed = getJobStatus(j);
    const matchStatus = statusFilter === 'ALL' || computed === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const current = filtered.slice(startIndex, startIndex + itemsPerPage);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const isExpired = (d) => d && new Date(d) < new Date();

  // D2/D3/D4: wrap export actions to pass setFeedback
  const handleExport = (type) => {
    setShowDownloadMenu(false);
    setFeedback({ type: '', message: '' });
    if (type === 'csv') exportCSV(filtered, setFeedback);
    else if (type === 'txt') exportTXT(filtered, setFeedback);
    else if (type === 'pdf') exportPDF(filtered, setFeedback);
  };

  const openAddModal  = ()    => { setEditJobId(null);  setModalOpen(true); };
  const openEditModal = (id)  => { setEditJobId(id);    setModalOpen(true); };
  const closeModal    = ()    => { setModalOpen(false); setEditJobId(null); };
  const handleModalSuccess = () => { closeModal(); fetchJobs(); };

  return (
    // D1/D5: scope class so page-specific overrides in CSS can target this wrapper
    <div className="page-container alumni-jobs-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Alumni Jobs</h1>
          <p className="page-subtitle">Job opportunities posted by alumni for current students</p>
        </div>
        {/* D1/D5: keep wrapper flex so Download+AddJob sit side-by-side, right-aligned */}
        <div className="header-actions-group alumni-jobs-header-actions">
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button
              type="button"
              className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            >
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
          <button type="button" className="books-btn books-btn-primary" onClick={openAddModal}>
            <Plus size={16} /><span>Add Job</span>
          </button>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ margin: '1rem 0' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="card table-card" style={{ marginTop: '1.25rem' }}>
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Job ID, Alumni ID, Company, or Role..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>Clear</button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="filter-select"
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <div className="table-stats-badge">
              Total: <strong>{filtered.length}</strong> {filtered.length === 1 ? 'Job' : 'Jobs'}
            </div>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" /><p>Loading jobs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="table-empty-state">
              <Briefcase size={36} className="empty-icon" />
              <h3>No jobs found</h3>
              <p>
                {loadError
                  ? 'Could not load jobs from the server. Please try refreshing.'
                  : search || statusFilter !== 'ALL'
                    ? 'No jobs matched your filters.'
                    : 'Get started by adding the first alumni job posting.'}
              </p>
              {!loadError && !search && statusFilter === 'ALL' && (
                <button
                  type="button"
                  className="books-btn books-btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={openAddModal}
                >
                  <Plus size={16} /><span>Add Job</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="ajb-desk-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th style={{ width: '110px' }}>Job ID</th>
                    <th style={{ width: '110px' }}>Alumni ID</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '120px' }}>Posted</th>
                    <th style={{ width: '120px' }}>Expiry</th>
                    <th style={{ width: '160px' }}>Application Link</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((j, i) => (
                    <tr key={j._id || j.jobId}>
                      <td className="text-secondary">{startIndex + i + 1}</td>
                      <td><span className="code-badge">{j.jobId}</span></td>
                      <td><span className="code-badge">{j.alumniId}</span></td>
                      <td><span className="dept-name-cell">{j.company}</span></td>
                      <td>{j.role}</td>
                      <td>
                        <span className={STATUS_CLASSES[getJobStatus(j)] || 'status-pill'}>
                          {getJobStatus(j)}
                        </span>
                      </td>
                      <td>{fmtDate(j.datePosted)}</td>
                      <td style={{ color: isExpired(j.dateOfExpiry) ? '#ef4444' : 'inherit' }}>
                        {fmtDate(j.dateOfExpiry)}
                      </td>
                      <td>
                        {j.applicationLink ? (
                          <a
                            href={j.applicationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.8125rem',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              fontWeight: 500,
                              maxWidth: '140px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={j.applicationLink}
                          >
                            <ExternalLink size={13} style={{ flexShrink: 0 }} />
                            Apply
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit"
                            onClick={() => openEditModal(j._id || j.jobId)}
                          >
                            <Edit size={14} /><span className="action-label">Edit</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            title="Delete"
                            onClick={() => setDeleteConfirm({ id: j._id || j.jobId, label: `${j.role} @ ${j.company}` })}
                          >
                            <Trash2 size={14} /><span className="action-label">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="ajb-mob-list">
                {current.map((j, i) => (
                  <AjbMobCard
                    key={j._id || j.jobId}
                    j={j}
                    num={startIndex + i + 1}
                    fmtDate={fmtDate}
                    isExpired={isExpired}
                    getJobStatus={getJobStatus}
                    STATUS_CLASSES={STATUS_CLASSES}
                    onEdit={() => openEditModal(j._id || j.jobId)}
                    onDelete={() => setDeleteConfirm({ id: j._id || j.jobId, label: `${j.role} @ ${j.company}` })}
                    expanded={ajbExpanded === (j._id || j.jobId)}
                    onToggle={() => setAjbExpanded(prev => prev === (j._id || j.jobId) ? null : (j._id || j.jobId))}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} jobs
                  </div>
                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        return (
                          <button
                            key={p}
                            type="button"
                            className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        );
                      if (p === currentPage - 2 || p === currentPage + 2)
                        return <span key={p} className="pagination-dots">...</span>;
                      return null;
                    })}
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="items-per-page">
                    <span>Items per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="items-per-page-select"
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

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={e => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon"><AlertTriangle size={22} /></div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Job Posting</h3>
                <p className="delete-dialog-desc">This will permanently remove the job posting.</p>
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
              <div className="delete-item-name">{deleteConfirm.label}</div>
            </div>
            <div className="delete-warning-note">
              <AlertCircle size={14} /><span>This action cannot be undone.</span>
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
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.label)}
                disabled={deleting}
              >
                {deleting
                  ? <><Loader2 size={16} className="spin-animate" /><span>Deleting...</span></>
                  : <><Trash2 size={16} /><span>Delete</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlumniJobFormModal
        isOpen={modalOpen}
        jobId={editJobId}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default AlumniJobs;
