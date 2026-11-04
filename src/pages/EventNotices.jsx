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
  Eye,
} from 'lucide-react';

import { getEventImage } from '../utils/eventImageUtils';
import EventNoticeFormModal from './EventNoticeFormModal';
const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const EventNotices = () => {
  const navigate = useNavigate();

  // -- Form modal state --
  const [formOpen,    setFormOpen]    = useState(false);
  const [editEventId, setEditEventId] = useState(null);

  const openAddModal   = ()    => { setEditEventId(null); setFormOpen(true); };
  const openEditModal  = (id)  => { setEditEventId(id);   setFormOpen(true); };
  const closeFormModal = ()    => { setFormOpen(false);   setEditEventId(null); };
  const handleFormSave = ()    => { closeFormModal();     setTimeout(fetchEvents, 100); };

  // -- View modal state --
  const [viewOpen,    setViewOpen]    = useState(false);
  const [viewEvent,   setViewEvent]   = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const openViewModal = async (id) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('erp_token')}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setViewEvent(data);
    } catch {
      setViewEvent(null);
    } finally {
      setViewLoading(false);
    }
  };
  const closeViewModal = () => { setViewOpen(false); setViewEvent(null); };

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
    <div className="page-container event-notices-page">
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
            onClick={() => openAddModal()}
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
        <div className="en-filter-bar">
          <div className="search-box-wrapper en-search" data-tooltip="Search event notices">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, event ID, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              title="Search event notices"
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>
                Clear
              </button>
            )}
          </div>

          <div className="en-filter-row">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="filter-select en-filter-select"
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

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="filter-select en-filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="en-filter-count">
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
              onClick={() => openAddModal()}
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
                  onClick={() => openViewModal(event._id)}
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
                        className="action-btn view-btn"
                        title="View Event Notice"
                        onClick={(e) => {
                          e.stopPropagation();
                          openViewModal(event._id);
                        }}
                      >
                        <Eye size={14} />
                        <span className="action-label">View</span>
                      </button>
                      <button
                        type="button"
                        className="action-btn edit-btn"
                        title="Edit Event Notice"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(event._id);
                        }}
                      >
                        <Edit size={14} />
                        <span className="action-label">Edit</span>
                      </button>
                      <button
                        type="button"
                        className="action-btn delete-btn"
                        title="Delete"
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

      {/* ===== Event Notice View Modal ===== */}
      {viewOpen && (
        <div className="env-overlay" onClick={closeViewModal}>
          <div className="env-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="env-header">
              <div>
                <h2 className="env-title">Event Notice Details</h2>
                <p className="env-subtitle">View only information</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={closeViewModal}><X size={18} /></button>
            </div>
            {/* Body */}
            <div className="env-body">
              {viewLoading ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem', gap:'0.75rem', color:'var(--text-secondary)' }}>
                  <Loader2 size={24} className="spin-animate" /><span>Loading...</span>
                </div>
              ) : !viewEvent ? (
                <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)' }}>
                  <AlertCircle size={28} style={{ color:'#ef4444', margin:'0 auto 0.5rem' }} />
                  <p>Could not load event notice.</p>
                </div>
              ) : (
                <>
                  {/* Image */}
                  <img src={getEventImage(viewEvent.category || viewEvent.eventType, viewEvent.imageUrl)} alt={viewEvent.title} className="env-image" onError={e => { e.target.src = getEventImage(viewEvent.category || viewEvent.eventType); }} />
                  {/* Badges */}
                  <div className="env-badges">
                    <span className="event-id-badge">{viewEvent.eventId}</span>
                    {viewEvent.status && <span className="env-badge env-badge-status">{viewEvent.status}</span>}
                    {viewEvent.category && <span className="env-badge env-badge-cat">{viewEvent.category}</span>}
                  </div>
                  {/* Title */}
                  <h3 className="env-event-title">{viewEvent.title}</h3>
                  {viewEvent.shortDescription && <p className="env-short-desc">{viewEvent.shortDescription}</p>}
                  <hr className="env-divider" />
                  {/* Details Grid */}
                  <div className="env-details-grid">
                    <div className="env-detail-row"><Calendar size={14} className="env-icon" /><span className="env-detail-label">Date &amp; Time</span><span className="env-detail-val">{new Date(viewEvent.eventDate).toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} &nbsp; {viewEvent.eventTime && <><Clock size={12} style={{verticalAlign:'middle'}} /> {viewEvent.eventTime}</>}</span></div>
                    {viewEvent.venue && <div className="env-detail-row"><MapPin size={14} className="env-icon" /><span className="env-detail-label">Venue</span><span className="env-detail-val">{viewEvent.venue?.name || viewEvent.venue}{viewEvent.venue?.capacity && <> &bull; Capacity: {viewEvent.venue.capacity}</>}</span></div>}
                    {viewEvent.organizer && <div className="env-detail-row"><User size={14} className="env-icon" /><span className="env-detail-label">Organizer</span><span className="env-detail-val">{viewEvent.organizer?.name || viewEvent.organizer}</span></div>}
                    {viewEvent.organizer?.email && <div className="env-detail-row"><Tag size={14} className="env-icon" /><span className="env-detail-label">Email</span><span className="env-detail-val">{viewEvent.organizer.email}</span></div>}
                    {viewEvent.targetAudience && <div className="env-detail-row"><Users size={14} className="env-icon" /><span className="env-detail-label">Audience</span><span className="env-detail-val">{Array.isArray(viewEvent.targetAudience) ? viewEvent.targetAudience.join(', ') : viewEvent.targetAudience}</span></div>}
                    {viewEvent.eventTime && !viewEvent.eventDate && <div className="env-detail-row"><Clock size={14} className="env-icon" /><span className="env-detail-label">Time</span><span className="env-detail-val">{viewEvent.eventTime}</span></div>}
                    {viewEvent.duration && <div className="env-detail-row"><Clock size={14} className="env-icon" /><span className="env-detail-label">Duration</span><span className="env-detail-val">{viewEvent.duration}</span></div>}
                    {viewEvent.maxParticipants && <div className="env-detail-row"><Users size={14} className="env-icon" /><span className="env-detail-label">Max Seats</span><span className="env-detail-val">{viewEvent.maxParticipants}</span></div>}
                    {viewEvent.registrationRequired && viewEvent.registrationDeadline && (
                      <div className="env-detail-row"><Tag size={14} className="env-icon" /><span className="env-detail-label">Reg. Deadline</span><span className="env-detail-val">{new Date(viewEvent.registrationDeadline).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}</span></div>
                    )}
                    {viewEvent.tags && viewEvent.tags.length > 0 && (
                      <div className="env-detail-row"><Tag size={14} className="env-icon" /><span className="env-detail-label">Tags</span><span className="env-detail-val" style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>{viewEvent.tags.map((t,i) => <span key={i} style={{ background:'#e0e7ff', color:'#3730a3', borderRadius:'12px', padding:'1px 8px', fontSize:'0.75rem', fontWeight:600 }}>{t}</span>)}</span></div>
                    )}
                  </div>
                  {/* Description */}
                  {viewEvent.description && viewEvent.description.trim() && (
                    <div className="env-section">
                      <p className="env-section-label">Description</p>
                      <div className="env-desc-box">{viewEvent.description}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Footer */}
            <div className="env-footer">
              <button type="button" className="books-btn books-btn-ghost" onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {/* Event Notice Form Modal */}
      <EventNoticeFormModal
        isOpen={formOpen}
        eventId={editEventId}
        onClose={closeFormModal}
        onSave={handleFormSave}
      />

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon">
                <AlertTriangle size={22} />
              </div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete</h3>
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
                    <span>Delete</span>
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
