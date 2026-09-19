---import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Download,
  Search,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Printer,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Link2,
  Globe,
} from 'lucide-react';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = `${_NODE_URL}/api`;

// --"-----"--- Export helpers --"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"---
const triggerDownload = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportCSV = (rows) => {
  const headers = ['Alumni ID', 'Name', 'Graduation Year', 'Job Title', 'Current Company', 'Email', 'Phone', 'LinkedIn', 'GitHub', 'Portfolio'];
  const body = rows.map(a => [
    a.alumniId, a.name, a.graduationYear, a.jobTitle, a.currentCompany,
    a.email, a.phone,
    a.socialLinks?.linkedin, a.socialLinks?.github, a.socialLinks?.portfolio,
  ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));
  triggerDownload([headers.join(','), ...body].join('\r\n'), `alumni_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
};

const exportTXT = (rows) => {
  const date = new Date().toLocaleString();
  const sep = '='.repeat(90);
  const lines = [
    'UNIVERSITY ERP -----" ALUMNI DIRECTORY',
    `Generated: ${date}   Total: ${rows.length}`,
    sep,
    'ID         NAME                         YEAR   JOB TITLE                   COMPANY',
    '-'.repeat(90),
    ...rows.map(a =>
      `${(a.alumniId||'').padEnd(10)} ${(a.name||'').padEnd(28)} ${String(a.graduationYear||'').padEnd(6)} ${(a.jobTitle||'').padEnd(27)} ${a.currentCompany||''}`
    ),
    sep, 'End of Report',
  ];
  triggerDownload(lines.join('\r\n'), `alumni_${new Date().toISOString().slice(0,10)}.txt`, 'text/plain');
};

const exportPDF = (rows) => {
  const date = new Date().toLocaleString();
  const rows_html = rows.map((a, i) => `
    <tr style="background:${i%2===0?'#fff':'#f9f9f9'}">
      <td>${i+1}</td><td>${a.alumniId||''}</td><td>${a.name||''}</td>
      <td>${a.graduationYear||''}</td><td>${a.jobTitle||''}</td><td>${a.currentCompany||''}</td>
    </tr>`).join('');
  const html = `<html><head><title>Alumni</title><style>
    body{font-family:Arial,sans-serif;font-size:11px;margin:24px}
    h2{font-size:16px;margin-bottom:4px}p{margin:2px 0 12px;color:#555;font-size:10px}
    table{width:100%;border-collapse:collapse}
    th{background:#111;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
    td{padding:5px 8px;border-bottom:1px solid #e5e5e5}
  </style></head><body>
    <h2>Alumni Directory</h2><p>Generated: ${date} &bull; Total: ${rows.length}</p>
    <table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Year</th><th>Job Title</th><th>Company</th></tr></thead>
    <tbody>${rows_html}</tbody></table>
  </body></html>`;
  const w = window.open('','_blank');
  w.document.write(html);
  w.document.close();
  w.print();
};

// --"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"-----"---

const Alumni = () => {
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const downloadMenuRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  useEffect(() => { fetchAlumni(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) setShowDownloadMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni`, { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to load alumni');
      const data = await res.json();
      setAlumni(data);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to load alumni from server' });
      setAlumni([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni/${id}`, { method: 'DELETE', headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setFeedback({ type: 'success', message: data.message });
      fetchAlumni();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const filteredAlumni = alumni.filter((a) => {
    const q = search.toLowerCase().trim();
    return !q ||
      (a.name||'').toLowerCase().includes(q) ||
      (a.alumniId||'').toLowerCase().includes(q) ||
      (a.jobTitle||'').toLowerCase().includes(q) ||
      (a.currentCompany||'').toLowerCase().includes(q) ||
      String(a.graduationYear||'').includes(q);
  });

  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAlumni = filteredAlumni.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Alumni Profiles</h1>
          <p className="page-subtitle">Manage alumni records, professional info, and social links</p>
        </div>

        <div className="header-actions-group">
          {/* Download */}
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button type="button" className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
              <Download size={16} /><span>Download</span><ChevronDown size={14} />
            </button>
            {showDownloadMenu && (
              <div className="download-dropdown-menu">
                <div className="dropdown-menu-header">Select Export Format</div>
                <button type="button" className="dropdown-menu-item" onClick={() => { setShowDownloadMenu(false); exportCSV(filteredAlumni); }}>
                  <FileSpreadsheet size={15} /><span>CSV Spreadsheet (.csv)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => { setShowDownloadMenu(false); exportTXT(filteredAlumni); }}>
                  <FileText size={15} /><span>Text Document (.txt)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => { setShowDownloadMenu(false); exportPDF(filteredAlumni); }}>
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
        </div>
      )}

      {/* Table Card */}
      <div className="card table-card" style={{ marginTop: '1.25rem' }}>
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input type="text" className="search-input"
              placeholder="Search by Name, ID, Job Title, or Company..."
              value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            {search && <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>Clear</button>}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{filteredAlumni.length}</strong> {filteredAlumni.length === 1 ? 'Alumni' : 'Alumni'}
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" /><p>Loading alumni...</p>
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div className="table-empty-state">
              <Users size={36} className="empty-icon" />
              <h3>No alumni found</h3>
              <p>{search ? `No alumni matched "${search}".` : 'Get started by adding your first alumni profile.'}</p>
              {!search && (
                <button type="button" className="books-btn books-btn-primary" style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/alumni/add')}>
                  <Plus size={16} /><span>Add Alumni</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th style={{ width: '120px' }}>Alumni ID</th>
                    <th>Name</th>
                    <th style={{ width: '110px' }}>Grad. Year</th>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th style={{ width: '200px' }}>Profile Links</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAlumni.map((a, i) => (
                    <tr key={a._id || a.alumniId}>
                      <td className="text-secondary">{startIndex + i + 1}</td>
                      <td><span className="code-badge">{a.alumniId}</span></td>
                      <td><span className="dept-name-cell">{a.name}</span></td>
                      <td>{a.graduationYear}</td>
                      <td>{a.jobTitle || '-----"'}</td>
                      <td>{a.currentCompany || '-----"'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {a.socialLinks?.linkedin && (
                            <a href={a.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn"
                              style={{ color: '#0a66c2', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none' }}>
                              <Link2 size={13} />LI
                            </a>
                          )}
                          {a.socialLinks?.github && (
                            <a href={a.socialLinks.github} target="_blank" rel="noopener noreferrer" title="GitHub"
                              style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none' }}>
                              <Globe size={13} />GH
                            </a>
                          )}
                          {a.socialLinks?.instagram && (
                            <a href={a.socialLinks.instagram} target="_blank" rel="noopener noreferrer" title="Instagram"
                              style={{ color: '#e1306c', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none' }}>
                              <Globe size={13} />IG
                            </a>
                          )}
                          {a.socialLinks?.twitter && (
                            <a href={a.socialLinks.twitter} target="_blank" rel="noopener noreferrer" title="Twitter / X"
                              style={{ color: '#1da1f2', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none' }}>
                              <Globe size={13} />TW
                            </a>
                          )}
                          {a.socialLinks?.portfolio && (
                            <a href={a.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" title="Portfolio"
                              style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none' }}>
                              <Globe size={13} />Web
                            </a>
                          )}
                          {a.socialLinks?.other && (
                            <a href={a.socialLinks.other} target="_blank" rel="noopener noreferrer" title="Other Link"
                              style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none' }}>
                              <Link2 size={13} />Url
                            </a>
                          )}
                          {!a.socialLinks?.linkedin && !a.socialLinks?.github && !a.socialLinks?.instagram &&
                           !a.socialLinks?.twitter && !a.socialLinks?.portfolio && !a.socialLinks?.other && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>-----"</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button type="button" className="action-btn edit-btn" title="Edit"
                            onClick={() => navigate(`/alumni/edit/${a._id || a.alumniId}`)}>
                            <Edit size={15} /><span className="action-label">Edit</span>
                          </button>
                          <button type="button" className="action-btn delete-btn" title="Delete"
                            onClick={() => setDeleteConfirm({ id: a._id || a.alumniId, name: a.name })}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAlumni.length)} of {filteredAlumni.length} alumni
                  </div>
                  <div className="pagination-buttons">
                    <button type="button" className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                      <ChevronLeft size={16} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                        return <button key={p} type="button" className={`pagination-btn ${p === currentPage ? 'active' : ''}`} onClick={() => handlePageChange(p)}>{p}</button>;
                      } else if (p === currentPage - 2 || p === currentPage + 2) {
                        return <span key={p} className="pagination-dots">...</span>;
                      }
                      return null;
                    })}
                    <button type="button" className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="items-per-page">
                    <span>Items per page:</span>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="items-per-page-select">
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

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon"><AlertTriangle size={22} /></div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Alumni Profile</h3>
                <p className="delete-dialog-desc">This will permanently remove the alumni record.</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => !deleting && setDeleteConfirm(null)} disabled={deleting}><X size={18} /></button>
            </div>
            <div className="delete-item-preview">
              <div className="delete-item-name">{deleteConfirm.name}</div>
            </div>
            <div className="delete-warning-note"><AlertCircle size={14} /><span>This action cannot be undone.</span></div>
            <div className="modal-actions">
              <button type="button" className="books-btn books-btn-ghost" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)} disabled={deleting}>
                {deleting ? <><Loader2 size={16} className="spin-animate" /><span>Deleting...</span></> : <><Trash2 size={16} /><span>Delete</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alumni;
