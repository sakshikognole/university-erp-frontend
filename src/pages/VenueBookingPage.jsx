import { useState, useEffect, useCallback } from 'react';
import {
  venueBookingService,
  fetchEvents,
  fetchVenues,
  generateBookingId,
} from '../services/venueBookingService';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';

// ── Status badge helper ───────────────────────────────────────────────────────
const STATUS_STYLE = {
  PENDING:   { background: '#fef9c3', color: '#854d0e',  border: '1px solid #fde047' },
  APPROVED:  { background: '#dcfce7', color: '#166534',  border: '1px solid #86efac' },
  REJECTED:  { background: '#fee2e2', color: '#991b1b',  border: '1px solid #fca5a5' },
  CANCELLED: { background: '#f1f5f9', color: '#475569',  border: '1px solid #cbd5e1' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return (
    <span style={{
      ...s,
      padding: '3px 10px',
      borderRadius: 9999,
      fontSize: '0.78rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  bookingId:   '',
  eventId:     '',
  venueId:     '',
  bookingDate: '',
  startTime:   '',
  endTime:     '',
  purpose:     '',
  requestedBy: '',
  status:      'PENDING',
};

// ── Modal — View / Edit ───────────────────────────────────────────────────────
function BookingModal({ isOpen, mode, booking, events, venues, onSave, onClose, saving }) {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (booking) {
      setForm({ ...EMPTY_FORM, ...booking });
    } else {
      setForm({ ...EMPTY_FORM, bookingId: generateBookingId() });
    }
    setErrors({});
  }, [isOpen, booking]);

  if (!isOpen) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.eventId)     e.eventId     = 'Event is required.';
    if (!form.venueId)     e.venueId     = 'Venue is required.';
    if (!form.bookingDate) e.bookingDate = 'Booking date is required.';
    if (!form.startTime)   e.startTime   = 'Start time is required.';
    if (!form.endTime)     e.endTime     = 'End time is required.';
    if (!form.requestedBy.trim()) e.requestedBy = 'Requested by is required.';
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      e.endTime = 'End time must be after start time.';
    }
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  if (mode === 'view') {
    const ev = events.find((e) => e.eventId === booking?.eventId);
    const vn = venues.find((v) => v.venueId === booking?.venueId);
    return (
      <div className="books-overlay">
        <div className="books-modal" style={{ maxWidth: 540 }}>
          <div className="books-modal-head">
            <h3>Booking Details</h3>
            <button className="books-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="books-modal-body">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                {[
                  ['Booking ID',   booking?.bookingId],
                  ['Event',        ev ? `${ev.eventId} — ${ev.eventTitle}` : booking?.eventId],
                  ['Venue',        vn ? `${vn.venueId} — ${vn.name}` : booking?.venueId],
                  ['Booking Date', booking?.bookingDate],
                  ['Start Time',   booking?.startTime],
                  ['End Time',     booking?.endTime],
                  ['Purpose',      booking?.purpose || '—'],
                  ['Requested By', booking?.requestedBy],
                ].map(([label, val]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 600, color: '#6b7280', width: 140 }}>{label}</td>
                    <td style={{ padding: '8px 4px', color: '#111827' }}>{val}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '8px 4px', fontWeight: 600, color: '#6b7280' }}>Status</td>
                  <td style={{ padding: '8px 4px' }}><StatusBadge status={booking?.status} /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="books-modal-foot">
            <button className="books-btn books-btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 560 }}>
        <div className="books-modal-head">
          <h3>Edit Booking</h3>
          <button className="books-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="books-modal-body">

            {/* Booking ID (read-only) */}
            <div className="books-form-group">
              <label className="books-form-label">Booking ID</label>
              <input className="books-form-control" value={form.bookingId} disabled />
            </div>

            {/* Event + Venue */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Event *</label>
                <select
                  className={`books-form-control ${errors.eventId ? 'err' : ''}`}
                  name="eventId" value={form.eventId} onChange={change}>
                  <option value="">Select event...</option>
                  {events.map((e) => (
                    <option key={e.eventId} value={e.eventId}>
                      {e.eventId} — {e.eventTitle}
                    </option>
                  ))}
                </select>
                {errors.eventId && <p className="books-form-err">{errors.eventId}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Venue *</label>
                <select
                  className={`books-form-control ${errors.venueId ? 'err' : ''}`}
                  name="venueId" value={form.venueId} onChange={change}>
                  <option value="">Select venue...</option>
                  {venues.map((v) => (
                    <option key={v.venueId} value={v.venueId}>
                      {v.venueId} — {v.name}
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
                <input
                  className={`books-form-control ${errors.bookingDate ? 'err' : ''}`}
                  type="date" name="bookingDate" value={form.bookingDate} onChange={change} />
                {errors.bookingDate && <p className="books-form-err">{errors.bookingDate}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Status</label>
                <select className="books-form-control" name="status" value={form.status} onChange={change}>
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
                <label className="books-form-label">Start Time *</label>
                <input
                  className={`books-form-control ${errors.startTime ? 'err' : ''}`}
                  type="time" name="startTime" value={form.startTime} onChange={change} />
                {errors.startTime && <p className="books-form-err">{errors.startTime}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">End Time *</label>
                <input
                  className={`books-form-control ${errors.endTime ? 'err' : ''}`}
                  type="time" name="endTime" value={form.endTime} onChange={change} />
                {errors.endTime && <p className="books-form-err">{errors.endTime}</p>}
              </div>
            </div>

            {/* Purpose + Requested By */}
            <div className="books-form-group">
              <label className="books-form-label">Purpose / Description</label>
              <textarea
                className="books-form-control"
                name="purpose" value={form.purpose} onChange={change}
                rows={2} placeholder="Describe the purpose of this booking..."
                style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div className="books-form-group">
              <label className="books-form-label">Requested By *</label>
              <input
                className={`books-form-control ${errors.requestedBy ? 'err' : ''}`}
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VenueBookingPage() {
  // Dropdown data
  const [events,   setEvents]   = useState([]);
  const [venues,   setVenues]   = useState([]);
  const [dropping, setDropping] = useState(true);
  const [dropError, setDropError] = useState('');

  // Booking list
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [pageError, setPageError] = useState('');

  // Form state
  const [form,      setForm]      = useState({ ...EMPTY_FORM, bookingId: generateBookingId() });
  const [formErrs,  setFormErrs]  = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [modal,     setModal]     = useState({ open: false, mode: 'view', booking: null });
  const [saving,    setSaving]    = useState(false);

  // Notifications
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  // ── Load dropdown data + bookings ──
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

  useEffect(() => {
    const init = async () => {
      setDropping(true); setDropError('');
      try {
        const [evRes, vnRes] = await Promise.all([fetchEvents(), fetchVenues()]);
        setEvents(evRes);
        setVenues(vnRes);
      } catch (err) {
        setDropError(err.message || 'Failed to load events or venues.');
      } finally {
        setDropping(false);
      }
    };
    init();
    loadBookings();
  }, [loadBookings]);

  // Auto-clear notifications
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Form handlers ──
  const changeForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFormErrs((er) => ({ ...er, [name]: '' }));
  };

  const validateForm = () => {
    const e = {};
    if (!form.eventId)     e.eventId     = 'Event is required.';
    if (!form.venueId)     e.venueId     = 'Venue is required.';
    if (!form.bookingDate) e.bookingDate = 'Booking date is required.';
    if (!form.startTime)   e.startTime   = 'Start time is required.';
    if (!form.endTime)     e.endTime     = 'End time is required.';
    if (!form.requestedBy.trim()) e.requestedBy = 'Requested by is required.';
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      e.endTime = 'End time must be after start time.';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
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

  // ── Modal handlers ──
  const openView = (b) => setModal({ open: true, mode: 'view',  booking: b });
  const openEdit = (b) => setModal({ open: true, mode: 'edit',  booking: b });
  const closeModal = () => setModal({ open: false, mode: 'view', booking: null });

  const handleModalSave = async (updated) => {
    setSaving(true);
    try {
      await venueBookingService.update(updated.bookingId, updated);
      setSuccess('Booking updated successfully.');
      closeModal();
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

  // ── Lookup helpers ──
  const eventLabel = (eventId) => {
    const ev = events.find((e) => e.eventId === eventId);
    return ev ? `${ev.eventId} — ${ev.eventTitle}` : eventId;
  };
  const venueLabel = (venueId) => {
    const vn = venues.find((v) => v.venueId === venueId);
    return vn ? `${vn.venueId} — ${vn.name}` : venueId;
  };

  // ── Render ──
  return (
    <div className="page-container">

      {/* ── Page header ── */}
      <div className="books-page-header">
        <div>
          <h1 className="page-title">Venue Booking</h1>
          <p className="stu-page-sub">Submit and manage venue booking requests</p>
        </div>
      </div>

      {/* ── Notifications ── */}
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

      {/* ══════════════════════════════════════════════════
          BOOKING REQUEST FORM
      ══════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#111827' }}>
          New Booking Request
        </h2>

        {dropping ? (
          <PageLoader message="Loading events and venues..." />
        ) : dropError ? (
          <PageError message={dropError} onRetry={() => { const init = async () => { setDropping(true); setDropError(''); try { const [e,v] = await Promise.all([fetchEvents(), fetchVenues()]); setEvents(e); setVenues(v); } catch(err) { setDropError(err.message); } finally { setDropping(false); } }; init(); }} />
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Row 1 — Booking ID (auto) */}
            <div className="books-form-group">
              <label className="books-form-label">Booking ID (auto-generated)</label>
              <input
                className="books-form-control"
                value={form.bookingId}
                disabled
                style={{ background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
              />
            </div>

            {/* Row 2 — Event + Venue */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Event *</label>
                <select
                  className={`books-form-control ${formErrs.eventId ? 'err' : ''}`}
                  name="eventId" value={form.eventId} onChange={changeForm}>
                  <option value="">— Select an event —</option>
                  {events.map((e) => (
                    <option key={e.eventId} value={e.eventId}>
                      {e.eventId} — {e.eventTitle}
                    </option>
                  ))}
                </select>
                {formErrs.eventId && <p className="books-form-err">{formErrs.eventId}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Venue *</label>
                <select
                  className={`books-form-control ${formErrs.venueId ? 'err' : ''}`}
                  name="venueId" value={form.venueId} onChange={changeForm}>
                  <option value="">— Select a venue —</option>
                  {venues.map((v) => (
                    <option key={v.venueId} value={v.venueId}>
                      {v.venueId} — {v.name}
                    </option>
                  ))}
                </select>
                {formErrs.venueId && <p className="books-form-err">{formErrs.venueId}</p>}
              </div>
            </div>

            {/* Row 3 — Date + Times */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="books-form-group">
                <label className="books-form-label">Booking Date *</label>
                <input
                  className={`books-form-control ${formErrs.bookingDate ? 'err' : ''}`}
                  type="date" name="bookingDate"
                  value={form.bookingDate} onChange={changeForm}
                  min={new Date().toISOString().split('T')[0]}
                />
                {formErrs.bookingDate && <p className="books-form-err">{formErrs.bookingDate}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Start Time *</label>
                <input
                  className={`books-form-control ${formErrs.startTime ? 'err' : ''}`}
                  type="time" name="startTime"
                  value={form.startTime} onChange={changeForm} />
                {formErrs.startTime && <p className="books-form-err">{formErrs.startTime}</p>}
              </div>
              <div className="books-form-group">
                <label className="books-form-label">End Time *</label>
                <input
                  className={`books-form-control ${formErrs.endTime ? 'err' : ''}`}
                  type="time" name="endTime"
                  value={form.endTime} onChange={changeForm} />
                {formErrs.endTime && <p className="books-form-err">{formErrs.endTime}</p>}
              </div>
            </div>

            {/* Row 4 — Purpose + Requested By */}
            <div className="club-form-row">
              <div className="books-form-group">
                <label className="books-form-label">Purpose / Description</label>
                <textarea
                  className="books-form-control"
                  name="purpose" value={form.purpose} onChange={changeForm}
                  rows={2} placeholder="Describe the purpose of this booking..."
                  style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div className="books-form-group">
                <label className="books-form-label">Requested By *</label>
                <input
                  className={`books-form-control ${formErrs.requestedBy ? 'err' : ''}`}
                  name="requestedBy" value={form.requestedBy} onChange={changeForm}
                  placeholder="e.g. Prof. Sharma" />
                {formErrs.requestedBy && <p className="books-form-err">{formErrs.requestedBy}</p>}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className="books-btn books-btn-primary"
                disabled={submitting || dropping}
                style={{ minWidth: 180 }}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>

          </form>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          BOOKING LIST TABLE
      ══════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            All Booking Requests
          </h2>
          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
            Total: {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <PageLoader message="Loading bookings..." />
        ) : pageError ? (
          <PageError message={pageError} onRetry={() => loadBookings()} />
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#9ca3af' }}>
            <p style={{ fontSize: '0.95rem' }}>No booking requests yet.</p>
          </div>
        ) : (
          <div className="books-table-wrap">
            <table className="books-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Booking ID</th>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Purpose</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, idx) => (
                  <tr key={b.bookingId}>
                    <td style={{ color: '#9ca3af' }}>{idx + 1}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                        {b.bookingId}
                      </span>
                    </td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {eventLabel(b.eventId)}
                    </td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {venueLabel(b.venueId)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{b.bookingDate}</td>
                    <td>{b.startTime}</td>
                    <td>{b.endTime}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.purpose || '—'}
                    </td>
                    <td>{b.requestedBy}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div className="books-actions">
                        <button
                          className="books-btn books-btn-sm books-btn-ghost"
                          onClick={() => openView(b)}
                          title="View"
                        >
                          View
                        </button>
                        <button
                          className="books-btn books-btn-sm books-btn-ghost"
                          onClick={() => openEdit(b)}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          className="books-btn books-btn-sm books-btn-danger"
                          onClick={() => handleDelete(b)}
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <BookingModal
        isOpen={modal.open}
        mode={modal.mode}
        booking={modal.booking}
        events={events}
        venues={venues}
        onSave={handleModalSave}
        onClose={closeModal}
        saving={saving}
      />

    </div>
  );
}
