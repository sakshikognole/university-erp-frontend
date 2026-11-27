import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  Link as LinkIcon,
  FileText,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  User,
} from 'lucide-react';

import { getEventImage } from '../utils/eventImageUtils';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

const _IS_PROD =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD
  ? 'https://university-erp-node.onrender.com/api'
  : 'http://localhost:5000/api';
const SPRING_API_URL = _IS_PROD
  ? 'https://university-erp-spring.onrender.com/api'
  : 'http://localhost:9090/api';

/* ── Validators ───────────────────────────────────────────────────── */
const TITLE_HAS_LETTER = /[A-Za-z]/;
const validateTitle = (v) => {
  const t = v.trim();
  if (!t) return 'Event Title is required.';
  if (t.length < 3) return 'Event Title must be at least 3 characters.';
  if (!TITLE_HAS_LETTER.test(t))
    return 'Event Title must contain at least one letter (e.g. 2026 Tech Fest).';
  return null;
};
const validateOrganizerName = (v) => {
  const t = v.trim();
  if (!t) return 'Organizer Name is required.';
  if (!TITLE_HAS_LETTER.test(t)) return 'Please enter a valid organizer name.';
  return null;
};
const validateImageUrl = (v) => {
  const t = v.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:')
      return 'Please enter a valid URL';
  } catch {
    return 'Please enter a valid URL';
  }
  return null;
};
const DIGITS_ONLY = /^\d+$/;
const validatePhone = (v) => {
  const t = v.trim();
  if (!t) return null;
  if (/\+\d+\+/.test(t))
    return 'Please enter the country code once, followed by your 10-digit number (e.g. +91 1234567890).';
  const stripped = t.replace(/^\+\d{1,3}\s*/, '').replace(/\s/g, '');
  if (!DIGITS_ONLY.test(stripped) || stripped.length !== 10)
    return 'Please enter a valid 10-digit phone number (e.g. +91 1234567890).';
  return null;
};
const DURATION_RE = /^\d{1,2}:\d{2}$/;
const validateDuration = (v) => {
  const t = v.trim();
  if (!t) return null;
  if (!DURATION_RE.test(t)) return 'Duration must be in HH:MM format (e.g. 02:30).';
  const [hh, mm] = t.split(':').map(Number);
  if (mm > 59) return 'Minutes must be between 00 and 59.';
  if (hh === 0 && mm === 0) return 'Duration cannot be 00:00.';
  return null;
};

const EMPTY_FORM = {
  title: '',
  description: '',
  imageUrl: '',
  eventDate: '',
  eventTime: '',
  duration: '',
  venue: '',
  organizerName: '',
  organizerContact: '+91 ',
  organizerEmail: '',
  category: 'ACADEMIC',
  status: 'PUBLISHED',
};

const STEPS = [
  { label: 'Basic Info', icon: <FileText size={14} /> },
  { label: 'Event Details', icon: <Calendar size={14} /> },
  { label: 'Organizer & Media', icon: <User size={14} /> },
];

