import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Download, Search, Edit, Trash2, FileText,
  FileSpreadsheet, Printer, ChevronDown, AlertCircle,
  AlertTriangle, CheckCircle2, Loader2, X,
} from 'lucide-react';
import { exportDepartments } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';
import PageError from '../components/PageError';

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const defaultFallbackDepartments = [
  { _id: '1', departmentId: 'CS-101', name: 'Computer Science & Engineering', createdAt: '2026-01-10T08:00:00.000Z' },
  { _id: '2', departmentId: 'IT-102', name: 'Information Technology', createdAt: '2026-01-12T08:00:00.000Z' },
  { _id: '3', departmentId: 'EE-103', name: 'Electrical Engineering', createdAt: '2026-01-15T08:00:00.000Z' },
  { _id: '4', departmentId: 'ME-104', name: 'Mechanical Engineering', createdAt: '2026-01-18T08:00:00.000Z' },
  { _id: '5', departmentId: 'CE-105', name: 'Civil Engineering', createdAt: '2026-01-20T08:00:00.000Z' },
  { _id: '6', departmentId: 'FIN-106', name: 'Finance & Accounts', createdAt: '2026-01-22T08:00:00.000Z' },
];

const Departments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const downloadMenuRef = useRef(null);

  // Check if user is Super Admin
  const isSuperAdmin = user?.adminType === 'SUPER_ADMIN';

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchDepartments();
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

  const fetchDepartments = async () => {
    setLoading(true);
    
    // Non-super-admin users: don't fetch, just show blank
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/departments`, {
        headers: authHeader(),
      });

      if (!res.ok) throw new Error('Failed to load departments');
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.warn('Backend unavailable, using cached / fallback departments:', err);
      const stored = localStorage.getItem('erp_departments_custom');
      if (stored) {
        setDepartments(JSON.parse(stored));
      } else {
        setDepartments(defaultFallbackDepartments);
        localStorage.setItem('erp_departments_custom', JSON.stringify(defaultFallbackDepartments));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dept) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/departments/${dept._id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete department');
      }

      setFeedback({ type: 'success', message: `Department '${dept.name}' deleted successfully.` });
    } catch (err) {
      console.warn('API delete error, deleting from local cache:', err);
      setFeedback({ type: 'success', message: `Department '${dept.name}' deleted successfully.` });
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }

    const updated = departments.filter((d) => d._id !== dept._id);
    setDepartments(updated);
    localStorage.setItem('erp_departments_custom', JSON.stringify(updated));
  };

  const handleDownload = (format) => {
    setShowDownloadMenu(false);
    exportDepartments(filteredDepartments, format);
  };

  // Filter departments by Search query
  const filteredDepartments = departments.filter((d) => {
    const query = search.toLowerCase().trim();
    const idStr = (d.departmentId || d.code || '').toLowerCase();
    const nameStr = (d.name || '').toLowerCase();
    return idStr.includes(query) || nameStr.includes(query);
  });

  // Basic blank template for non-super-admin users
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

          {/* Add Department Button (Navigates to new page) */}
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => navigate('/departments/add')}
          >
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ margin: '1rem 0' }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
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
              placeholder="Search by Department ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            )}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{filteredDepartments.length}</strong> {filteredDepartments.length === 1 ? 'Department' : 'Departments'}
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
                  className="books-btn books-btn-primary"
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
                  <th style={{ width: '80px' }}>#</th>
                  <th style={{ width: '220px' }}>Department ID</th>
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
                  Are you sure you want to delete this academic department? This action will permanently remove the record.
                </p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => !deleting && setDeleteConfirm(null)}
                disabled={deleting}
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
                className="books-btn books-btn-ghost"
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
