import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
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
  MapPin,
  User,
  Clock,
  DollarSign,
  Tag,
} from 'lucide-react';
import { exportEvents } from '../utils/exportUtils';
import { getEventImage } from '../utils/eventImageUtils';

const API_BASE_URL = 'http://localhost:8080/api';

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const downloadMenuRef = useRef(null);

  // Pagination state (6 items per page for clean 3-card rows)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    fetchEvents();
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

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events`);

      if (!res.ok) {
        throw new Error('Failed to load events');
      }
      
      const data = await res.json();
      setEvents(data);
      setFeedback({ type: '', message: '' });
    } catch (err) {
      console.error('Error fetching events:', err);
      setFeedback({ type: 'error', message: 'Failed to load events from server' });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId, eventTitle) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete event');
      }

      const data = await res.json();
      setFeedback({ type: 'success', message: data.message || `Event '${eventTitle}' deleted successfully.` });
      fetchEvents(); // Refresh the list
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setFeedback({ type: 'error', message: error.message || 'Failed to delete event' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (format) => {
    setShowDownloadMenu(false);
    exportEvents(filteredEvents, format);
  };

  // Filter events by Search query and Status filter
  const filteredEvents = events.filter((e) => {
    const query = search.toLowerCase().trim();
    const title = (e.eventTitle || e.title || '').toLowerCase();
    const matchesSearch =
      !query ||
      title.includes(query) ||
      (e.eventId || '').toLowerCase().includes(query) ||
      (e.eventType || '').toLowerCase().includes(query) ||
      (e.organizerId || '').toLowerCase().includes(query) ||
      (e.venueId || '').toLowerCase().includes(query) ||
      (e.description || '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' || (e.status || 'ACTIVE').toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newCount) => {
    setItemsPerPage(newCount);
    setCurrentPage(1);
  };

  const getStatusPillClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-pill status-pill-upcoming';
      case 'INACTIVE':
        return 'status-pill status-pill-completed';
      default:
        return 'status-pill status-pill-upcoming';
    }
  };

  const formatEventDateRange = (start, end) => {
    if (!start && !end) return 'Dates TBA';
    try {
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;

      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      if (startDate && endDate) {
        if (startDate.toDateString() === endDate.toDateString()) {
          return `${startDate.toLocaleDateString(undefined, options)}`;
        }
        return `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString(undefined, options)}`;
      }
      return (startDate || endDate).toLocaleDateString(undefined, options);
    } catch {
      return `${start || ''} to ${end || ''}`;
    }
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Event Bookings</h1>
          <p className="page-subtitle">Manage campus events, hall reservations, and schedule bookings</p>
        </div>

        <div className="header-actions-group">
          {/* Export Dropdown */}
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button
              type="button"
              className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              title="Download event data"
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

          {/* Add Event Button */}
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => navigate('/events/add')}
          >
            <Plus size={16} />
            <span>Add Event</span>
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

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginTop: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-box-wrapper" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Title, Event ID, Type, Organizer, Venue..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="table-stats-badge">
              Total: <strong>{filteredEvents.length}</strong> {filteredEvents.length === 1 ? 'Event' : 'Events'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 3 Cards per Row, 30% Image / 70% Data */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
          <p>Loading event bookings...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card table-empty-state" style={{ marginTop: '1.25rem' }}>
          <Calendar size={40} className="empty-icon" />
          <h3>No events found</h3>
          <p>
            {search || statusFilter !== 'ALL'
              ? 'No event records matched your filter criteria.'
              : 'Get started by creating your first university event booking.'}
          </p>
          {!search && statusFilter === 'ALL' && (
            <button
              type="button"
              className="books-btn books-btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => navigate('/events/add')}
            >
              <Plus size={16} />
              <span>Add Event</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 3-Cards Per Row Grid */}
          <div className="events-cards-grid">
            {currentEvents.map((event) => {
              const displayImg = getEventImage(event.eventType, event.imageUrl);
              const eventTitle = event.eventTitle || event.title || 'Untitled Event';
              return (
                <div 
                  key={event.id || event.eventId} 
                  className="event-card"
                  onClick={() => navigate(`/events/view/${event.eventId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* 30% Image Area */}
                  <div className="event-card-image-box">
                    <img
                      src={displayImg}
                      alt={eventTitle}
                      className="event-card-img"
                      onError={(e) => {
                        e.target.src = getEventImage(event.eventType);
                      }}
                    />
                    <div className="event-image-overlay-top">
                      <span className="event-type-badge">
                        <Tag size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        {event.eventType || 'Event'}
                      </span>
                      <span className={getStatusPillClass(event.status)}>
                        {event.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  {/* 70% Data Area */}
                  <div className="event-card-body">
                    <div>
                      {/* Card Top Row: Event ID */}
                      <div className="event-card-header">
                        <span className="event-id-code">{event.eventId}</span>
                      </div>

                      {/* Title */}
                      <h3 className="event-card-title" title={eventTitle}>
                        {eventTitle}
                      </h3>

                      {/* Structured Metadata Rows */}
                      <div className="event-meta-list">
                        {/* Dates */}
                        <div className="event-meta-row">
                          <Clock size={14} />
                          <span className="event-meta-text">
                            {formatEventDateRange(event.startDate, event.endDate)}
                          </span>
                        </div>

                        {/* Venue */}
                        <div className="event-meta-row">
                          <MapPin size={14} />
                          <span className="event-meta-text">
                            {event.venueId || 'Venue Unassigned'}
                          </span>
                        </div>

                        {/* Organizer */}
                        <div className="event-meta-row">
                          <User size={14} />
                          <span className="event-meta-text">
                            {event.organizerId || 'Organizer Not Assigned'}
                          </span>
                        </div>
                      </div>

                      {/* Description Snippet */}
                      {event.description && (
                        <p className="event-desc-snippet" title={event.description}>
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Card Actions (Edit & Delete) */}
                    <div className="event-card-footer">
                      <button
                        type="button"
                        className="action-btn edit-btn"
                        title="Edit Event"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/edit/${event.eventId}`);
                        }}
                      >
                        <Edit size={14} />
                        <span className="action-label">Edit</span>
                      </button>
                      <button
                        type="button"
                        className="action-btn delete-btn"
                        title="Delete Event"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({
                            id: event.eventId,
                            eventId: event.eventId,
                            title: eventTitle,
                            venueId: event.venueId,
                            eventType: event.eventType,
                          });
                        }}
                      >
                        <Trash2 size={14} />
                        <span className="action-label">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls" style={{ marginTop: '2rem' }}>
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} events
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
                <span>Cards per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="items-per-page-select"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon">
                <AlertTriangle size={22} />
              </div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Event Booking</h3>
                <p className="delete-dialog-desc">
                  Are you sure you want to delete this event booking? This will remove the scheduled reservation permanently.
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
                <div className="delete-item-name">{deleteConfirm.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {deleteConfirm.eventType || 'Event'} &bull; Venue: {deleteConfirm.venueId || 'TBA'}
                </div>
              </div>
              {deleteConfirm.eventId && (
                <span className="delete-item-code">{deleteConfirm.eventId}</span>
              )}
            </div>

            <div className="delete-warning-note">
              <AlertCircle size={14} />
              <span>This action cannot be undone.</span>
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
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.title)}
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
                    <span>Delete Event</span>
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

export default Events;
