import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, BookOpen, Users,
  UserCheck, UserX, ChevronDown, ChevronUp, Loader2,
  AlertCircle, Search, X, FileText,
} from 'lucide-react';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD
  ? 'https://university-erp-node.onrender.com/api'
  : 'http://localhost:5000/api';

const AttendanceHistory = () => {
  const navigate = useNavigate();

  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');
  const [expanded, setExpanded] = useState(null); // _id of open record

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search,         setSearch]         = useState('');
  const [filterDate,     setFilterDate]     = useState('');
  const [filterSubject,  setFilterSubject]  = useState('');
  const [filterVenue,    setFilterVenue]    = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/attendance`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to load attendance records');
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Could not load attendance records.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Unique filter options derived from records ────────────────────────────
  const uniqueDates    = useMemo(() => [...new Set(records.map(r => r.date))].sort((a, b) => b.localeCompare(a)), [records]);
  const uniqueSubjects = useMemo(() => [...new Set(records.map(r => r.subjectName))].sort(), [records]);
  const uniqueVenues   = useMemo(() => [...new Set(records.map(r => r.venue))].sort(), [records]);

  // ── Filtered records ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter(r => {
      if (filterDate    && r.date        !== filterDate)    return false;
      if (filterSubject && r.subjectName !== filterSubject) return false;
      if (filterVenue   && r.venue       !== filterVenue)   return false;
      if (q) {
        return (
          r.date?.toLowerCase().includes(q)        ||
          r.subjectName?.toLowerCase().includes(q) ||
          r.venue?.toLowerCase().includes(q)       ||
          r.time?.toLowerCase().includes(q)        ||
          r.submittedBy?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, search, filterDate, filterSubject, filterVenue]);

  const clearFilters = () => {
    setSearch(''); setFilterDate(''); setFilterSubject(''); setFilterVenue('');
  };
  const hasFilters = search || filterDate || filterSubject || filterVenue;

  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return d; }
  };

  return (
    <div className="page-container">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/attendance')}
            title="Back to Attendance"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Attendance Records</h1>
            <p className="page-subtitle">All submitted attendance sessions</p>
          </div>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="card att-hist-filters">
        {/* Search */}
        <div className="search-box-wrapper" style={{ flex: '1 1 200px', minWidth: 0 }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search subject, venue, date, time…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>Clear</button>
          )}
        </div>

        {/* Date filter */}
        <select
          className="att-hist-select"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        >
          <option value="">All Dates</option>
          {uniqueDates.map(d => (
            <option key={d} value={d}>{fmtDate(d)}</option>
          ))}
        </select>

        {/* Subject filter */}
        <select
          className="att-hist-select"
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
        >
          <option value="">All Subjects</option>
          {uniqueSubjects.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Venue filter */}
        <select
          className="att-hist-select"
          value={filterVenue}
          onChange={e => setFilterVenue(e.target.value)}
        >
          <option value="">All Venues</option>
          {uniqueVenues.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {/* Clear all filters */}
        {hasFilters && (
          <button type="button" className="att-hist-clear-btn" onClick={clearFilters}>
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={30} className="spin-animate" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <p>Loading attendance records…</p>
        </div>
      ) : error ? (
        <div className="card" style={{ marginTop: '1.25rem', padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <AlertCircle size={28} style={{ margin: '0 auto 0.75rem', display: 'block', color: '#ef4444' }} />
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ marginTop: '1.25rem', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FileText size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.35 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No records found</h3>
          <p style={{ fontSize: '0.875rem' }}>
            {hasFilters ? 'Try adjusting or clearing the filters.' : 'No attendance has been submitted yet.'}
          </p>
          {hasFilters && (
            <button type="button" className="books-btn books-btn-ghost" style={{ marginTop: '1rem' }} onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="att-hist-list">
          {filtered.map((record) => {
            const present = record.students.filter(s => s.present).length;
            const absent  = record.students.length - present;
            const pct     = record.students.length
              ? Math.round((present / record.students.length) * 100)
              : 0;
            const isOpen  = expanded === record._id;

            return (
              <div key={record._id} className={`att-hist-card${isOpen ? ' att-hist-card--open' : ''}`}>

                {/* ── Card header (always visible) ── */}
                <button
                  type="button"
                  className="att-hist-card-header"
                  onClick={() => setExpanded(isOpen ? null : record._id)}
                  aria-expanded={isOpen}
                >
                  {/* Left: meta */}
                  <div className="att-hist-meta">
                    <div className="att-hist-meta-row">
                      <BookOpen size={13} className="att-hist-icon" />
                      <span className="att-hist-subject">{record.subjectName}</span>
                    </div>
                    <div className="att-hist-meta-row att-hist-meta-secondary">
                      <Calendar size={12} className="att-hist-icon" />
                      <span>{fmtDate(record.date)}</span>
                      <span className="att-hist-dot">·</span>
                      <Clock size={12} className="att-hist-icon" />
                      <span>{record.time}</span>
                      <span className="att-hist-dot">·</span>
                      <MapPin size={12} className="att-hist-icon" />
                      <span>{record.venue}</span>
                    </div>
                  </div>

                  {/* Right: counts + chevron */}
                  <div className="att-hist-counts">
                    <div className="att-hist-count-group">
                      <span className="att-hist-pct">{pct}%</span>
                      <span className="att-hist-pct-lbl">present</span>
                    </div>
                    <div className="att-hist-badges">
                      <span className="att-hist-badge att-hist-badge--present">
                        <UserCheck size={12} /> {present}
                      </span>
                      <span className="att-hist-badge att-hist-badge--absent">
                        <UserX size={12} /> {absent}
                      </span>
                      <span className="att-hist-badge att-hist-badge--total">
                        <Users size={12} /> {record.students.length}
                      </span>
                    </div>
                    {isOpen
                      ? <ChevronUp size={16} className="att-hist-chevron" />
                      : <ChevronDown size={16} className="att-hist-chevron" />}
                  </div>
                </button>

                {/* ── Progress bar ── */}
                <div className="att-hist-progress-bar">
                  <div
                    className="att-hist-progress-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* ── Expanded detail ── */}
                {isOpen && (
                  <div className="att-hist-detail">
                    {/* Detail tiles row */}
                    <div className="att-hist-detail-tiles">
                      <div className="att-hist-detail-tile">
                        <span className="att-hist-detail-label">Date</span>
                        <span className="att-hist-detail-val">{fmtDate(record.date)}</span>
                      </div>
                      <div className="att-hist-detail-tile">
                        <span className="att-hist-detail-label">Time</span>
                        <span className="att-hist-detail-val">{record.time}</span>
                      </div>
                      <div className="att-hist-detail-tile">
                        <span className="att-hist-detail-label">Venue</span>
                        <span className="att-hist-detail-val">{record.venue}</span>
                      </div>
                      <div className="att-hist-detail-tile">
                        <span className="att-hist-detail-label">Subject</span>
                        <span className="att-hist-detail-val">{record.subjectName}</span>
                      </div>
                      <div className="att-hist-detail-tile">
                        <span className="att-hist-detail-label">Submitted by</span>
                        <span className="att-hist-detail-val">{record.submittedBy || '—'}</span>
                      </div>
                      <div className="att-hist-detail-tile">
                        <span className="att-hist-detail-label">Submitted at</span>
                        <span className="att-hist-detail-val">
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Student table */}
                    <div className="att-hist-student-table">
                      {/* Header */}
                      <div className="att-hist-student-header">
                        <span style={{ width: 32, flexShrink: 0, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>#</span>
                        <span style={{ flex: '0 0 110px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Roll No</span>
                        <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Name</span>
                        <span style={{ width: 90, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Status</span>
                      </div>
                      {record.students.map((s, idx) => (
                        <div
                          key={s.rollNo}
                          className={`att-hist-student-row${s.present ? ' att-hist-student-row--present' : ''}${idx % 2 === 0 ? ' att-hist-student-row--even' : ''}`}
                        >
                          <span style={{ width: 32, flexShrink: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{idx + 1}</span>
                          <span style={{ flex: '0 0 110px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{s.rollNo}</span>
                          <span style={{ flex: 1, fontSize: '0.875rem' }}>{s.name}</span>
                          <span style={{ width: 90, textAlign: 'center' }}>
                            {s.present
                              ? <span className="att-present-pill"><UserCheck size={11} /> Present</span>
                              : <span className="att-absent-pill"><UserX size={11} /> Absent</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
