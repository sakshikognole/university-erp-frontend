---import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';
const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const NODE_API_URL = `${_NODE_URL}/api`;

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    eventId: '',
    eventTitle: '',
    description: '',
    eventType: 'Conference',
    startDate: '',
    endDate: '',
    organizerId: '',
    venueId: '',
    status: 'ACTIVE',
  });

  // Club combobox state
  const [clubs, setClubs] = useState([]);
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [selectedClubName, setSelectedClubName] = useState('');

  // Venue combobox state
  const [venues, setVenues] = useState([]);
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [selectedVenueName, setSelectedVenueName] = useState('');

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    loadClubs();
    loadVenues();
    if (isEditMode) {
      loadEventDetails();
    }
  }, [id]);

  const loadClubs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clubs`);
      if (res.ok) {
        const data = await res.json();
        setClubs(data);
      }
    } catch (err) {
      console.error('Error fetching clubs:', err);
    }
  };

  const loadVenues = async () => {
    try {
      const res = await fetch(`${NODE_API_URL}/venues`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setVenues(Array.isArray(data) ? data : (data.venues || []));
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
    }
  };

  const loadEventDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`, {
        headers: authHeader(),
      });

      if (res.ok) {
        const event = await res.json();
        
        // Format dates for datetime-local input
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setFormData({
          eventId: event.eventId || '',
          eventTitle: event.eventTitle || '',
          description: event.description || '',
          eventType: event.eventType || 'Conference',
          startDate: formatDateForInput(event.startDate),
          endDate: formatDateForInput(event.endDate),
          organizerId: event.organizerId || '',
          venueId: event.venueId || '',
          status: event.status || 'ACTIVE',
        });

        // Resolve club name if organizerId exists
        if (event.organizerId) {
          const club = clubs.find(c => c.clubId === event.organizerId);
          if (club) {
            setSelectedClubName(club.clubName);
            setClubSearchQuery(club.clubName);
          } else {
            setClubSearchQuery(event.organizerId);
          }
        }

        // Resolve venue name if venueId exists
        if (event.venueId) {
          const venue = venues.find(
            (v) =>
              v.venueId?.toUpperCase() === event.venueId.toUpperCase() ||
              v._id === event.venueId ||
              v.name?.toLowerCase() === event.venueId.toLowerCase()
          );
          if (venue) {
            setSelectedVenueName(venue.name);
            setVenueSearchQuery(venue.name);
          } else {
            setVenueSearchQuery(event.venueId);
          }
        }
      } else {
        setFeedback({ type: 'error', message: 'Event not found.' });
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server to load event details.' });
    } finally {
      setFetching(false);
    }
  };

  // Sync resolved names when clubs or venues load
  useEffect(() => {
    if (formData.organizerId && clubs.length > 0 && !selectedClubName) {
      const club = clubs.find(
        (c) =>
          c.clubId?.toUpperCase() === formData.organizerId.toUpperCase() ||
          c.clubName?.toLowerCase() === formData.organizerId.toLowerCase()
      );
      if (club) {
        setSelectedClubName(club.clubName);
        setClubSearchQuery(club.clubName);
      } else {
        setClubSearchQuery(formData.organizerId);
      }
    }
  }, [clubs, formData.organizerId]);

  useEffect(() => {
    if (formData.venueId && venues.length > 0 && !selectedVenueName) {
      const venue = venues.find(
        (v) =>
          v.venueId?.toUpperCase() === formData.venueId.toUpperCase() ||
          v._id === formData.venueId ||
          v.name?.toLowerCase() === formData.venueId.toLowerCase()
      );
      if (venue) {
        setSelectedVenueName(venue.name);
        setVenueSearchQuery(venue.name);
      } else {
        setVenueSearchQuery(formData.venueId);
      }
    }
  }, [venues, formData.venueId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClubSearchChange = (e) => {
    const query = e.target.value;
    setClubSearchQuery(query);
    setShowClubDropdown(query.length >= 2);
    
    // Clear selection if user is typing
    if (selectedClubName && query !== selectedClubName) {
      setSelectedClubName('');
      setFormData((prev) => ({ ...prev, organizerId: '' }));
    }
  };

  const handleClubSelect = (club) => {
    setFormData((prev) => ({ ...prev, organizerId: club.clubId }));
    setSelectedClubName(club.clubName);
    setClubSearchQuery(club.clubName);
    setShowClubDropdown(false);
  };

  const getFilteredClubs = () => {
    if (clubSearchQuery.length < 2) return [];
    
    const query = clubSearchQuery.toLowerCase().trim();
    return clubs
      .filter(club => 
        (club.clubName || '').toLowerCase().includes(query) || 
        (club.clubId || '').toLowerCase().includes(query)
      )
      .slice(0, 8);
  };

  const handleVenueSearchChange = (e) => {
    const query = e.target.value;
    setVenueSearchQuery(query);
    setShowVenueDropdown(query.length >= 2);
    
    // User can type an exact venue ID directly or search by name
    setFormData((prev) => ({ ...prev, venueId: query }));
    if (selectedVenueName && query !== selectedVenueName) {
      setSelectedVenueName('');
    }
  };

  const handleVenueSelect = (venue) => {
    const vid = venue.venueId || venue.name || venue._id;
    setFormData((prev) => ({ ...prev, venueId: vid }));
    setSelectedVenueName(venue.name);
    setVenueSearchQuery(venue.name);
    setShowVenueDropdown(false);
  };

  const getFilteredVenues = () => {
    if (venueSearchQuery.length < 2) return [];
    
    const query = venueSearchQuery.toLowerCase().trim();
    return venues
      .filter(venue => 
        (venue.name || '').toLowerCase().includes(query) || 
        (venue.venueId || '').toLowerCase().includes(query)
      )
      .slice(0, 8);
  };

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.club-combobox-container')) {
        setShowClubDropdown(false);
      }
      if (!e.target.closest('.venue-combobox-container')) {
        setShowVenueDropdown(false);
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        setShowClubDropdown(false);
        setShowVenueDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!formData.eventId.trim() || !formData.eventTitle.trim() || !formData.eventType || !formData.status) {
      setFeedback({ type: 'error', message: 'Event ID, Title, Type, and Status are required.' });
      return;
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        setFeedback({ type: 'error', message: 'End date must be after start date.' });
        return;
      }
    }

    setLoading(true);

    const payload = {
      eventId: formData.eventId.trim(),
      eventTitle: formData.eventTitle.trim(),
      description: formData.description.trim(),
      eventType: formData.eventType.trim(),
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      organizerId: formData.organizerId.trim(),
      venueId: formData.venueId.trim(),
      status: formData.status.trim(),
    };

    try {
      const url = isEditMode
        ? `${API_BASE_URL}/events/${id}`
        : `${API_BASE_URL}/events`;

      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to save event.' });
        setLoading(false);
        return;
      }

      setFeedback({ type: 'success', message: data.message || (isEditMode ? 'Event updated successfully!' : 'Event created successfully!') });
      setTimeout(() => navigate('/events'), 1200);
    } catch (error) {
      console.error('Error submitting event:', error);
      setFeedback({ type: 'error', message: 'Unable to connect to the server. Please try again.' });
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
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
              {isEditMode ? 'Edit Event' : 'Add New Event'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update event booking information and details'
                : 'Create a new event booking with venue reservation'}
            </p>
          </div>
        </div>
      </div>

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

      <div className="card" style={{ maxWidth: '820px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading event details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="eventId" className="form-label">
                    Event ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="eventId"
                    name="eventId"
                    className="form-input"
                    placeholder="e.g. EVT-2024-001"
                    value={formData.eventId}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="eventTitle" className="form-label">
                    Event Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="eventTitle"
                    name="eventTitle"
                    className="form-input"
                    placeholder="e.g. Annual Tech Conference 2024"
                    value={formData.eventTitle}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input"
                  placeholder="Enter event description..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="eventType" className="form-label">
                    Event Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="eventType"
                    name="eventType"
                    className="form-input"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Conference">Conference</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Examination">Examination</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="form-input"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Schedule & Location</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate" className="form-label">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    className="form-input"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate" className="form-label">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    className="form-input"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="venueId" className="form-label">
                    Venue
                  </label>
                  <div className="venue-combobox-container" style={{ position: 'relative' }}>
                    <input
                      type="text"
                      id="venueId"
                      className="form-input"
                      placeholder="Type venue name or ID (min 2 chars)..."
                      value={venueSearchQuery}
                      onChange={handleVenueSearchChange}
                      onFocus={() => venueSearchQuery.length >= 2 && setShowVenueDropdown(true)}
                      autoComplete="off"
                    />
                    {selectedVenueName && (
                      <div style={{ 
                        marginTop: '0.25rem', 
                        fontSize: '0.875rem', 
                        color: 'var(--text-secondary)' 
                      }}>
                        Selected: {selectedVenueName} -----" {formData.venueId}
                      </div>
                    )}
                    {showVenueDropdown && getFilteredVenues().length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '0.25rem',
                          maxHeight: '280px',
                          overflowY: 'auto',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          zIndex: 1000,
                        }}
                      >
                        {getFilteredVenues().map((venue) => (
                          <div
                            key={venue._id || venue.venueId}
                            onClick={() => handleVenueSelect(venue)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-color)',
                              transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                              {venue.name}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                              {venue.venueId}
                              {venue.capacity && ` ------- Capacity: ${venue.capacity}`}
                              {venue.status && ` ------- ${venue.status}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showVenueDropdown && venueSearchQuery.length >= 2 && getFilteredVenues().length === 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '0.25rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem',
                          zIndex: 1000,
                        }}
                      >
                        No venues found matching "{venueSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="organizerId" className="form-label">
                    Organizer Club
                  </label>
                  <div className="club-combobox-container" style={{ position: 'relative' }}>
                    <input
                      type="text"
                      id="organizerId"
                      className="form-input"
                      placeholder="Type club name or ID (min 2 chars)..."
                      value={clubSearchQuery}
                      onChange={handleClubSearchChange}
                      onFocus={() => clubSearchQuery.length >= 2 && setShowClubDropdown(true)}
                      autoComplete="off"
                    />
                    {selectedClubName && (
                      <div style={{ 
                        marginTop: '0.25rem', 
                        fontSize: '0.875rem', 
                        color: 'var(--text-secondary)' 
                      }}>
                        Selected: {selectedClubName} -----" {formData.organizerId}
                      </div>
                    )}
                    {showClubDropdown && getFilteredClubs().length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '0.25rem',
                          maxHeight: '280px',
                          overflowY: 'auto',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          zIndex: 1000,
                        }}
                      >
                        {getFilteredClubs().map((club) => (
                          <div
                            key={club.clubId}
                            onClick={() => handleClubSelect(club)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-color)',
                              transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                              {club.clubName}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                              {club.clubId}
                              {club.clubCategory && ` ------- ${club.clubCategory}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showClubDropdown && clubSearchQuery.length >= 2 && getFilteredClubs().length === 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '0.25rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem',
                          zIndex: 1000,
                        }}
                      >
                        No clubs found matching "{clubSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions-row" style={{ marginTop: '2rem' }}>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/events')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="books-btn books-btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin-animate" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isEditMode ? 'Update Event' : 'Save Event'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EventForm;
