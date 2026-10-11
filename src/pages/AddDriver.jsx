/**
 * AddDriver.jsx — Add / Edit Driver
 *
 * Defects fixed:
 *   D8   Driver name: rejects numbers-only / special-char-only
 *   D9-11 Contact: exact format +91 XXXXXXXXXX
 *   D12  Duplicate license: client-side warning + backend enforces uniqueness
 *   D13  License format: Indian DL pattern
 *   Imp-21 License number is now mandatory
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  validateDriverName,
  validateContact,
  validateLicense,
} from '../utils/transportValidation';

const API_BASE_URL = 'http://localhost:5000/api';

const AddDriver = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isEditMode = Boolean(id);

  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(false);
  const [idLoading, setIdLoading] = useState(!isEditMode);
  const [feedback,  setFeedback]  = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const feedbackTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    driverId: '',
    name: '',
    phone: '',
    licenseNumber: '',
    status: 'ACTIVE',
  });

  const authHeader = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
  });

  // D3: auto-dismiss success notifications after 2 s
  const showFeedback = (type, message) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, message });
    if (type === 'success') {
      feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), 2000);
    }
  };

  useEffect(() => {
    if (isEditMode) loadDriverDetails();
    else            fetchNextDriverId();
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDriverDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/drivers/${id}`, { headers: authHeader() });
      if (res.ok) {
        const d = await res.json();
        setFormData({ driverId: d.driverId || '', name: d.name || '', phone: d.phone || '', licenseNumber: d.licenseNumber || '', status: d.status || 'ACTIVE' });
      } else {
        showFeedback('error', 'Driver not found.');
      }
    } catch { showFeedback('error', 'Unable to connect to server.'); }
    finally  { setFetching(false); }
  };

  const fetchNextDriverId = async () => {
    setIdLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/drivers/next-id`, { headers: authHeader() });
      const data = res.ok ? await res.json() : {};
      setFormData(prev => ({ ...prev, driverId: data.nextId || 101 }));
    } catch { setFormData(prev => ({ ...prev, driverId: 101 })); }
    finally  { setIdLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // Run all field-level validations and return an errors object
  const validate = () => {
    const errs = {};
    const nameErr = validateDriverName(formData.name);
    if (nameErr) errs.name = nameErr;
    const contactErr = validateContact(formData.phone);
    if (contactErr) errs.phone = contactErr;
    const licenseErr = validateLicense(formData.licenseNumber); // Imp-21: required
    if (licenseErr) errs.licenseNumber = licenseErr;
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
      const url    = isEditMode ? `${API_BASE_URL}/transport/drivers/${id}` : `${API_BASE_URL}/transport/drivers`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method, headers: authHeader(),
        body: JSON.stringify({
          driverId:      Number(formData.driverId),
          name:          formData.name.trim(),
          phone:         formData.phone.trim(),
          licenseNumber: formData.licenseNumber.trim().toUpperCase(),
          status:        formData.status,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // D12: backend duplicate-key error surfaced here
        if (data.message && data.message.toLowerCase().includes('license')) {
          setFieldErrors(prev => ({ ...prev, licenseNumber: data.message }));
        }
        showFeedback('error', data.message || 'Failed to save driver.');
        setLoading(false);
        return;
      }

      showFeedback('success', isEditMode ? 'Driver updated successfully!' : 'Driver added successfully!');
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
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{isEditMode ? 'Edit Driver' : 'Add Driver'}</h1>
            <p className="page-subtitle">{isEditMode ? 'Update driver credentials and license details' : 'Register a new driver for campus transport vehicles'}</p>
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
            <p>Loading driver details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout" noValidate>
            <div className="form-section">
              <h3 className="form-section-title">Driver Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="driverId" className="form-label">
                    Driver ID {isEditMode ? '' : '(Auto-Generated)'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" id="driverId" name="driverId" className="form-input"
                      value={formData.driverId} onChange={handleChange}
                      placeholder={idLoading ? 'Generating ID...' : 'e.g. 101'} required />
                    {idLoading && <Loader2 size={16} className="spin-animate" style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-secondary)' }} />}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select id="status" name="status" className="form-input" value={formData.status} onChange={handleChange}>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* D8: Name with inline validation */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="name" className="form-label">
                  Driver Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="text" id="name" name="name"
                  className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name} onChange={handleChange} />
                <FieldError name="name" />
              </div>

              <div className="form-row" style={{ marginTop: '1rem' }}>
                {/* D9-11: Contact with exact format requirement */}
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">Contact Number</label>
                  <input type="text" id="phone" name="phone"
                    className={`form-input${fieldErrors.phone ? ' input-error' : ''}`}
                    placeholder="+91 9876543210"
                    value={formData.phone} onChange={handleChange} />
                  <small className="form-field-hint">Format: +91 followed by 10 digits</small>
                  <FieldError name="phone" />
                </div>

                {/* D13 + Imp-21: License mandatory + format */}
                <div className="form-group">
                  <label htmlFor="licenseNumber" className="form-label">
                    License Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" id="licenseNumber" name="licenseNumber"
                    className={`form-input${fieldErrors.licenseNumber ? ' input-error' : ''}`}
                    placeholder="e.g. MH14 2019 0012345"
                    value={formData.licenseNumber} onChange={handleChange} />
                  <small className="form-field-hint">Indian DL format: SS DD YYYY NNNNNNN</small>
                  <FieldError name="licenseNumber" />
                </div>
              </div>
            </div>

            {/* D5: transport-form-actions keeps Cancel+Save right-aligned on mobile */}
            <div className="form-actions-row transport-form-actions" style={{ marginTop: '1.75rem' }}>
              <button type="button" className="books-btn books-btn-ghost" onClick={() => navigate('/transport')} disabled={loading}>Cancel</button>
              <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
                {loading ? <><Loader2 size={16} className="spin-animate" /><span>Saving...</span></> : <><Save size={16} /><span>{isEditMode ? 'Update Driver' : 'Save Driver'}</span></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddDriver;
