/**
 * AddVehicle.jsx — Add / Edit Vehicle
 *
 * Defects fixed:
 *   D14   Vehicle ID: read-only on Edit (system-assigned string)
 *   D15   Duplicate registration: backend enforces; frontend surfaces error
 *   D16   Vehicle name/model: requires at least one alphanumeric char
 *   D17   Registration format: Indian plate pattern
 *   Imp-23 Registration is now mandatory
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { validateVehicleId, validateVehicleName, validateRegistration } from '../utils/transportValidation';

const _IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const AddVehicle = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isEditMode = Boolean(id);

  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const feedbackTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    vehicleId: '', name: '', vehicleNumber: '', capacity: 40, status: 'ACTIVE',
  });

  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  const showFeedback = (type, message) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, message });
    if (type === 'success')
      feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), 2000);
  };

  useEffect(() => {
    if (isEditMode) loadVehicleDetails();
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadVehicleDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/vehicles/${id}`, { headers: authHeader() });
      if (res.ok) {
        const v = await res.json();
        setFormData({ vehicleId: v.vehicleId || '', name: v.name || '', vehicleNumber: v.vehicleNumber || '', capacity: v.capacity || 40, status: v.status || 'ACTIVE' });
      } else {
        showFeedback('error', 'Vehicle not found.');
      }
    } catch { showFeedback('error', 'Unable to connect to server.'); }
    finally  { setFetching(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!isEditMode) {
      const idErr = validateVehicleId(formData.vehicleId);
      if (idErr) errs.vehicleId = idErr;
    }
    const nameErr = validateVehicleName(formData.name);
    if (nameErr) errs.name = nameErr;
    // Imp-23 + D17: registration mandatory + format
    const regErr = validateRegistration(formData.vehicleNumber);
    if (regErr) errs.vehicleNumber = regErr;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showFeedback('', '');

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showFeedback('error', 'Please fix the highlighted errors before saving.');
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const url    = isEditMode ? `${API_BASE_URL}/transport/vehicles/${id}` : `${API_BASE_URL}/transport/vehicles`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method, headers: authHeader(),
        body: JSON.stringify({
          vehicleId:     formData.vehicleId.trim(),
          name:          formData.name.trim(),
          vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
          capacity:      Number(formData.capacity) || 40,
          status:        formData.status,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // D15: duplicate registration / vehicle ID error
        if (data.message && (data.message.toLowerCase().includes('registration') || data.message.toLowerCase().includes('vehicle number'))) {
          setFieldErrors(prev => ({ ...prev, vehicleNumber: data.message }));
        }
        showFeedback('error', data.message || 'Failed to save vehicle.');
        setLoading(false);
        return;
      }

      showFeedback('success', isEditMode ? 'Vehicle updated successfully!' : 'Vehicle added successfully!');
      setTimeout(() => navigate('/transport'), 1200);
    } catch {
      showFeedback('error', 'Unable to connect to server. Please try again.');
      setLoading(false);
    }
  };

  const FieldError = ({ name }) =>
    fieldErrors[name]
      ? <p className="form-field-error" style={{ marginTop: '0.25rem' }}>{fieldErrors[name]}</p>
      : null;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="btn-back" onClick={() => navigate('/transport')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{isEditMode ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
            <p className="page-subtitle">{isEditMode ? 'Update fleet vehicle information' : 'Register a new bus or transport vehicle'}</p>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`} style={{ marginBottom: '1.5rem' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="card" style={{ maxWidth: '640px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading vehicle details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout" noValidate>
            <div className="form-section">
              <h3 className="form-section-title">Vehicle Information</h3>

              <div className="form-row">
                {/* D14: read-only on Edit */}
                <div className="form-group">
                  <label htmlFor="vehicleId" className="form-label">
                    Vehicle ID <span style={{ color: '#ef4444' }}>*</span>
                    {isEditMode && <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '6px' }}>(cannot change)</span>}
                  </label>
                  <input type="text" id="vehicleId" name="vehicleId"
                    className={`form-input${fieldErrors.vehicleId ? ' input-error' : ''}${isEditMode ? ' eb-readonly-id' : ''}`}
                    placeholder="e.g. BUS-101"
                    value={formData.vehicleId} onChange={handleChange}
                    readOnly={isEditMode} disabled={isEditMode}
                    style={isEditMode ? { backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.8 } : undefined} />
                  <FieldError name="vehicleId" />
                </div>

                {/* D16: name/model validation */}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Vehicle Name / Model <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" id="name" name="name"
                    className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
                    placeholder="e.g. Tata Starbus 40-Seater"
                    value={formData.name} onChange={handleChange} />
                  <FieldError name="name" />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '1rem' }}>
                {/* D17 + Imp-23: registration mandatory + format */}
                <div className="form-group">
                  <label htmlFor="vehicleNumber" className="form-label">
                    Registration / Plate Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" id="vehicleNumber" name="vehicleNumber"
                    className={`form-input${fieldErrors.vehicleNumber ? ' input-error' : ''}`}
                    placeholder="e.g. MH12AB1234"
                    value={formData.vehicleNumber} onChange={handleChange} />
                  <small className="form-field-hint">Indian plate format: MH 12 AB 1234</small>
                  <FieldError name="vehicleNumber" />
                </div>

                <div className="form-group">
                  <label htmlFor="capacity" className="form-label">Seating Capacity</label>
                  <input type="number" id="capacity" name="capacity" className="form-input"
                    placeholder="e.g. 40" min="1"
                    value={formData.capacity} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="status" className="form-label">Operational Status</label>
                <select id="status" name="status" className="form-input" value={formData.status} onChange={handleChange}>
                  <option value="ACTIVE">Active (In Service)</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {/* D5: transport-form-actions right-aligns on mobile */}
            <div className="form-actions-row transport-form-actions" style={{ marginTop: '1.75rem' }}>
              <button type="button" className="books-btn books-btn-ghost" onClick={() => navigate('/transport')} disabled={loading}>Cancel</button>
              <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
                {loading ? <><Loader2 size={16} className="spin-animate" /><span>Saving...</span></> : <><Save size={16} /><span>{isEditMode ? 'Update Vehicle' : 'Save Vehicle'}</span></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddVehicle;
