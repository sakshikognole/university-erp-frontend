import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { validateVehicleId, validateVehicleName, validateRegistration } from '../utils/transportValidation';

const API_BASE_URL = 'http://localhost:5000/api';
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('erp_token')}` });

const FieldError = ({ msg }) => msg ? <p className="sf-field-error"><AlertCircle size={12} style={{ flexShrink: 0 }} />{msg}</p> : null;

const AddVehicleModal = ({ isOpen, vehicleId: vehicleIdProp, onClose, onSuccess }) => {
  const isEdit = Boolean(vehicleIdProp);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const emptyForm = { vehicleId: '', name: '', vehicleNumber: '', capacity: 40, status: 'ACTIVE' };
  const [form, setForm] = useState(emptyForm);

  const reset = useCallback(() => { setForm(emptyForm); setFieldErrors({}); setFeedback({ type: '', message: '' }); }, []); // eslint-disable-line

  useEffect(() => {
    if (!isOpen) return;
    reset();
    if (isEdit) loadVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, vehicleIdProp]);

  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  useEffect(() => { const f = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); }; document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f); }, [isOpen, loading, onClose]);

  const loadVehicle = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/vehicles/${vehicleIdProp}`, { headers: authHeader() });
      if (res.ok) { const v = await res.json(); setForm({ vehicleId: v.vehicleId || '', name: v.name || '', vehicleNumber: v.vehicleNumber || '', capacity: v.capacity || 40, status: v.status || 'ACTIVE' }); }
      else setFeedback({ type: 'error', message: 'Vehicle not found.' });
    } catch { setFeedback({ type: 'error', message: 'Unable to connect.' }); }
    finally { setFetching(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!isEdit) { const e = validateVehicleId(form.vehicleId); if (e) errs.vehicleId = e; }
    const n = validateVehicleName(form.name); if (n) errs.name = n;
    const r = validateRegistration(form.vehicleNumber); if (r) errs.vehicleNumber = r;
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
      const url = isEdit ? `${API_BASE_URL}/transport/vehicles/${vehicleIdProp}` : `${API_BASE_URL}/transport/vehicles`;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: authHeader(), body: JSON.stringify({ vehicleId: form.vehicleId.trim(), name: form.name.trim(), vehicleNumber: form.vehicleNumber.trim().toUpperCase(), capacity: Number(form.capacity) || 40, status: form.status }) });
      const data = await res.json();
      if (!res.ok) { if (data.message?.toLowerCase().includes('registration') || data.message?.toLowerCase().includes('vehicle number')) setFieldErrors((p) => ({ ...p, vehicleNumber: data.message })); setFeedback({ type: 'error', message: data.message || 'Failed to save.' }); return; }
      setFeedback({ type: 'success', message: data.message || (isEdit ? 'Vehicle updated.' : 'Vehicle added.') });
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
            <div className="sf-header-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>
            <div><h2 className="sf-title">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h2><p className="sf-subtitle">{isEdit ? 'Update fleet vehicle info' : 'Register a new transport vehicle'}</p></div>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="sf-body">
          {feedback.message && <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>{feedback.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}<span>{feedback.message}</span></div>}
          {fetching ? <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading…</p></div> : (
            <form id="vehicle-form" onSubmit={handleSubmit} className="sf-form" noValidate>
              <div className="sf-section-label">Vehicle Information</div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="v2-vehicleId">Vehicle ID <span className="sf-required">*</span>{isEdit && <span className="sf-optional">read-only</span>}</label>
                  <input id="v2-vehicleId" name="vehicleId" type="text" className={`${ic('vehicleId')}${isEdit ? ' sf-input-readonly' : ''}`} placeholder="e.g. BUS-101" value={form.vehicleId} onChange={handleChange} readOnly={isEdit} disabled={isEdit} />
                  <FieldError msg={fieldErrors.vehicleId} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="v2-name">Name / Model <span className="sf-required">*</span></label>
                  <input id="v2-name" name="name" type="text" className={ic('name')} placeholder="e.g. Tata Starbus 40-Seater" value={form.name} onChange={handleChange} autoComplete="off" />
                  <FieldError msg={fieldErrors.name} />
                </div>
              </div>
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="v2-vehicleNumber">Registration No. <span className="sf-required">*</span></label>
                  <input id="v2-vehicleNumber" name="vehicleNumber" type="text" className={ic('vehicleNumber')} placeholder="e.g. MH12AB1234" value={form.vehicleNumber} onChange={handleChange} autoComplete="off" />
                  <FieldError msg={fieldErrors.vehicleNumber} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="v2-capacity">Capacity</label>
                  <input id="v2-capacity" name="capacity" type="number" min="1" className="sf-input" placeholder="e.g. 40" value={form.capacity} onChange={handleChange} />
                </div>
              </div>
              <div className="sf-row"><div className="sf-group">
                <label className="sf-label" htmlFor="v2-status">Status</label>
                <select id="v2-status" name="status" className="sf-input" value={form.status} onChange={handleChange}>
                  <option value="ACTIVE">Active</option><option value="MAINTENANCE">Maintenance</option><option value="INACTIVE">Inactive</option>
                </select>
              </div></div>
            </form>
          )}
        </div>
        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="vehicle-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></> : <><Save size={15} /><span>{isEdit ? 'Update Vehicle' : 'Save Vehicle'}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
