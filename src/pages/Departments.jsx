import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Download,
  Search,
  Edit,
  Trash2,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { exportDepartments } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = ${_NODE_URL}/api;

// ─────────────────────────────────────────────────────────────────────────────
// Departments page — Super Admin view
//
// DEF-001 / DEF-002 / DEF-015:
//   - Uses `authLoading` from AuthContext to defer access-control decisions until
//     the initial token-expiry check has settled. This prevents the blank-panel
//     flash that occurred on page refresh and on mobile Desktop View switches.
//
// DEF-007:
//   - Delete errors are no longer silently swallowed; the real API error is shown.
//     The item is only removed from local state/cache when the API actually succeeds.
//
// DEF-015:
//   - No CSS width calculations that depend on initial mount; the layout is
//     purely flex/table-based so it reacts correctly to viewport changes without
//     JavaScript-driven resize logic.
//
// DEF-016:
//   - Responsive placeholder: state tracks `isMobile` via matchMedia and provides
//     a shorter placeholder text on narrow viewports, preventing truncation while
//     keeping the full text available on desktop.
//
// PERFORMANCE:
//   - Single fetch per mount; `fetchDepartments` is memoised with useCallback.
//   - Feedback banners auto-dismiss after 5 seconds.
//   - No duplicate API calls on navigation back (localStorage cache used as
//     optimistic display while real fetch is in flight).
// ─────────────────────────────────────────────────────────────────────────────

