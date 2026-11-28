/**
 * StudentTransport.jsx
 *
 * Student-facing transport page.
 * - Fetches only the authenticated student's bus pass via /api/transport/my-pass (JWT).
 * - PRN is NEVER hardcoded or taken from props/params.
 * - Displays a professional Bus Pass card.
 * - PENDING: View + Pay buttons in header.
 * - PAID: View Bus Pass + Download Bus Pass buttons in header; Pay button hidden.
 * - Duplicate payment is blocked at both frontend and backend.
 * - PDF download reuses the existing exportUtils.js printWindow pattern.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus, CreditCard, Eye, Loader2, AlertCircle, CheckCircle2,
  Download, MapPin, Ticket, X, GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD
  ? 'https://university-erp-node.onrender.com/api'
  : 'http://localhost:5000/api';

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('erp_token') || ''}`,
});

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const fmtAmt = (v) =>
  v != null && v !== '' ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ label, paid }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.03em',
    backgroundColor: paid ? '#dcfce7' : '#fef3c7',
    color: paid ? '#15803d' : '#b45309',
    border: `1px solid ${paid ? '#bbf7d0' : '#fde68a'}`,
  }}>
    {paid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
    {label}
  </span>
);

// ── Pay confirmation dialog ───────────────────────────────────────────────────
const PayConfirmDialog = ({ isOpen, routeTitle, fee, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: '#dbeafe', color: '#1d4ed8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CreditCard size={18} />
            </div>
            <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>Confirm Payment</h3>
          </div>
          <button type="button" className="close-modal-btn" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '0.5rem 0 1rem 0' }}>
          <p style={{ fontSize: '0.95rem', color: '#374151', marginBottom: '1rem' }}>
            Proceed to pay the Transport Fee for your assigned bus route?
          </p>
          <div style={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: '8px', padding: '0.85rem 1rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Route</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', marginTop: '0.2rem' }}>{routeTitle}</div>
            </div>
            {fee > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Amount</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f766e', marginTop: '0.2rem' }}>{fmtAmt(fee)}</div>
              </div>
            )}
          </div>
        </div>
        <div className="modal-actions" style={{ marginTop: '0.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ minWidth: '90px' }}>Cancel</button>
          <button type="button" className="books-btn books-btn-primary" onClick={onConfirm} style={{ minWidth: '90px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={14} /> Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};

// ── View Bus Pass modal ───────────────────────────────────────────────────────
const ViewPassModal = ({ isOpen, onClose, pass, route, feeRecord, user }) => {
  if (!isOpen || !pass) return null;
  const isPaid = pass.paymentStatus === 'PAID';
  const fee = route?.fee ?? feeRecord?.totalFeeAmount ?? 0;
  const rows = [
    ['Bus Pass ID',    pass.passId || '—'],
    ['Student PRN',    pass.studentId || '—'],
    ['Student Name',   pass.studentName || user?.name || '—'],
    ['Route ID',       `Route #${pass.routeId || '—'}`],
    ['Route Name',     route?.routeName || '—'],
    ['Boarding Stop',  pass.fromStop || '—'],
    ['Drop Stop',      pass.toStop || '—'],
    ['Stops',          route?.stops?.join(' → ') || '—'],
    ['Transport Fee',  fmtAmt(fee)],
    ['Payment Status', isPaid ? 'PAID' : 'PENDING'],
    ['Pass Status',    isPaid ? 'Active' : 'Pending Payment'],
    ['Valid Till',     fmtDate(pass.validTill)],
  ];
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title" style={{ margin: 0 }}>Bus Pass Details</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Pass ID: {pass.passId}
            </p>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div style={{ padding: '0.5rem 0 0.25rem 0' }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', flexShrink: 0, paddingRight: '1rem' }}>{label}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
            </div>
          ))}
        </div>
        <div className="modal-actions" style={{ marginTop: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ── PDF Bus Pass generator (reuses printWindow pattern from exportUtils.js) ───
const generateBusPassPDF = ({ pass, route, user, feeRecord, preview = false }) => {
  const isPaid = pass?.paymentStatus === 'PAID';
  if (!isPaid) {
    alert('Bus Pass PDF is only available after successful payment.');
    return;
  }

  const fee = route?.fee ?? feeRecord?.totalFeeAmount ?? 0;
  const studentName = pass?.studentName || user?.name || '—';
  const prn = pass?.studentId || user?.prn || '—';
  const passId = pass?.passId || '—';
  const routeId = pass?.routeId || '—';
  const routeName = route?.routeName || `Route #${routeId}`;
  const stops = route?.stops?.join(', ') || '—';
  const boardingStop = pass?.fromStop || '—';
  const dropStop = pass?.toStop || '—';
  const validTill = fmtDate(pass?.validTill);
  const issueDate = fmtDate(pass?.createdAt || new Date());
  const degree = feeRecord?.degree || user?.department || '—';
  const academicYear = feeRecord?.academicYear || (() => { const y = new Date().getFullYear(); return `${y}-${y + 1}`; })();

  const printWindow = window.open('', '_blank', 'width=820,height=600');
  if (!printWindow) {
    alert('Please allow popups to generate the Bus Pass PDF.');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Bus Pass – ${passId}</title>
  <style>
    @page { size: A5 landscape; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .pass-wrap { width: 100%; max-width: 740px; }
    .pass-card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; }
    .pass-header { background: linear-gradient(135deg, #111827 0%, #1e3a5f 100%); color: #fff; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; }
    .univ-name { font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }
    .univ-sub  { font-size: 11px; opacity: 0.75; margin-top: 2px; }
    .pass-type { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .pass-body { padding: 20px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .left-col  { padding-right: 20px; border-right: 1px dashed #d1d5db; }
    .right-col { padding-left: 20px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .field { margin-bottom: 10px; }
    .field-label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
    .field-value { font-size: 13px; font-weight: 600; color: #111827; }
    .field-value.mono { font-family: 'Courier New', monospace; }
    .field-value.large { font-size: 16px; font-weight: 800; }
    .stops-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
    .stop-chip { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; }
    .pass-footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; }
    .paid-badge { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 5px; }
    .paid-dot { width: 7px; height: 7px; background: #16a34a; border-radius: 50%; display: inline-block; }
    .footer-note { font-size: 10px; color: #9ca3af; }
    @media print {
      body { background: #fff; padding: 0; }
      .pass-card { box-shadow: none; border: 1px solid #000; }
    }
  </style>
</head>
<body>
  <div class="pass-wrap">
    <div class="pass-card">
      <div class="pass-header">
        <div>
          <div class="univ-name">University ERP</div>
          <div class="univ-sub">Official Student Bus Pass · Academic Year ${academicYear}</div>
        </div>
        <div class="pass-type">Bus Pass</div>
      </div>
      <div class="pass-body">
        <div class="left-col">
          <div class="section-title">Student Details</div>
          <div class="field">
            <div class="field-label">Full Name</div>
            <div class="field-value large">${studentName}</div>
          </div>
          <div class="field">
            <div class="field-label">PRN</div>
            <div class="field-value mono">${prn}</div>
          </div>
          <div class="field">
            <div class="field-label">Program</div>
            <div class="field-value">${degree}</div>
          </div>
          <div class="field">
            <div class="field-label">Bus Pass ID</div>
            <div class="field-value mono large">${passId}</div>
          </div>
        </div>
        <div class="right-col">
          <div class="section-title">Route Details</div>
          <div class="field">
            <div class="field-label">Route ID</div>
            <div class="field-value mono">Route #${routeId}</div>
          </div>
          <div class="field">
            <div class="field-label">Route Name</div>
            <div class="field-value">${routeName}</div>
          </div>
          <div class="field">
            <div class="field-label">Boarding Stop</div>
            <div class="field-value">${boardingStop}</div>
          </div>
          <div class="field">
            <div class="field-label">Drop Stop</div>
            <div class="field-value">${dropStop}</div>
          </div>
          <div class="field">
            <div class="field-label">All Stops</div>
            <div class="stops-list">${(route?.stops || []).map((s) => `<span class="stop-chip">${s}</span>`).join('')}</div>
          </div>
          <div class="field" style="margin-top:8px;">
            <div class="field-label">Transport Fee</div>
            <div class="field-value">${fmtAmt(fee)}</div>
          </div>
          <div class="field">
            <div class="field-label">Valid Till</div>
            <div class="field-value">${validTill}</div>
          </div>
        </div>
      </div>
      <div class="pass-footer">
        <div class="paid-badge"><span class="paid-dot"></span>PAYMENT VERIFIED · ACTIVE</div>
        <div class="footer-note">Issued: ${issueDate} · This is an official University ERP document.</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() { ${preview ? '' : 'window.print();'} };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

// ── Main Bus Pass Card ────────────────────────────────────────────────────────
const BusPassCard = ({ pass, route, feeRecord, user }) => {
  const isPaid = pass?.paymentStatus === 'PAID';
  const fee = route?.fee ?? feeRecord?.totalFeeAmount ?? 0;
  const feeStatus = feeRecord?.status || (isPaid ? 'PAID' : 'PENDING');
  const routeTitle = route?.routeName?.trim() || `Route #${route?.routeId || '—'}`;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb',
      maxWidth: '780px',
      width: '100%',
    }}>
      {/* Card header stripe */}
      <div style={{
        background: 'linear-gradient(135deg, #111827 0%, #1e3a5f 100%)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px', display: 'flex' }}>
            <Bus size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>University ERP</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>Official Student Bus Pass</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusBadge label={isPaid ? 'Active' : 'Pending Payment'} paid={isPaid} />
        </div>
      </div>

      {/* Pass ID bar */}
      <div style={{
        background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
        padding: '0.6rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Ticket size={14} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Pass ID</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>{pass?.passId || '—'}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
          Valid till: <strong style={{ color: '#374151' }}>{fmtDate(pass?.validTill)}</strong>
        </div>
      </div>

      {/* Main grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0',
        padding: '1.25rem 1.5rem',
      }}>
        {/* Student info */}
        <div style={{ paddingRight: '1.5rem', borderRight: '1px dashed #e5e7eb', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '0.75rem' }}>Student Details</div>
          <Field label="Student Name" value={pass?.studentName || user?.name || '—'} large />
          <Field label="PRN" value={pass?.studentId || user?.prn || '—'} mono />
        </div>

        {/* Route info */}
        <div style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '0.75rem' }}>Route Details</div>
          <Field label="Route ID" value={`Route #${route?.routeId || '—'}`} mono />
          <Field label="Route Name" value={routeTitle} />
          <Field label="Boarding Stop" value={pass?.fromStop || '—'} />
          <Field label="Drop Stop" value={pass?.toStop || '—'} />
        </div>
      </div>

      {/* Stops */}
      {route?.stops?.length > 0 && (
        <div style={{ padding: '0 1.5rem 1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '0.5rem' }}>All Stops</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {route.stops.map((s, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#eff6ff', color: '#1e40af',
                border: '1px solid #bfdbfe', padding: '3px 10px',
                borderRadius: '20px', fontSize: '0.78rem', fontWeight: 500,
              }}>
                <MapPin size={10} />{s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fee + payment row */}
      <div style={{
        background: '#f9fafb', borderTop: '1px solid #e5e7eb',
        padding: '0.9rem 1.5rem',
        display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>Transport Fee</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f766e', marginTop: '2px' }}>{fmtAmt(fee)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>Payment Status</div>
          <div style={{ marginTop: '4px' }}><StatusBadge label={feeStatus} paid={feeStatus === 'PAID'} /></div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>Pass Status</div>
          <div style={{ marginTop: '4px' }}><StatusBadge label={isPaid ? 'Active' : 'Pending Payment'} paid={isPaid} /></div>
        </div>
      </div>
    </div>
  );
};

// Small field sub-component used inside BusPassCard
const Field = ({ label, value, mono, large }) => (
  <div style={{ marginBottom: '0.65rem' }}>
    <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>{label}</div>
    <div style={{
      fontSize: large ? '1rem' : '0.9rem',
      fontWeight: large ? 700 : 600,
      color: '#111827',
      fontFamily: mono ? "'Courier New', monospace" : 'inherit',
      marginTop: '2px',
    }}>{value}</div>
  </div>
);

// ── Main page component ───────────────────────────────────────────────────────
const StudentTransport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [payConfirm, setPayConfirm] = useState(false);

  const fetchMyPass = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/transport/my-pass`, { headers: authHeader() });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else if (res.status === 404) {
        setData({ assigned: false });
      } else {
        setError(json.message || 'Failed to load your transport details.');
      }
    } catch {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyPass(); }, [fetchMyPass]);

  const handlePay = () => {
    if (!data?.route) return;
    const route = data.route;
    const title = route.routeName?.trim() || `Route #${route.routeId}`;
    navigate('/fee-payment', {
      state: {
        fromStudentPay: true,
        routeId: route.routeId,
        transportTitle: `Transport Fee – ${title}`,
        fee: route.fee || 0,
        routeData: route,
      },
    });
  };

  const { pass, route, feeRecord } = data || {};
  const isPaid = pass?.paymentStatus === 'PAID' || feeRecord?.status === 'PAID';
  const fee = route?.fee ?? feeRecord?.totalFeeAmount ?? 0;
  const routeTitle = route?.routeName?.trim() || `Route #${route?.routeId || '—'}`;

  // ── Shared header layout ──────────────────────────────────────────────────
  const PageHeader = ({ children }) => (
    <div className="page-header-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ flex: 1 }}>
        <h1 className="page-title">My Transport</h1>
        <p className="page-subtitle">Your assigned bus route and bus pass details</p>
      </div>
      {/* Action buttons pinned to the right */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container">
        <PageHeader />
        <div className="table-loading-state" style={{ minHeight: '300px' }}>
          <Loader2 size={30} className="spin-animate" />
          <p>Loading your transport details…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="page-container">
        <PageHeader />
        <div className="feedback-banner feedback-error" style={{ margin: '1rem 0' }}>
          <AlertCircle size={18} /><span>{error}</span>
        </div>
      </div>
    );
  }

  // ── Not assigned ──────────────────────────────────────────────────────────
  if (!data || !data.assigned) {
    return (
      <div className="page-container">
        <PageHeader />
        <div className="card table-card" style={{ marginTop: '1.25rem' }}>
          <div className="table-empty-state" style={{ padding: '3rem 1rem' }}>
            <Bus size={40} className="empty-icon" />
            <h3>No Bus Route Assigned</h3>
            <p>You have not been assigned a bus route or bus pass yet. Please contact the administration.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Assigned ──────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <PageHeader>
        {!isPaid && (
          <>
            {fee > 0 && (
              <button
                type="button"
                className="books-btn books-btn-primary"
                onClick={() => setPayConfirm(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CreditCard size={15} /> Pay
              </button>
            )}
          </>
        )}
        {isPaid && (
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => generateBusPassPDF({ pass, route, user, feeRecord })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Download Bus Pass
          </button>
        )}
      </PageHeader>

      {/* Paid success banner */}
      {isPaid && (
        <div className="feedback-banner feedback-success" style={{ margin: '1rem 0' }}>
          <CheckCircle2 size={18} />
          <span>Your transport fee is paid and your Bus Pass is active. You can view or download your Bus Pass above.</span>
        </div>
      )}

      {/* Bus Pass Card */}
      <div style={{ marginTop: '1.25rem' }}>
        <BusPassCard pass={pass} route={route} feeRecord={feeRecord} user={user} />
      </div>

      {/* View modal */}
      <ViewPassModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        pass={pass}
        route={route}
        feeRecord={feeRecord}
        user={user}
      />

      {/* Pay confirmation */}
      <PayConfirmDialog
        isOpen={payConfirm}
        routeTitle={routeTitle}
        fee={fee}
        onConfirm={() => { setPayConfirm(false); handlePay(); }}
        onCancel={() => setPayConfirm(false)}
      />
    </div>
  );
};

export default StudentTransport;
