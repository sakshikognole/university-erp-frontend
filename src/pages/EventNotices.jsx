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
  Tag,
  Users,
} from 'lucide-react';

import { getEventImage } from '../utils/eventImageUtils';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = ${_NODE_URL}/api;

const EventNotices = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PUBLISHED');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, itemsPerPage, statusFilter, categoryFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'eventDate',
        order: 'desc',
      });

      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);

      const res = await fetch(`${API_BASE_URL}/events?${params}`, {
        headers: authHeader(),
      });

      if (!res.ok) {
        throw new Error('Failed to load event notices');
      }

      const data = await res.json();
      setEvents(data.eventNotices || []);
      setTotalEvents(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setFeedback({ type: '', message: '' });
    } catch (err) {
      console.error('Error fetching event notices:', err);
      setFeedback({ type: 'error', message: 'Failed to load event notices from server' });
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
        headers: authHeader(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete event notice');
      }

      const data = await res.json();
      setFeedback({
        type: 'success',
        message: data.message || `Event notice '${eventTitle}' deleted successfully.`,
      });
      fetchEvents();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting event notice:', error);
      setFeedback({ type: 'error', message: error.message || 'Failed to delete event notice' });
    } finally {
      setDeleting(false);
    }
  };

  // Filter events by search query
  const filteredEvents = events.filter((e) => {
    if (!search) return true;
    const query = search.toLowerCase().trim();
    return (
      e.title?.toLowerCase().includes(query) ||
      e.eventId?.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query) ||
      e.venue?.name?.toLowerCase().includes(query) ||
      e.organizer?.name?.toLowerCase().includes(query)
    );
  });

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (newCount) => {
    setItemsPerPage(newCount);
    setCurrentPage(1);
  };

  const getStatusPillClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED':
        return 'status-pill status-pill-upcoming';
      case 'DRAFT':
        return 'status-pill status-pill-completed';
      case 'CANCELLED':
        return 'status-pill' ;
      case 'COMPLETED':
        return 'status-pill status-pill-completed';
      default:
        return 'status-pill';
    }
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Event Notices</h1>
          <p className="page-subtitle">Publish and manage campus event announcements with images and details</p>
        </div>

        <div className="header-actions-group">
          {/* Add Event Notice Button */}
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => navigate('/event-notices/add')}
          >
            <Plus size={16} />
            <span>Publish Event Notice</span>
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
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginTop: '1.25rem', padding: '1rem 1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div className="search-box-wrapper" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, event ID, description, venue, organizer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Category:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="ALL">All Categories</option>
                <option value="ACADEMIC">Academic</option>
                <option value="SPORTS">Sports</option>
                <option value="CULTURAL">Cultural</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="SEMINAR">Seminar</option>
                <option value="CONFERENCE">Conference</option>
                <option value="SOCIAL">Social</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

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
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="table-stats-badge">
              Total: <strong>{totalEvents}</strong> {totalEvents === 1 ? 'Event' : 'Events'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 3 Cards per Row */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
          <p>Loading event notices...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card table-empty-state" style={{ marginTop: '1.25rem' }}>
          <Calendar size={40} className="empty-icon" />
          <h3>No event notices found</h3>
          <p>
            {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'No event notices matched your filter criteria.'
              : 'Get started by publishing your first event notice.'}
          </p>
          {!search && statusFilter === 'ALL' && categoryFilter === 'ALL' && (
            <button
              type="button"
              className="books-btn books-btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => navigate('/event-notices/add')}
            >
              <Plus size={16} />
              <span>Publish Event Notice</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 3-Cards Per Row Grid */}
          <div className="events-cards-grid">
            {filteredEvents.map((event) => {
              const displayImg = getEventImage(event.category || event.eventType, event.imageUrl);
              return (
                <div
                  key={event._id}
                  className="event-card"
                  onClick={() => navigate(`/event-notices/view/${event._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Image Area */}
                  <div className="event-card-image-box">
                    <img
                      src={displayImg}
                      alt={event.title}
                      className="event-card-img"
                      onError={(e) => {
                        e.target.src = getEventImage(event.category || event.eventType);
                      }}
                    />
                    <div className="event-image-overlay-top">
                      <span className="event-type-badge">
                        <Tag size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        {event.category || 'Event'}
                      </span>
                      <span className={getStatusPillClass(event.status)}>{event.status || 'PUBLISHED'}</span>
                    </div>
                  </div>

                  {/* Data Area */}
                  <div className="event-card-body">
                    <div>
                      {/* Event ID */}
                      <div className="event-card-header">
                        <span className="event-id-code">{event.eventId}</span>
                      </div>

                      {/* Title */}
                      <h3 className="event-card-title" title={event.title}>
                        {event.title}
                      </h3>

                      {/* Metadata */}
                      <div className="event-meta-list">
                        {/* Date & Time */}
                        <div className="event-meta-row">
                          <Clock size={14} />
                          <span className="event-meta-text">
                            {formatEventDate(event.eventDate)} at {event.eventTime}
                          </span>
                        </div>

                        {/* Venue */}
                        <div className="event-meta-row">
                          <MapPin size={14} />
                          <span className="event-meta-text">{event.venue?.name || 'Venue TBA'}</span>
                        </div>

                        {/* Organizer */}
                        <div className="event-meta-row">
                          <User size={14} />
                          <span className="event-meta-text">{event.organizer?.name || 'Organizer TBA'}</span>
                        </div>

                        {/* Target Audience */}
                        <div className="event-meta-row">
                          <Users size={14} />
                          <span className="event-meta-text">
                            {event.targetAudience?.join(', ') || 'All'}
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

                    {/* Card Actions */}
                    <div className="event-card-footer">
                      <button
                        type="button"
                        className="action-btn edit-btn"
                        title="Edit Event Notice"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/event-notices/edit/${event._id}`);
                        }}
                      >
                        <Edit size={14} />
                        <span className="action-label">Edit</span>
                      </button>
                      <button
                        type="button"
                        className="action-btn delete-btn"
                        title="Delete Event Notice"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({
                            id: event._id,
                            eventId: event.eventId,
                            title: event.title,
                            venue: event.venue?.name,
                            category: event.category,
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
                Page {currentPage} of {totalPages} ({totalEvents} total)
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
                    return (
                      <span key={pageNum} className="pagination-dots">
                        ...
                      </span>
                    );
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon">
                <AlertTriangle size={22} />
              </div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Event Notice</h3>
                <p className="delete-dialog-desc">
                  Are you sure you want to delete this event notice? This action cannot be undone.
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
                  {deleteConfirm.category || 'Event'} &bull; Venue: {deleteConfirm.venue || 'TBA'}
                </div>
              </div>
              {deleteConfirm.eventId && <span className="delete-item-code">{deleteConfirm.eventId}</span>}
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
                    <span>Delete Event Notice</span>
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

export default EventNotices;
