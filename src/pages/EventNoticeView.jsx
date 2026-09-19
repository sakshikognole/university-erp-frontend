import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Tag,
  Users,
  AlertTriangle,
  X,
  BookOpen,
  UserCheck,
} from 'lucide-react';

import { getEventImage } from '../utils/eventImageUtils';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = ${_NODE_URL}/api;

const EventNoticeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`, {
        headers: authHeader(),
      });

      if (!res.ok) {
        throw new Error('Event notice not found');
      }

      const data = await res.json();
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event notice:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load event notice' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`, {
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
        message: data.message || 'Event notice deleted successfully.',
      });
      setTimeout(() => navigate('/event-notices'), 1200);
    } catch (error) {
      console.error('Error deleting event notice:', error);
      setFeedback({ type: 'error', message: error.message || 'Failed to delete event notice' });
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED':
        return 'badge badge-success';
      case 'DRAFT':
        return 'badge badge-warning';
      case 'CANCELLED':
        return 'badge badge-danger';
      case 'COMPLETED':
        return 'badge badge-info';
      default:
        return 'badge';
    }
  };

  const getCategoryBadgeClass = (category) => {
    const classes = {
      ACADEMIC: 'badge badge-primary',
      SPORTS: 'badge badge-success',
      CULTURAL: 'badge badge-purple',
      WORKSHOP: 'badge badge-info',
      SEMINAR: 'badge badge-warning',
      CONFERENCE: 'badge badge-dark',
      SOCIAL: 'badge badge-pink',
      OTHER: 'badge',
    };
    return classes[category?.toUpperCase()] || 'badge';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
          <p>Loading event notice...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-container">
        <div className="card table-empty-state">
          <AlertCircle size={40} className="empty-icon" />
          <h3>Event Notice Not Found</h3>
          <p>The requested event notice could not be found.</p>
          <button
            type="button"
            className="books-btn books-btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/event-notices')}
          >
            <ArrowLeft size={16} />
            <span>Back to Event Notices</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ 
        marginBottom: '1.5rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/event-notices')}
            title="Back to Event Notices"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', margin: 0 }}>
              Event Notice Details
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              View complete information about this event notice
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="books-btn books-btn-secondary"
            onClick={() => navigate(`/event-notices/edit/${event._id}`)}
          >
            <Edit size={16} />
            <span>Edit Notice</span>
          </button>
          <button
            type="button"
            className="books-btn"
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              padding: '0.5rem 1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ marginBottom: '1.5rem' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="card">
        {/* Event Image */}
        <div style={{ marginBottom: '2rem' }}>
          <img
            src={getEventImage(event.category || event.eventType, event.imageUrl)}
            alt={event.title}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
            onError={(e) => {
              e.target.src = getEventImage(event.category || event.eventType);
            }}
          />
        </div>

        {/* Event Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span className="event-id-badge" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}>
              {event.eventId}
            </span>
            <span className={getStatusBadgeClass(event.status)}>{event.status}</span>
            <span className={getCategoryBadgeClass(event.category)}>{event.category}</span>
          </div>

          <h2
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            {event.title}
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              marginTop: '1rem',
            }}
          >
            {event.description}
          </p>
        </div>

        {/* Event Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {/* Date & Time */}
          <div className="detail-card">
            <div className="detail-icon-box" style={{ backgroundColor: '#dbeafe' }}>
              <Calendar size={20} style={{ color: '#2563eb' }} />
            </div>
            <div>
              <div className="detail-label">Date & Time</div>
              <div className="detail-value">{formatDate(event.eventDate)}</div>
              <div className="detail-subtext">
                <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {event.eventTime}
                {event.duration && ` • ${event.duration}`}
              </div>
            </div>
          </div>

          {/* Venue */}
          <div className="detail-card">
            <div className="detail-icon-box" style={{ backgroundColor: '#dcfce7' }}>
              <MapPin size={20} style={{ color: '#16a34a' }} />
            </div>
            <div>
              <div className="detail-label">Venue</div>
              <div className="detail-value">{event.venue?.name || 'TBA'}</div>
              {event.venue?.venueId && (
                <div className="detail-subtext">ID: {event.venue.venueId}</div>
              )}
              {event.venue?.capacity && (
                <div className="detail-subtext">Capacity: {event.venue.capacity}</div>
              )}
            </div>
          </div>

          {/* Organizer */}
          <div className="detail-card">
            <div className="detail-icon-box" style={{ backgroundColor: '#fef3c7' }}>
              <User size={20} style={{ color: '#d97706' }} />
            </div>
            <div>
              <div className="detail-label">Organizer</div>
              <div className="detail-value">{event.organizer?.name || 'TBA'}</div>
              {event.organizer?.email && (
                <div className="detail-subtext">
                  <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {event.organizer.email}
                </div>
              )}
              {event.organizer?.contact && (
                <div className="detail-subtext">
                  <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {event.organizer.contact}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Details (Registration & Tags if present) */}
        {(event.registrationRequired || (event.tags && event.tags.length > 0)) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Registration */}
            {event.registrationRequired && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <UserCheck size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Registration
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Required
                  {event.registrationDeadline && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Deadline: {formatDate(event.registrationDeadline)}
                    </div>
                  )}
                  {event.maxParticipants && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Max Participants: {event.maxParticipants}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Tag size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Tags
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {event.tags.map((tag, idx) => (
                    <span key={idx} className="badge" style={{ fontSize: '0.8125rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Published Info */}
        {event.publishedAt && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
            }}
          >
            Published on {formatDate(event.publishedAt)} {event.publishedBy?.name && `by ${event.publishedBy.name}`}
          </div>
        )}

        {/* Action Buttons Footer */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingTop: '1.5rem',
            marginTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="books-btn books-btn-ghost"
            onClick={() => navigate('/event-notices')}
          >
            <ArrowLeft size={16} />
            <span>Back to List</span>
          </button>
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => navigate(`/event-notices/edit/${event._id}`)}
          >
            <Edit size={16} />
            <span>Edit Notice</span>
          </button>
          <button
            type="button"
            className="books-btn"
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              padding: '0.5rem 1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 size={16} />
            <span>Delete Notice</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(false)}>
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
                onClick={() => !deleting && setDeleteConfirm(false)}
                disabled={deleting}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="delete-item-preview">
              <div>
                <div className="delete-item-name">{event.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {event.category} • {event.venue?.name}
                </div>
              </div>
              <span className="delete-item-code">{event.eventId}</span>
            </div>

            <div className="delete-warning-note">
              <AlertCircle size={14} />
              <span>This action cannot be undone.</span>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
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

export default EventNoticeView;
