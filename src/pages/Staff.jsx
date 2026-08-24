import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { exportStaff } from '../utils/exportUtils';

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const Staff = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/staff`, {
        headers: authHeader(),
      });

      if (!res.ok) throw new Error('Failed to load staff list');
      const data = await res.json();
      setStaffList(data);
    } catch (err) {
      console.warn('Backend unavailable:', err);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format) => {
    setShowDownloadMenu(false);
    exportStaff(filteredStaff, format);
  };

  // Filter staff by search query
  const filteredStaff = staffList.filter((s) => {
    const query = search.toLowerCase().trim();
    const nameStr = (s.name || '').toLowerCase();
    const staffIdStr = (s.staffId || '').toLowerCase();
    const emailStr = (s.email || '').toLowerCase();
    const phoneStr = (s.phone || '').toLowerCase();
    const roleStr = (s.role || '').toLowerCase();
    return (
      nameStr.includes(query) ||
      staffIdStr.includes(query) ||
      emailStr.includes(query) ||
      phoneStr.includes(query) ||
      roleStr.includes(query)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'â€”';
    try {
      return new Date(dateValue).toISOString().slice(0, 10);
    } catch {
      return dateValue;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Staff Directory</h1>
          <p className="page-subtitle">Manage university faculty, administrators, and staff records</p>
        </div>

        <div className="header-actions-group">
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button
              type="button"
              className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              title="Download staff data"
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

          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => navigate('/add-staff')}
          >
            <Plus size={16} />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

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

      <div className="card table-card" style={{ marginTop: '1.25rem' }}>
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Name, Staff ID, Email, Phone, or Role..."
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
            Total: <strong>{filteredStaff.length}</strong> {filteredStaff.length === 1 ? 'Staff Member' : 'Staff Members'}
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" />
              <p>Loading staff list...</p>
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
                  onClick={() => navigate('/add-staff')}
                >
                  <Plus size={16} />
                  <span>Add Staff</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th style={{ width: '150px' }}>Staff ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th style={{ width: '140px' }}>Phone</th>
                    <th style={{ width: '140px' }}>Role</th>
                    <th style={{ width: '120px' }}>Join Date</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStaff.map((staff, index) => (
                    <tr key={staff._id || staff.staffId || index}>
                      <td className="text-secondary">{startIndex + index + 1}</td>
                      <td>
                        <span className="code-badge">{staff.staffId}</span>
                      </td>
                      <td>
                        <span className="dept-name-cell">{staff.name}</span>
                      </td>
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
                            onClick={() => navigate(`/staff/edit/${staff._id || staff.staffId}`)}
                          >
                            <Edit size={15} />
                            <span className="action-label">Edit</span>
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
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredStaff.length)} of {filteredStaff.length} staff
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
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="pagination-dots">...</span>;
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
    </div>
  );
};

export default Staff;
