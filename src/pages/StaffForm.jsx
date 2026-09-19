import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  validateName,
  validateStaffId,
  validateEmail,
  validatePhone,
  validateRole,
  VALID_ROLES,
} from '../utils/staffValidation';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = ${_NODE_URL}/api;

const StaffForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    name: '',
    staffId: '',
    email: '',
    phone: '',
    dateOfJoining: '',
    role: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
  });

  // Per-field validation error messages
  const [fieldErrors, setFieldErrors] = useState({});

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    if (isEditMode) {
      loadStaffDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadStaffDetails = async () => {
    setFetching(true);
    try {
      // Single staff endpoint — no fallback to full list fetch (performance fix)
      const res = await fetch(`${API_BASE_URL}/super-admin/staff/${id}`, {
        headers: authHeader(),
      });

      if (res.ok) {
        const staff = await res.json();
        populateStaffData(staff);
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: data.message || 'Staff member not found.' });
      }
    } catch (err) {
      console.error('Error fetching staff details:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server to load staff details.' });
    } finally {
      setFetching(false);
    }
  };

  const populateStaffData = (staff) => {
    let formattedDate = '';
    if (staff.dateOfJoining) {
      try {
        formattedDate = new Date(staff.dateOfJoining).toISOString().slice(0, 10);
      } catch {
        formattedDate = staff.dateOfJoining;
      }
    }

    setFormData({
      name: staff.name || '',
      staffId: staff.staffId || '',
      email: staff.email || '',
      phone: staff.phone || '',
      dateOfJoining: formattedDate,
      role: staff.role || '',
      bankName: staff.bankDetails?.bankName || '',
      accountHolderName: staff.bankDetails?.accountHolderName || '',
      accountNumber: staff.bankDetails?.accountNumber || '',
      ifscCode: staff.bankDetails?.ifscCode || '',
    });
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue =
      name === 'staffId' || name === 'ifscCode' ? value.toUpperCase() : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Clear the field error as the user types / selects
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate a single field on blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    let err = '';
    switch (name) {
      case 'name':      err = validateName(value);    break;
      case 'staffId':   err = validateStaffId(value); break;
      case 'email':     err = validateEmail(value);   break;
      case 'phone':     err = validatePhone(value);   break;
      case 'role':      err = validateRole(value);    break;
      default:          break;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    // Validate required fields
    const errors = {
      name:    validateName(formData.name),
      staffId: validateStaffId(formData.staffId),
      email:   validateEmail(formData.email),
      phone:   validatePhone(formData.phone),
      role:    validateRole(formData.role),
    };

    if (!formData.dateOfJoining) {
      errors.dateOfJoining = 'Date of Joining is required.';
    }

    const hasErrors = Object.values(errors).some((e) => e !== '');
    if (hasErrors) {
      setFieldErrors(errors);
      setFeedback({ type: 'error', message: 'Please fix the errors below before saving.' });
      return;
    }

    setLoading(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/super-admin/staff/${id}`
        : `${API_BASE_URL}/super-admin/staff`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({
          name: formData.name.trim(),
          staffId: formData.staffId.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim().replace(/\s/g, ''),
          dateOfJoining: formData.dateOfJoining,
          role: formData.role.trim(),
          bankDetails: {
            bankName: formData.bankName.trim(),
            accountHolderName: formData.accountHolderName.trim(),
            accountNumber: formData.accountNumber.trim(),
            ifscCode: formData.ifscCode.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Surface backend validation / uniqueness errors in the right field
        if (data.validationErrors) {
          setFieldErrors((prev) => ({ ...prev, ...data.validationErrors }));
        }
        throw new Error(
          data.message || (isEditMode ? 'Failed to update staff member' : 'Failed to add staff member')
        );
      }

      setFeedback({
        type: 'success',
        message: isEditMode
          ? `Staff member '${formData.name}' updated successfully.`
          : 'Staff member added successfully.',
      });

      setTimeout(() => {
        navigate('/staff');
      }, 1200);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || (isEditMode ? 'Error updating staff member.' : 'Error adding staff member.'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper: renders an inline error for a field
  const FieldError = ({ field }) =>
    fieldErrors[field] ? (
      <span className="form-field-error" role="alert">
        <AlertCircle size={13} />
        {fieldErrors[field]}
      </span>
    ) : null;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/staff')}
            title="Back to Staff"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEditMode ? 'Edit Staff Member' : 'Add New Staff'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update staff member profile, role assignment, and bank details'
                : 'Register a new staff member into the university system'}
            </p>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ marginBottom: '1.5rem' }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* staff-form wrapper keeps all content within the card width on mobile */}
      <div className="card staff-form-card">
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading staff details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout" noValidate>
            {/* ── Personal Information ── */}
            <div className="form-section">
              <h3 className="form-section-title">Personal Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="name">
                    Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
                    placeholder="e.g. Jane Smith"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError field="name" />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="staffId">
                    Staff ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="staffId"
                    name="staffId"
                    type="text"
                    className={`form-input${fieldErrors.staffId ? ' input-error' : ''}`}
                    placeholder="e.g. STF2024001"
                    value={formData.staffId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError field="staffId" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
                    placeholder="e.g. jane.smith@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError field="email" />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Phone Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={`form-input${fieldErrors.phone ? ' input-error' : ''}`}
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError field="phone" />
                </div>
              </div>

              <div className="form-row">
                {/* Date of Joining — show a visible text hint on mobile
                    because <input type="date"> hides its placeholder on iOS/Android.
                    We use a wrapper with a data-placeholder attribute handled in CSS. */}
                <div className="form-group">
                  <label className="form-label" htmlFor="dateOfJoining">
                    Date of Joining <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div
                    className={`date-input-wrapper${!formData.dateOfJoining ? ' date-empty' : ''}`}
                    data-placeholder="DD-MM-YYYY"
                  >
                    <input
                      id="dateOfJoining"
                      name="dateOfJoining"
                      type="date"
                      className={`form-input${fieldErrors.dateOfJoining ? ' input-error' : ''}`}
                      value={formData.dateOfJoining}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  <FieldError field="dateOfJoining" />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="role">
                    Role <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    className={`form-input${fieldErrors.role ? ' input-error' : ''}`}
                    value={formData.role}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <option value="">— Select Role —</option>
                    {VALID_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <FieldError field="role" />
                </div>
              </div>
            </div>

            {/* ── Bank Details ── */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Bank Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="bankName">
                    Bank Name
                  </label>
                  <input
                    id="bankName"
                    name="bankName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. State Bank of India"
                    value={formData.bankName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="accountHolderName">
                    Account Holder Name
                  </label>
                  <input
                    id="accountHolderName"
                    name="accountHolderName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jane Smith"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="accountNumber">
                    Account Number
                  </label>
                  <input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1234567890"
                    value={formData.accountNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ifscCode">
                    IFSC Code
                  </label>
                  <input
                    id="ifscCode"
                    name="ifscCode"
                    type="text"
                    className="form-input"
                    placeholder="e.g. SBIN0001234"
                    value={formData.ifscCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions-row" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/staff')}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin-animate" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isEditMode ? 'Update Staff' : 'Save Staff'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StaffForm;
