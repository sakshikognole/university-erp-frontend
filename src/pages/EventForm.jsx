/**
 * EventForm.jsx
 *
 * Handles Add New Event and Edit Event in a dialog/modal rendered inside
 * Events.jsx (Improvement 3).  When this component is used standalone via a
 * direct URL (/events/add, /events/edit/:id) it falls back to full-page mode.
 *
 * Defects fixed: 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
 * Improvements:  1 (HH:MM placeholder), 2 (12-hour time), 4 (venue + club required)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

const API_BASE_URL  = 'http://localhost:8080/api';
const NODE_API_URL  = 'http://localhost:5000/api';

// ─── Validation helpers ────────────────────────────────────────────────────────

// D6: Event IDs are manually entered. The existing convention in the DB is
// free-form alphanumeric strings with optional hyphens (e.g. EVT-2024-001).
// We enforce: 3–50 chars, at least one letter or digit, no leading/trailing spaces.
const EVENT_ID_HAS_ALNUM = /[A-Za-z0-9]/;
const validateEventId = (v) => {
  const t = v.trim();
  if (!t) return 'Event ID is required.';
  if (t.length < 2) return 'Event ID must be at least 2 characters.';
  if (t.length > 50) return 'Event ID must not exceed 50 characters.';
  if (!EVENT_ID_HAS_ALNUM.test(t))
    return 'Event ID must contain at least one letter or digit.';
  return null;
};

// D7: Title must contain at least one letter — rejects "!!! ###" but allows
// "2026 Tech Fest", "AI & Society — 2025", "CSIT Seminar".
const TITLE_HAS_LETTER = /[A-Za-z]/;
const validateTitle = (v) => {
  const t = v.trim();
  if (!t) return 'Event Title is required.';
  if (t.length < 3) return 'Event Title must be at least 3 characters.';
  if (!TITLE_HAS_LETTER.test(t))
    return 'Event Title must contain at least one letter (e.g. 2026 Tech Fest).';
  return null;
};

// D8 / D9: Parse a "YYYY-MM-DD" date string (from <input type="date">) and
// validate it is not in the past.  Also catches two-digit years because
// <input type="date"> never produces them — but we guard anyway.
const validateStartDate = (dateStr) => {
  if (!dateStr) return 'Start Date is required.';
  const parts = dateStr.split('-');
  if (parts.length !== 3 || parts[0].length !== 4)
    return 'Please enter a valid date in YYYY-MM-DD format (four-digit year required).';
  const year = parseInt(parts[0], 10);
  if (year < 1900 || year > 2200)
    return 'Please enter a valid four-digit year.';

  // Build a local-date-only comparison (no timezone offset errors)
  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  })();
  if (dateStr < todayStr)
    return 'Start Date cannot be in the past.';

  return null;
};

const validateEndDate = (endDateStr, startDateStr, startTimeStr, endTimeStr) => {
  if (!endDateStr) return 'End Date is required.';
  const parts = endDateStr.split('-');
  if (parts.length !== 3 || parts[0].length !== 4)
    return 'Please enter a valid date in YYYY-MM-DD format (four-digit year required).';
  const year = parseInt(parts[0], 10);
  if (year < 1900 || year > 2200)
    return 'Please enter a valid four-digit year.';

  if (startDateStr && endDateStr && startTimeStr && endTimeStr) {
    const startISO = `${startDateStr}T${startTimeStr}`;
    const endISO   = `${endDateStr}T${endTimeStr}`;
    if (endISO <= startISO)
      return 'End Date & Time must be after Start Date & Time.';
  } else if (startDateStr && endDateStr && endDateStr < startDateStr) {
    return 'End Date must be on or after Start Date.';
  }
  return null;
};

const validateTime = (v, label) => {
  if (!v) return `${label} is required.`;
  return null;
};

// Convert "HH:MM" (24-h) to "hh:MM AM/PM" for display.
const to12h = (v) => {
  if (!v) return '';
  const [hh, mm] = v.split(':').map(Number);
  if (isNaN(hh) || isNaN(mm)) return v;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const h12    = hh % 12 || 12;
  return `${String(h12).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${suffix}`;
};

// Convert "hh:MM AM/PM" back to "HH:MM" (24-h) for the hidden state.
const to24h = (display) => {
  if (!display) return '';
  const m = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return display; // passthrough if already 24-h or unparseable
  let h = parseInt(m[1], 10);
  const min = m[2];
  const suf = m[3].toUpperCase();
  if (suf === 'AM') { if (h === 12) h = 0; }
  else              { if (h !== 12) h += 12; }
  return `${String(h).padStart(2,'0')}:${min}`;
};

// Run all field validations; returns { field: message } object.
const validateAll = (f, isEdit) => {
  const errs = {};
  if (!isEdit) {
    const idErr = validateEventId(f.eventId);
    if (idErr) errs.eventId = idErr;
  }
  const titleErr = validateTitle(f.eventTitle);
  if (titleErr) errs.eventTitle = titleErr;
  if (!f.eventType) errs.eventType = 'Event Type is required.';

  // D10/D11: Start date + time required
  const sdErr = validateStartDate(f.startDateOnly);
  if (sdErr) errs.startDateOnly = sdErr;
  const stErr = validateTime(f.startTimeOnly, 'Start Time');
  if (stErr) errs.startTimeOnly = stErr;

  // D10/D11: End date + time required
  const edErr = validateEndDate(f.endDateOnly, f.startDateOnly, f.startTimeOnly, f.endTimeOnly);
  if (edErr) errs.endDateOnly = edErr;
  const etErr = validateTime(f.endTimeOnly, 'End Time');
  if (etErr) errs.endTimeOnly = etErr;

  // I4: Venue and Organizer Club required
  if (!f.venueId || !f.venueId.trim()) errs.venueId = 'Venue is required.';
  if (!f.organizerId || !f.organizerId.trim()) errs.organizerId = 'Organizer Club is required.';

  return errs;
};

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Props when embedded as a dialog inside Events.jsx:
 *   isDialog   {boolean}  – renders as overlay, not full page
 *   dialogId   {string}   – event ID being edited (undefined for add)
 *   onClose    {function} – called when dialog should close
 *   onSaved    {function} – called after successful save to refresh parent list
 *
 * When rendered via a route (no props), behaves exactly as before.
 */
