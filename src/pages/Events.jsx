/**
 * Events.jsx
 *
 * Event Booking listing page.
 *
 * Defects fixed: 1 (buttons right-aligned on mobile), 2 (Add Event not full-width)
 * Improvement 3:  Add New Event, Edit Event, and View Event Details all open as
 *                 dialogs/modals instead of navigating to separate pages.
 *                 Existing routes (/events/add, /events/edit/:id, /events/view/:id)
 *                 still work for direct navigation — those pages are unchanged.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Plus,
  Download,
  Search,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Printer,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Trash2,
  X,
  MapPin,
  User,
  Clock,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import { exportEvents } from '../utils/exportUtils';
import { getEventImage } from '../utils/eventImageUtils';
import EventForm from './EventForm';

const _IS_PROD_EV = window.location.hostname !== 'localhost';
const API_BASE_URL  = _IS_PROD_EV ? 'https://university-erp-spring.onrender.com/api' : 'http://localhost:9090/api';
const NODE_API_URL  = _IS_PROD_EV ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

// ─── View Event Details dialog (inline, reusing existing modal CSS) ───────────
const EventDetailsDialog = ({ eventId, onClose, onEdit, onDeleted }) => {
  const [event,   setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [club,    setClub]    = useState(null);
  const [venue,   setVenue]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [feedback,   setFeedback]   = useState({ type: '', message: '' });

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/events/${eventId}`);
        if (!res.ok) throw new Error('Event not found');
        const data = await res.json();
        setEvent(data);
        if (data.organizerId) fetchClub(data.organizerId);
        if (data.venueId)     fetchVenue(data.venueId);
      } catch (err) {
        setFeedback({ type: 'error', message: err.message || 'Failed to load event details' });
      } finally { setLoading(false); }
    })();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClub = async (clubId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clubs`);
      if (res.ok) {
        const clubs = await res.json();
        const found = clubs.find(c => c.clubId === clubId);
        if (found) setClub(found);
      }
    } catch { /* non-critical */ }
  };

  const fetchVenue = async (venueId) => {
    try {
      const res = await fetch(`${NODE_API_URL}/venues`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        const venues = Array.isArray(data) ? data : (data.venues || []);
        const found = venues.find(v =>
          v.venueId?.toUpperCase() === venueId.toUpperCase() ||
          v._id === venueId ||
          v.name?.toLowerCase() === venueId.toLowerCase()
        );
        if (found) setVenue(found);
      }
    } catch { /* non-critical */ }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Delete failed'); }
      if (onDeleted) onDeleted();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  const fmt = (d) => {
    if (!d) return 'Not specified';
    try {
      return new Date(d).toLocaleString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return d; }
  };

  const statusCls = (s) =>
    s?.toUpperCase() === 'ACTIVE' ? 'status-pill status-pill-upcoming' : 'status-pill status-pill-completed';

  return (
    <div className="modal-overlay eb-view-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content eb-view-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Event Details</h2>
          <button type="button" className="close-modal-btn" onClick={onClose} title="Close"><X size={18} /></button>
        </div>

        {feedback.message && (
          <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
            style={{ marginBottom: '1rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading event details…</p>
          </div>
        ) : event ? (
          <>
            {/* Title row */}
            <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span className="event-type-badge"><Tag size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{event.eventType || 'Event'}</span>
                <span className={statusCls(event.status)}>{event.status || 'ACTIVE'}</span>
                <span className="event-id-code" style={{ marginLeft: 'auto' }}>{event.eventId}</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {event.eventTitle || event.title || 'Untitled Event'}
              </h3>
            </div>

            {/* Key info grid */}
            <div className="eb-details-grid">
              <div className="eb-detail-row">
                <div className="eb-detail-label"><Clock size={14} /> Start</div>
                <div className="eb-detail-value">{fmt(event.startDate)}</div>
              </div>
              <div className="eb-detail-row">
                <div className="eb-detail-label"><Clock size={14} /> End</div>
                <div className="eb-detail-value">{fmt(event.endDate)}</div>
              </div>
              <div className="eb-detail-row">
                <div className="eb-detail-label"><MapPin size={14} /> Venue</div>
                <div className="eb-detail-value">
                  {venue ? <><strong>{venue.name}</strong><br /><span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{venue.venueId}{venue.capacity && ` • Cap. ${venue.capacity}`}</span></> : (event.venueId || 'Not assigned')}
                </div>
              </div>
              <div className="eb-detail-row">
                <div className="eb-detail-label"><User size={14} /> Organizer</div>
                <div className="eb-detail-value">
                  {club ? <><strong>{club.clubName}</strong><br /><span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{club.clubId}{club.clubCategory && ` • ${club.clubCategory}`}</span></> : (event.organizerId || 'Not assigned')}
                </div>
              </div>
            </div>

            {event.description && (
              <div style={{ margin: '1rem 0', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {event.description}
              </div>
            )}

            {/* Actions */}
            {confirmDel ? (
              <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginTop: '1rem' }}>
                <p style={{ margin: '0 0 0.75rem', color: '#991b1b', fontWeight: 500 }}>Delete "{event.eventTitle}"? This cannot be undone.</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="books-btn books-btn-ghost" onClick={() => setConfirmDel(false)} disabled={deleting}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                    {deleting ? <><Loader2 size={14} className="spin-animate" /><span>Deleting…</span></> : <><Trash2 size={14} /><span><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Delete</span></span></>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-footer">
                <button type="button" className="books-btn books-btn-ghost" onClick={onClose}>
                  <ArrowLeft size={14} /><span>Back</span>
                </button>
                <button type="button" className="books-btn books-btn-secondary" onClick={() => onEdit(event.eventId)}>
                  <Edit size={14} /><span>Edit</span>
                </button>
                <button type="button" className="btn btn-danger" onClick={() => setConfirmDel(true)}>
                  <Trash2 size={14} /><span><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Delete</span></span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={32} style={{ color: '#ef4444', margin: '0 auto 0.75rem' }} />
            <p>Event not found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Events page ─────────────────────────────────────────────────────────

const Events = () => {
  const [events,         setEvents]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [deleting,       setDeleting]       = useState(false);
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('ALL');
  const [feedback,       setFeedback]       = useState({ type: '', message: '' });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const downloadMenuRef = useRef(null);

  // Improvement 3: dialog state
  const [activeDialog, setActiveDialog] = useState(null);
  // activeDialog: null | { mode: 'add' } | { mode: 'edit', id: string } | { mode: 'view', id: string }

  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    const h = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target))
        setShowDownloadMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('erp_token')}` },
      });
      if (!res.ok) throw new Error('Failed to load events');
      setEvents(await res.json());
      setFeedback({ type: '', message: '' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load events from server' });
      setEvents([]);
    } finally { setLoading(false); }
  };

  const handleDelete = async (eventId, eventTitle) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('erp_token')}` },
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed to delete event'); }
      const d = await res.json();
      setFeedback({ type: 'success', message: d.message || `Event '${eventTitle}' deleted successfully.` });
      fetchEvents();
      setDeleteConfirm(null);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete event' });
    } finally { setDeleting(false); }
  };

  const handleDownload = (fmt) => { setShowDownloadMenu(false); exportEvents(filteredEvents, fmt); };

  const filteredEvents = events.filter(e => {
    const q = search.toLowerCase().trim();
    const title = (e.eventTitle || e.title || '').toLowerCase();
    const matchSearch = !q || title.includes(q) ||
      (e.eventId||'').toLowerCase().includes(q) ||
      (e.eventType||'').toLowerCase().includes(q) ||
      (e.organizerId||'').toLowerCase().includes(q) ||
      (e.venueId||'').toLowerCase().includes(q) ||
      (e.description||'').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || (e.status||'ACTIVE').toUpperCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages  = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const currentEvts = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  const getStatusPillClass = (s) =>
    s?.toUpperCase() === 'INACTIVE' ? 'status-pill status-pill-completed' : 'status-pill status-pill-upcoming';

  const formatDateRange = (start, end) => {
    if (!start && !end) return 'Dates TBA';
    try {
      const s = start ? new Date(start) : null;
      const e = end   ? new Date(end)   : null;
      const o = { month: 'short', day: 'numeric', year: 'numeric' };
      if (s && e) {
        if (s.toDateString() === e.toDateString()) return s.toLocaleDateString(undefined, o);
        return `${s.toLocaleDateString(undefined, { month:'short', day:'numeric' })} – ${e.toLocaleDateString(undefined, o)}`;
      }
      return (s||e).toLocaleDateString(undefined, o);
    } catch { return `${start||''} – ${end||''}`; }
  };

  return (
    <div className="page-container events-page">
      {/* ── Top header ────────────────────────────────────────────── */}
      {/*
        D1: buttons right-aligned on mobile.
        D2: Add Event not full-width on mobile.
        Scoped under .events-page so no other module is affected.
      */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Event Bookings</h1>
          <p className="page-subtitle">Manage campus events, hall reservations, and schedule bookings</p>
        </div>

        {/* D1/D2: wrapped in events-header-actions so CSS can keep them right-aligned */}
        <div className="header-actions-group events-header-actions">
          {/* Export Dropdown */}
          <div className="download-dropdown-wrapper" ref={downloadMenuRef}>
            <button type="button" className="btn btn-secondary download-trigger-btn"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)} title="Download event data">
              <Download size={16} /><span>Download</span><ChevronDown size={14} />
            </button>
            {showDownloadMenu && (
              <div className="download-dropdown-menu">
                <div className="dropdown-menu-header">Select Export Format</div>
                <button type="button" className="dropdown-menu-item" onClick={() => handleDownload('csv')}>
                  <FileSpreadsheet size={15} /><span>CSV Spreadsheet (.csv)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => handleDownload('txt')}>
                  <FileText size={15} /><span>Text Document (.txt)</span>
                </button>
                <button type="button" className="dropdown-menu-item" onClick={() => handleDownload('pdf')}>
                  <Printer size={15} /><span>Printable PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          {/* Improvement 3: opens Add dialog instead of navigating */}
          <button type="button" className="books-btn books-btn-primary"
            onClick={() => setActiveDialog({ mode: 'add' })}>
            <Plus size={16} /><span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ margin: '1rem 0' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="card" style={{ marginTop: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-box-wrapper" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={16} className="search-icon" />
            <input type="text" className="search-input"
              placeholder="Search by Title, Event ID, Type, Organizer, Venue…"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
            {search && <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>Clear</button>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
              <select value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="filter-select">
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="table-stats-badge">
              Total: <strong>{filteredEvents.length}</strong> {filteredEvents.length === 1 ? 'Event' : 'Events'}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="spin-animate" style={{ margin: '0 auto 0.75rem' }} />
          <p>Loading event bookings…</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card table-empty-state" style={{ marginTop: '1.25rem' }}>
          <Calendar size={40} className="empty-icon" />
          <h3>No events found</h3>
          <p>{search || statusFilter !== 'ALL'
            ? 'No event records matched your filter criteria.'
            : 'Get started by creating your first university event booking.'}</p>
          {!search && statusFilter === 'ALL' && (
            <button type="button" className="books-btn books-btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => setActiveDialog({ mode: 'add' })}>
              <Plus size={16} /><span>Add Event</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="events-cards-grid">
            {currentEvts.map((event) => {
              const displayImg  = getEventImage(event.eventType, event.imageUrl);
              const eventTitle  = event.eventTitle || event.title || 'Untitled Event';
              return (
                <div key={event.id || event.eventId} className="event-card"
                  onClick={() => setActiveDialog({ mode: 'view', id: event.eventId })}
                  style={{ cursor: 'pointer' }}>

                  <div className="event-card-image-box">
                    <img src={displayImg} alt={eventTitle} className="event-card-img"
                      onError={e => { e.target.src = getEventImage(event.eventType); }} />
                    <div className="event-image-overlay-top">
                      <span className="event-type-badge">
                        <Tag size={11} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }} />
                        {event.eventType || 'Event'}
                      </span>
                      <span className={getStatusPillClass(event.status)}>{event.status || 'ACTIVE'}</span>
                    </div>
                  </div>

                  <div className="event-card-body">
                    <div>
                      <div className="event-card-header">
                        <span className="event-id-code">{event.eventId}</span>
                      </div>
                      <h3 className="event-card-title" title={eventTitle}>{eventTitle}</h3>
                      <div className="event-meta-list">
                        <div className="event-meta-row"><Clock size={14} />
                          <span className="event-meta-text">{formatDateRange(event.startDate, event.endDate)}</span>
                        </div>
                        <div className="event-meta-row"><MapPin size={14} />
                          <span className="event-meta-text">{event.venueId || 'Venue Unassigned'}</span>
                        </div>
                        <div className="event-meta-row"><User size={14} />
                          <span className="event-meta-text">{event.organizerId || 'Organizer Not Assigned'}</span>
                        </div>
                      </div>
                      {event.description && (
                        <p className="event-desc-snippet" title={event.description}>{event.description}</p>
                      )}
                    </div>

                    <div className="event-card-footer">
                      {/* View — Improvement 3: opens dialog */}
                      <button type="button" className="action-btn view-btn" title="View Details"
                        onClick={e => { e.stopPropagation(); setActiveDialog({ mode: 'view', id: event.eventId }); }}>
                        <Eye size={14} /><span className="action-label">View</span>
                      </button>
                      {/* Edit — Improvement 3: opens dialog */}
                      <button type="button" className="action-btn edit-btn" title="Edit Event"
                        onClick={e => { e.stopPropagation(); setActiveDialog({ mode: 'edit', id: event.eventId }); }}>
                        <Edit size={14} /><span className="action-label">Edit</span>
                      </button>
                      <button type="button" className="action-btn delete-btn" title="Delete Event"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteConfirm({ id: event.eventId, eventId: event.eventId, title: eventTitle, venueId: event.venueId, eventType: event.eventType });
                        }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls" style={{ marginTop: '2rem' }}>
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEvents.length)} of {filteredEvents.length} events
              </div>
              <div className="pagination-buttons">
                <button type="button" className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (p===1||p===totalPages||(p>=currentPage-1&&p<=currentPage+1))
                    return <button key={p} type="button" className={`pagination-btn${p===currentPage?' active':''}`}
                      onClick={() => setCurrentPage(p)}>{p}</button>;
                  if (p===currentPage-2||p===currentPage+2)
                    return <span key={p} className="pagination-dots">…</span>;
                  return null;
                })}
                <button type="button" className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="items-per-page">
                <span>Cards per page:</span>
                <select value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="items-per-page-select">
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Delete confirmation modal ───────────────────────────── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={e => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon"><AlertTriangle size={22} /></div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Event Booking</h3>
                <p className="delete-dialog-desc">This will permanently remove the event booking.</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => !deleting && setDeleteConfirm(null)} disabled={deleting}>
                <X size={18} />
              </button>
            </div>
            <div className="delete-item-preview">
              <div>
                <div className="delete-item-name">{deleteConfirm.title}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:'0.2rem' }}>
                  {deleteConfirm.eventType || 'Event'} &bull; Venue: {deleteConfirm.venueId || 'TBA'}
                </div>
              </div>
              {deleteConfirm.eventId && <span className="delete-item-code">{deleteConfirm.eventId}</span>}
            </div>
            <div className="delete-warning-note"><AlertCircle size={14} /><span>This action cannot be undone.</span></div>
            <div className="modal-actions">
              <button type="button" className="books-btn books-btn-ghost" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.title)} disabled={deleting}>
                {deleting ? <><Loader2 size={16} className="spin-animate" /><span>Deleting…</span></> : <><Trash2 size={16} /><span>Delete Event</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Improvement 3: Add / Edit dialogs ────────────────────── */}
      {activeDialog?.mode === 'add' && (
        <EventForm
          isDialog
          onClose={() => setActiveDialog(null)}
          onSaved={() => { fetchEvents(); setFeedback({ type: 'success', message: 'Event created successfully!' }); }}
        />
      )}
      {activeDialog?.mode === 'edit' && (
        <EventForm
          isDialog
          dialogId={activeDialog.id}
          onClose={() => setActiveDialog(null)}
          onSaved={() => { fetchEvents(); setFeedback({ type: 'success', message: 'Event updated successfully!' }); }}
        />
      )}

      {/* ── Improvement 3: View Details dialog ───────────────────── */}
      {activeDialog?.mode === 'view' && (
        <EventDetailsDialog
          eventId={activeDialog.id}
          onClose={() => setActiveDialog(null)}
          onEdit={(id) => setActiveDialog({ mode: 'edit', id })}
          onDeleted={() => {
            setActiveDialog(null);
            fetchEvents();
            setFeedback({ type: 'success', message: 'Event deleted successfully.' });
          }}
        />
      )}
    </div>
  );
};

export default Events;