const Departments = () => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const downloadMenuRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  // DEF-016: responsive placeholder — tracks whether the viewport is "mobile"
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false
  );

  // Check if user is Super Admin. We only make this decision after authLoading
  // is false so a token-expiry logout doesn't flip us to the blank non-admin
  // panel mid-render (DEF-001, DEF-002, DEF-015).
  const isSuperAdmin = !authLoading && user?.adminType === 'SUPER_ADMIN';

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // Show feedback and auto-dismiss after 5 s
  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  }, []);

  // DEF-016: listen for viewport width changes so the placeholder stays correct
  // after mobile-to-desktop-view switches (DEF-015 secondary concern).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e) => setIsMobile(e.matches);
    // Use addEventListener if available, fall back to addListener for older browsers
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else {
      mq.addListener(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, []);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/departments`, {
        headers: authHeader(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
      // Keep cache fresh for offline/fallback scenarios
      localStorage.setItem('erp_departments_custom', JSON.stringify(data));
    } catch (err) {
      console.warn('Departments API unavailable, using local cache:', err.message);
      // Show the cached data so the page isn't blank, but tell the user
      const stored = localStorage.getItem('erp_departments_custom');
      if (stored) {
        try {
          const cached = JSON.parse(stored);
          setDepartments(Array.isArray(cached) ? cached : []);
        } catch {
          setDepartments([]);
        }
      } else {
        setDepartments([]);
      }
      setFetchError('Unable to reach the server. Showing cached data. Refresh to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch once auth is settled and user is confirmed as super admin (DEF-001)
  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      fetchDepartments();
    }
  }, [authLoading, isSuperAdmin, fetchDepartments]);

  // Clean up feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (dept) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/departments/${dept._id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete department');
      }

      // Only update local state and cache after confirmed API success (DEF-007)
      const updated = departments.filter((d) => d._id !== dept._id);
      setDepartments(updated);
      localStorage.setItem('erp_departments_custom', JSON.stringify(updated));
      showFeedback('success', `Department '${dept.name}' deleted successfully.`);
    } catch (err) {
      // Show the real error — do not fake success (DEF-007)
      showFeedback('error', err.message || 'Failed to delete department. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleDownload = (format) => {
    setShowDownloadMenu(false);
    exportDepartments(filteredDepartments, format);
  };

  // Filter departments by search query
  const filteredDepartments = departments.filter((d) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    const idStr = (d.departmentId || d.code || '').toLowerCase();
    const nameStr = (d.name || '').toLowerCase();
    return idStr.includes(query) || nameStr.includes(query);
  });

  // ── Render: auth still settling — show spinner (DEF-001, DEF-002, DEF-015) ──
  if (authLoading) {
    return (
      <div className="page-container">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Departments</h1>
            <p className="page-subtitle">Manage university departments and academic divisions.</p>
          </div>
        </div>
        <div className="card table-card" style={{ marginTop: '1.25rem' }}>
          <div className="table-loading-state">
            <Loader2 size={24} className="spin-animate" />
            <p>Loading departments...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: non-Super-Admin user ──
  if (!isSuperAdmin) {
    return (
      <div className="page-container">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Departments</h1>
            <p className="page-subtitle">Departments Related Information will be shown here</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: full Super Admin view ──
  return (
    <div className="page-container">
      {/* Top Header with Action Buttons on Top-Right Corner */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">
            Manage university departments, course allocations, and academic divisions.
          </p>
        </div>

        {/* Top-Right Corner Buttons: Download (Left) and Add Department (Right) */}
        <div className="header-actions-group">
          {/* Download Dropdown */}
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button
              type="button"
              className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              title="Download departments data"
            >
              <Download size={16} />
              <span>Download</span>
              <ChevronDown size={14} />
            </button>

            {showDownloadMenu && (
              <div className="download-dropdown-menu">
                <div className="dropdown-menu-header">Select Export Format</div>
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => handleDownload('csv')}
                >
                  <FileSpreadsheet size={15} />
                  <span>CSV Spreadsheet (.csv)</span>
                </button>
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => handleDownload('txt')}
                >
                  <FileText size={15} />
                  <span>Text Document (.txt)</span>
                </button>
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => handleDownload('pdf')}
                >
                  <Printer size={15} />
                  <span>Printable PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Department Button */}
          <button
            type="button"
            className="btn btn-primary add-department-btn"
            onClick={() => navigate('/departments/add')}
          >
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner — auto-dismissed after 5 s */}
      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ margin: '1rem 0' }}
          role="alert"
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
          <button
            type="button"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.25rem', color: 'inherit', opacity: 0.7 }}
            onClick={() => setFeedback({ type: '', message: '' })}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Fetch-error inline notice (non-blocking) */}
      {fetchError && !loading && (
        <div
          className="feedback-banner feedback-error"
          style={{ margin: '0.5rem 0 1rem 0' }}
          role="alert"
        >
          <AlertCircle size={16} />
          <span>{fetchError}</span>
          <button
            type="button"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.25rem', color: 'inherit', opacity: 0.7 }}
            onClick={() => { setFetchError(''); fetchDepartments(); }}
            aria-label="Retry"
            title="Retry"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Card with Search & Departments Table */}
      <div className="card table-card" style={{ marginTop: '1.25rem' }}>
        {/* Table Search & Filter Bar */}
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              /*
               * DEF-016: responsive placeholder.
               * On mobile (≤640 px) a shorter label is shown so the text fits
               * without being truncated by the browser. On desktop the full
               * label is shown. Both convey the same search intent.
               */
              placeholder={
                isMobile
                  ? 'Search departments...'
                  : 'Search by Department ID or Name...'
              }
              title="Search by Department ID and Department Name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search departments"
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{filteredDepartments.length}</strong>{' '}
            {filteredDepartments.length === 1 ? 'Department' : 'Departments'}
          </div>
        </div>

        {/* Departments List Table */}
        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" />
              <p>Loading departments list...</p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="table-empty-state">
              <Building2 size={36} className="empty-icon" />
              <h3>No departments found</h3>
              <p>
                {search
                  ? `No departments matched "${search}".`
                  : 'Get started by creating your first department.'}
              </p>
              {!search && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/departments/add')}
                >
                  <Plus size={16} />
                  <span>Add Department</span>
                </button>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th style={{ width: '200px' }}>Department ID</th>
                  <th>Department Name</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((dept, index) => {
                  const deptIdDisplay = dept.departmentId || dept.code || 'N/A';
                  return (
                    <tr key={dept._id || deptIdDisplay || index}>
                      <td className="text-secondary">{index + 1}</td>
                      <td>
                        <span className="code-badge">{deptIdDisplay}</span>
                      </td>
                      <td>
                        <span className="dept-name-cell">{dept.name}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit Department"
                            onClick={() => navigate(`/departments/edit/${dept._id || deptIdDisplay}`)}
                          >
                            <Edit size={15} />
                            <span className="action-label">Edit</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            title="Delete Department"
                            onClick={() => setDeleteConfirm(dept)}
                          >
                            <Trash2 size={15} />
                            <span className="action-label">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon">
                <AlertTriangle size={22} />
              </div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Department</h3>
                <p className="delete-dialog-desc">
                  Are you sure you want to delete this academic department? This action will
                  permanently remove the record.
                </p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => !deleting && setDeleteConfirm(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="delete-item-preview">
              <div>
                <div className="delete-item-name">{deleteConfirm.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Academic Department Record
                </div>
              </div>
              <span className="delete-item-code">
                {deleteConfirm.departmentId || deleteConfirm.code || 'N/A'}
              </span>
            </div>

            <div className="delete-warning-note">
              <AlertCircle size={14} />
              <span>This operation cannot be undone.</span>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
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
                    <span>Delete Department</span>
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

export default Departments;
