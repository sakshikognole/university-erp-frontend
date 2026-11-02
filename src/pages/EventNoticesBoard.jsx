import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  User,
  Clock,
  Tag,
  Users,
  Mail,
  Phone,
  UserCheck,
} from 'lucide-react';

import { getEventImage } from '../utils/eventImageUtils';

const API_BASE_URL = 'http://localhost:5000/api';

const EventNoticesBoard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PUBLISHED');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  useEffect(() => { fetchEvents(); }, [currentPage, itemsPerPage, statusFilter, categoryFilter]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: itemsPerPage, sortBy: 'eventDate', order: 'desc' });
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      const res = await fetch(`${API_BASE_URL}/events?${params}`, { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to load event notices');
      const data = await res.json();
      setEvents(data.eventNotices || []);
      setTotalEvents(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setFeedback({ type: '', message: '' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to load event notices from server' });
      setEvents([]);
    } finally { setLoading(false); }
  };

  const filteredEvents = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase().trim();
    return e.title?.toLowerCase().includes(q) || e.eventId?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) || e.venue?.name?.toLowerCase().includes(q) ||
      e.organizer?.name?.toLowerCase().includes(q);
  });

  const openModal = (event) => { setSelectedEvent(event); setModalOpen(true); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { setModalOpen(false); setSelectedEvent(null); document.body.style.overflow = ''; };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) { setCurrentPage(newPage); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const getStatusPillClass = (s) => {
    switch (s?.toUpperCase()) {
      case 'PUBLISHED': return 'status-pill status-pill-upcoming';
      case 'COMPLETED': case 'DRAFT': return 'status-pill status-pill-completed';
      default: return 'status-pill';
    }
  };

  const getStatusBadgeClass = (s) => {
    switch (s?.toUpperCase()) {
      case 'PUBLISHED': return 'badge badge-success';
      case 'DRAFT':     return 'badge badge-warning';
      case 'CANCELLED': return 'badge badge-danger';
      case 'COMPLETED': return 'badge badge-info';
      default:          return 'badge';
    }
  };

  const getCatClass = (c) => ({
    ACADEMIC:'badge badge-primary',SPORTS:'badge badge-success',CULTURAL:'badge badge-purple',
    WORKSHOP:'badge badge-info',SEMINAR:'badge badge-warning',CONFERENCE:'badge badge-dark',
    SOCIAL:'badge badge-pink',OTHER:'badge'
  }[c?.toUpperCase()] || 'badge');

  const fmtShort = (d) => { try { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); } catch { return 'TBA'; } };
  const fmtLong  = (d) => { try { return new Date(d).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); } catch { return 'TBA'; } };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Event Notices</h1>
          <p className="page-subtitle">Browse campus event announcements with images and details</p>
        </div>
      </div>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type==='success'?'feedback-success':'feedback-error'}`} style={{margin:'1rem 0'}}>
          <AlertCircle size={18}/><span>{feedback.message}</span>
        </div>
      )}

      <div className="card" style={{marginTop:'1.25rem',padding:'1rem 1.25rem'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
          <div className="search-box-wrapper" style={{flex:1,minWidth:'260px'}}>
            <Search size={16} className="search-icon"/>
            <input type="text" className="search-input" placeholder="Search by title, event ID, description, venue, organizer..."
              value={search} onChange={(e)=>setSearch(e.target.value)}/>
            {search && <button type="button" className="search-clear-btn" onClick={()=>setSearch('')}>Clear</button>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <span style={{fontSize:'0.8125rem',fontWeight:600,color:'var(--text-secondary)'}}>Category:</span>
              <select value={categoryFilter} onChange={(e)=>{setCategoryFilter(e.target.value);setCurrentPage(1);}} className="filter-select">
                <option value="ALL">All Categories</option>
                <option value="ACADEMIC">Academic</option><option value="SPORTS">Sports</option>
                <option value="CULTURAL">Cultural</option><option value="WORKSHOP">Workshop</option>
                <option value="SEMINAR">Seminar</option><option value="CONFERENCE">Conference</option>
                <option value="SOCIAL">Social</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <span style={{fontSize:'0.8125rem',fontWeight:600,color:'var(--text-secondary)'}}>Status:</span>
              <select value={statusFilter} onChange={(e)=>{setStatusFilter(e.target.value);setCurrentPage(1);}} className="filter-select">
                <option value="ALL">All Statuses</option><option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="table-stats-badge">Total: <strong>{totalEvents}</strong> {totalEvents===1?'Event':'Events'}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{padding:'4rem',textAlign:'center',color:'var(--text-secondary)'}}>
          <Loader2 size={32} className="spin-animate" style={{margin:'0 auto 0.75rem auto'}}/><p>Loading event notices...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card table-empty-state" style={{marginTop:'1.25rem'}}>
          <Calendar size={40} className="empty-icon"/><h3>No event notices found</h3>
          <p>{search||statusFilter!=='ALL'||categoryFilter!=='ALL'?'No event notices matched your filter criteria.':'There are no event notices to display right now.'}</p>
        </div>
      ) : (
        <>
          <div className="events-cards-grid">
            {filteredEvents.map((event) => {
              const img = getEventImage(event.category||event.eventType, event.imageUrl);
              return (
                <div key={event._id} className="event-card" onClick={()=>openModal(event)} style={{cursor:'pointer'}}>
                  <div className="event-card-image-box">
                    <img src={img} alt={event.title} className="event-card-img" onError={(e)=>{e.target.src=getEventImage(event.category||event.eventType);}}/>
                    <div className="event-image-overlay-top">
                      <span className="event-type-badge"><Tag size={11} style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}/>{event.category||'Event'}</span>
                      <span className={getStatusPillClass(event.status)}>{event.status||'PUBLISHED'}</span>
                    </div>
                  </div>
                  <div className="event-card-body">
                    <div>
                      <div className="event-card-header"><span className="event-id-code">{event.eventId}</span></div>
                      <h3 className="event-card-title" title={event.title}>{event.title}</h3>
                      <div className="event-meta-list">
                        <div className="event-meta-row"><Clock size={14}/><span className="event-meta-text">{fmtShort(event.eventDate)} at {event.eventTime}</span></div>
                        <div className="event-meta-row"><MapPin size={14}/><span className="event-meta-text">{event.venue?.name||'Venue TBA'}</span></div>
                        <div className="event-meta-row"><User size={14}/><span className="event-meta-text">{event.organizer?.name||'Organizer TBA'}</span></div>
                        <div className="event-meta-row"><Users size={14}/><span className="event-meta-text">{event.targetAudience?.join(', ')||'All'}</span></div>
                      </div>
                      {event.description && <p className="event-desc-snippet" title={event.description}>{event.description}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls" style={{marginTop:'2rem'}}>
              <div className="pagination-info">Page {currentPage} of {totalPages} ({totalEvents} total)</div>
              <div className="pagination-buttons">
                <button type="button" className="pagination-btn" onClick={()=>handlePageChange(currentPage-1)} disabled={currentPage===1}><ChevronLeft size={16}/></button>
                {[...Array(totalPages)].map((_,i)=>{
                  const p=i+1;
                  if(p===1||p===totalPages||(p>=currentPage-1&&p<=currentPage+1))
                    return <button key={p} type="button" className={`pagination-btn ${p===currentPage?'active':''}`} onClick={()=>handlePageChange(p)}>{p}</button>;
                  if(p===currentPage-2||p===currentPage+2) return <span key={p} className="pagination-dots">...</span>;
                  return null;
                })}
                <button type="button" className="pagination-btn" onClick={()=>handlePageChange(currentPage+1)} disabled={currentPage===totalPages}><ChevronRight size={16}/></button>
              </div>
              <div className="items-per-page">
                <span>Cards per page:</span>
                <select value={itemsPerPage} onChange={(e)=>{ setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="items-per-page-select">
                  <option value={6}>6</option><option value={9}>9</option><option value={12}>12</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── View-Only Detail Modal ── */}
      {modalOpen && selectedEvent && (
        <div className="enb-modal-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="enb-modal-card" onClick={(e)=>e.stopPropagation()}>
            <div className="enb-modal-header">
              <div>
                <h2 className="enb-modal-title">Event Details</h2>
                <p className="enb-modal-subtitle">View-only information</p>
              </div>
              <button type="button" className="enb-modal-close" onClick={closeModal} title="Close"><X size={20}/></button>
            </div>

            <div className="enb-modal-body">
              <img
                src={getEventImage(selectedEvent.category||selectedEvent.eventType, selectedEvent.imageUrl)}
                alt={selectedEvent.title} className="enb-modal-image"
                onError={(e)=>{e.target.src=getEventImage(selectedEvent.category||selectedEvent.eventType);}}
              />

              <div className="enb-modal-badges">
                <span className="event-id-badge" style={{fontSize:'0.875rem',padding:'0.375rem 0.75rem'}}>{selectedEvent.eventId}</span>
                <span className={getStatusBadgeClass(selectedEvent.status)}>{selectedEvent.status}</span>
                <span className={getCatClass(selectedEvent.category)}>{selectedEvent.category}</span>
              </div>

              <h3 className="enb-modal-event-title">{selectedEvent.title}</h3>
              {selectedEvent.description && <p className="enb-modal-desc">{selectedEvent.description}</p>}

              <div className="enb-detail-grid">
                <div className="detail-card">
                  <div className="detail-icon-box" style={{backgroundColor:'#dbeafe'}}><Calendar size={20} style={{color:'#2563eb'}}/></div>
                  <div>
                    <div className="detail-label">Date &amp; Time</div>
                    <div className="detail-value">{fmtLong(selectedEvent.eventDate)}</div>
                    <div className="detail-subtext"><Clock size={13} style={{display:'inline',marginRight:4}}/>{selectedEvent.eventTime}{selectedEvent.duration&&` • ${selectedEvent.duration}`}</div>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon-box" style={{backgroundColor:'#dcfce7'}}><MapPin size={20} style={{color:'#16a34a'}}/></div>
                  <div>
                    <div className="detail-label">Venue</div>
                    <div className="detail-value">{selectedEvent.venue?.name||'TBA'}</div>
                    {selectedEvent.venue?.capacity && <div className="detail-subtext">Capacity: {selectedEvent.venue.capacity}</div>}
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon-box" style={{backgroundColor:'#fef3c7'}}><User size={20} style={{color:'#d97706'}}/></div>
                  <div>
                    <div className="detail-label">Organizer</div>
                    <div className="detail-value">{selectedEvent.organizer?.name||'TBA'}</div>
                    {selectedEvent.organizer?.email && <div className="detail-subtext"><Mail size={13} style={{display:'inline',marginRight:4}}/>{selectedEvent.organizer.email}</div>}
                    {selectedEvent.organizer?.contact && <div className="detail-subtext"><Phone size={13} style={{display:'inline',marginRight:4}}/>{selectedEvent.organizer.contact}</div>}
                  </div>
                </div>
                {selectedEvent.targetAudience?.length > 0 && (
                  <div className="detail-card">
                    <div className="detail-icon-box" style={{backgroundColor:'#ede9fe'}}><Users size={20} style={{color:'#7c3aed'}}/></div>
                    <div>
                      <div className="detail-label">Target Audience</div>
                      <div className="detail-value">{selectedEvent.targetAudience.join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>

              {(selectedEvent.registrationRequired || selectedEvent.tags?.length > 0) && (
                <div className="enb-extra-section">
                  {selectedEvent.registrationRequired && (
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.4rem'}}>
                        <UserCheck size={15} style={{color:'var(--text-secondary)'}}/><span style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text-secondary)'}}>Registration</span>
                      </div>
                      <div style={{fontSize:'0.875rem',color:'var(--text-primary)'}}>Required
                        {selectedEvent.registrationDeadline && <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginTop:2}}>Deadline: {fmtLong(selectedEvent.registrationDeadline)}</div>}
                        {selectedEvent.maxParticipants && <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginTop:2}}>Max Participants: {selectedEvent.maxParticipants}</div>}
                      </div>
                    </div>
                  )}
                  {selectedEvent.tags?.length > 0 && (
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.4rem'}}>
                        <Tag size={15} style={{color:'var(--text-secondary)'}}/><span style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text-secondary)'}}>Tags</span>
                      </div>
                      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                        {selectedEvent.tags.map((tag,idx)=><span key={idx} className="badge" style={{fontSize:'0.8125rem'}}>{tag}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedEvent.publishedAt && (
                <div className="enb-published-note">
                  Published on {fmtLong(selectedEvent.publishedAt)}{selectedEvent.publishedBy?.name && ` by ${selectedEvent.publishedBy.name}`}
                </div>
              )}
            </div>

            <div className="enb-modal-footer">
              <button type="button" className="books-btn books-btn-ghost" onClick={closeModal}>
                <X size={16}/><span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventNoticesBoard;
