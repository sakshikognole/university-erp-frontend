---import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Tag,
  FileText,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';
const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const NODE_API_URL = `${_NODE_URL}/api`;

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [club, setClub] = useState(null);
  const [venue, setVenue] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`);

      if (!res.ok) {
        throw new Error('Event not found');
      }

      const data = await res.json();
      setEvent(data);

      // Fetch club details if organizerId exists
      if (data.organizerId) {
        fetchClubDetails(data.organizerId);
      }

      // Fetch venue details if venueId exists
      if (data.venueId) {
        fetchVenueDetails(data.venueId);
      }

      setFeedback({ type: '', message: '' });
    } catch (err) {
      console.error('Error fetching event details:', err);
      setFeedback({ type: 'error', message: 'Failed to load event details' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClubDetails = async (clubId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clubs`);
      if (res.ok) {
        const clubs = await res.json();
        const foundClub = clubs.find(c => c.clubId === clubId);
        if (foundClub) setClub(foundClub);
      }
    } catch (err) {
      console.error('Error fetching club details:', err);
    }
  };

  const fetchVenueDetails = async (venueId) => {
    try {
      const res = await fetch(`${NODE_API_URL}/venues`);
      if (res.ok) {
        const data = await res.json();
        const venues = Array.isArray(data) ? data : (data.venues || []);
        const foundVenue = venues.find(
          v =>
            v.venueId?.toUpperCase() === venueId.toUpperCase() ||
            v._id === venueId ||
            v.name?.toLowerCase() === venueId.toLowerCase()
        );
        if (foundVenue) setVenue(foundVenue);
      }
    } catch (err) {
      console.error('Error fetching venue details:', err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete event');
      }

      const data = await res.json();
      setFeedback({ 
        type: 'success', 
        message: data.message || 'Event deleted successfully.' 
      });
      
      setTimeout(() => navigate('/events'), 1500);
    } catch (error) {
      console.error('Error deleting event:', error);
      setFeedback({ 
        type: 'error', 
        message: error.message || 'Failed to delete event' 
      });
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
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

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ 
          padding: '4rem', 
          textAlign: 'center', 
          color: 'var(--text-secondary)' 
        }}>
          <Loader2 size={40} className="spin-animate" style={{ margin: '0 auto 1rem auto' }} />
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event && !loading) {
    return (
      <div className="page-container">
        <div style={{ 
          padding: '4rem', 
          textAlign: 'center', 
          color: 'var(--text-secondary)' 
        }}>
          <AlertCircle size={40} style={{ margin: '0 auto 1rem auto', color: '#ef4444' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Event Not Found</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            The event you're looking for doesn't exist or has been deleted.
          </p>
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => navigate('/events')}
          >
            <ArrowLeft size={16} />
            <span>Back to Events</span>
          </button>
        </div>
      </div>
    );
  }

  const eventTitle = event.eventTitle || event.title || 'Untitled Event';

  return (
    <div className="page-container">
      {/* Header with Back Button */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/events')}
            title="Back to Events"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              Event Details
            </h1>
            <p className="page-subtitle">
              Complete information about this event
            </p>
          </div>
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
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Event Details Card */}
      <div className="card" style={{ maxWidth: '1000px' }}>
        {/* Content Section */}
        <div style={{ padding: '2rem' }}>
          {/* Header row with Badges, Title and Event ID */}
          <div style={{ 
            marginBottom: '1.5rem', 
            paddingBottom: '1.25rem', 
            borderBottom: '1px solid var(--border-color)' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '0.5rem'
            }}>
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  flexWrap: 'wrap', 
                  marginBottom: '0.75rem' 
                }}>
                  <span className="event-type-badge" style={{ fontSize: '0.875rem', padding: '0.35rem 0.75rem' }}>
                    <Tag size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    {event.eventType || 'Event'}
                  </span>
                  <span className={getStatusPillClass(event.status)} style={{ fontSize: '0.875rem', padding: '0.35rem 0.75rem' }}>
                    {event.status || 'ACTIVE'}
                  </span>
                </div>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {eventTitle}
                </h2>
              </div>
              <span className="event-id-code" style={{ fontSize: '0.875rem' }}>
                {event.eventId}
              </span>
            </div>
          </div>

          {/* Key Information Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
          }}>
            {/* Start Date */}
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}>
                <Calendar size={16} />
                <span>Start Date & Time</span>
              </div>
              <div style={{ 
                color: 'var(--text-primary)', 
                fontSize: '0.95rem',
                paddingLeft: '1.5rem'
              }}>
                {formatDateTime(event.startDate)}
              </div>
            </div>

            {/* End Date */}
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}>
                <Clock size={16} />
                <span>End Date & Time</span>
              </div>
              <div style={{ 
                color: 'var(--text-primary)', 
                fontSize: '0.95rem',
                paddingLeft: '1.5rem'
              }}>
                {formatDateTime(event.endDate)}
              </div>
            </div>

            {/* Venue */}
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}>
                <MapPin size={16} />
                <span>Venue</span>
              </div>
              <div style={{ 
                color: 'var(--text-primary)', 
                fontSize: '0.95rem',
                paddingLeft: '1.5rem'
              }}>
                {venue ? (
                  <div>
                    <div style={{ fontWeight: '500' }}>{venue.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                      {venue.venueId}
                      {venue.capacity && ` ------- Capacity: ${venue.capacity}`}
                      {venue.status && ` ------- ${venue.status}`}
                    </div>
                  </div>
                ) : (
                  event.venueId || 'Not assigned'
                )}
              </div>
            </div>

            {/* Organizer Club */}
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}>
                <User size={16} />
                <span>Organizer Club</span>
              </div>
              <div style={{ 
                color: 'var(--text-primary)', 
                fontSize: '0.95rem',
                paddingLeft: '1.5rem'
              }}>
                {club ? (
                  <div>
                    <div style={{ fontWeight: '500' }}>{club.clubName}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                      {club.clubId}
                      {club.clubCategory && ` ------- ${club.clubCategory}`}
                    </div>
                  </div>
                ) : (
                  event.organizerId || 'Not assigned'
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          {event.description && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.75rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}>
                <FileText size={16} />
                <span>Description</span>
              </div>
              <div style={{ 
                color: 'var(--text-primary)', 
                fontSize: '0.95rem',
                lineHeight: '1.6',
                paddingLeft: '1.5rem',
                whiteSpace: 'pre-wrap'
              }}>
                {event.description}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div style={{ 
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              fontSize: '0.875rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Created: </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Last Updated: </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {event.updatedAt ? new Date(event.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              className="books-btn books-btn-ghost"
              onClick={() => navigate('/events')}
            >
              <ArrowLeft size={16} />
              <span>Back to List</span>
            </button>
            <button
              type="button"
              className="books-btn books-btn-secondary"
              onClick={() => navigate(`/events/edit/${event.eventId}`)}
            >
              <Edit size={16} />
              <span>Edit Event</span>
            </button>
            <button
              type="button"
              className="books-btn books-btn-danger"
              onClick={() => setDeleteConfirm(true)}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#fee', 
                  borderRadius: '8px',
                  color: '#dc2626'
                }}>
                  <AlertCircle size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1rem', 
                    color: 'var(--text-primary)' 
                  }}>
                    Are you sure you want to delete this event?
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5'
                  }}>
                    <strong>"{eventTitle}"</strong> will be permanently deleted. 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
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
                className="books-btn books-btn-danger"
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

export default EventDetails;
