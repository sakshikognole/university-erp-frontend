import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, Loader2, Calendar, Clock, MapPin, User, Mail, Phone,
  Tag, Users, X, ArrowLeft,
} from 'lucide-react';
import { getEventImage } from '../utils/eventImageUtils';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const EventNoticeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/events/${id}`, { headers: authHeader() });
        if (!res.ok) throw new Error('Event notice not found');
        setEvent(await res.json());
      } catch (err) {
        setError(err.message || 'Failed to load event notice');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const fmt = (d) => {
    if (!d) return 'Date TBA';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return 'Invalid Date'; }
  };

  return (
    /* Full-viewport overlay so the card is always centred */
    <div className="env-overlay env-page-overlay" onClick={() => navigate('/event-notices')}>
      <div className="env-modal env-page-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="env-header">
          <div>
            <h2 className="env-title">Event Notice Details</h2>
            <p className="env-subtitle">View only information</p>
          </div>
          <button
            type="button"
            className="sf-close-btn"
            onClick={() => navigate('/event-notices')}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="env-body">
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem', gap:'0.75rem', color:'var(--text-secondary)' }}>
              <Loader2 size={24} className="spin-animate" /><span>Loading...</span>
            </div>
          ) : error || !event ? (
            <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)' }}>
              <AlertCircle size={28} style={{ color:'#ef4444', margin:'0 auto 0.5rem', display:'block' }} />
              <p>{error || 'Could not load event notice.'}</p>
            </div>
          ) : (
            <>
              {/* Image */}
              <img
                src={getEventImage(event.category || event.eventType, event.imageUrl)}
                alt={event.title}
                className="env-image"
                onError={e => { e.target.src = getEventImage(event.category || event.eventType); }}
              />

              {/* Badges */}
              <div className="env-badges">
                <span className="event-id-badge">{event.eventId}</span>
                {event.status   && <span className="env-badge env-badge-status">{event.status}</span>}
                {event.category && <span className="env-badge env-badge-cat">{event.category}</span>}
              </div>

              {/* Title */}
              <h3 className="env-event-title">{event.title}</h3>
              {event.shortDescription && <p className="env-short-desc">{event.shortDescription}</p>}

              <hr className="env-divider" />

              {/* Details */}
              <div className="env-details-grid">
                {event.eventDate && (
                  <div className="env-detail-row">
                    <Calendar size={14} className="env-icon" />
                    <span className="env-detail-label">Date &amp; Time</span>
                    <span className="env-detail-val">
                      {fmt(event.eventDate)}
                      {event.eventTime && <> &nbsp;<Clock size={12} style={{ verticalAlign:'middle' }} /> {event.eventTime}</>}
                      {event.duration && <> &bull; {event.duration}</>}
                    </span>
                  </div>
                )}
                {event.venue && (
                  <div className="env-detail-row">
                    <MapPin size={14} className="env-icon" />
                    <span className="env-detail-label">Venue</span>
                    <span className="env-detail-val">
                      {event.venue?.name || event.venue}
                      {event.venue?.capacity && <> &bull; Capacity: {event.venue.capacity}</>}
                    </span>
                  </div>
                )}
                {event.organizer && (
                  <div className="env-detail-row">
                    <User size={14} className="env-icon" />
                    <span className="env-detail-label">Organizer</span>
                    <span className="env-detail-val">{event.organizer?.name || event.organizer}</span>
                  </div>
                )}
                {event.organizer?.email && (
                  <div className="env-detail-row">
                    <Mail size={14} className="env-icon" />
                    <span className="env-detail-label">Email</span>
                    <span className="env-detail-val">{event.organizer.email}</span>
                  </div>
                )}
                {event.organizer?.contact && (
                  <div className="env-detail-row">
                    <Phone size={14} className="env-icon" />
                    <span className="env-detail-label">Phone</span>
                    <span className="env-detail-val">{event.organizer.contact}</span>
                  </div>
                )}
                {event.targetAudience && (
                  <div className="env-detail-row">
                    <Users size={14} className="env-icon" />
                    <span className="env-detail-label">Audience</span>
                    <span className="env-detail-val">
                      {Array.isArray(event.targetAudience)
                        ? event.targetAudience.join(', ')
                        : event.targetAudience}
                    </span>
                  </div>
                )}
                {event.maxParticipants && (
                  <div className="env-detail-row">
                    <Users size={14} className="env-icon" />
                    <span className="env-detail-label">Max Seats</span>
                    <span className="env-detail-val">{event.maxParticipants}</span>
                  </div>
                )}
                {event.registrationRequired && event.registrationDeadline && (
                  <div className="env-detail-row">
                    <Tag size={14} className="env-icon" />
                    <span className="env-detail-label">Reg. Deadline</span>
                    <span className="env-detail-val">
                      {new Date(event.registrationDeadline).toLocaleDateString('en-IN', {
                        year:'numeric', month:'long', day:'numeric',
                      })}
                    </span>
                  </div>
                )}
                {event.tags && event.tags.length > 0 && (
                  <div className="env-detail-row">
                    <Tag size={14} className="env-icon" />
                    <span className="env-detail-label">Tags</span>
                    <span className="env-detail-val" style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>
                      {event.tags.map((t, i) => (
                        <span key={i} style={{ background:'#e0e7ff', color:'#3730a3', borderRadius:'12px', padding:'1px 8px', fontSize:'0.75rem', fontWeight:600 }}>{t}</span>
                      ))}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && event.description.trim() && (
                <div className="env-section">
                  <p className="env-section-label">Description</p>
                  <div className="env-desc-box">{event.description}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — Close only */}
        <div className="env-footer">
          <button
            type="button"
            className="books-btn books-btn-ghost"
            onClick={() => navigate('/event-notices')}
          >
            <ArrowLeft size={15} style={{ marginRight: '0.25rem' }} />
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default EventNoticeView;
