import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  validateName,
  validateStaffId,
  validateEmail,
  validatePhone,
  validateRole,
  VALID_ROLES,
} from '../utils/staffValidation';

const API_BASE_URL = 'http://localhost:5000/api';

// ---------------------------------------------------------------------------
// FieldError — small red helper shown beneath an invalid input
// ---------------------------------------------------------------------------
const FieldError = ({ message }) =>
  message ? (
    <p className="sf-field-error" role="alert">
      <AlertCircle size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
      {message}
    </p>
  ) : null;

// ---------------------------------------------------------------------------
// StaffFormModal
//
// Props:
//   isOpen    — boolean
//   staffId   — string | null   (null = Add mode, string = Edit mode)
//   onClose   — () => void
//   onSuccess — () => void
// ---------------------------------------------------------------------------
const StaffFormModal = ({ isOpen, staffId, onClose, onSuccess }) => {
  const isEditMode = Boolean(staffId);

  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const emptyForm = {
    name: '', staffId: '', email: '', phone: '',
    dateOfJoining: '', role: '',
    bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '',
  };

  const [formData, setFormData]       = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched]         = useState({});

  // ── Auth ──────────────────────────────────────────────────────────────
  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  // ── Reset ──────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setFieldErrors({});
    setTouched({});
    setFeedback({ type: '', message: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode) { resetForm(); loadStaffDetails(); }
    else resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, staffId]);

  // ── Lock body scroll ──────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Escape key ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  // ── Load for Edit ─────────────────────────────────────────────────────
  const loadStaffDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/staff/${staffId}`, {
        headers: authHeader(),
      });
      if (res.ok) {
        populateStaffData(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: data.message || 'Staff member not found.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Unable to connect to server.' });
    } finally {
      setFetching(false);
    }
  };

  const populateStaffData = (staff) => {
    let formattedDate = '';
    if (staff.dateOfJoining) {
      try { formattedDate = new Date(staff.dateOfJoining).toISOString().slice(0, 10); }
      catch { formattedDate = staff.dateOfJoining; }
    }
    setFormData({
      name:               staff.name                       || '',
      staffId:            staff.staffId                    || '',
      email:              staff.email                      || '',
      phone:              staff.phone                      || '',
      dateOfJoining:      formattedDate,
      role:               staff.role                       || '',
      bankName:           staff.bankDetails?.bankName            || '',
      accountHolderName:  staff.bankDetails?.accountHolderName   || '',
      accountNumber:      staff.bankDetails?.accountNumber       || '',
      ifscCode:           staff.bankDetails?.ifscCode            || '',
    });
    setFieldErrors({});
    setTouched({});
  };

  // ── onChange ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = (name === 'staffId' || name === 'ifscCode')
      ? value.toUpperCase()
      : value;
    // Strip spaces and symbols from staffId — letters and digits only
    const sanitised = name === 'staffId'
      ? value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      : newValue;
    setFormData((prev) => ({ ...prev, [name]: sanitised }));
    if (touched[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: getFieldError(name, sanitised) }));
    }
  };

  // ── onBlur ────────────────────────────────────────────────────────────
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: getFieldError(name, value) }));
  };

  const getFieldError = (name, value) => {
    switch (name) {
      case 'name':    return validateName(value);
      case 'staffId': return validateStaffId(value);
      case 'email':   return validateEmail(value);
      case 'phone':   return validatePhone(value);
      case 'role':    return validateRole(value);
      case 'dateOfJoining': return value ? '' : 'Date of Joining is required.';
      default:        return '';
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const allTouched = { name: true, staffId: true, email: true, phone: true, role: true, dateOfJoining: true };
    setTouched(allTouched);

    const errors = {
      name:          validateName(formData.name),
      staffId:       validateStaffId(formData.staffId),
      email:         validateEmail(formData.email),
      phone:         validatePhone(formData.phone),
      role:          validateRole(formData.role),
      dateOfJoining: formData.dateOfJoining ? '' : 'Date of Joining is required.',
    };

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      const firstErr = Object.keys(errors).find((k) => errors[k]);
      document.getElementById(`stf-${firstErr}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const url    = isEditMode
        ? `${API_BASE_URL}/super-admin/staff/${staffId}`
        : `${API_BASE_URL}/super-admin/staff`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({
          name:          formData.name.trim(),
          staffId:       formData.staffId.trim(),
          email:         formData.email.trim(),
          phone:         formData.phone.trim().replace(/\s/g, ''),
          dateOfJoining: formData.dateOfJoining,
          role:          formData.role.trim(),
          bankDetails: {
            bankName:           formData.bankName.trim(),
            accountHolderName:  formData.accountHolderName.trim(),
            accountNumber:      formData.accountNumber.trim(),
            ifscCode:           formData.ifscCode.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.validationErrors) {
          setFieldErrors((prev) => ({ ...prev, ...data.validationErrors }));
        }
        throw new Error(data.message || (isEditMode ? 'Failed to update staff member' : 'Failed to add staff member'));
      }

      setFeedback({
        type: 'success',
        message: isEditMode
          ? `Staff member '${formData.name}' updated successfully.`
          : `Staff member '${formData.name}' added successfully.`,
      });

      setTimeout(() => onSuccess(), 900);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || (isEditMode ? 'Error updating staff member.' : 'Error adding staff member.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `sf-input${fieldErrors[field] && touched[field] ? ' sf-input-error' : ''}`;

  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className="sf-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Edit Staff Member' : 'Add New Staff'}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="sf-modal">

        {/* ── Header ── */}
        <div className="sf-header">
          <div className="sf-header-left">
            <div className="sf-header-icon">
              {isEditMode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                </svg>
              )}
            </div>
            <div>
              <h2 className="sf-title">{isEditMode ? 'Edit Staff Member' : 'Add New Staff'}</h2>
              <p className="sf-subtitle">
                {isEditMode
                  ? "Update staff member's profile, role and bank details"
                  : 'Register a new staff member into the university system'}
              </p>
            </div>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="sf-body">

          {feedback.message && (
            <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>
              {feedback.type === 'success'
                ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                : <AlertCircle   size={16} style={{ flexShrink: 0 }} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {fetching ? (
            <div className="sf-loading">
              <Loader2 size={26} className="spin-animate" />
              <p>Loading staff details…</p>
            </div>
          ) : (
            <form id="staff-form" onSubmit={handleSubmit} className="sf-form" noValidate>

              {/* ── Personal Information ── */}
              <div className="sf-section-label">Personal Information</div>

              {/* Name + Staff ID */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-name">
                    Name <span className="sf-required">*</span>
                  </label>
                  <input
                    id="stf-name" name="name" type="text"
                    className={inputClass('name')}
                    placeholder="e.g. Jane Smith"
                    value={formData.name}
                    onChange={handleChange} onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError message={touched.name ? fieldErrors.name : ''} />
                </div>

                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-staffId">
                    Staff ID <span className="sf-required">*</span>
                  </label>
                  <input
                    id="stf-staffId" name="staffId" type="text"
                    className={inputClass('staffId')}
                    placeholder="e.g. STF2024001"
                    value={formData.staffId}
                    onChange={handleChange} onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError message={touched.staffId ? fieldErrors.staffId : ''} />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-email">
                    Email Address <span className="sf-required">*</span>
                  </label>
                  <input
                    id="stf-email" name="email" type="email"
                    className={inputClass('email')}
                    placeholder="e.g. jane.smith@university.edu"
                    value={formData.email}
                    onChange={handleChange} onBlur={handleBlur}
                    autoComplete="off" inputMode="email"
                  />
                  <FieldError message={touched.email ? fieldErrors.email : ''} />
                </div>

                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-phone">
                    Phone Number <span className="sf-required">*</span>
                  </label>
                  <input
                    id="stf-phone" name="phone" type="tel"
                    inputMode="numeric" maxLength={10}
                    className={inputClass('phone')}
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleChange} onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError message={touched.phone ? fieldErrors.phone : ''} />
                </div>
              </div>

              {/* Date of Joining + Role */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-dateOfJoining">
                    Date of Joining <span className="sf-required">*</span>
                  </label>
                  {/* Single native date input — no wrapper, no CSS pseudo-placeholder */}
                  <input
                    id="stf-dateOfJoining" name="dateOfJoining" type="date"
                    className={inputClass('dateOfJoining')}
                    value={formData.dateOfJoining}
                    onChange={handleChange} onBlur={handleBlur}
                  />
                  <FieldError message={touched.dateOfJoining ? fieldErrors.dateOfJoining : ''} />
                </div>

                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-role">
                    Role <span className="sf-required">*</span>
                  </label>
                  <select
                    id="stf-role" name="role"
                    className={inputClass('role')}
                    value={formData.role}
                    onChange={handleChange} onBlur={handleBlur}
                  >
                    <option value="">— Select Role —</option>
                    {VALID_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <FieldError message={touched.role ? fieldErrors.role : ''} />
                </div>
              </div>

              {/* ── Bank Details ── */}
              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>
                Bank Details
                <span className="sf-optional">optional</span>
              </div>

              {/* Bank Name + Account Holder Name */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-bankName">Bank Name</label>
                  <input
                    id="stf-bankName" name="bankName" type="text"
                    className="sf-input"
                    placeholder="e.g. State Bank of India"
                    value={formData.bankName}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>

                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-accountHolderName">Account Holder Name</label>
                  <input
                    id="stf-accountHolderName" name="accountHolderName" type="text"
                    className="sf-input"
                    placeholder="e.g. Jane Smith"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Account Number + IFSC */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-accountNumber">Account Number</label>
                  <input
                    id="stf-accountNumber" name="accountNumber" type="text"
                    className="sf-input"
                    placeholder="e.g. 1234567890"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>

                <div className="sf-group">
                  <label className="sf-label" htmlFor="stf-ifscCode">IFSC Code</label>
                  <input
                    id="stf-ifscCode" name="ifscCode" type="text"
                    className="sf-input"
                    placeholder="e.g. SBIN0001234"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
              </div>

            </form>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="staff-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading ? (
              <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></>
            ) : (
              <><Save size={15} /><span>{isEditMode ? 'Update Staff' : 'Add Staff'}</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default StaffFormModal;
