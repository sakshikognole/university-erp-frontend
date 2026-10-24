import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2, Plus, MapPin } from 'lucide-react';
import { validateRouteName } from '../utils/transportValidation';
const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('erp_token')}` });

const FieldError = ({ msg }) => msg ? <p className="sf-field-error"><AlertCircle size={12} style={{ flexShrink: 0 }} />{msg}</p> : null;

const AddBusRouteModal = ({ isOpen, routeId: routeIdProp, onClose, onSuccess }) => {
  const isEdit = Boolean(routeIdProp);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [routeNameError, setRouteNameError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stopInput, setStopInput] = useState('');

  const emptyForm = { routeId: '', hasCustomName: false, routeName: '', driverId: '', driverName: '', vehicleId: '', vehicleName: '', stops: [], status: 'ACTIVE' };
  const [form, setForm] = useState(emptyForm);

  const reset = useCallback(() => { setForm(emptyForm); setRouteNameError(''); setFeedback({ type: '', message: '' }); setStopInput(''); }, []); // eslint-disable-line

  useEffect(() => {
    if (!isOpen) return;
    reset();
    fetchDropdowns();
    if (isEdit) loadRoute(); else fetchNextId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, routeIdProp]);

  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  useEffect(() => { const f = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); }; document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f); }, [isOpen, loading, onClose]);

  const fetchDropdowns = async () => {
    try {
      const [dr, vr] = await Promise.all([fetch(`${API_BASE_URL}/transport/drivers`, { headers: authHeader() }), fetch(`${API_BASE_URL}/transport/vehicles`, { headers: authHeader() })]);
      if (dr.ok) setDrivers(await dr.json());
      if (vr.ok) setVehicles(await vr.json());
    } catch { /* non-fatal */ }
  };

  const fetchNextId = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/transport/routes/next-id`, { headers: authHeader() });
      if (res.ok) { const d = await res.json(); setForm((p) => ({ ...p, routeId: d.nextId || 1 })); }
    } catch { /* non-fatal */ }
  };

  const loadRoute = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/routes/${routeIdProp}`, { headers: authHeader() });
      if (res.ok) {
        const r = await res.json();
        setForm({ routeId: r.routeId || '', hasCustomName: Boolean(r.hasCustomName || r.routeName), routeName: r.routeName || '', driverId: r.driverId || '', driverName: r.driverName || '', vehicleId: r.vehicleId || '', vehicleName: r.vehicleName || '', stops: r.stops || [], status: r.status || 'ACTIVE' });
      } else setFeedback({ type: 'error', message: 'Bus route not found.' });
    } catch { setFeedback({ type: 'error', message: 'Unable to connect.' }); }
    finally { setFetching(false); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') setForm((p) => ({ ...p, [name]: checked, routeName: checked ? p.routeName : '' }));
    else setForm((p) => ({ ...p, [name]: value }));
  };

  const addStop = (s) => { const t = s.trim(); if (t && !form.stops.includes(t)) setForm((p) => ({ ...p, stops: [...p.stops, t] })); };
  const handleStopInput = (e) => {
    const v = e.target.value;
    if (v.includes(',')) { v.split(',').forEach((p, i, arr) => { if (i < arr.length - 1 && p.trim()) addStop(p); else setStopInput(p.trim() ? p : ''); }); if (v.endsWith(',')) setStopInput(''); }
    else setStopInput(v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    if (form.routeId === '' || form.routeId === null) { setFeedback({ type: 'error', message: 'Route ID is required.' }); return; }
    if (!form.driverName) { setFeedback({ type: 'error', message: 'Please select a Driver.' }); return; }
    if (!form.vehicleName) { setFeedback({ type: 'error', message: 'Please select a Vehicle.' }); return; }
    if (form.hasCustomName) { const err = validateRouteName(form.routeName); if (err) { setRouteNameError(err); return; } }
    setRouteNameError('');
    setLoading(true);
    try {
      const url = isEdit ? `${API_BASE_URL}/transport/routes/${routeIdProp}` : `${API_BASE_URL}/transport/routes`;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: authHeader(), body: JSON.stringify({ routeId: Number(form.routeId), hasCustomName: form.hasCustomName, routeName: form.hasCustomName ? form.routeName.trim() : '', driverId: form.driverId || null, driverName: form.driverName.trim(), vehicleId: form.vehicleId || '', vehicleName: form.vehicleName.trim(), stops: form.stops, status: form.status }) });
      const data = await res.json();
      if (!res.ok) { setFeedback({ type: 'error', message: data.message || 'Failed to save.' }); return; }
      setFeedback({ type: 'success', message: data.message || (isEdit ? 'Route updated.' : 'Route created.') });
      setTimeout(() => onSuccess(), 900);
    } catch { setFeedback({ type: 'error', message: 'Unable to connect.' }); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="sf-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="sf-modal">
        <div className="sf-header">
          <div className="sf-header-left">
            <div className="sf-header-icon"><MapPin size={18} /></div>
            <div><h2 className="sf-title">{isEdit ? 'Edit Bus Route' : 'Add Bus Route'}</h2><p className="sf-subtitle">Configure route, driver, vehicle and stops</p></div>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="sf-body">
          {feedback.message && <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>{feedback.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}<span>{feedback.message}</span></div>}
          {fetching ? <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading…</p></div> : (
            <form id="route-form" onSubmit={handleSubmit} className="sf-form" noValidate>
              <div className="sf-section-label">Route Identification</div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="r-routeId">Route ID (Numeric) <span className="sf-required">*</span></label>
                  <input id="r-routeId" name="routeId" type="number" className="sf-input" placeholder="e.g. 1, 2, 101" value={form.routeId} onChange={handleChange} />
                </div>
                <div className="sf-group" style={{ justifyContent: 'flex-end', paddingBottom: '0.25rem' }}>
                  <label className="sf-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: 'auto' }}>
                    <input type="checkbox" name="hasCustomName" checked={form.hasCustomName} onChange={handleChange} style={{ width: 16, height: 16 }} />
                    Add Custom Route Name
                  </label>
                </div>
              </div>
              {form.hasCustomName && (
                <div className="sf-row"><div className="sf-group sf-group-full">
                  <label className="sf-label" htmlFor="r-routeName">Route Name <span className="sf-required">*</span></label>
                  <input id="r-routeName" name="routeName" type="text" className={`sf-input${routeNameError ? ' sf-input-error' : ''}`} placeholder="e.g. North City Express" value={form.routeName} onChange={(e) => { handleChange(e); if (routeNameError) setRouteNameError(validateRouteName(e.target.value) || ''); }} />
                  <FieldError msg={routeNameError} />
                </div></div>
              )}
              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>Assignment</div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="r-driverName">Driver <span className="sf-required">*</span></label>
                  <select id="r-driverName" name="driverName" className="sf-input" value={form.driverName} onChange={(e) => { const d = drivers.find((x) => x.name === e.target.value); setForm((p) => ({ ...p, driverName: e.target.value, driverId: d ? d.driverId : '' })); }}>
                    <option value="">— Select Driver —</option>
                    {drivers.map((d) => <option key={d._id || d.driverId} value={d.name}>{d.name} ({d.driverId})</option>)}
                  </select>
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="r-vehicleName">Vehicle <span className="sf-required">*</span></label>
                  <select id="r-vehicleName" name="vehicleName" className="sf-input" value={form.vehicleName} onChange={(e) => { const v = vehicles.find((x) => x.name === e.target.value); setForm((p) => ({ ...p, vehicleName: e.target.value, vehicleId: v ? v.vehicleId : '' })); }}>
                    <option value="">— Select Vehicle —</option>
                    {vehicles.map((v) => <option key={v._id || v.vehicleId} value={v.name}>{v.name} ({v.vehicleId})</option>)}
                  </select>
                </div>
              </div>
              <div className="sf-row"><div className="sf-group">
                <label className="sf-label" htmlFor="r-status">Status</label>
                <select id="r-status" name="status" className="sf-input" value={form.status} onChange={handleChange}>
                  <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                </select>
              </div></div>
              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>Stops <span className="sf-optional">optional</span></div>
              <div className="sf-custom-input-row">
                <div className="sf-group" style={{ flex: 1 }}>
                  <input type="text" className="sf-input" placeholder="Type stop name, press Enter or comma" value={stopInput}
                    onChange={handleStopInput} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (stopInput.trim()) { addStop(stopInput); setStopInput(''); } } }} />
                </div>
                <button type="button" className="sf-add-custom-btn" onClick={() => { if (stopInput.trim()) { addStop(stopInput); setStopInput(''); } }}><Plus size={15} /><span>Add</span></button>
              </div>
              {form.stops.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {form.stops.map((s, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '1rem', padding: '0.25rem 0.6rem', fontSize: '0.8125rem' }}>
                      <span style={{ background: '#2563eb', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{i + 1}</span>
                      {s}
                      <button type="button" onClick={() => setForm((p) => ({ ...p, stops: p.stops.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}><X size={13} /></button>
                    </span>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>
        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="route-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></> : <><Save size={15} /><span>{isEdit ? 'Update Route' : 'Save Route'}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBusRouteModal;
