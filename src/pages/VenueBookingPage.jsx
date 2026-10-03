import { useState, useEffect, useCallback } from 'react';
import {
  venueBookingService,
  fetchEvents,
  fetchVenues,
  generateBookingId,
} from '../services/venueBookingService';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  PENDING:   { background: '#fef9c3', color: '#854d0e',  border: '1px solid #fde047' },
  APPROVED:  { background: '#dcfce7', color: '#166534',  border: '1px solid #86efac' },
  REJECTED:  { background: '#fee2e2', color: '#991b1b',  border: '1px solid #fca5a5' },
  CANCELLED: { background: '#f1f5f9', color: '#475569',  border: '1px solid #cbd5e1' },
};
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return (
    <span style={{ ...s, padding: '3px 10px', borderRadius: 9999,
                   fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ── D11: format YYYY-MM-DD → DD-MM-YYYY for display ──────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return iso;
}

// ── Today's date string YYYY-MM-DD ───────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

// ── Validation helpers ────────────────────────────────────────────────────────
// D6/D9: validate date — must be a real calendar date
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d) && d.toISOString().split('T')[0] === dateStr;
}

// D8: Requested By — only letters, spaces, dots
function validateRequestedBy(val) {
  const t = val.trim();
  if (!t) return 'Requested by is required.';
  if (!/^[A-Za-z\s.]+$/.test(t))
    return 'Requested By must contain only letters, spaces, and dots.';
  if (/\s{2,}/.test(t))
    return 'Requested By must not contain double spaces.';
  return '';
}

const EMPTY_FORM = {
  bookingId: '', eventId: '', venueId: '',
  bookingDate: '', startTime: '', endTime: '',
  purpose: '', requestedBy: '', status: 'PENDING',
};

