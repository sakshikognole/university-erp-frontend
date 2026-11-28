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

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

// Roles that require a Department assignment (teacher-type roles)
const TEACHER_ROLES = [
  'Professor', 'Associate Professor', 'Assistant Professor',
  'Lecturer', 'Head of Department', 'Dean', 'Teacher',
];

// ─── FieldError helper ────────────────────────────────────────────────────────
const FieldError = ({ message }) =>
  message ? (
    <p className="sf-field-error" role="alert">
      <AlertCircle size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
      {message}
    </p>
  ) : null;

// ─────────────────────────────────────────────────────────────────────────────
// StaffFormModal
// Props:
//   isOpen    — boolean
//   staffId   — string | null   (null = Add, string = Edit)
//   onClose   — () => void
//   onSuccess — () => void
// ─────────────────────────────────────────────────────────────────────────────
const StaffFormModal = ({ isOpen, staffId, onClose, onSuccess }) => {
  const isEditMode = Boolean(staffId);

  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(false);
  const [feedback, setFeedback]   = useState({ type: '', message: '' });
  const [departments, setDepartments] = useState([]);

  const emptyForm = {
    name: '', staffId: '', email: '', phone: '',
    dateOfJoining: '', role: '', department: '',
    bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '',
  };

  const [formData, setFormData]       = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched]         = useState({});

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const isTeacherRole = TEACHER_ROLES.includes(formData.role);

  // ── Reset ───────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setFieldErrors({});
    setTouched({});
    setFeedback({ type: '', message: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Open / close ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode) { resetForm(); loadStaffDetails(); }
    else resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, staffId]);

  // ── Fetch departments (for Teacher role dropdown) ─────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const fetchDepts = async () => {
      try {
        const token = localStorage.getItem('erp_token');
        const res = await fetch(`${API_BASE_URL}/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDepartments(Array.isArray(data) ? data : []);
        }
      } catch { /* non-fatal */ }
    };
    fetchDepts();
  }, [isOpen]);

  // ── Scroll lock ───────────────────────────────────────────────────────
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
      const res = await fetch(`${API_BASE_URL}/super-admin/staff/${staffId}`, { headers: authHeader() });
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
      name:              staff.name                            || '',
      staffId:           staff.staffId                        || '',
      email:             staff.email                          || '',
      phone:             staff.phone                          || '',
      dateOfJoining:     formattedDate,
      role:              staff.role                           || '',
      department:        staff.department                     || '',
      bankName:          staff.bankDetails?.bankName          || '',
      accountHolderName: staff.bankDetails?.accountHolderName || '',
      accountNumber:     staff.bankDetails?.accountNumber     || '',
      ifscCode:          staff.bankDetails?.ifscCode          || '',
    });
    setFieldErrors({});
    setTouched({});
  };

  // ── onChange ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitised = value;
    if (name === 'staffId') sanitised = value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
    if (name === 'ifscCode') sanitised = value.toUpperCase();
    // When role changes away from a teacher role, clear department
    if (name === 'role' && !TEACHER_ROLES.includes(value)) {
      setFormData((prev) => ({ ...prev, role: value, department: '' }));
      if (touched[name]) setFieldErrors((prev) => ({ ...prev, role: getFieldError(name, value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: sanitised }));
    if (touched[name]) setFieldErrors((prev) => ({ ...prev, [name]: getFieldError(name, sanitised) }));
  };

  // ── onBlur ────────────────────────────────────────────────────────────
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: getFieldError(name, value) }));
  };

  const getFieldError = (name, value) => {
    switch (name) {
      case 'name':         return validateName(value);
      case 'staffId':      return validateStaffId(value);
      case 'email':        return validateEmail(value);
      case 'phone':        return validatePhone(value);
      case 'role':         return validateRole(value);
      case 'dateOfJoining': return value ? '' : 'Date of Joining is required.';
      default:             return '';
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
          department:    formData.department.trim(),
          bankDetails: {
            bankName:          formData.bankName.trim(),
            accountHolderName: formData.accountHolderName.trim(),
            accountNumber:     formData.accountNumber.trim(),
            ifscCode:          formData.ifscCode.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.validationErrors) setFieldErrors((prev) => ({ ...prev, ...data.validationErrors }));
        throw new Error(data.message || (isEditMode ? 'Failed to update staff member' : 'Failed to add staff member'));
      }

      setFeedback({
        type: 'success',
        message: isEditMode
          ? `Staff member '${formData.name}' updated successfully.`
          : `Staff member '${formData.name}' added successfully.${isTeacherRole ? ' Teacher login created with password: Teacher@123' : ''}`,
      });

      setTimeout(() => onSuccess(), 1200);
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

  return (
    <div
      className="sf-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Edit Staff Member' : 'Add New Staff'}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="sf-modal">

        {/* Header */}
        <div className="sf-header">
          <div className="sf-header-left">
            <h2 className="sf-title">{isEditMode ? 'Edit Staff Member' : 'Add New Staff'}</h2>
          </div>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="sf-body">
          {feedback.message && (
            <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>
              {feedback.type === 'success'
                ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                : <AlertCircle  size={16} style={{ flexShrink: 0 }} />}
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
                    className={`sf-input${fieldErrors.staffId && touched.staffId ? ' sf-input-error' : ''}${isEditMode ? ' sf-input-readonly' : ''}`}
                    placeholder="e.g. STF001, STF-2024"
                    value={formData.staffId}
                    onChange={handleChange} onBlur={handleBlur}
                    autoComplete="off"
                    readOnly={isEditMode}
                    disabled={isEditMode}
                    maxLength={30}
                  />
                  {isEditMode && <small className="sf-field-hint">Staff ID cannot be changed after creation.</small>}
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

              {/* Department — shown only for Teacher-type roles */}
              {isTeacherRole && (
                <div className="sf-row">
                  <div className="sf-group" style={{ flex: '0 0 calc(50% - 0.5rem)' }}>
                    <label className="sf-label" htmlFor="stf-department">
                      Department <span className="sf-required">*</span>
                    </label>
                    {departments.length > 0 ? (
                      <select
                        id="stf-department" name="department"
                        className="sf-input"
                        value={formData.department}
                        onChange={handleChange}
                      >
                        <option value="">— Select Department —</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="stf-department" name="department" type="text"
                        className="sf-input"
                        placeholder="e.g. Computer Science"
                        value={formData.department}
                        onChange={handleChange}
                        autoComplete="off"
                      />
                    )}
                    <small className="sf-field-hint">
                      Required for teacher roles — used for department-wise attendance.
                    </small>
                  </div>
                </div>
              )}

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

        {/* Footer */}
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
