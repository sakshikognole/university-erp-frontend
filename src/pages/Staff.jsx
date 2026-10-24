import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Edit,
  X,
} from 'lucide-react';
import { exportStaff } from '../utils/exportUtils';
import StaffFormModal from './StaffForm';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const authHeader = () => {
  const token = localStorage.getItem('erp_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const Staff = () => {
  const navigate = useNavigate();

  // ── Data ─────────────────────────────────────────────────────────────
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [feedback, setFeedback]   = useState({ type: '', message: '' });
  const feedbackTimerRef          = useRef(null);

  // ── Modal ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]       = useState(false);
  const [editStaffId, setEditStaffId]   = useState(null);

  // ── Search ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');

  // ── Download dropdown ─────────────────────────────────────────────────
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  // ── Pagination ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/staff`, { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to load staff list');
      setStaffList(await res.json());
    } catch {
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  // Close download menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target))
        setShowDownloadMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-dismiss feedback banner after 4 s
  const showBanner = useCallback((type, message) => {
    setFeedback({ type, message });
    clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  }, []);
  useEffect(() => () => clearTimeout(feedbackTimerRef.current), []);

  // ── Modal helpers ─────────────────────────────────────────────────────
  const openAddModal  = ()       => { setEditStaffId(null);  setModalOpen(true); };
  const openEditModal = (id)     => { setEditStaffId(id);    setModalOpen(true); };
  const closeModal    = ()       => { setModalOpen(false);   setEditStaffId(null); };

  const handleModalSuccess = useCallback(() => {
    closeModal();
    fetchStaff();
    showBanner('success', editStaffId ? 'Staff member updated successfully.' : 'Staff member added successfully.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editStaffId, fetchStaff, showBanner]);

  // ── Search filter ─────────────────────────────────────────────────────
  const filteredStaff = staffList.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.name    || '').toLowerCase().includes(q) ||
      (s.staffId || '').toLowerCase().includes(q) ||
      (s.email   || '').toLowerCase().includes(q) ||
      (s.phone   || '').toLowerCase().includes(q) ||
      (s.role    || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => { setCurrentPage(1); }, [search]);

  // ── Pagination ────────────────────────────────────────────────────────
  const totalPages      = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex      = (currentPage - 1) * itemsPerPage;
  const endIndex        = startIndex + itemsPerPage;
  const currentStaff    = filteredStaff.slice(startIndex, endIndex);

  const handlePageChange         = (p)   => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };
  const handleItemsPerPageChange = (val) => { setItemsPerPage(val); setCurrentPage(1); };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toISOString().slice(0, 10); } catch { return d; }
  };

  const handleDownload = (format) => { setShowDownloadMenu(false); exportStaff(filteredStaff, format); };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* Page header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Staff Directory</h1>
          <p className="page-subtitle">Manage university faculty, administrators, and staff records</p>
        </div>

        <div className="header-actions-group">
          {/* Download */}
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button
              type="button"
              className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu((v) => !v)}
              title="Download staff data"
            >
              <Download size={16} /><span>Download</span><ChevronDown size={14} />
            </button>
            {showDownloadMenu && (
              <div className="download-dropdown-menu">
                <div className="dropdown-menu-header">Select Export Format</div>
                <button type="button" className="dropdown-menu-item" onClick={() => handleDownload('csv')}>
                  <FileSpreadsheet size={15} /><span>CSV Spreadsheet (.csv)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => handleDownload('txt')}>
                  <FileText size={15} /><span>Text Document (.txt)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => handleDownload('pdf')}>
                  <Printer size={15} /><span>Printable PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Staff — opens modal */}
          <button type="button" className="books-btn books-btn-primary" onClick={openAddModal}>
            <Plus size={16} /><span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback.message && (
        <div
          className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ margin: '1rem 0' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.25rem', color: 'inherit', opacity: 0.7 }}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="card table-card" style={{ marginTop: '1.25rem' }}>

        {/* Search bar */}
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Name, Staff ID, Email, Phone or Role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>Clear</button>
            )}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{filteredStaff.length}</strong>{' '}
            {filteredStaff.length === 1 ? 'Staff Member' : 'Staff Members'}
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" />
              <p>Loading staff list…</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="table-empty-state">
              <Users size={36} className="empty-icon" />
              <h3>No staff members found</h3>
              <p>
                {search
                  ? `No staff matched "${search}".`
                  : 'Get started by adding your first staff member.'}
              </p>
              {!search && (
                <button
                  type="button"
                  className="books-btn books-btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={openAddModal}
                >
                  <Plus size={16} /><span>Add Staff</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '52px' }}>#</th>
                    <th style={{ width: '150px' }}>Staff ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th style={{ width: '130px' }}>Phone</th>
                    <th style={{ width: '140px' }}>Role</th>
                    <th style={{ width: '110px' }}>Join Date</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStaff.map((staff, index) => (
                    <tr key={staff._id || staff.staffId || index}>
                      <td className="text-secondary">{startIndex + index + 1}</td>
                      <td><span className="code-badge">{staff.staffId}</span></td>
                      <td><span className="dept-name-cell">{staff.name}</span></td>
                      <td>{staff.email}</td>
                      <td>{staff.phone}</td>
                      <td>{staff.role}</td>
                      <td>{formatDate(staff.dateOfJoining)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit Staff Member"
                            onClick={() => openEditModal(staff._id || staff.staffId)}
                          >
                            <Edit size={14} />
                            <span className="action-label">Edit</span>
                          </button>
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
                    Showing {startIndex + 1}–{Math.min(endIndex, filteredStaff.length)} of {filteredStaff.length} staff
                  </div>

                  <div className="pagination-buttons">
                    <button type="button" className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                      <ChevronLeft size={16} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                        return (
                          <button key={p} type="button" className={`pagination-btn${p === currentPage ? ' active' : ''}`} onClick={() => handlePageChange(p)}>
                            {p}
                          </button>
                        );
                      } else if (p === currentPage - 2 || p === currentPage + 2) {
                        return <span key={p} className="pagination-dots">…</span>;
                      }
                      return null;
                    })}

                    <button type="button" className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="items-per-page">
                    <span>Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="items-per-page-select"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Staff Form Modal */}
      <StaffFormModal
        isOpen={modalOpen}
        staffId={editStaffId}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
      />

    </div>
  );
};

export default Staff;
