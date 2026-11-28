import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─────────────────────────────────────────────────────────────────────────────
// Build a map  date-string → { present: bool, subject: string }[]
// from flat attendance records
// ─────────────────────────────────────────────────────────────────────────────
function buildDateMap(records) {
  const map = {}; // 'YYYY-MM-DD' → array of session objects
  for (const rec of records) {
    const dateKey = (rec.date || '').slice(0, 10);
    if (!dateKey) continue;
    if (!map[dateKey]) map[dateKey] = [];
    // Each record already has students filtered to just this student (backend does it)
    const studentEntry = rec.students?.[0];
    map[dateKey].push({
      present:     studentEntry ? Boolean(studentEntry.present) : false,
      subjectName: rec.subjectName || '',
      time:        rec.time        || '',
    });
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// MonthGrid — renders one month as a square grid
// ─────────────────────────────────────────────────────────────────────────────
function MonthGrid({ year, month, dateMap }) {
  const firstDay    = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells       = [];

  // Leading blanks
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Days
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="att-matrix-month">
      <h4 className="att-matrix-month-label">{MONTH_NAMES[month]} {year}</h4>
      <div className="att-matrix-day-headers">
        {DAY_LABELS.map((l) => <span key={l} className="att-matrix-day-hdr">{l}</span>)}
      </div>
      <div className="att-matrix-grid">
        {cells.map((day, idx) => {
          if (!day) return <span key={`blank-${idx}`} className="att-matrix-cell att-matrix-cell--blank" />;

          const mm   = String(month + 1).padStart(2, '0');
          const dd   = String(day).padStart(2, '0');
          const key  = `${year}-${mm}-${dd}`;
          const sessions = dateMap[key] || [];

          const hasData   = sessions.length > 0;
          const allPresent = hasData && sessions.every((s) => s.present);
          const anyAbsent  = hasData && sessions.some((s) => !s.present);
          // Mixed: some classes present, some absent
          const mixed      = hasData && allPresent === false && anyAbsent === false ? false
                           : (hasData && sessions.some((s) => s.present) && sessions.some((s) => !s.present));

          let cls = 'att-matrix-cell';
          if (!hasData)        cls += ' att-matrix-cell--empty';
          else if (mixed)      cls += ' att-matrix-cell--mixed';
          else if (allPresent) cls += ' att-matrix-cell--present';
          else                 cls += ' att-matrix-cell--absent';

          const tooltip = hasData
            ? sessions.map((s) => `${s.subjectName}: ${s.present ? 'Present' : 'Absent'}`).join('\n')
            : 'No attendance record';

          return (
            <span
              key={key}
              className={cls}
              title={`${key}\n${tooltip}`}
              aria-label={`${key}: ${hasData ? (mixed ? 'Mixed' : allPresent ? 'Present' : 'Absent') : 'No record'}`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AttendanceMatrix component
// ─────────────────────────────────────────────────────────────────────────────
const AttendanceMatrix = () => {
  const { user } = useAuth();
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [selYear,  setSelYear]  = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const prn = user?.prn;
        if (!prn) { setError('Could not determine your student ID. Please log in again.'); setLoading(false); return; }

        const res = await fetch(`${API_BASE_URL}/attendance?prn=${encodeURIComponent(prn)}`, {
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
  }, [user]);

  const dateMap = useMemo(() => buildDateMap(records), [records]);

  // Determine which years have data
  const years = useMemo(() => {
    const ys = new Set(Object.keys(dateMap).map((k) => parseInt(k.slice(0, 4), 10)));
    ys.add(new Date().getFullYear()); // always include current year
    return [...ys].sort((a, b) => b - a);
  }, [dateMap]);

  // Summary stats for selected year
  const { totalSessions, presentCount, absentCount, pct } = useMemo(() => {
    let total = 0, pres = 0;
    for (const [date, sessions] of Object.entries(dateMap)) {
      if (parseInt(date.slice(0, 4), 10) !== selYear) continue;
      sessions.forEach((s) => { total++; if (s.present) pres++; });
    }
    return {
      totalSessions: total,
      presentCount:  pres,
      absentCount:   total - pres,
      pct:           total ? Math.round((pres / total) * 100) : 0,
    };
  }, [dateMap, selYear]);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={30} className="spin-animate" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <p>Loading your attendance…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginTop: '1.25rem' }}>
          <AlertCircle size={28} style={{ margin: '0 auto 0.75rem', display: 'block', color: '#ef4444' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Year-wise attendance calendar — green = present, red = absent</p>
        </div>
      </div>

      {/* Year selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Year:</span>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setSelYear(y)}
            style={{
              padding: '0.3rem 0.9rem',
              borderRadius: '1.5rem',
              border: '1.5px solid',
              borderColor: y === selYear ? 'var(--primary-color, #2563eb)' : 'var(--border-color)',
              background:  y === selYear ? 'var(--primary-color, #2563eb)' : 'transparent',
              color:       y === selYear ? '#fff' : 'var(--text-primary)',
              fontWeight:  y === selYear ? 700 : 400,
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.15s',
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="card" style={{ display: 'flex', gap: '1.5rem', padding: '1rem 1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Attendance</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: pct >= 75 ? '#16a34a' : '#dc2626' }}>{pct}%</span>
        </div>
        <div style={{ width: '1px', background: 'var(--border-color)', alignSelf: 'stretch' }} />
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Sessions', value: totalSessions, color: 'var(--text-primary)' },
            { label: 'Present',        value: presentCount,  color: '#16a34a' },
            { label: 'Absent',         value: absentCount,   color: '#dc2626' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {[
            { cls: 'att-matrix-cell--present', label: 'Present' },
            { cls: 'att-matrix-cell--absent',  label: 'Absent' },
            { cls: 'att-matrix-cell--mixed',   label: 'Mixed' },
            { cls: 'att-matrix-cell--empty',   label: 'No record' },
          ].map(({ cls, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
              <span className={`att-matrix-cell ${cls}`} style={{ width: 16, height: 16, fontSize: 0, display: 'inline-block' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      {totalSessions === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Calendar size={32} style={{ opacity: 0.3, margin: '0 auto 0.75rem', display: 'block' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No attendance records for {selYear}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Once your attendance is recorded, it will appear here.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="att-matrix-container">
            {MONTH_NAMES.map((_, month) => (
              <MonthGrid key={month} year={selYear} month={month} dateMap={dateMap} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMatrix;
