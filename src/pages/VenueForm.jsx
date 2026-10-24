import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const VENUE_ID_REGEX  = /^(?=[A-Z0-9-]*[A-Z])(?=[A-Z0-9-]*[0-9])[A-Z0-9]{1,10}(-[A-Z0-9]{1,10}){0,4}$/;
const VENUE_NAME_REGEX = /^[A-Za-z][A-Za-z0-9 ,.\-'()]{1,99}$/;

const FieldError = ({ message }) =>
  message ? (
    <p className="sf-field-error" role="alert">
      <AlertCircle size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
      {message}
    </p>
  ) : null;

// ---------------------------------------------------------------------------
// VenueFormModal — Props: isOpen, venueId (null=Add), onClose, onSuccess
// ---------------------------------------------------------------------------
const VenueFormModal = ({ isOpen, venueId, onClose, onSuccess }) => {
  const isEditMode = Boolean(venueId);

  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched,     setTouched]     = useState({});
  const [facilityInput, setFacilityInput] = useState({ name: '', details: '' });

  const emptyForm = { venueId: '', name: '', capacity: '', facilities: [], status: 'ACTIVE' };
  const [formData, setFormData] = useState(emptyForm);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const reset = useCallback(() => {
    setFormData(emptyForm);
    setFieldErrors({});
    setTouched({});
    setFeedback({ type: '', message: '' });
    setFacilityInput({ name: '', details: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    reset();
    if (isEditMode) loadVenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, venueId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  const loadVenue = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/venues/${venueId}`, { headers: authHeader() });
      if (res.ok) {
        const v = await res.json();
        setFormData({
          venueId:    v.venueId    || '',
          name:       v.name       || '',
          capacity:   v.capacity   || '',
          facilities: v.facilities || [],
          status:     v.status     || 'ACTIVE',
        });
      } else {
        setFeedback({ type: 'error', message: 'Venue not found.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Unable to connect to server.' });
    } finally {
      setFetching(false);
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'venueId': {
        const v = (value || '').trim().toUpperCase();
        if (!v) return 'Venue ID is required.';
        if (!VENUE_ID_REGEX.test(v)) return 'Invalid Venue ID (e.g. HALL-101).';
        return '';
      }
      case 'name': {
        const v = (value || '').trim();
        if (!v) return 'Venue Name is required.';
        if (!VENUE_NAME_REGEX.test(v)) return 'Invalid Venue Name (e.g. Main Auditorium).';
        return '';
      }
      case 'capacity':
        if (value === '' || value === null || value === undefined) return 'Capacity is required.';
        if (Number(value) < 1) return 'Capacity must be at least 1.';
        return '';
      case 'status':
        return value ? '' : 'Status is required.';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // Facilities
  const handleAddFacility = () => {
    const fname = facilityInput.name.trim();
    if (!fname) return;
    if (formData.facilities.some((f) => f.name === fname)) return;
    setFormData((prev) => ({ ...prev, facilities: [...prev.facilities, { name: fname, details: facilityInput.details.trim() }] }));
    setFacilityInput({ name: '', details: '' });
  };

  const handleRemoveFacility = (name) => {
    setFormData((prev) => ({ ...prev, facilities: prev.facilities.filter((f) => f.name !== name) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    setTouched({ venueId: true, name: true, capacity: true, status: true });
    const errors = {};
    ['venueId', 'name', 'capacity', 'status'].forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) errors[f] = err;
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const url    = isEditMode ? `${API_BASE_URL}/super-admin/venues/${venueId}` : `${API_BASE_URL}/super-admin/venues`;
      const method = isEditMode ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method, headers: authHeader(),
        body: JSON.stringify({
          venueId:    formData.venueId.trim().toUpperCase(),
          name:       formData.name.trim(),
          capacity:   Number(formData.capacity),
          facilities: formData.facilities,
          status:     formData.status.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFeedback({ type: 'error', message: data.message || 'Failed to save venue.' }); return; }
      setFeedback({ type: 'success', message: data.message || (isEditMode ? 'Venue updated successfully.' : 'Venue created successfully.') });
      setTimeout(() => onSuccess(), 900);
    } catch {
      setFeedback({ type: 'error', message: 'Unable to connect to the server.' });
    } finally {
      setLoading(false);
    }
  };

  const ic = (f) => `sf-input${fieldErrors[f] && touched[f] ? ' sf-input-error' : ''}`;

  if (!isOpen) return null;

  return (
    <div className="sf-overlay" role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="sf-modal">

        <div className="sf-header">
          <div className="sf-header-left">
            <div className="sf-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <h2 className="sf-title">{isEditMode ? 'Edit Venue' : 'Add New Venue'}</h2>
              <p className="sf-subtitle">{isEditMode ? 'Update venue information and facilities' : 'Create a new venue record with facility information'}</p>
            </div>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="sf-body">
          {feedback.message && (
            <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {fetching ? (
            <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading venue details…</p></div>
          ) : (
            <form id="venue-form" onSubmit={handleSubmit} className="sf-form" noValidate>

              <div className="sf-section-label">Venue Information</div>

              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="v-venueId">Venue ID <span className="sf-required">*</span></label>
                  <input id="v-venueId" name="venueId" type="text" className={ic('venueId')}
                    placeholder="e.g. HALL-101" value={formData.venueId}
                    onChange={handleChange} onBlur={handleBlur} autoComplete="off" />
                  <FieldError message={touched.venueId ? fieldErrors.venueId : ''} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="v-name">Venue Name <span className="sf-required">*</span></label>
                  <input id="v-name" name="name" type="text" className={ic('name')}
                    placeholder="e.g. Main Auditorium" value={formData.name}
                    onChange={handleChange} onBlur={handleBlur} autoComplete="off" />
                  <FieldError message={touched.name ? fieldErrors.name : ''} />
                </div>
              </div>

              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="v-capacity">Capacity <span className="sf-required">*</span></label>
                  <input id="v-capacity" name="capacity" type="number" min="1" className={ic('capacity')}
                    placeholder="e.g. 500" value={formData.capacity}
                    onChange={handleChange} onBlur={handleBlur} />
                  <FieldError message={touched.capacity ? fieldErrors.capacity : ''} />
                </div>
                <div className="sf-group">
                  <label className="sf-label" htmlFor="v-status">Status <span className="sf-required">*</span></label>
                  <select id="v-status" name="status" className={ic('status')}
                    value={formData.status} onChange={handleChange} onBlur={handleBlur}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                  <FieldError message={touched.status ? fieldErrors.status : ''} />
                </div>
              </div>

              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>
                Facilities <span className="sf-optional">optional</span>
              </div>

              <div className="sf-custom-input-row">
                <div className="sf-group" style={{ flex: 1 }}>
                  <label className="sf-label" htmlFor="v-facilityName">Facility Name</label>
                  <input id="v-facilityName" type="text" className="sf-input"
                    placeholder="e.g. Projector, AC"
                    value={facilityInput.name}
                    onChange={(e) => setFacilityInput((p) => ({ ...p, name: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFacility(); } }} />
                </div>
                <div className="sf-group" style={{ flex: 1 }}>
                  <label className="sf-label" htmlFor="v-facilityDetails">Details</label>
                  <input id="v-facilityDetails" type="text" className="sf-input"
                    placeholder="e.g. 4K resolution"
                    value={facilityInput.details}
                    onChange={(e) => setFacilityInput((p) => ({ ...p, details: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFacility(); } }} />
                </div>
                <button type="button" className="sf-add-custom-btn" onClick={handleAddFacility} title="Add facility" disabled={!facilityInput.name.trim()}>
                  <Plus size={15} /><span>Add</span>
                </button>
              </div>

              {formData.facilities.length > 0 && (
                <div className="sf-custom-list">
                  {formData.facilities.map((f, i) => (
                    <div key={i} className="sf-custom-item">
                      <span className="sf-custom-key">{f.name}</span>
                      {f.details && <><span className="sf-custom-sep">—</span><span className="sf-custom-val">{f.details}</span></>}
                      <button type="button" className="sf-custom-remove" onClick={() => handleRemoveFacility(f.name)} title="Remove">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </form>
          )}
        </div>

        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="venue-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></> : <><Save size={15} /><span>{isEditMode ? 'Update Venue' : 'Save Venue'}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueFormModal;
