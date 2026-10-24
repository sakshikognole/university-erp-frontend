import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { validateDriverName, validateContact, validateLicense } from '../utils/transportValidation';

const API_BASE_URL = 'http://localhost:5000/api';
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('erp_token')}` });

const FieldError = ({ msg }) => msg ? <p className="sf-field-error"><AlertCircle size={12} style={{ flexShrink: 0 }} />{msg}</p> : null;

const AddDriverModal = ({ isOpen, driverId: driverIdProp, onClose, onSuccess }) => {
  const isEdit = Boolean(driverIdProp);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const emptyForm = { driverId: '', name: '', phone: '', licenseNumber: '', status: 'ACTIVE' };
  const [form, setForm] = useState(emptyForm);

  const reset = useCallback(() => { setForm(emptyForm); setFieldErrors({}); setFeedback({ type: '', message: '' }); }, []); // eslint-disable-line

  useEffect(() => {
    if (!isOpen) return;
    reset();
    if (isEdit) loadDriver(); else fetchNextId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, driverIdProp]);

  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  useEffect(() => { const f = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); }; document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f); }, [isOpen, loading, onClose]);

  const loadDriver = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/drivers/${driverIdProp}`, { headers: authHeader() });
      if (res.ok) { const d = await res.json(); setForm({ driverId: d.driverId || '', name: d.name || '', phone: d.phone || '', licenseNumber: d.licenseNumber || '', status: d.status || 'ACTIVE' }); }
      else setFeedback({ type: 'error', message: 'Driver not found.' });
    } catch { setFeedback({ type: 'error', message: 'Unable to connect.' }); }
    finally { setFetching(false); }
  };

  const fetchNextId = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/transport/drivers/next-id`, { headers: authHeader() });
      if (res.ok) { const d = await res.json(); setForm((p) => ({ ...p, driverId: d.nextId || 101 })); }
    } catch { /* non-fatal */ }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    const n = validateDriverName(form.name); if (n) errs.name = n;
    const c = validateContact(form.phone); if (c) errs.phone = c;
    const l = validateLicense(form.licenseNumber); if (l) errs.licenseNumber = l;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const url = isEdit ? `${API_BASE_URL}/transport/drivers/${driverIdProp}` : `${API_BASE_URL}/transport/drivers`;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: authHeader(), body: JSON.stringify({ driverId: Number(form.driverId), name: form.name.trim(), phone: form.phone.trim(), licenseNumber: form.licenseNumber.trim().toUpperCase(), status: form.status }) });
      const data = await res.json();
      if (!res.ok) { if (data.message?.toLowerCase().includes('license')) setFieldErrors((p) => ({ ...p, licenseNumber: data.message })); setFeedback({ type: 'error', message: data.message || 'Failed to save.' }); return; }
      setFeedback({ type: 'success', message: data.message || (isEdit ? 'Driver updated.' : 'Driver added.') });
      setTimeout(() => onSuccess(), 900);
    } catch { setFeedback({ type: 'error', message: 'Unable to connect.' }); }
    finally { setLoading(false); }
  };

  const ic = (f) => `sf-input${fieldErrors[f] ? ' sf-input-error' : ''}`;
  if (!isOpen) return null;

  return (
    <div className="sf-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="sf-modal" style={{ maxWidth: '560px' }}>
        <div className="sf-header">
          <div className="sf-header-left">
            <div className="sf-header-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
            <div><h2 className="sf-title">{isEdit ? 'Edit Driver' : 'Add Driver'}</h2><p className="sf-subtitle">{isEdit ? 'Update driver credentials' : 'Register a new driver'}</p></div>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="sf-body">
          {feedback.message && <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>{feedback.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}<span>{feedback.message}</span></div>}
          {fetching ? <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading…</p></div> : (
            <form id="driver-form" onSubmit={handleSubmit} className="sf-form" noValidate>
              <div className="sf-section-label">Driver Information</div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="d-driverId">Driver ID {!isEdit && '(Auto)'}</label>
                  <input id="d-driverId" name="driverId" type="number" className="sf-input" placeholder="e.g. 101" value={form.driverId} onChange={handleChange} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="d-status">Status</label>
                  <select id="d-status" name="status" className="sf-input" value={form.status} onChange={handleChange}>
                    <option value="ACTIVE">Active</option><option value="ON_LEAVE">On Leave</option><option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="sf-row"><div className="sf-group sf-group-full">
                <label className="sf-label" htmlFor="d-name">Name <span className="sf-required">*</span></label>
                <input id="d-name" name="name" type="text" className={ic('name')} placeholder="e.g. Ramesh Kumar" value={form.name} onChange={handleChange} autoComplete="off" />
                <FieldError msg={fieldErrors.name} />
              </div></div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="d-phone">Contact Number</label>
                  <input id="d-phone" name="phone" type="text" className={ic('phone')} placeholder="+91 9876543210" value={form.phone} onChange={handleChange} autoComplete="off" />
                  <FieldError msg={fieldErrors.phone} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="d-licenseNumber">License Number <span className="sf-required">*</span></label>
                  <input id="d-licenseNumber" name="licenseNumber" type="text" className={ic('licenseNumber')} placeholder="e.g. MH14 2019 0012345" value={form.licenseNumber} onChange={handleChange} autoComplete="off" />
                  <FieldError msg={fieldErrors.licenseNumber} />
                </div>
              </div>
            </form>
          )}
        </div>
        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="driver-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></> : <><Save size={15} /><span>{isEdit ? 'Update Driver' : 'Save Driver'}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDriverModal;
