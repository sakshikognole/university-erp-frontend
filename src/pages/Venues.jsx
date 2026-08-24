import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Download,
  Search,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Printer,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  X,
  Upload,
} from 'lucide-react';
import { exportVenues } from '../utils/exportUtils';

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const Venues = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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
    fetchVenues();
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

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/venues`, {
        headers: authHeader(),
      });

      if (!res.ok) throw new Error('Failed to load venues');
      const data = await res.json();
      setVenues(data);
    } catch (err) {
      console.warn('Backend unavailable:', err);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (venueId, venueName) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/venues/${venueId}`, {
        method: 'DELETE',
        headers: authHeader(),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: 'error', message: data.message || 'Failed to delete venue' });
        return;
      }

      setFeedback({ type: 'success', message: `Venue '${venueName}' deleted successfully.` });
      fetchVenues();
      setDeleteConfirm(null);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Error deleting venue.' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (format) => {
    setShowDownloadMenu(false);
    exportVenues(filteredVenues, format);
  };

  // Filter venues by search query
  const filteredVenues = venues.filter((v) => {
    const query = search.toLowerCase().trim();
    const nameStr = (v.name || '').toLowerCase();
    const venueIdStr = (v.venueId || '').toLowerCase();
    const statusStr = (v.status || '').toLowerCase();
    const facilitiesStr = (v.facilities || [])
      .map(f => (typeof f === 'string' ? f : `${f.name || ''} ${f.details || ''}`))
      .join(' ')
      .toLowerCase();
    return (
      nameStr.includes(query) ||
      venueIdStr.includes(query) ||
      statusStr.includes(query) ||
      facilitiesStr.includes(query)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVenues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVenues = filteredVenues.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-badge status-active';
      case 'INACTIVE':
        return 'status-badge status-inactive';
      case 'MAINTENANCE':
        return 'status-badge status-warning';
      case 'RESERVED':
        return 'status-badge status-info';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Venues</h1>
          <p className="page-subtitle">Manage venue records and facility information</p>
        </div>

        <div className="header-actions-group">
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button
              type="button"
              className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              title="Download venues data"
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
            className="btn btn-secondary"
            onClick={() => navigate('/bulk-upload-venues')}
            title="Bulk upload venues via CSV"
          >
            <Upload size={16} />
            <span>Bulk Upload</span>
          </button>

          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => navigate('/venues/add')}
          >
            <Plus size={16} />
            <span>Add Venue</span>
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
              placeholder="Search by Name, Venue ID, Status, or Facilities..."
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
            Total: <strong>{filteredVenues.length}</strong> {filteredVenues.length === 1 ? 'Venue' : 'Venues'}
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" />
              <p>Loading venues list...</p>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="table-empty-state">
              <MapPin size={36} className="empty-icon" />
              <h3>No venues found</h3>
              <p>
                {search
                  ? `No venues matched "${search}".`
                  : 'Get started by adding your first venue.'}
              </p>
              {!search && (
                <button
                  type="button"
                  className="books-btn books-btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => navigate('/venues/add')}
                >
                  <Plus size={16} />
                  <span>Add Venue</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>#</th>
                    <th style={{ width: '140px' }}>Venue ID</th>
                    <th>Name</th>
                    <th style={{ width: '100px' }}>Capacity</th>
                    <th>Facilities</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVenues.map((venue, index) => (
                    <tr key={venue._id || venue.venueId || index}>
                      <td className="text-secondary">{startIndex + index + 1}</td>
                      <td>
                        <span className="code-badge">{venue.venueId}</span>
                      </td>
                      <td>
                        <span className="dept-name-cell">{venue.name}</span>
                      </td>
                      <td>{venue.capacity || 0}</td>
                      <td>
                        {venue.facilities && venue.facilities.length > 0
                          ? venue.facilities.slice(0, 2).map(f => f.name || f).join(', ') +
                            (venue.facilities.length > 2 ? ` +${venue.facilities.length - 2}` : '')
                          : 'â€”'}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(venue.status)}>
                          {venue.status || 'N/A'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit Venue"
                            onClick={() => navigate(`/venues/edit/${venue._id || venue.venueId}`)}
                          >
                            <Edit size={15} />
                            <span className="action-label">Edit</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            title="Delete Venue"
                            onClick={() => setDeleteConfirm({
                              id: venue._id || venue.venueId,
                              venueId: venue.venueId,
                              name: venue.name,
                              capacity: venue.capacity,
                              status: venue.status,
                            })}
                          >
                            <Trash2 size={15} />
                            <span className="action-label">Delete</span>
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
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredVenues.length)} of {filteredVenues.length} venues
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon">
                <AlertTriangle size={22} />
              </div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Venue</h3>
                <p className="delete-dialog-desc">
                  Are you sure you want to delete this venue? This action will remove the record permanently.
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
                  Capacity: {deleteConfirm.capacity || 0} seats &bull; Status: {deleteConfirm.status || 'ACTIVE'}
                </div>
              </div>
              {deleteConfirm.venueId && (
                <span className="delete-item-code">{deleteConfirm.venueId}</span>
              )}
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
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)}
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
                    <span>Delete Venue</span>
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

export default Venues;
