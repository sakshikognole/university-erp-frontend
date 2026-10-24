import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2, UserCheck, Search } from 'lucide-react';
import { validateBusPassId, validateValidTill } from '../utils/transportValidation';

const API_BASE_URL = 'http://localhost:5000/api';
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('erp_token')}` });

const FieldError = ({ msg }) => msg ? <p className="sf-field-error"><AlertCircle size={12} style={{ flexShrink: 0 }} />{msg}</p> : null;

const AddBusPassModal = ({ isOpen, passId: passIdProp, onClose, onSuccess }) => {
  const isEdit = Boolean(passIdProp);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [routes, setRoutes] = useState([]);
  const [availableStops, setAvailableStops] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [studentError, setStudentError] = useState('');

  const sixMonthsLater = () => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d.toISOString().split('T')[0]; };
  const emptyForm = { passId: '', studentId: '', studentName: '', routeId: '', fromStop: '', toStop: 'Main University Campus', paymentStatus: 'PAID', validTill: sixMonthsLater() };
  const [form, setForm] = useState(emptyForm);

  const reset = useCallback(() => { setForm({ ...emptyForm, validTill: sixMonthsLater() }); setFieldErrors({}); setFeedback({ type: '', message: '' }); setStudentInfo(null); setStudentError(''); setAvailableStops([]); }, []); // eslint-disable-line

  useEffect(() => {
    if (!isOpen) return;
    reset();
    fetchRoutes();
    if (isEdit) loadPass(); else fetchNextPassId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, passIdProp]);

  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  useEffect(() => { const f = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); }; document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f); }, [isOpen, loading, onClose]);

  const fetchRoutes = async () => {
    try { const res = await fetch(`${API_BASE_URL}/transport/routes`, { headers: authHeader() }); if (res.ok) setRoutes(await res.json()); } catch { /* non-fatal */ }
  };

  const fetchNextPassId = async () => {
    try { const res = await fetch(`${API_BASE_URL}/transport/passes/next-id`, { headers: authHeader() }); if (res.ok) { const d = await res.json(); if (d.nextPassId) setForm((p) => ({ ...p, passId: d.nextPassId })); } } catch { /* non-fatal */ }
  };

  const loadPass = async () => {
    setFetching(true);
    try {
      const [pr, rr] = await Promise.all([fetch(`${API_BASE_URL}/transport/passes/${passIdProp}`, { headers: authHeader() }), fetch(`${API_BASE_URL}/transport/routes`, { headers: authHeader() })]);
      let loadedRoutes = [];
      if (rr.ok) { loadedRoutes = await rr.json(); setRoutes(loadedRoutes); }
      if (pr.ok) {
        const p = await pr.json();
        setForm({ passId: p.passId || '', studentId: p.studentId || '', studentName: p.studentName || '', routeId: p.routeId !== undefined ? p.routeId : '', fromStop: p.fromStop || '', toStop: p.toStop || 'Main University Campus', paymentStatus: p.paymentStatus || 'PAID', validTill: p.validTill ? new Date(p.validTill).toISOString().split('T')[0] : '' });
        if (p.studentId) verifyStudent(p.studentId);
        const route = loadedRoutes.find((r) => String(r.routeId) === String(p.routeId));
        if (route?.stops) setAvailableStops(route.stops);
      } else setFeedback({ type: 'error', message: 'Pass not found.' });
    } catch { setFeedback({ type: 'error', message: 'Unable to connect.' }); }
    finally { setFetching(false); }
  };

  const verifyStudent = async (prn) => {
    const p = (prn || form.studentId || '').trim();
    if (!p) { setStudentInfo(null); setStudentError(''); return null; }
    setVerifying(true); setStudentError('');
    try {
      const res = await fetch(`${API_BASE_URL}/transport/verify-student/${encodeURIComponent(p)}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok && data.valid && data.student) { setStudentInfo(data.student); setForm((f) => ({ ...f, studentId: data.student.prn, studentName: data.student.name })); return data.student; }
      else { setStudentInfo(null); setStudentError(data.message || `No student with PRN "${p}".`); return null; }
    } catch { setStudentError('Failed to verify student.'); return null; }
    finally { setVerifying(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === 'studentId') { setStudentInfo(null); setStudentError(''); }
    if (name === 'routeId') {
      const route = routes.find((r) => String(r.routeId) === String(value));
      setAvailableStops(route?.stops || []);
      setForm((p) => ({ ...p, routeId: value, fromStop: '' }));
    }
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    const passErr = validateBusPassId(form.passId); if (passErr) { setFieldErrors((p) => ({ ...p, passId: passErr })); return; }
    if (!form.studentId.trim()) { setFeedback({ type: 'error', message: 'Student PRN is required.' }); return; }
    let student = studentInfo;
    if (!student) student = await verifyStudent(form.studentId);
    if (!student) { setFeedback({ type: 'error', message: `Student PRN '${form.studentId}' not found.` }); return; }
    if (!form.routeId) { setFeedback({ type: 'error', message: 'Please select a route.' }); return; }
    if (!form.fromStop.trim()) { setFeedback({ type: 'error', message: 'Please select a boarding stop.' }); return; }
    const dateErr = validateValidTill(form.validTill); if (dateErr) { setFieldErrors((p) => ({ ...p, validTill: dateErr })); return; }

    setLoading(true);
    try {
      const url = isEdit ? `${API_BASE_URL}/transport/passes/${passIdProp}` : `${API_BASE_URL}/transport/passes`;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: authHeader(), body: JSON.stringify({ passId: form.passId.trim(), studentId: student.prn, studentName: student.name, routeId: Number(form.routeId), fromStop: form.fromStop.trim(), toStop: form.toStop.trim(), paymentStatus: form.paymentStatus, validTill: form.validTill }) });
      const data = await res.json();
      if (!res.ok) { setFeedback({ type: 'error', message: data.message || 'Failed to save.' }); return; }
      setFeedback({ type: 'success', message: data.message || (isEdit ? 'Pass updated.' : 'Pass issued.') });
      setTimeout(() => onSuccess(), 900);
    } catch { setFeedback({ type: 'error', message: 'Unable to connect.' }); }
    finally { setLoading(false); }
  };

  const ic = (f) => `sf-input${fieldErrors[f] ? ' sf-input-error' : ''}`;
  if (!isOpen) return null;

  return (
    <div className="sf-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="sf-modal">
        <div className="sf-header">
          <div className="sf-header-left">
            <div className="sf-header-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
            <div><h2 className="sf-title">{isEdit ? 'Edit Bus Pass' : 'Issue Bus Pass'}</h2><p className="sf-subtitle">{isEdit ? 'Update pass details' : 'Issue a bus pass for an enrolled student'}</p></div>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="sf-body">
          {feedback.message && <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>{feedback.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}<span>{feedback.message}</span></div>}
          {fetching ? <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading…</p></div> : (
            <form id="pass-form" onSubmit={handleSubmit} className="sf-form" noValidate>
              <div className="sf-section-label">Pass &amp; Student</div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="bp-passId">Pass ID <span className="sf-required">*</span></label>
                  <input id="bp-passId" name="passId" type="text" className={ic('passId')} placeholder="e.g. BP-1001" value={form.passId} onChange={handleChange} autoComplete="off" />
                  <FieldError msg={fieldErrors.passId} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="bp-studentId">Student PRN <span className="sf-required">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input id="bp-studentId" name="studentId" type="text" className={`sf-input${studentError ? ' sf-input-error' : ''}`}
                      style={{ paddingRight: '2.25rem', borderColor: studentInfo ? '#16a34a' : studentError ? '#ef4444' : undefined }}
                      placeholder="e.g. PRN2024001" value={form.studentId} onChange={handleChange} onBlur={() => form.studentId.trim() && verifyStudent(form.studentId)} autoComplete="off" />
                    <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                      {verifying ? <Loader2 size={15} className="spin-animate" style={{ color: '#9ca3af' }} /> : studentInfo ? <UserCheck size={15} style={{ color: '#16a34a' }} /> : <button type="button" onClick={() => verifyStudent(form.studentId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', display: 'flex', padding: 0 }}><Search size={15} /></button>}
                    </div>
                  </div>
                  {studentInfo && <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem' }}>{studentInfo.name} — verified</p>}
                  {studentError && <p style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.2rem' }}>{studentError}</p>}
                </div>
              </div>
              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>Route &amp; Stops</div>
              <div className="sf-row"><div className="sf-group sf-group-full">
                <label className="sf-label" htmlFor="bp-routeId">Route <span className="sf-required">*</span></label>
                <select id="bp-routeId" name="routeId" className="sf-input" value={form.routeId} onChange={handleChange}>
                  <option value="">— Select Route —</option>
                  {routes.map((r) => <option key={r._id || r.routeId} value={r.routeId}>Route #{r.routeId}{r.routeName ? ` — ${r.routeName}` : ''} ({r.stops?.length || 0} stops)</option>)}
                </select>
              </div></div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="bp-fromStop">From Stop <span className="sf-required">*</span></label>
                  {availableStops.length > 0
                    ? <select id="bp-fromStop" name="fromStop" className="sf-input" value={form.fromStop} onChange={handleChange}><option value="">— Select —</option>{availableStops.map((s, i) => <option key={i} value={s}>{s}</option>)}</select>
                    : <input id="bp-fromStop" name="fromStop" type="text" className="sf-input" placeholder="Boarding stop" value={form.fromStop} onChange={handleChange} />
                  }
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="bp-toStop">To Stop <span className="sf-required">*</span></label>
                  <input id="bp-toStop" name="toStop" type="text" className="sf-input" placeholder="Main University Campus" value={form.toStop} onChange={handleChange} />
                </div>
              </div>
              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>Validity &amp; Payment</div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="bp-paymentStatus">Payment Status <span className="sf-required">*</span></label>
                  <select id="bp-paymentStatus" name="paymentStatus" className="sf-input" value={form.paymentStatus} onChange={handleChange}>
                    <option value="PAID">Paid</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option>
                  </select>
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="bp-validTill">Valid Till <span className="sf-required">*</span></label>
                  <input id="bp-validTill" name="validTill" type="date" className={ic('validTill')} min={new Date().toISOString().split('T')[0]} value={form.validTill} onChange={handleChange} />
                  <FieldError msg={fieldErrors.validTill} />
                </div>
              </div>
            </form>
          )}
        </div>
        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="pass-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></> : <><Save size={15} /><span>{isEdit ? 'Update Pass' : 'Issue Pass'}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBusPassModal;
