import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';

import { getEventImage } from '../utils/eventImageUtils';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = `${_NODE_URL}/api`;

const EventNoticeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [venues, setVenues] = useState([]);
  const [bookedEvents, setBookedEvents] = useState([]);
  const [selectedBookedEventId, setSelectedBookedEventId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    eventDate: '',
    eventTime: '',
    duration: '',
    venue: '',
    organizerName: '',
    organizerContact: '',
    organizerEmail: '',
    category: 'ACADEMIC',
    status: 'PUBLISHED',
  });

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    loadBookedEvents();
    loadVenues();
    if (isEditMode) {
      loadEventNoticeDetails();
    }
  }, [id]);

  const loadBookedEvents = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookedEvents(data);
        }
      }
    } catch (err) {
      console.warn('Could not load booked events:', err);
    }
  };

  const handleSelectBookedEvent = (e) => {
    const eventId = e.target.value;
    setSelectedBookedEventId(eventId);
    if (!eventId) return;

    const ev = bookedEvents.find((b) => (b.eventId === eventId || b.id === eventId));
    if (ev) {
      const eventTitle = ev.eventTitle || ev.title || '';
      const eventDesc = ev.description || '';

      setFormData((prev) => {
        const updated = {
          ...prev,
          title: eventTitle || prev.title,
          description: eventDesc || prev.description,
        };

        // If category matches
        if (ev.eventType) {
          const upperType = ev.eventType.toUpperCase();
          const validCategories = ['ACADEMIC', 'SPORTS', 'CULTURAL', 'WORKSHOP', 'SEMINAR', 'CONFERENCE', 'SOCIAL', 'OTHER'];
          if (validCategories.includes(upperType)) {
            updated.category = upperType;
          }
        }

        // If startDate exists, prefill eventDate and eventTime
        if (ev.startDate) {
          try {
            const dateObj = new Date(ev.startDate);
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            const hh = String(dateObj.getHours()).padStart(2, '0');
            const mm = String(dateObj.getMinutes()).padStart(2, '0');
            updated.eventDate = `${y}-${m}-${d}`;
            if (!prev.eventTime) updated.eventTime = `${hh}:${mm}`;
          } catch (err) {
            console.warn('Date parsing error:', err);
          }
        }

        // If venue exists in loaded venues matching venueId, auto-select venue
        if (ev.venueId && venues.length > 0) {
          const matchingVenue = venues.find(
            (v) =>
              v.venueId?.toUpperCase() === ev.venueId.toUpperCase() ||
              v._id === ev.venueId ||
              v.name?.toLowerCase() === ev.venueId.toLowerCase()
          );
          if (matchingVenue) {
            updated.venue = matchingVenue._id;
          }
        }

        // If organizer exists
        if (ev.organizerId && !prev.organizerName) {
          updated.organizerName = ev.organizerId;
        }

        return updated;
      });
    }
  };

  const loadVenues = async () => {
    try {
      let res = await fetch(`${API_BASE_URL}/venues`, {
        headers: authHeader(),
      });
      if (!res.ok) {
        res = await fetch('http://localhost:5000/api/super-admin/venues', {
          headers: authHeader(),
        });
      }
      if (res.ok) {
        const data = await res.json();
        setVenues(Array.isArray(data) ? data : (data.venues || []));
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
    }
  };

  const loadEventNoticeDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`, {
        headers: authHeader(),
      });

      if (res.ok) {
        const event = await res.json();

        // Format dates for input fields
        const formatDate = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        setFormData({
          title: event.title || '',
          description: event.description || '',
          imageUrl: event.imageUrl || '',
          eventDate: formatDate(event.eventDate),
          eventTime: event.eventTime || '',
          duration: event.duration || '',
          venue: event.venue?._id || '',
          organizerName: event.organizer?.name || '',
          organizerContact: event.organizer?.contact || '',
          organizerEmail: event.organizer?.email || '',
          category: event.category || 'OTHER',
          status: event.status || 'DRAFT',
        });

        if (event.imageUrl) {
          setImagePreview(event.imageUrl);
        }
      } else {
        setFeedback({ type: 'error', message: 'Event notice not found.' });
      }
    } catch (err) {
      console.error('Error fetching event notice details:', err);
      setFeedback({
        type: 'error',
        message: 'Unable to connect to server to load event notice details.',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // If typing Cloudinary URL directly, update live preview
    if (name === 'imageUrl') {
      if (value.trim()) {
        setImagePreview(value.trim());
        setImageFile(null);
      } else if (!imageFile) {
        setImagePreview(null);
      }
    }
  };

  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFeedback({ type: 'error', message: 'File size must be less than 10MB' });
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        setFeedback({ type: 'error', message: 'Only image (JPG, PNG, WEBP, GIF), PDF, and Word (DOC, DOCX) files are allowed' });
        return;
      }

      setImageFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, use a special marker so we know a file is selected
        setImagePreview('__document__');
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.eventDate ||
      !formData.eventTime ||
      !formData.venue ||
      !formData.organizerName.trim()
    ) {
      setFeedback({
        type: 'error',
        message: 'Title, Description, Event Date, Event Time, Venue, and Organizer Name are required.',
      });
      return;
    }

    setLoading(true);

    try {
      // Step 1: if the user picked a local image file, upload it directly from the
      // browser to Cloudinary. This avoids routing the binary through the Node
      // container, which causes ETIMEDOUT when Docker cannot reach api.cloudinary.com.
      let resolvedImageUrl = formData.imageUrl.trim() || null;
      if (imageFile) {
        try {
          resolvedImageUrl = await uploadToCloudinary(imageFile, 'event-notices');
        } catch (uploadErr) {
          setFeedback({ type: 'error', message: `Image upload failed: ${uploadErr.message}` });
          setLoading(false);
          return;
        }
      }

      // Step 2: send JSON body â-- no multipart needed anymore
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl: resolvedImageUrl,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime.trim(),
        duration: formData.duration.trim(),
        venue: formData.venue,
        organizer: {
          name: formData.organizerName.trim(),
          contact: formData.organizerContact.trim(),
          email: formData.organizerEmail.trim(),
        },
        category: formData.category,
        targetAudience: ['ALL'],
        registrationRequired: false,
        tags: [],
        status: formData.status,
      };

      const url = isEditMode ? `${API_BASE_URL}/events/${id}` : `${API_BASE_URL}/events`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.message || data.error || `Server responded with status ${res.status}: Failed to save event notice.`,
        });
        setLoading(false);
        return;
      }

      setFeedback({
        type: 'success',
        message: data.message || (isEditMode ? 'Event notice updated successfully!' : 'Event notice created successfully!'),
      });
      setTimeout(() => navigate('/event-notices'), 1200);
    } catch (error) {
      console.error('Error submitting event notice:', error);
      setFeedback({
        type: 'error',
        message: error.message || 'Unable to connect to the server. Please check your network and try again.',
      });
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
            onClick={() => navigate('/event-notices')}
            title="Back to Event Notices"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEditMode ? 'Edit Event Notice' : 'Publish New Event Notice'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update event notice information and details'
                : 'Create a new event announcement with image, details, and venue'}
            </p>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '2px',
            }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="card" style={{ maxWidth: '1000px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading event notice details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            {/* File Upload Section */}
            <div className="form-section">
              <h3 className="form-section-title">Event Attachment</h3>

              <div className="form-group">
                <label className="form-label">Upload Event Image or Document (Max 10MB)</label>

                {imagePreview ? (
                  imagePreview === '__document__' && imageFile ? (
                    /* Document file preview */
                    <div
                      style={{
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        marginBottom: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '14px',
                          background: 'var(--bg-secondary, #f9fafb)',
                        }}
                      >
                        <FileText size={22} style={{ color: 'var(--primary, #6366f1)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-all', display: 'block' }}>
                            {imageFile.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {(imageFile.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={removeImage}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                          title="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Image preview */
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '260px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Remove file"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    {/* Category Cover Preview */}
                    <div style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      height: '180px',
                      marginBottom: '0.75rem',
                      border: '1px solid var(--border-color)',
                    }}>
                      <img
                        src={getEventImage(formData.category)}
                        alt={formData.category}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        left: '0.5rem',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        Category Cover: {formData.category}
                      </div>
                    </div>

                    <label
                      htmlFor="imageUpload"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        border: '2px dashed var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: 'var(--bg-secondary)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                      }}
                    >
                      <Upload size={20} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        Click to upload event image or document
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        JPG, PNG, GIF, WEBP, PDF, DOC, DOCX (max 10MB)
                      </span>
                    </label>
                  </div>
                )}

                <input
                  type="file"
                  id="imageUpload"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />

                {/* Cloudinary / Web Image URL Input Field */}
                <div style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="imageUrl" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={15} />
                    <span>Or Enter Cloudinary / Web Image URL</span>
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    className="form-input"
                    placeholder="https://res.cloudinary.com/... or https://..."
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    Paste a direct Cloudinary URL or online image link to display for this event.
                  </small>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Basic Information</h3>

              {/* Booked Events Selector (Full Size Box matching Venue field) */}
              <div className="form-group">
                <label htmlFor="bookedEventSelect" className="form-label">
                  Select From Event Bookings (Optional)
                </label>
                <select
                  id="bookedEventSelect"
                  name="bookedEventSelect"
                  className="form-input"
                  value={selectedBookedEventId}
                  onChange={handleSelectBookedEvent}
                >
                  <option value="">-- Choose from Booked Events (Auto-fills details) or enter manually below --</option>
                  {bookedEvents.map((b) => (
                    <option key={b.eventId || b.id} value={b.eventId || b.id}>
                      {b.eventTitle || b.title} (ID: {b.eventId || b.id}){b.eventType ? ` â-¢ Type: ${b.eventType}` : ''}{b.venueId ? ` â-¢ Venue: ${b.venueId}` : ''}
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  Selecting a booked event will automatically pre-fill the Title, Description, Category, Date, and Venue. Both Title and Description remain fully editable.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Event Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  placeholder="e.g. Annual Tech Fest 2024"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input"
                  placeholder="Enter detailed event description..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  style={{ resize: 'vertical', minHeight: '120px' }}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="form-input"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
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
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Event Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="eventDate" className="form-label">
                    Event Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    id="eventDate"
                    name="eventDate"
                    className="form-input"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="eventTime" className="form-label">
                    Event Time <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    id="eventTime"
                    name="eventTime"
                    className="form-input"
                    value={formData.eventTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="duration" className="form-label">
                    Duration
                  </label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    className="form-input"
                    placeholder="e.g. 2 hours"
                    value={formData.duration}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="venue" className="form-label">
                  Venue <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="venue"
                  name="venue"
                  className="form-input"
                  value={formData.venue}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Venue</option>
                  {venues.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.venueId}) - Capacity: {v.capacity}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Organizer Information */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Organizer Information</h3>

              <div className="form-group">
                <label htmlFor="organizerName" className="form-label">
                  Organizer Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="organizerName"
                  name="organizerName"
                  className="form-input"
                  placeholder="e.g. Computer Science Department"
                  value={formData.organizerName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="organizerContact" className="form-label">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    id="organizerContact"
                    name="organizerContact"
                    className="form-input"
                    placeholder="e.g. +1234567890"
                    value={formData.organizerContact}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="organizerEmail" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="organizerEmail"
                    name="organizerEmail"
                    className="form-input"
                    placeholder="e.g. events@university.edu"
                    value={formData.organizerEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions-row" style={{ marginTop: '2rem' }}>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/event-notices')}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin-animate" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isEditMode ? 'Update Event Notice' : 'Publish Event Notice'}</span>
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

export default EventNoticeForm;
