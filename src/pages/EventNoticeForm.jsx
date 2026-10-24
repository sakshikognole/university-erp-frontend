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
  Link as LinkIcon,
  FileText,
} from 'lucide-react';

import { getEventImage } from '../utils/eventImageUtils';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

const API_BASE_URL = 'http://localhost:5000/api';

// ─── Validation helpers ────────────────────────────────────────────────────────

// Title: must contain at least one letter so purely numeric / special-char
// values are rejected, but "2026 Tech Fest" or "AI & Society — 2025" are fine.
const TITLE_HAS_LETTER = /[A-Za-z]/;
const validateTitle = (v) => {
  const t = v.trim();
  if (!t) return 'Event Title is required.';
  if (t.length < 3) return 'Event Title must be at least 3 characters.';
  if (!TITLE_HAS_LETTER.test(t))
    return 'Event Title must contain at least one letter (e.g. 2026 Tech Fest).';
  return null;
};

// Organizer name: same rule — must have at least one letter, allows hyphens,
// apostrophes, spaces, and international characters.
const validateOrganizerName = (v) => {
  const t = v.trim();
  if (!t) return 'Organizer Name is required.';
  if (!TITLE_HAS_LETTER.test(t))
    return 'Please enter a valid organizer name.';
  return null;
};

// Image URL: if non-empty must be a parseable http/https URL.
// Returns null when the field is blank (it is optional).
const validateImageUrl = (v) => {
  const t = v.trim();
  if (!t) return null; // optional
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:')
      return 'Please enter a valid URL';
  } catch {
    return 'Please enter a valid URL';
  }
  return null;
};

// Phone: optional. When present, strip the country-code prefix (+91 or any
// +XX…) and require exactly 10 digits for the local number.
// Also reject strings that look like a doubled country code (e.g. "+91+91…").
const DIGITS_ONLY = /^\d+$/;
const validatePhone = (v) => {
  const t = v.trim();
  if (!t) return null; // optional
  // Prevent duplicate country code entry (+91 typed twice)
  if (/\+\d+\+/.test(t))
    return 'Please enter the country code once, followed by your 10-digit number (e.g. +91 1234567890).';
  // Strip leading +XX country code and spaces
  const stripped = t.replace(/^\+\d{1,3}\s*/, '').replace(/\s/g, '');
  if (!DIGITS_ONLY.test(stripped) || stripped.length !== 10)
    return 'Please enter a valid 10-digit phone number (e.g. +91 1234567890).';
  return null;
};

// Duration: optional but when supplied must match HH:MM (00:00 – 99:59).
const DURATION_RE = /^\d{1,2}:\d{2}$/;
const validateDuration = (v) => {
  const t = v.trim();
  if (!t) return null; // optional
  if (!DURATION_RE.test(t)) return 'Duration must be in HH:MM format (e.g. 02:30).';
  const [hh, mm] = t.split(':').map(Number);
  if (mm > 59) return 'Minutes must be between 00 and 59.';
  if (hh === 0 && mm === 0) return 'Duration cannot be 00:00.';
  return null;
};

// Run all validations and return a { field: message } map.
const validateAll = (formData) => {
  const errs = {};
  const titleErr = validateTitle(formData.title);
  if (titleErr) errs.title = titleErr;
  if (!formData.description.trim()) errs.description = 'Description is required.';
  if (!formData.eventDate) errs.eventDate = 'Event Date is required.';
  if (!formData.eventTime) errs.eventTime = 'Event Time is required.';
  if (!formData.venue) errs.venue = 'Please select a venue.';
  const orgErr = validateOrganizerName(formData.organizerName);
  if (orgErr) errs.organizerName = orgErr;
  const urlErr = validateImageUrl(formData.imageUrl);
  if (urlErr) errs.imageUrl = urlErr;
  const phoneErr = validatePhone(formData.organizerContact);
  if (phoneErr) errs.organizerContact = phoneErr;
  const durErr = validateDuration(formData.duration);
  if (durErr) errs.duration = durErr;
  return errs;
};

// ─── Component ─────────────────────────────────────────────────────────────────

const EventNoticeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  // In edit mode we store the original imageUrl so we can preserve it when
  // the user saves without uploading a new image.
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [venues, setVenues] = useState([]);
  const [bookedEvents, setBookedEvents] = useState([]);
  const [selectedBookedEventId, setSelectedBookedEventId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // imageUrl holds either a typed/pasted URL or the URL returned by Cloudinary
    imageUrl: '',
    eventDate: '',
    // Default phone prefix so the user sees "+91" already filled in
    eventTime: '',
    duration: '',
    venue: '',
    organizerName: '',
    organizerContact: '+91 ',
    organizerEmail: '',
    category: 'ACADEMIC',
    status: 'PUBLISHED',
  });

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  useEffect(() => {
    loadBookedEvents();
    loadVenues();
    if (isEditMode) loadEventNoticeDetails();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data loaders ────────────────────────────────────────────────────────────

  const loadBookedEvents = async () => {
    try {
      const res = await fetch('http://localhost:9090/api/events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setBookedEvents(data);
      }
    } catch (err) {
      console.warn('Could not load booked events:', err);
    }
  };

  const loadVenues = async () => {
    try {
      let res = await fetch(`${API_BASE_URL}/venues`, { headers: authHeader() });
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
      const res = await fetch(`${API_BASE_URL}/events/${id}`, { headers: authHeader() });
      if (res.ok) {
        const event = await res.json();
        const formatDate = (d) => {
          if (!d) return '';
          const dt = new Date(d);
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        const existingUrl = event.imageUrl || '';
        setOriginalImageUrl(existingUrl);
        setFormData({
          title: event.title || '',
          description: event.description || '',
          imageUrl: existingUrl,
          eventDate: formatDate(event.eventDate),
          eventTime: event.eventTime || '',
          duration: event.duration || '',
          venue: event.venue?._id || '',
          organizerName: event.organizer?.name || '',
          // Preserve existing contact, falling back to +91 prefix for blank
          organizerContact: event.organizer?.contact || '+91 ',
          organizerEmail: event.organizer?.email || '',
          category: event.category || 'OTHER',
          status: event.status || 'DRAFT',
        });
        if (existingUrl) setImagePreview(existingUrl);
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

  // ── Booked-event prefill ────────────────────────────────────────────────────

  const handleSelectBookedEvent = (e) => {
    const eventId = e.target.value;
    setSelectedBookedEventId(eventId);
    if (!eventId) return;
    const ev = bookedEvents.find((b) => b.eventId === eventId || b.id === eventId);
    if (!ev) return;

    setFormData((prev) => {
      const updated = {
        ...prev,
        title: ev.eventTitle || ev.title || prev.title,
        description: ev.description || prev.description,
      };
      if (ev.eventType) {
        const upper = ev.eventType.toUpperCase();
        if (['ACADEMIC','SPORTS','CULTURAL','WORKSHOP','SEMINAR','CONFERENCE','SOCIAL','OTHER'].includes(upper))
          updated.category = upper;
      }
      if (ev.startDate) {
        try {
          const dt = new Date(ev.startDate);
          updated.eventDate = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
          if (!prev.eventTime)
            updated.eventTime = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
        } catch { /* ignore */ }
      }
      if (ev.venueId && venues.length > 0) {
        const match = venues.find(
          (v) => v.venueId?.toUpperCase() === ev.venueId.toUpperCase() ||
                 v._id === ev.venueId ||
                 v.name?.toLowerCase() === ev.venueId.toLowerCase()
        );
        if (match) updated.venue = match._id;
      }
      if (ev.organizerId && !prev.organizerName) updated.organizerName = ev.organizerId;
      return updated;
    });
  };

  // ── Input handlers ──────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear inline error as user types
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));

    // Live preview when user pastes/types an image URL
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
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'File size must be less than 10 MB.' });
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Only JPG, PNG, WEBP, GIF, PDF, DOC, DOCX files are allowed.' });
      return;
    }
    setImageFile(file);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview('__document__');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    // Run all frontend validations
    const errs = validateAll(formData);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFeedback({
        type: 'error',
        message: 'Please fix the highlighted errors before submitting.',
      });
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      // Step 1: upload file to Cloudinary if a local file was picked
      let resolvedImageUrl;

      if (imageFile) {
        // User selected a new file — upload it
        try {
          resolvedImageUrl = await uploadToCloudinary(imageFile, 'event-notices');
        } catch (uploadErr) {
          setFeedback({ type: 'error', message: `Image upload failed: ${uploadErr.message}` });
          setLoading(false);
          return;
        }
      } else if (formData.imageUrl.trim()) {
        // User typed/pasted a URL
        resolvedImageUrl = formData.imageUrl.trim();
      } else if (isEditMode) {
        // Edit mode, no new file and no pasted URL:
        // PRESERVE the original image rather than overwriting with null.
        resolvedImageUrl = originalImageUrl || undefined;
      } else {
        // Add mode, no image supplied
        resolvedImageUrl = null;
      }

      // Step 2: build JSON payload
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
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

      // Only include imageUrl when we have a definite value to set.
      // In edit mode without a new image resolvedImageUrl is the original URL
      // (or undefined if there never was one) — either way we include it so the
      // backend can keep it unchanged without accidentally nulling it out.
      if (resolvedImageUrl !== undefined) {
        payload.imageUrl = resolvedImageUrl;
      }
      // In add mode with no image, send explicit null to clear any stale value.
      if (!isEditMode && resolvedImageUrl === null) {
        payload.imageUrl = null;
      }

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
          message: data.message || `Server error ${res.status}: failed to save event notice.`,
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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // Render an inline field error
  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="form-field-error" style={{ marginTop: '0.25rem' }}>
        {fieldErrors[name]}
      </p>
    ) : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      {/*
        en-form-header: scoped class for mobile back-arrow + heading stacking.
        On mobile the back arrow moves above the heading block (column layout).
      */}
      <div className="en-form-header" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="btn-back en-form-back-btn"
          onClick={() => navigate('/event-notices')}
          title="Back to Event Notices"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="en-form-heading-block">
          <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
            {isEditMode ? 'Edit Event Notice' : 'Publish New Event Notice'}
          </h1>
          <p className="page-subtitle en-form-subtitle">
            {isEditMode
              ? 'Update event notice information and details'
              : 'Create a new event announcement with image, details, and venue'}
          </p>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}
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
          <form onSubmit={handleSubmit} className="form-layout" noValidate>

            {/* ── Event Attachment ─────────────────────────────────────── */}
            <div className="form-section">
              <h3 className="form-section-title">Event Attachment</h3>

              <div className="form-group">
                <label className="form-label">Upload Event Image or Document (Max 10 MB)</label>

                {imagePreview ? (
                  imagePreview === '__document__' && imageFile ? (
                    <div style={{ borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'var(--bg-secondary, #f9fafb)' }}>
                        <FileText size={22} style={{ color: 'var(--primary, #6366f1)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-all', display: 'block' }}>{imageFile.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{(imageFile.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <button type="button" onClick={removeImage} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} title="Remove file"><X size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                      <img src={imagePreview} alt="Event preview" style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      <button type="button" onClick={removeImage} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Remove image"><X size={18} /></button>
                    </div>
                  )
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '180px', marginBottom: '0.75rem', border: '1px solid var(--border-color)' }}>
                      <img src={getEventImage(formData.category)} alt={formData.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', backgroundColor: 'rgba(0,0,0,0.75)', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                        Category Cover: {formData.category}
                      </div>
                    </div>
                    <label htmlFor="imageUpload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                    >
                      <Upload size={20} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Click to upload event image or document</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>JPG, PNG, GIF, WEBP, PDF, DOC, DOCX (max 10 MB)</span>
                    </label>
                  </div>
                )}

                <input type="file" id="imageUpload" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx" onChange={handleImageChange} style={{ display: 'none' }} />

                {/* Image URL input */}
                <div style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="imageUrl" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={15} />
                    <span>Or Enter Cloudinary / Web Image URL</span>
                  </label>
                  <input
                    type="text"
                    id="imageUrl"
                    name="imageUrl"
                    className={`form-input${fieldErrors.imageUrl ? ' input-error' : ''}`}
                    placeholder="https://res.cloudinary.com/... or https://..."
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                  />
                  <FieldError name="imageUrl" />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    Paste a direct Cloudinary URL or online image link. Leave blank to keep the existing image when editing.
                  </small>
                </div>
              </div>
            </div>

            {/* ── Basic Information ─────────────────────────────────────── */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Basic Information</h3>

              {/* Booked event selector */}
              <div className="form-group">
                <label htmlFor="bookedEventSelect" className="form-label">
                  Select From Event Bookings (Optional)
                </label>
                <select id="bookedEventSelect" name="bookedEventSelect" className="form-input" value={selectedBookedEventId} onChange={handleSelectBookedEvent}>
                  <option value="">-- Choose from Booked Events (auto-fills details) or enter manually --</option>
                  {bookedEvents.map((b) => (
                    <option key={b.eventId || b.id} value={b.eventId || b.id}>
                      {b.eventTitle || b.title} (ID: {b.eventId || b.id}){b.eventType ? ` • Type: ${b.eventType}` : ''}{b.venueId ? ` • Venue: ${b.venueId}` : ''}
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  Selecting a booked event pre-fills Title, Description, Category, Date, and Venue. All fields remain editable.
                </small>
              </div>

              {/* Title */}
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Event Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={`form-input${fieldErrors.title ? ' input-error' : ''}`}
                  placeholder="e.g. 2026 Tech Fest"
                  value={formData.title}
                  onChange={handleInputChange}
                />
                <FieldError name="title" />
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  className={`form-input${fieldErrors.description ? ' input-error' : ''}`}
                  placeholder="Enter detailed event description..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  style={{ resize: 'vertical', minHeight: '120px' }}
                />
                <FieldError name="description" />
              </div>

              {/* Category + Status */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select id="category" name="category" className="form-input" value={formData.category} onChange={handleInputChange}>
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
                  <select id="status" name="status" className="form-input" value={formData.status} onChange={handleInputChange}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Event Details ─────────────────────────────────────────── */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Event Details</h3>

              <div className="form-row">
                {/* Date */}
                <div className="form-group">
                  <label htmlFor="eventDate" className="form-label">
                    Event Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    id="eventDate"
                    name="eventDate"
                    className={`form-input en-date-input${fieldErrors.eventDate ? ' input-error' : ''}`}
                    value={formData.eventDate}
                    onChange={handleInputChange}
                  />
                  {/* Improvement: show DD/MM/YYYY hint on mobile where native
                      date inputs hide the placeholder attribute */}
                  <small className="form-field-hint en-date-hint">Format: DD/MM/YYYY</small>
                  <FieldError name="eventDate" />
                </div>

                {/* Time */}
                <div className="form-group">
                  <label htmlFor="eventTime" className="form-label">
                    Event Time <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    id="eventTime"
                    name="eventTime"
                    className={`form-input en-time-input${fieldErrors.eventTime ? ' input-error' : ''}`}
                    value={formData.eventTime}
                    onChange={handleInputChange}
                  />
                  {/* Improvement: HH:MM hint */}
                  <small className="form-field-hint en-time-hint">Format: HH:MM (24-hour)</small>
                  <FieldError name="eventTime" />
                </div>

                {/* Duration */}
                <div className="form-group">
                  <label htmlFor="duration" className="form-label">Duration</label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    className={`form-input${fieldErrors.duration ? ' input-error' : ''}`}
                    placeholder="HH:MM (e.g. 02:30)"
                    value={formData.duration}
                    onChange={handleInputChange}
                  />
                  <small className="form-field-hint">Format: HH:MM (e.g. 02:30 = 2 h 30 m)</small>
                  <FieldError name="duration" />
                </div>
              </div>

              {/* Venue */}
              <div className="form-group">
                <label htmlFor="venue" className="form-label">
                  Venue <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="venue"
                  name="venue"
                  className={`form-input${fieldErrors.venue ? ' input-error' : ''}`}
                  value={formData.venue}
                  onChange={handleInputChange}
                >
                  <option value="">Select Venue</option>
                  {venues.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.venueId}) - Capacity: {v.capacity}
                    </option>
                  ))}
                </select>
                <FieldError name="venue" />
              </div>
            </div>

            {/* ── Organizer Information ─────────────────────────────────── */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Organizer Information</h3>

              {/* Organizer Name */}
              <div className="form-group">
                <label htmlFor="organizerName" className="form-label">
                  Organizer Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="organizerName"
                  name="organizerName"
                  className={`form-input${fieldErrors.organizerName ? ' input-error' : ''}`}
                  placeholder="e.g. Computer Science Department"
                  value={formData.organizerName}
                  onChange={handleInputChange}
                />
                <FieldError name="organizerName" />
              </div>

              <div className="form-row">
                {/* Phone — +91 default, 10-digit local number */}
                <div className="form-group">
                  <label htmlFor="organizerContact" className="form-label">Contact Number</label>
                  <input
                    type="tel"
                    id="organizerContact"
                    name="organizerContact"
                    className={`form-input${fieldErrors.organizerContact ? ' input-error' : ''}`}
                    placeholder="+91 1234567890"
                    value={formData.organizerContact}
                    onChange={handleInputChange}
                  />
                  <small className="form-field-hint">Format: +91 1234567890 (10 digits after country code)</small>
                  <FieldError name="organizerContact" />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="organizerEmail" className="form-label">Email Address</label>
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

            {/* ── Form actions ──────────────────────────────────────────── */}
            {/*
              en-form-actions: scoped class so we can left-align Cancel + Submit
              on mobile without touching the shared .form-actions-row rule used
              by other modules.
            */}
            <div className="form-actions-row en-form-actions" style={{ marginTop: '2rem' }}>
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
                  <><Loader2 size={16} className="spin-animate" /><span>Saving...</span></>
                ) : (
                  <><Save size={16} /><span>{isEditMode ? 'Update Event Notice' : 'Publish Event Notice'}</span></>
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