// ── Validate booking form ─────────────────────────────────────────────────────
function validateBooking(form, isEdit = false) {
  const e = {};
  if (!form.eventId)   e.eventId = 'Event is required.';
  if (!form.venueId)   e.venueId = 'Venue is required.';

  // D6/D9: reject invalid dates
  if (!form.bookingDate) {
    e.bookingDate = 'Booking date is required.';
  } else if (!isValidDate(form.bookingDate)) {
    e.bookingDate = 'Please enter a valid date.';
  } else if (!isEdit && form.bookingDate < todayStr()) {
    // D10: past date blocked on new bookings and edit
    e.bookingDate = 'Booking date cannot be in the past.';
  } else if (isEdit && form.bookingDate < todayStr()) {
    e.bookingDate = 'Booking date cannot be in the past.';
  }

  // D7: validate time — HTML time input auto-corrects invalid values to max
  // We use pattern validation to catch the edge-case
  if (!form.startTime) {
    e.startTime = 'Start time is required.';
  } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.startTime)) {
    e.startTime = 'Please enter a valid time (HH:MM).';
  }

  if (!form.endTime) {
    e.endTime = 'End time is required.';
  } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.endTime)) {
    e.endTime = 'Please enter a valid time (HH:MM).';
  } else if (form.startTime && form.endTime && form.endTime <= form.startTime) {
    e.endTime = 'End time must be after start time.';
  }

  // D8: Requested By validation
  const rbErr = validateRequestedBy(form.requestedBy);
  if (rbErr) e.requestedBy = rbErr;

  return e;
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ booking, events, venues, onClose }) {
  if (!booking) return null;
  const ev = events.find(e => e.eventId === booking.eventId);
  const vn = venues.find(v => v.venueId === booking.venueId);
  return (
    <div className="books-overlay" onClick={onClose}>
      <div className="books-modal" style={{ maxWidth: 500 }}
           onClick={e => e.stopPropagation()}>
        <div className="books-modal-head">
          <h3>Booking Details</h3>
          <button className="books-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="books-modal-body">
          {[
            ['Booking ID',   booking.bookingId],
            ['Event',        ev ? `${ev.eventId} — ${ev.eventTitle}` : booking.eventId],
            ['Venue',        vn ? `${vn.venueId} — ${vn.name}` : booking.venueId],
            ['Booking Date', fmtDate(booking.bookingDate)],
            ['Start Time',   booking.startTime],
            ['End Time',     booking.endTime],
            ['Purpose',      booking.purpose || '—'],
            ['Requested By', booking.requestedBy],
          ].map(([label, val]) => (
            <div key={label} style={{
              display: 'flex', gap: 12, padding: '8px 0',
              borderBottom: '1px solid var(--border-primary,#f3f4f6)',
            }}>
              <span style={{ width: 130, flexShrink: 0, fontWeight: 600,
                             fontSize: 13, color: 'var(--text-secondary)' }}>
                {label}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-primary)',
                             wordBreak: 'break-word' }}>
                {val}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
            <span style={{ width: 130, flexShrink: 0, fontWeight: 600,
                           fontSize: 13, color: 'var(--text-secondary)' }}>
              Status
            </span>
            <StatusBadge status={booking.status} />
          </div>
        </div>
        <div className="books-modal-foot">
          <button className="books-btn books-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ booking, events, venues, onSave, onClose, saving }) {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (booking) setForm({ ...EMPTY_FORM, ...booking });
    setErrors({});
  }, [booking]);

  if (!booking) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: '' }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validateBooking(form, true);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 560 }}>
        <div className="books-modal-head">
          <h3>Edit Booking</h3>
          <button className="books-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column',
                                         maxHeight: '85vh', overflow: 'hidden' }}>
          <div className="books-modal-body" style={{ overflowY: 'auto', flex: 1 }}>

            {/* Booking ID read-only */}
            <div className="books-form-group">
              <label className="books-form-label">Booking ID</label>
              <input className="books-form-control" value={form.bookingId} disabled
                     style={{ background: '#f9fafb', color: '#6b7280' }} />
            </div>

            {/* Event + Venue */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Event *</label>
                <select className={`books-form-control ${errors.eventId ? 'err' : ''}`}
                        name="eventId" value={form.eventId} onChange={change}>
                  <option value="">— Select event —</option>
                  {events.map(ev => (
                    <option key={ev.eventId} value={ev.eventId}>
                      {ev.eventId} — {ev.eventTitle}
                    </option>
                  ))}
                </select>
                {errors.eventId && <p className="books-form-err">{errors.eventId}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Venue *</label>
                <select className={`books-form-control ${errors.venueId ? 'err' : ''}`}
                        name="venueId" value={form.venueId} onChange={change}>
                  <option value="">— Select venue —</option>
                  {venues.map(vn => (
                    <option key={vn.venueId} value={vn.venueId}>
                      {vn.venueId} — {vn.name}
                    </option>
                  ))}
                </select>
                {errors.venueId && <p className="books-form-err">{errors.venueId}</p>}
              </div>
            </div>

            {/* Date + Status */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Booking Date *</label>
                <input className={`books-form-control ${errors.bookingDate ? 'err' : ''}`}
                       type="date" name="bookingDate" value={form.bookingDate}
                       min={todayStr()} onChange={change} />
                {errors.bookingDate && <p className="books-form-err">{errors.bookingDate}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Status</label>
                <select className="books-form-control" name="status"
                        value={form.status} onChange={change}>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* Start + End time */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Start Time * (HH:MM)</label>
                <input className={`books-form-control ${errors.startTime ? 'err' : ''}`}
                       type="time" name="startTime" value={form.startTime}
                       placeholder="HH:MM" onChange={change} />
                {errors.startTime && <p className="books-form-err">{errors.startTime}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">End Time * (HH:MM)</label>
                <input className={`books-form-control ${errors.endTime ? 'err' : ''}`}
                       type="time" name="endTime" value={form.endTime}
                       placeholder="HH:MM" onChange={change} />
                {errors.endTime && <p className="books-form-err">{errors.endTime}</p>}
              </div>
            </div>

            {/* Purpose — Improvement: larger textarea */}
            <div className="books-form-group">
              <label className="books-form-label">Purpose / Description</label>
              <textarea className="books-form-control" name="purpose"
                        value={form.purpose} onChange={change}
                        rows={4} placeholder="Describe the purpose of this booking..."
                        style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            {/* Requested By — D8 */}
            <div className="books-form-group">
              <label className="books-form-label">Requested By *</label>
              <input className={`books-form-control ${errors.requestedBy ? 'err' : ''}`}
                     name="requestedBy" value={form.requestedBy} onChange={change}
                     placeholder="e.g. Prof. Sharma" />
              {errors.requestedBy && <p className="books-form-err">{errors.requestedBy}</p>}
            </div>

          </div>
          <div className="books-modal-foot">
            <button type="button" className="books-btn books-btn-ghost"
                    onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="books-btn books-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════════════════
export default function VenueBookingPage() {
  const [events,    setEvents]    = useState([]);
  const [venues,    setVenues]    = useState([]);
  const [dropping,  setDropping]  = useState(true);
  const [dropError, setDropError] = useState('');
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [pageError, setPageError] = useState('');
  const [form,      setForm]      = useState({ ...EMPTY_FORM, bookingId: generateBookingId() });
  const [formErrs,  setFormErrs]  = useState({});
  const [submitting,setSubmitting]= useState(false);
  const [viewBooking, setViewBooking] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  // ── Load bookings ──────────────────────────────────────────────────────────
  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setPageError(''); }
    try {
      const res = await venueBookingService.getAll();
      setBookings(Array.isArray(res) ? res : (res.data ?? []));
    } catch (err) {
      if (!silent) setPageError(err.message || 'Failed to load bookings.');
      else setError('Failed to refresh bookings.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setDropping(true); setDropError('');
      try {
        const [evRes, vnRes] = await Promise.all([fetchEvents(), fetchVenues()]);
        setEvents(evRes); setVenues(vnRes);
      } catch (err) {
        setDropError(err.message || 'Failed to load events or venues.');
      } finally {
        setDropping(false);
      }
    };
    init();
    loadBookings();
  }, [loadBookings]);

  // ── Auto-clear notifications ───────────────────────────────────────────────
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Form handlers ──────────────────────────────────────────────────────────
  const changeForm = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFormErrs(er => ({ ...er, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateBooking(form, false);
    if (Object.keys(errs).length) { setFormErrs(errs); return; }
    setSubmitting(true);
    try {
      await venueBookingService.create(form);
      setSuccess('Venue booking request submitted successfully.');
      setForm({ ...EMPTY_FORM, bookingId: generateBookingId() });
      setFormErrs({});
      loadBookings(true);
    } catch (err) {
      setError(err.message || 'Failed to submit booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalSave = async (updated) => {
    setSaving(true);
    try {
      await venueBookingService.update(updated.bookingId, updated);
      setSuccess('Booking updated successfully.');
      setEditBooking(null);
      loadBookings(true);
    } catch (err) {
      setError(err.message || 'Failed to update booking.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete booking "${b.bookingId}"?`)) return;
    try {
      await venueBookingService.remove(b.bookingId);
      setSuccess('Booking deleted.');
      loadBookings(true);
    } catch (err) {
      setError(err.message || 'Failed to delete booking.');
    }
  };

  const eventLabel = (id) => {
    const ev = events.find(e => e.eventId === id);
    return ev ? `${ev.eventId} — ${ev.eventTitle}` : id;
  };
  const venueLabel = (id) => {
    const vn = venues.find(v => v.venueId === id);
    return vn ? `${vn.venueId} — ${vn.name}` : id;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* D1: header left-aligned on mobile — flexWrap nowrap, flexShrink */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'nowrap',
        gap: 12, marginBottom: '1.25rem',
      }}>
        <div style={{ minWidth: 0 }}>
          {/* D1: page-title is left-aligned */}
          <h1 className="page-title" style={{ textAlign: 'left' }}>Venue Booking</h1>
          <p className="stu-page-sub" style={{ textAlign: 'left' }}>
            Submit and manage venue booking requests
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="books-alert books-alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}
      {error && (
        <div className="books-alert books-alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* ── New Booking Request Form ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem',
                     color: '#111827', textAlign: 'left' }}>
          New Booking Request
        </h2>

        {dropping ? (
          <PageLoader message="Loading events and venues..." />
        ) : dropError ? (
          <PageError message={dropError} />
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Booking ID */}
            <div className="books-form-group">
              <label className="books-form-label">Booking ID (auto-generated)</label>
              <input className="books-form-control" value={form.bookingId} disabled
                     style={{ background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed',
                              maxWidth: 280 }} />
            </div>

            {/* D2: Event + Venue — stack on mobile via flex-wrap */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Event *</label>
                <select className={`books-form-control ${formErrs.eventId ? 'err' : ''}`}
                        name="eventId" value={form.eventId} onChange={changeForm}>
                  <option value="">— Select an event —</option>
                  {events.map(ev => (
                    <option key={ev.eventId} value={ev.eventId}>
                      {ev.eventId} — {ev.eventTitle}
                    </option>
                  ))}
                </select>
                {formErrs.eventId && <p className="books-form-err">{formErrs.eventId}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Venue *</label>
                <select className={`books-form-control ${formErrs.venueId ? 'err' : ''}`}
                        name="venueId" value={form.venueId} onChange={changeForm}>
                  <option value="">— Select a venue —</option>
                  {venues.map(vn => (
                    <option key={vn.venueId} value={vn.venueId}>
                      {vn.venueId} — {vn.name}
                    </option>
                  ))}
                </select>
                {formErrs.venueId && <p className="books-form-err">{formErrs.venueId}</p>}
              </div>
            </div>

            {/* D2: Date + Start + End — each on its own row on mobile */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Booking Date *</label>
                <input className={`books-form-control ${formErrs.bookingDate ? 'err' : ''}`}
                       type="date" name="bookingDate" value={form.bookingDate}
                       min={todayStr()} onChange={changeForm} />
                {formErrs.bookingDate && <p className="books-form-err">{formErrs.bookingDate}</p>}
              </div>
              <div className="books-form-group">
                {/* Improvement: placeholder HH:MM */}
                <label className="books-form-label">Start Time * (HH:MM)</label>
                <input className={`books-form-control ${formErrs.startTime ? 'err' : ''}`}
                       type="time" name="startTime" value={form.startTime}
                       placeholder="HH:MM" onChange={changeForm} />
                {formErrs.startTime && <p className="books-form-err">{formErrs.startTime}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">End Time * (HH:MM)</label>
                <input className={`books-form-control ${formErrs.endTime ? 'err' : ''}`}
                       type="time" name="endTime" value={form.endTime}
                       placeholder="HH:MM" onChange={changeForm} />
                {formErrs.endTime && <p className="books-form-err">{formErrs.endTime}</p>}
              </div>
            </div>

            {/* Improvement: larger description textarea */}
            <div className="books-form-group">
              <label className="books-form-label">Purpose / Description</label>
              <textarea className="books-form-control" name="purpose"
                        value={form.purpose} onChange={changeForm}
                        rows={4} placeholder="Describe the purpose of this booking..."
                        style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            {/* Requested By — D8 */}
            <div className="books-form-group" style={{ maxWidth: 380 }}>
              <label className="books-form-label">Requested By *</label>
              <input className={`books-form-control ${formErrs.requestedBy ? 'err' : ''}`}
                     name="requestedBy" value={form.requestedBy} onChange={changeForm}
                     placeholder="e.g. Prof. Sharma" />
              {formErrs.requestedBy && <p className="books-form-err">{formErrs.requestedBy}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button type="submit"
                      className="books-btn books-btn-primary"
                      disabled={submitting || dropping}
                      style={{ minWidth: 160 }}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── All Booking Requests ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            All Booking Requests
          </h2>
          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
            Total: {bookings.length}
          </span>
        </div>

        {loading ? (
          <PageLoader message="Loading bookings..." />
        ) : pageError ? (
          <PageError message={pageError} onRetry={() => loadBookings()} />
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#9ca3af' }}>
            <p>No booking requests yet.</p>
          </div>
        ) : (
          <>
            {/* D3/D4/D5: Desktop table — simplified columns, Actions always visible */}
            <div className="book-desk-table">
              <div className="books-table-wrap">
                <table className="books-table">
                  <thead>
                    <tr>
                      {/* Improvement: center-aligned headers */}
                      {['#','Booking ID','Event','Venue','Date','Start','Status','Actions']
                        .map(h => (
                          <th key={h} style={{ textAlign: 'center' }}>{h}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, idx) => (
                      <tr key={b.bookingId}>
                        <td style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                          {idx + 1}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem',
                                         fontWeight: 600 }}>
                            {b.bookingId}
                          </span>
                        </td>
                        {/* D5: Event column — full width, wraps instead of truncating */}
                        <td style={{ fontSize: 13, maxWidth: 200,
                                     wordBreak: 'break-word' }}>
                          {eventLabel(b.eventId)}
                        </td>
                        {/* D5: Venue column */}
                        <td style={{ fontSize: 13, maxWidth: 180,
                                     wordBreak: 'break-word' }}>
                          {venueLabel(b.venueId)}
                        </td>
                        {/* D11: show DD-MM-YYYY */}
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap',
                                     fontSize: 13 }}>
                          {fmtDate(b.bookingDate)}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 13 }}>
                          {b.startTime}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <StatusBadge status={b.status} />
                        </td>
                        {/* D4: Actions always visible — not pushed off-screen */}
                        <td style={{ textAlign: 'center' }}>
                          <div className="books-actions" style={{ justifyContent: 'center' }}>
                            <button className="books-btn books-btn-sm books-btn-ghost"
                                    onClick={() => setViewBooking(b)}>
                              View
                            </button>
                            <button className="books-btn books-btn-sm books-btn-ghost"
                                    onClick={() => setEditBooking(b)}>
                              Edit
                            </button>
                            <button className="books-btn books-btn-sm books-btn-danger"
                                    onClick={() => handleDelete(b)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* D3: Mobile cards — no horizontal scroll */}
            <div className="book-mob-list">
              {bookings.map((b, idx) => (
                <div key={b.bookingId} className="book-mob-card">
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem',
                                       fontWeight: 700, color: '#1e3a5f' }}>
                          {b.bookingId}
                        </span>
                        <span style={{ marginLeft: 8, fontSize: 12,
                                       color: '#9ca3af' }}>#{idx + 1}</span>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    {[
                      ['Event',   eventLabel(b.eventId)],
                      ['Venue',   venueLabel(b.venueId)],
                      ['Date',    fmtDate(b.bookingDate)],
                      ['Time',    `${b.startTime} — ${b.endTime}`],
                      ['Req. By', b.requestedBy],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', gap: 8,
                                                fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: '#6b7280',
                                       minWidth: 64, flexShrink: 0 }}>
                          {label}
                        </span>
                        <span style={{ color: '#111827', wordBreak: 'break-word' }}>
                          {val}
                        </span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="books-btn books-btn-sm books-btn-ghost"
                              style={{ flex: 1 }}
                              onClick={() => setViewBooking(b)}>
                        View
                      </button>
                      <button className="books-btn books-btn-sm books-btn-ghost"
                              style={{ flex: 1 }}
                              onClick={() => setEditBooking(b)}>
                        Edit
                      </button>
                      <button className="books-btn books-btn-sm books-btn-danger"
                              style={{ flex: 1 }}
                              onClick={() => handleDelete(b)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {viewBooking && (
        <ViewModal
          booking={viewBooking}
          events={events}
          venues={venues}
          onClose={() => setViewBooking(null)}
        />
      )}
      {editBooking && (
        <EditModal
          booking={editBooking}
          events={events}
          venues={venues}
          onSave={handleModalSave}
          onClose={() => setEditBooking(null)}
          saving={saving}
        />
      )}

    </div>
  );
}