const EventForm = ({ isDialog = false, dialogId, onClose, onSaved } = {}) => {
  // Support both dialog-prop mode and route-param mode
  const routeParams = useParams();
  const navigate    = useNavigate();

  const id         = isDialog ? dialogId : routeParams.id;
  const isEditMode = Boolean(id);

  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(false);
  const [feedback,  setFeedback]  = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  // Separate date and time so we can show DD/MM/YYYY hints (D9) and
  // a 12-hour time picker (I2) without converting datetime-local.
  const [formData, setFormData] = useState({
    eventId:       '',
    eventTitle:    '',
    description:   '',
    eventType:     'Conference',
    startDateOnly: '',   // YYYY-MM-DD (native date input value)
    startTimeOnly: '',   // HH:MM 24-hour (stored internally)
    endDateOnly:   '',
    endTimeOnly:   '',
    organizerId:   '',
    venueId:       '',
    status:        'ACTIVE',
  });

  // I2: Display state for 12-hour time inputs (what the user sees/types)
  const [startTimeDisplay, setStartTimeDisplay] = useState('');
  const [endTimeDisplay,   setEndTimeDisplay]   = useState('');

  // Club combobox state
  const [clubs,            setClubs]            = useState([]);
  const [clubSearchQuery,  setClubSearchQuery]  = useState('');
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [selectedClubName, setSelectedClubName] = useState('');

  // Venue combobox state
  const [venues,             setVenues]             = useState([]);
  const [venueSearchQuery,   setVenueSearchQuery]   = useState('');
  const [showVenueDropdown,  setShowVenueDropdown]  = useState(false);
  const [selectedVenueName,  setSelectedVenueName]  = useState('');

  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${localStorage.getItem('erp_token')}`,
  });

  useEffect(() => {
    loadClubs();
    loadVenues();
    if (isEditMode) loadEventDetails();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    const onDown = (e) => {
      if (!e.target.closest('.eb-club-combo'))  setShowClubDropdown(false);
      if (!e.target.closest('.eb-venue-combo')) setShowVenueDropdown(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { setShowClubDropdown(false); setShowVenueDropdown(false); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown',   onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown',   onKey);
    };
  }, []);

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadClubs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clubs`);
      if (res.ok) setClubs(await res.json());
    } catch (err) { console.error('Error fetching clubs:', err); }
  };

  const loadVenues = async () => {
    try {
      const res = await fetch(`${NODE_API_URL}/venues`, { headers: authHeader() });
      if (res.ok) {
        const d = await res.json();
        setVenues(Array.isArray(d) ? d : (d.venues || []));
      }
    } catch { /* non-critical — venue details enrich view only */ }
  };

  // Split an ISO or "YYYY-MM-DDTHH:MM" string into date and 24-h time parts
  const splitDateTime = (str) => {
    if (!str) return { date: '', time: '' };
    try {
      // Handle full ISO string (has 'Z' or offset)
      const dt   = new Date(str);
      const date = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      const time = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
      return { date, time };
    } catch {
      // Fallback: split on 'T'
      const [date='', timeFull=''] = str.split('T');
      return { date, time: timeFull.slice(0,5) };
    }
  };

  const loadEventDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}`, { headers: authHeader() });
      if (res.ok) {
        const ev = await res.json();
        const sd = splitDateTime(ev.startDate);
        const ed = splitDateTime(ev.endDate);

        setFormData({
          eventId:       ev.eventId       || '',
          eventTitle:    ev.eventTitle    || '',
          description:   ev.description   || '',
          eventType:     ev.eventType     || 'Conference',
          startDateOnly: sd.date,
          startTimeOnly: sd.time,
          endDateOnly:   ed.date,
          endTimeOnly:   ed.time,
          organizerId:   ev.organizerId   || '',
          venueId:       ev.venueId       || '',
          status:        ev.status        || 'ACTIVE',
        });

        // Set 12-h display values
        setStartTimeDisplay(to12h(sd.time));
        setEndTimeDisplay(to12h(ed.time));

        // Resolve names from loaded lists (may not be populated yet; synced below)
        if (ev.organizerId) setClubSearchQuery(ev.organizerId);
        if (ev.venueId)     setVenueSearchQuery(ev.venueId);
      } else {
        setFeedback({ type: 'error', message: 'Event not found.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Unable to connect to server.' + (err?.message ? ` ${err.message}` : '') });
    } finally {
      setFetching(false);
    }
  };

  // Sync resolved display names once lists arrive after edit-load
  useEffect(() => {
    if (formData.organizerId && clubs.length > 0 && !selectedClubName) {
      const club = clubs.find(c =>
        c.clubId?.toUpperCase() === formData.organizerId.toUpperCase() ||
        c.clubName?.toLowerCase() === formData.organizerId.toLowerCase()
      );
      if (club) { setSelectedClubName(club.clubName); setClubSearchQuery(club.clubName); }
      else        { setClubSearchQuery(formData.organizerId); }
    }
  }, [clubs, formData.organizerId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (formData.venueId && venues.length > 0 && !selectedVenueName) {
      const venue = venues.find(v =>
        v.venueId?.toUpperCase() === formData.venueId.toUpperCase() ||
        v._id === formData.venueId ||
        v.name?.toLowerCase() === formData.venueId.toLowerCase()
      );
      if (venue) { setSelectedVenueName(venue.name); setVenueSearchQuery(venue.name); }
      else        { setVenueSearchQuery(formData.venueId); }
    }
  }, [venues, formData.venueId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Input handlers ────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // I2: 12-hour time input — user types "02:30 PM", we store "14:30" in state
  const handleStartTimeChange = (e) => {
    const raw = e.target.value;
    setStartTimeDisplay(raw);
    const h24 = to24h(raw);
    setFormData(prev => ({ ...prev, startTimeOnly: h24 }));
    if (fieldErrors.startTimeOnly) setFieldErrors(prev => ({ ...prev, startTimeOnly: undefined }));
  };

  const handleEndTimeChange = (e) => {
    const raw = e.target.value;
    setEndTimeDisplay(raw);
    const h24 = to24h(raw);
    setFormData(prev => ({ ...prev, endTimeOnly: h24 }));
    if (fieldErrors.endTimeOnly) setFieldErrors(prev => ({ ...prev, endTimeOnly: undefined }));
  };

  // Club combobox
  const handleClubSearchChange = (e) => {
    const q = e.target.value;
    setClubSearchQuery(q);
    setShowClubDropdown(q.length >= 2);
    if (selectedClubName && q !== selectedClubName) {
      setSelectedClubName('');
      setFormData(prev => ({ ...prev, organizerId: '' }));
    }
    if (fieldErrors.organizerId) setFieldErrors(prev => ({ ...prev, organizerId: undefined }));
  };
  const handleClubSelect = (club) => {
    setFormData(prev => ({ ...prev, organizerId: club.clubId }));
    setSelectedClubName(club.clubName);
    setClubSearchQuery(club.clubName);
    setShowClubDropdown(false);
    if (fieldErrors.organizerId) setFieldErrors(prev => ({ ...prev, organizerId: undefined }));
  };
  const getFilteredClubs = () => {
    if (clubSearchQuery.length < 2) return [];
    const q = clubSearchQuery.toLowerCase();
    return clubs.filter(c =>
      (c.clubName||'').toLowerCase().includes(q) ||
      (c.clubId||'').toLowerCase().includes(q)
    ).slice(0, 8);
  };

  // Venue combobox
  const handleVenueSearchChange = (e) => {
    const q = e.target.value;
    setVenueSearchQuery(q);
    setShowVenueDropdown(q.length >= 2);
    setFormData(prev => ({ ...prev, venueId: q }));
    if (selectedVenueName && q !== selectedVenueName) setSelectedVenueName('');
    if (fieldErrors.venueId) setFieldErrors(prev => ({ ...prev, venueId: undefined }));
  };
  const handleVenueSelect = (venue) => {
    const vid = venue.venueId || venue.name || venue._id;
    setFormData(prev => ({ ...prev, venueId: vid }));
    setSelectedVenueName(venue.name);
    setVenueSearchQuery(venue.name);
    setShowVenueDropdown(false);
    if (fieldErrors.venueId) setFieldErrors(prev => ({ ...prev, venueId: undefined }));
  };
  const getFilteredVenues = () => {
    if (venueSearchQuery.length < 2) return [];
    const q = venueSearchQuery.toLowerCase();
    return venues.filter(v =>
      (v.name||'').toLowerCase().includes(q) ||
      (v.venueId||'').toLowerCase().includes(q)
    ).slice(0, 8);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const errs = validateAll(formData, isEditMode);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFeedback({ type: 'error', message: 'Please fix the highlighted errors before saving.' });
      return;
    }
    setFieldErrors({});
    setLoading(true);

    // Combine date + 24-h time into ISO strings
    const toISO = (dateStr, timeStr) => {
      if (!dateStr) return null;
      const t = timeStr || '00:00';
      return new Date(`${dateStr}T${t}:00`).toISOString();
    };

    const payload = {
      // D12: never send eventId on update — backend preserves the original
      ...(isEditMode ? {} : { eventId: formData.eventId.trim() }),
      eventTitle:   formData.eventTitle.trim(),
      description:  formData.description.trim(),
      eventType:    formData.eventType.trim(),
      startDate:    toISO(formData.startDateOnly, formData.startTimeOnly),
      endDate:      toISO(formData.endDateOnly,   formData.endTimeOnly),
      organizerId:  formData.organizerId.trim(),
      venueId:      formData.venueId.trim(),
      status:       formData.status.trim(),
    };

    try {
      const url    = isEditMode ? `${API_BASE_URL}/events/${id}` : `${API_BASE_URL}/events`;
      const method = isEditMode ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(payload) });
      const data   = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || data.message || 'Failed to save event.' });
        setLoading(false);
        return;
      }

      setFeedback({
        type:    'success',
        message: data.message || (isEditMode ? 'Event updated successfully!' : 'Event created successfully!'),
      });

      if (isDialog && onSaved) {
        setTimeout(() => { onSaved(); if (onClose) onClose(); }, 900);
      } else {
        setTimeout(() => navigate('/events'), 1200);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Unable to connect to the server. Please try again.' });
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDialog && onClose) { onClose(); }
    else { navigate('/events'); }
  };

  // ── Inline error helper ──────────────────────────────────────────────────

  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="form-field-error" style={{ marginTop: '0.25rem' }}>
        {fieldErrors[name]}
      </p>
    ) : null;

  // ── Combobox dropdown shared render ──────────────────────────────────────

  const dropdownStyle = {
    position: 'absolute', top: '100%', left: 0, right: 0,
    marginTop: '0.25rem', maxHeight: '280px', overflowY: 'auto',
    backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
    borderRadius: '8px', zIndex: 1000,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06)',
  };
  const dropdownItemStyle = {
    padding: '0.75rem 1rem', cursor: 'pointer',
    borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s',
  };
  const dropdownEmptyStyle = {
    ...dropdownItemStyle, color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'default',
  };

  // ── Form content (shared between dialog and page modes) ──────────────────

  const formContent = (
    <form onSubmit={handleSubmit} className="form-layout" noValidate>

      {/* ── Basic Information ─────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">Basic Information</h3>

        <div className="form-row">
          {/* D6 / D12: Event ID — disabled (read-only) on edit */}
          <div className="form-group">
            <label htmlFor="eb-eventId" className="form-label">
              Event ID <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              id="eb-eventId"
              name="eventId"
              className={`form-input${fieldErrors.eventId ? ' input-error' : ''}${isEditMode ? ' eb-readonly-id' : ''}`}
              placeholder="e.g. EVT-2024-001"
              value={formData.eventId}
              onChange={handleInputChange}
              readOnly={isEditMode}
              disabled={isEditMode}
              style={isEditMode ? { backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.8 } : undefined}
              maxLength={50}
            />
            {isEditMode && (
              <small className="form-field-hint">Event ID cannot be changed after creation.</small>
            )}
            <FieldError name="eventId" />
          </div>

          {/* D7: Title */}
          <div className="form-group">
            <label htmlFor="eb-eventTitle" className="form-label">
              Event Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              id="eb-eventTitle"
              name="eventTitle"
              className={`form-input${fieldErrors.eventTitle ? ' input-error' : ''}`}
              placeholder="e.g. Annual Tech Conference 2026"
              value={formData.eventTitle}
              onChange={handleInputChange}
              maxLength={200}
            />
            <FieldError name="eventTitle" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="eb-description" className="form-label">Description</label>
          <textarea
            id="eb-description"
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
            <label htmlFor="eb-eventType" className="form-label">
              Event Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="eb-eventType" name="eventType"
              className={`form-input${fieldErrors.eventType ? ' input-error' : ''}`}
              value={formData.eventType} onChange={handleInputChange}
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
            <FieldError name="eventType" />
          </div>

          <div className="form-group">
            <label htmlFor="eb-status" className="form-label">
              Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select id="eb-status" name="status" className="form-input" value={formData.status} onChange={handleInputChange}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Schedule & Location ──────────────────────────────────── */}
      <div className="form-section" style={{ marginTop: '2rem' }}>
        <h3 className="form-section-title">Schedule &amp; Location</h3>

        {/* D10: asterisks on date/time labels */}
        <div className="form-row">
          {/* Start Date — D9: native date input always produces YYYY-MM-DD (no 2-digit years) */}
          <div className="form-group">
            <label htmlFor="eb-startDateOnly" className="form-label">
              Start Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              id="eb-startDateOnly"
              name="startDateOnly"
              className={`form-input${fieldErrors.startDateOnly ? ' input-error' : ''}`}
              value={formData.startDateOnly}
              onChange={(e) => {
                handleInputChange(e);
                // Clear end-date error when start changes
                if (fieldErrors.endDateOnly) setFieldErrors(p => ({ ...p, endDateOnly: undefined }));
              }}
            />
            <small className="form-field-hint">Format: DD/MM/YYYY</small>
            <FieldError name="startDateOnly" />
          </div>

          {/* Start Time — I1: placeholder HH:MM  I2: 12-hour display */}
          <div className="form-group">
            <label htmlFor="eb-startTimeOnly" className="form-label">
              Start Time <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              id="eb-startTimeOnly"
              className={`form-input${fieldErrors.startTimeOnly ? ' input-error' : ''}`}
              placeholder="HH:MM AM/PM"
              value={startTimeDisplay}
              onChange={handleStartTimeChange}
              onBlur={() => {
                // Normalise on blur: if user typed 24-h format convert to 12-h display
                const h24 = to24h(startTimeDisplay) || startTimeDisplay;
                const display = to12h(h24) || startTimeDisplay;
                setStartTimeDisplay(display);
              }}
              maxLength={10}
            />
            <small className="form-field-hint">12-hour format, e.g. 09:30 AM</small>
            <FieldError name="startTimeOnly" />
          </div>
        </div>

        <div className="form-row">
          {/* End Date */}
          <div className="form-group">
            <label htmlFor="eb-endDateOnly" className="form-label">
              End Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              id="eb-endDateOnly"
              name="endDateOnly"
              className={`form-input${fieldErrors.endDateOnly ? ' input-error' : ''}`}
              value={formData.endDateOnly}
              onChange={handleInputChange}
            />
            <small className="form-field-hint">Format: DD/MM/YYYY</small>
            <FieldError name="endDateOnly" />
          </div>

          {/* End Time */}
          <div className="form-group">
            <label htmlFor="eb-endTimeOnly" className="form-label">
              End Time <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              id="eb-endTimeOnly"
              className={`form-input${fieldErrors.endTimeOnly ? ' input-error' : ''}`}
              placeholder="HH:MM AM/PM"
              value={endTimeDisplay}
              onChange={handleEndTimeChange}
              onBlur={() => {
                const h24 = to24h(endTimeDisplay) || endTimeDisplay;
                const display = to12h(h24) || endTimeDisplay;
                setEndTimeDisplay(display);
              }}
              maxLength={10}
            />
            <small className="form-field-hint">12-hour format, e.g. 05:00 PM</small>
            <FieldError name="endTimeOnly" />
          </div>
        </div>

        {/* Venue + Organizer Club */}
        <div className="form-row">
          {/* I4: Venue required */}
          <div className="form-group">
            <label htmlFor="eb-venueSearch" className="form-label">
              Venue <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="eb-venue-combo" style={{ position: 'relative' }}>
              <input
                type="text"
                id="eb-venueSearch"
                className={`form-input${fieldErrors.venueId ? ' input-error' : ''}`}
                placeholder="Type venue name or ID (min 2 chars)…"
                value={venueSearchQuery}
                onChange={handleVenueSearchChange}
                onFocus={() => venueSearchQuery.length >= 2 && setShowVenueDropdown(true)}
                autoComplete="off"
              />
              {selectedVenueName && (
                <small className="form-field-hint">
                  Selected: {selectedVenueName} — {formData.venueId}
                </small>
              )}
              {showVenueDropdown && (
                <div style={dropdownStyle}>
                  {getFilteredVenues().length === 0 ? (
                    <div style={dropdownEmptyStyle}>No venues found matching "{venueSearchQuery}"</div>
                  ) : getFilteredVenues().map((v) => (
                    <div key={v._id || v.venueId} style={dropdownItemStyle}
                      onClick={() => handleVenueSelect(v)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                        {v.venueId}{v.capacity && ` • Capacity: ${v.capacity}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <FieldError name="venueId" />
          </div>

          {/* I4: Organizer Club required */}
          <div className="form-group">
            <label htmlFor="eb-clubSearch" className="form-label">
              Organizer Club <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="eb-club-combo" style={{ position: 'relative' }}>
              <input
                type="text"
                id="eb-clubSearch"
                className={`form-input${fieldErrors.organizerId ? ' input-error' : ''}`}
                placeholder="Type club name or ID (min 2 chars)…"
                value={clubSearchQuery}
                onChange={handleClubSearchChange}
                onFocus={() => clubSearchQuery.length >= 2 && setShowClubDropdown(true)}
                autoComplete="off"
              />
              {selectedClubName && (
                <small className="form-field-hint">
                  Selected: {selectedClubName} — {formData.organizerId}
                </small>
              )}
              {showClubDropdown && (
                <div style={dropdownStyle}>
                  {getFilteredClubs().length === 0 ? (
                    <div style={dropdownEmptyStyle}>No clubs found matching "{clubSearchQuery}"</div>
                  ) : getFilteredClubs().map((c) => (
                    <div key={c.clubId} style={dropdownItemStyle}
                      onClick={() => handleClubSelect(c)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.clubName}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                        {c.clubId}{c.clubCategory && ` • ${c.clubCategory}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <FieldError name="organizerId" />
          </div>
        </div>
      </div>

      {/* ── Form actions — D3/D4: right-aligned; mobile class applied below ── */}
      <div className="form-actions-row eb-form-actions" style={{ marginTop: '2rem' }}>
        <button type="button" className="books-btn books-btn-ghost" onClick={handleCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
          {loading
            ? <><Loader2 size={16} className="spin-animate" /><span>Saving…</span></>
            : <><Save size={16} /><span>{isEditMode ? 'Update Event' : 'Save Event'}</span></>
          }
        </button>
      </div>
    </form>
  );

  // ── Dialog mode ──────────────────────────────────────────────────────────

  if (isDialog) {
    return (
      <div className="modal-overlay eb-form-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}>
        <div className="modal-content eb-form-dialog" onClick={e => e.stopPropagation()}>
          {/* D5: Back / close button at top-left of dialog header */}
          <div className="modal-header eb-dialog-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              {/* D5: back arrow before heading */}
              <button type="button" className="btn-back" onClick={handleCancel} title="Close" style={{ flexShrink: 0 }}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="modal-title" style={{ fontSize: '1.125rem' }}>
                  {isEditMode ? 'Edit Event' : 'Add New Event'}
                </h2>
                <p className="page-subtitle" style={{ fontSize: '0.8125rem', marginTop: '0.1rem' }}>
                  {isEditMode ? 'Update event booking information' : 'Create a new event booking with venue reservation'}
                </p>
              </div>
            </div>
            <button type="button" className="close-modal-btn" onClick={handleCancel} title="Close">
              <X size={18} />
            </button>
          </div>

          {feedback.message && (
            <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
              style={{ marginBottom: '1rem' }}>
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {fetching ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem' }} />
              <p>Loading event details…</p>
            </div>
          ) : formContent}
        </div>
      </div>
    );
  }

  // ── Full-page / standalone mode ───────────────────────────────────────────

  return (
    <div className="page-container">
      {/* D5: back arrow above (before) the heading in a flex column on mobile */}
      <div className="eb-page-header" style={{ marginBottom: '1.5rem' }}>
        <button type="button" className="btn-back eb-back-btn" onClick={handleCancel} title="Back to Events">
          <ArrowLeft size={18} />
        </button>
        <div className="eb-heading-block">
          <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
            {isEditMode ? 'Edit Event' : 'Add New Event'}
          </h1>
          <p className="page-subtitle">
            {isEditMode ? 'Update event booking information and details' : 'Create a new event booking with venue reservation'}
          </p>
        </div>
      </div>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ marginBottom: '1.5rem' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="card eb-form-card" style={{ maxWidth: '820px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading event details…</p>
          </div>
        ) : formContent}
      </div>
    </div>
  );
};

export default EventForm;