/* ── Component ────────────────────────────────────────────────────── */
export default function EventNoticeFormModal({ isOpen, eventId, onClose, onSave }) {
  const isEditMode = Boolean(eventId);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [venues, setVenues] = useState([]);
  const [bookedEvents, setBookedEvents] = useState([]);
  const [selectedBookedEventId, setSelectedBookedEventId] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);

  const bodyRef = useRef(null);

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  /* Reset and load when modal opens */
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setFeedback({ type: '', message: '' });
    setFieldErrors({});
    setImagePreview(null);
    setImageFile(null);
    setOriginalImageUrl('');
    setSelectedBookedEventId('');
    setFormData(EMPTY_FORM);
    loadBookedEvents();
    loadVenues();
    if (isEditMode) loadEventNoticeDetails();
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Scroll modal body to top on step change */
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [step]);

  /* Keyboard close */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  /* ── Data loaders ─────────────────────────────────────────────── */
  const loadBookedEvents = async () => {
    try {
      const res = await fetch(`${SPRING_API_URL}/events`);
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
      if (!res.ok)
        res = await fetch(`${API_BASE_URL}/super-admin/venues`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setVenues(Array.isArray(data) ? data : data.venues || []);
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
    }
  };

  const loadEventNoticeDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, { headers: authHeader() });
      if (res.ok) {
        const event = await res.json();
        const fmtDate = (d) => {
          if (!d) return '';
          const dt = new Date(d);
          return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        };
        const existingUrl = event.imageUrl || '';
        setOriginalImageUrl(existingUrl);
        setFormData({
          title: event.title || '',
          description: event.description || '',
          imageUrl: existingUrl,
          eventDate: fmtDate(event.eventDate),
          eventTime: event.eventTime || '',
          duration: event.duration || '',
          venue: event.venue?._id || '',
          organizerName: event.organizer?.name || '',
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
      setFeedback({ type: 'error', message: 'Unable to load event notice details.' });
    } finally {
      setFetching(false);
    }
  };

  /* ── Booked event prefill ─────────────────────────────────────── */
  const handleSelectBookedEvent = (e) => {
    const evId = e.target.value;
    setSelectedBookedEventId(evId);
    if (!evId) return;
    const ev = bookedEvents.find((b) => b.eventId === evId || b.id === evId);
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

  /* ── Input handlers ───────────────────────────────────────────── */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    if (name === 'imageUrl') {
      if (value.trim()) { setImagePreview(value.trim()); setImageFile(null); }
      else if (!imageFile) setImagePreview(null);
    }
  };

  const ALLOWED_TYPES = [
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'File size must be less than 10 MB.' }); return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Only JPG, PNG, WEBP, GIF, PDF, DOC, DOCX files are allowed.' }); return;
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

  /* ── Step validation ──────────────────────────────────────────── */
  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      const tErr = validateTitle(formData.title);
      if (tErr) errs.title = tErr;
      if (!formData.description.trim()) errs.description = 'Description is required.';
    }
    if (s === 1) {
      if (!formData.eventDate) errs.eventDate = 'Event Date is required.';
      if (!formData.eventTime) errs.eventTime = 'Event Time is required.';
      if (!formData.venue) errs.venue = 'Please select a venue.';
      const durErr = validateDuration(formData.duration);
      if (durErr) errs.duration = durErr;
    }
    if (s === 2) {
      const orgErr = validateOrganizerName(formData.organizerName);
      if (orgErr) errs.organizerName = orgErr;
      const urlErr = validateImageUrl(formData.imageUrl);
      if (urlErr) errs.imageUrl = urlErr;
      const phoneErr = validatePhone(formData.organizerContact);
      if (phoneErr) errs.organizerContact = phoneErr;
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFeedback({ type: 'error', message: 'Please fix the highlighted errors before continuing.' });
      return;
    }
    setFieldErrors({});
    setFeedback({ type: '', message: '' });
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setFieldErrors({});
    setFeedback({ type: '', message: '' });
    setStep((s) => s - 1);
  };

  /* ── Submit ───────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    const errs = validateStep(2);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFeedback({ type: 'error', message: 'Please fix the highlighted errors before submitting.' });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      let resolvedImageUrl;
      if (imageFile) {
        try {
          resolvedImageUrl = await uploadToCloudinary(imageFile, 'event-notices');
        } catch (uploadErr) {
          setFeedback({ type: 'error', message: `Image upload failed: ${uploadErr.message}` });
          setLoading(false);
          return;
        }
      } else if (formData.imageUrl.trim()) {
        resolvedImageUrl = formData.imageUrl.trim();
      } else if (isEditMode) {
        resolvedImageUrl = originalImageUrl || undefined;
      } else {
        resolvedImageUrl = null;
      }

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
      if (resolvedImageUrl !== undefined) payload.imageUrl = resolvedImageUrl;
      if (!isEditMode && resolvedImageUrl === null) payload.imageUrl = null;

      const url = isEditMode
        ? `${API_BASE_URL}/events/${eventId}`
        : `${API_BASE_URL}/events`;
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
        setFeedback({ type: 'error', message: data.message || `Server error ${res.status}.` });
        setLoading(false);
        return;
      }
      setFeedback({
        type: 'success',
        message: data.message || (isEditMode ? 'Event notice updated!' : 'Event notice published!'),
      });
      setTimeout(() => { onSave && onSave(); }, 1000);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Network error. Please try again.' });
      setLoading(false);
    }
  };

  /* ── Field error helper ───────────────────────────────────────── */
  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="enf-field-error">
        <AlertCircle size={12} /> {fieldErrors[name]}
      </p>
    ) : null;

  /* ── Step renderers ───────────────────────────────────────────── */
  const renderStep0 = () => (
    <div className="enf-step-body">
      {/* Booked event selector */}
      <div className="enf-group">
        <label className="enf-label">
          Link to Booked Event <span className="enf-optional">(Optional)</span>
        </label>
        <select
          className="enf-input"
          value={selectedBookedEventId}
          onChange={handleSelectBookedEvent}
        >
          <option value="">— Choose from booked events (auto-fills details) —</option>
          {bookedEvents.map((b) => (
            <option key={b.eventId || b.id} value={b.eventId || b.id}>
              {b.eventTitle || b.title} (ID: {b.eventId || b.id})
              {b.eventType ? ` · ${b.eventType}` : ''}
              {b.venueId ? ` · Venue: ${b.venueId}` : ''}
            </option>
          ))}
        </select>
        <small className="enf-hint">Selecting a booked event pre-fills Title, Description, Category, Date & Venue. All fields remain editable.</small>
      </div>

      {/* Title */}
      <div className="enf-group">
        <label className="enf-label" htmlFor="enf-title">
          Event Title <span className="enf-required">*</span>
        </label>
        <input
          id="enf-title"
          type="text"
          name="title"
          className={`enf-input${fieldErrors.title ? ' enf-input-error' : ''}`}
          placeholder="e.g. 2026 Tech Fest"
          value={formData.title}
          onChange={handleInputChange}
        />
        <FieldError name="title" />
      </div>

      {/* Description */}
      <div className="enf-group">
        <label className="enf-label" htmlFor="enf-description">
          Description <span className="enf-required">*</span>
        </label>
        <textarea
          id="enf-description"
          name="description"
          className={`enf-input${fieldErrors.description ? ' enf-input-error' : ''}`}
          placeholder="Enter detailed event description..."
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          style={{ resize: 'vertical', minHeight: '100px' }}
        />
        <FieldError name="description" />
      </div>

      {/* Category + Status */}
      <div className="enf-row">
        <div className="enf-group">
          <label className="enf-label" htmlFor="enf-category">
            Category <span className="enf-required">*</span>
          </label>
          <select
            id="enf-category"
            name="category"
            className="enf-input"
            value={formData.category}
            onChange={handleInputChange}
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
        <div className="enf-group">
          <label className="enf-label" htmlFor="enf-status">
            Status <span className="enf-required">*</span>
          </label>
          <select
            id="enf-status"
            name="status"
            className="enf-input"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="enf-step-body">
      {/* Date + Time + Duration */}
      <div className="enf-row">
        <div className="enf-group">
          <label className="enf-label" htmlFor="enf-eventDate">
            <Calendar size={13} style={{ display:'inline', marginRight:'4px', verticalAlign:'middle' }} />
            Event Date <span className="enf-required">*</span>
          </label>
          <input
            id="enf-eventDate"
            type="date"
            name="eventDate"
            className={`enf-input${fieldErrors.eventDate ? ' enf-input-error' : ''}`}
            value={formData.eventDate}
            onChange={handleInputChange}
          />
          <small className="enf-hint">Format: DD/MM/YYYY</small>
          <FieldError name="eventDate" />
        </div>
        <div className="enf-group">
          <label className="enf-label" htmlFor="enf-eventTime">
            <Clock size={13} style={{ display:'inline', marginRight:'4px', verticalAlign:'middle' }} />
            Event Time <span className="enf-required">*</span>
          </label>
          <input
            id="enf-eventTime"
            type="time"
            name="eventTime"
            className={`enf-input${fieldErrors.eventTime ? ' enf-input-error' : ''}`}
            value={formData.eventTime}
            onChange={handleInputChange}
          />
          <small className="enf-hint">Format: HH:MM (24-hour)</small>
          <FieldError name="eventTime" />
        </div>
      </div>

      <div className="enf-group">
        <label className="enf-label" htmlFor="enf-duration">
          Duration <span className="enf-optional">(Optional)</span>
        </label>
        <input
          id="enf-duration"
          type="text"
          name="duration"
          className={`enf-input${fieldErrors.duration ? ' enf-input-error' : ''}`}
          placeholder="HH:MM (e.g. 02:30)"
          value={formData.duration}
          onChange={handleInputChange}
        />
        <small className="enf-hint">Format: HH:MM — e.g. 02:30 = 2 h 30 m</small>
        <FieldError name="duration" />
      </div>

      {/* Venue */}
      <div className="enf-group">
        <label className="enf-label" htmlFor="enf-venue">
          <MapPin size={13} style={{ display:'inline', marginRight:'4px', verticalAlign:'middle' }} />
          Venue <span className="enf-required">*</span>
        </label>
        <select
          id="enf-venue"
          name="venue"
          className={`enf-input${fieldErrors.venue ? ' enf-input-error' : ''}`}
          value={formData.venue}
          onChange={handleInputChange}
        >
          <option value="">Select Venue</option>
          {venues.map((v) => (
            <option key={v._id} value={v._id}>
              {v.name} ({v.venueId}) — Capacity: {v.capacity}
            </option>
          ))}
        </select>
        <FieldError name="venue" />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="enf-step-body">
      {/* Organizer Name */}
      <div className="enf-group">
        <label className="enf-label" htmlFor="enf-orgName">
          <User size={13} style={{ display:'inline', marginRight:'4px', verticalAlign:'middle' }} />
          Organizer Name <span className="enf-required">*</span>
        </label>
        <input
          id="enf-orgName"
          type="text"
          name="organizerName"
          className={`enf-input${fieldErrors.organizerName ? ' enf-input-error' : ''}`}
          placeholder="e.g. Computer Science Department"
          value={formData.organizerName}
          onChange={handleInputChange}
        />
        <FieldError name="organizerName" />
      </div>

      {/* Contact + Email */}
      <div className="enf-row">
        <div className="enf-group">
          <label className="enf-label" htmlFor="enf-contact">
            Contact Number <span className="enf-optional">(Optional)</span>
          </label>
          <input
            id="enf-contact"
            type="tel"
            name="organizerContact"
            className={`enf-input${fieldErrors.organizerContact ? ' enf-input-error' : ''}`}
            placeholder="+91 1234567890"
            value={formData.organizerContact}
            onChange={handleInputChange}
          />
          <small className="enf-hint">Format: +91 1234567890</small>
          <FieldError name="organizerContact" />
        </div>
        <div className="enf-group">
          <label className="enf-label" htmlFor="enf-email">
            Email Address <span className="enf-optional">(Optional)</span>
          </label>
          <input
            id="enf-email"
            type="email"
            name="organizerEmail"
            className="enf-input"
            placeholder="e.g. events@university.edu"
            value={formData.organizerEmail}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Image upload */}
      <div className="enf-group">
        <label className="enf-label">
          Event Image / Document <span className="enf-optional">(Optional, max 10 MB)</span>
        </label>

        {imagePreview ? (
          imagePreview === '__document__' && imageFile ? (
            <div className="enf-file-preview">
              <FileText size={22} className="enf-file-icon" />
              <div className="enf-file-info">
                <span className="enf-file-name">{imageFile.name}</span>
                <span className="enf-file-size">{(imageFile.size / 1024).toFixed(0)} KB</span>
              </div>
              <button type="button" className="enf-remove-btn" onClick={removeImage} title="Remove">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="enf-img-preview-wrap">
              <img src={imagePreview} alt="Event preview" className="enf-img-preview"
                onError={(e) => { e.target.style.display = 'none'; }} />
              <button type="button" className="enf-remove-img-btn" onClick={removeImage} title="Remove image">
                <X size={16} />
              </button>
            </div>
          )
        ) : (
          <div className="enf-upload-area">
            {/* Category cover preview */}
            <div className="enf-category-cover">
              <img
                src={getEventImage(formData.category)}
                alt={formData.category}
                className="enf-category-img"
              />
              <span className="enf-category-label">Category cover: {formData.category}</span>
            </div>
            <label htmlFor="enf-imageUpload" className="enf-drop-zone">
              <Upload size={20} />
              <span>Click to upload image or document</span>
              <small>JPG, PNG, GIF, WEBP, PDF, DOC, DOCX (max 10 MB)</small>
            </label>
          </div>
        )}
        <input
          type="file"
          id="enf-imageUpload"
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Image URL alternative */}
      <div className="enf-group">
        <label className="enf-label" htmlFor="enf-imageUrl" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <LinkIcon size={13} />
          Or paste a Cloudinary / Web Image URL
        </label>
        <input
          id="enf-imageUrl"
          type="text"
          name="imageUrl"
          className={`enf-input${fieldErrors.imageUrl ? ' enf-input-error' : ''}`}
          placeholder="https://res.cloudinary.com/..."
          value={formData.imageUrl}
          onChange={handleInputChange}
        />
        <FieldError name="imageUrl" />
        <small className="enf-hint">Leave blank to keep the existing image when editing.</small>
      </div>
    </div>
  );

  /* ── Step indicator ───────────────────────────────────────────── */
  const StepIndicator = () => (
    <div className="enf-steps">
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`enf-step-dot ${i < step ? 'enf-step-done' : i === step ? 'enf-step-active' : 'enf-step-idle'}`}>
            {i < step ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
            <div className="enf-step-label">{s.label}</div>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`enf-step-line ${i < step ? 'enf-step-line-done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  /* ── Main render ──────────────────────────────────────────────── */
  return (
    <div
      className="enf-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Edit Event Notice' : 'Publish Event Notice'}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="enf-card">

        {/* Header */}
        <div className="enf-header">
          <div>
            <h2 className="enf-title">
              {isEditMode ? 'Edit Event Notice' : 'Publish Event Notice'}
            </h2>
            <p className="enf-subtitle">
              Step {step + 1} of {STEPS.length} — {STEPS[step].label}
            </p>
          </div>
          <button
            type="button"
            className="enf-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="enf-steps-wrap">
          <StepIndicator />
        </div>

        {/* Feedback banner */}
        {feedback.message && (
          <div className={`enf-feedback ${feedback.type === 'success' ? 'enf-feedback-success' : 'enf-feedback-error'}`}>
            {feedback.type === 'success'
              ? <CheckCircle2 size={15} />
              : <AlertCircle size={15} />}
            <span>{feedback.message}</span>
            <button
              type="button"
              className="enf-feedback-close"
              onClick={() => setFeedback({ type: '', message: '' })}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="enf-body" ref={bodyRef}>
          {fetching ? (
            <div className="enf-loading">
              <Loader2 size={28} className="spin-animate" />
              <p>Loading event details…</p>
            </div>
          ) : (
            <>
              {step === 0 && renderStep0()}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
            </>
          )}
        </div>

        {/* Footer navigation */}
        <div className="enf-footer">
          <button
            type="button"
            className="enf-btn enf-btn-ghost"
            onClick={step === 0 ? onClose : goPrev}
            disabled={loading}
          >
            {step === 0 ? 'Cancel' : (
              <><ChevronLeft size={16} /><span>Back</span></>
            )}
          </button>

          <div className="enf-footer-right">
            {/* Dot progress on mobile */}
            <div className="enf-dot-progress">
              {STEPS.map((_, i) => (
                <span key={i} className={`enf-dot ${i === step ? 'enf-dot-active' : i < step ? 'enf-dot-done' : ''}`} />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="enf-btn enf-btn-primary"
                onClick={goNext}
                disabled={loading || fetching}
              >
                <span>Next</span><ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="enf-btn enf-btn-primary"
                onClick={handleSubmit}
                disabled={loading || fetching}
              >
                {loading ? (
                  <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></>
                ) : (
                  <><Save size={15} /><span>{isEditMode ? 'Update Notice' : 'Publish Notice'}</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

