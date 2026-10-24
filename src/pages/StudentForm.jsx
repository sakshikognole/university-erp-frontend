import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  validateName,
  validatePRN,
  validateClass,
  validateDivision,
  validateDegree,
  validateYearOfEnrollment,
  validateEmail,
  validateStudentFields,
} from '../utils/studentValidation';

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
// StudentFormModal
//
// Props:
//   isOpen      — boolean — controls visibility
//   studentId   — string | null — null = Add mode, string = Edit mode
//   onClose     — () => void — called when user cancels or closes
//   onSuccess   — (student) => void — called after a successful save
// ---------------------------------------------------------------------------
const StudentFormModal = ({ isOpen, studentId, onClose, onSuccess }) => {
  const isEditMode = Boolean(studentId);

  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const emptyForm = {
    name: '', prn: '', class: '', division: '',
    degree: '', yearOfEnrollment: '', email: '',
    customFields: [],
  };

  const [formData, setFormData]     = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched]       = useState({});
  const [customFieldKey, setCustomFieldKey]     = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  // ── Per-field validators ────────────────────────────────────────────────
  const FIELD_VALIDATORS = {
    name:             validateName,
    prn:              validatePRN,
    class:            validateClass,
    division:         validateDivision,
    degree:           validateDegree,
    yearOfEnrollment: validateYearOfEnrollment,
    email:            validateEmail,
  };

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // ── Reset form state whenever the modal opens/changes mode ─────────────
  const resetForm = useCallback(() => {
    setFormData(emptyForm);
    setFieldErrors({});
    setTouched({});
    setFeedback({ type: '', message: '' });
    setCustomFieldKey('');
    setCustomFieldValue('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode) {
      resetForm();
      loadStudentDetails();
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, studentId]);

  // ── Lock body scroll while modal is open ───────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Load student for edit ──────────────────────────────────────────────
  const loadStudentDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/super-admin/students/${studentId}`,
        { headers: authHeader() }
      );

      if (res.ok) {
        populateStudentData(await res.json());
      } else {
        // Fallback: scan full list
        const allRes = await fetch(`${API_BASE_URL}/super-admin/students`, {
          headers: authHeader(),
        });
        if (allRes.ok) {
          const allStudents = await allRes.json();
          const found = allStudents.find(
            (s) =>
              s._id === studentId ||
              s.prn === studentId ||
              s.prn === studentId.toUpperCase()
          );
          if (found) {
            populateStudentData(found);
          } else {
            setFeedback({ type: 'error', message: 'Student record not found.' });
          }
        } else {
          setFeedback({ type: 'error', message: 'Failed to load student details.' });
        }
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      setFeedback({
        type: 'error',
        message: 'Unable to connect to server to load student details.',
      });
    } finally {
      setFetching(false);
    }
  };

  const populateStudentData = (student) => {
    setFormData({
      name:             student.name             || '',
      prn:              student.prn              || '',
      class:            student.class            || '',
      division:         student.division         || '',
      degree:           student.degree           || '',
      yearOfEnrollment: student.yearOfEnrollment || '',
      email:            student.email            || '',
      customFields: Array.isArray(student.customFields) ? student.customFields : [],
    });
    setFieldErrors({});
    setTouched({});
  };

  // ── onChange ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'prn') {
      // Allow only letters and digits — strip everything else, then uppercase
      newValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }
    if (name === 'division') {
      // Single letter A-Z only — take first letter, strip everything else
      const letter = value.replace(/[^A-Za-z]/g, '');
      newValue = letter.slice(0, 1).toUpperCase();
    }
    if (name === 'class') {
      // Letters and spaces only — strip digits and symbols
      newValue = value.replace(/[^A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s]/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (touched[name] && FIELD_VALIDATORS[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: FIELD_VALIDATORS[name](newValue) }));
    }
  };

  // ── onBlur ─────────────────────────────────────────────────────────────
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (FIELD_VALIDATORS[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: FIELD_VALIDATORS[name](value) }));
    }
  };

  // ── Custom fields ──────────────────────────────────────────────────────
  const handleAddCustomField = () => {
    if (!customFieldKey.trim() || !customFieldValue.trim()) {
      setFeedback({ type: 'error', message: 'Please enter both key and value for the custom field.' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { key: customFieldKey.trim(), value: customFieldValue.trim() },
      ],
    }));
    setCustomFieldKey('');
    setCustomFieldValue('');
    setFeedback({ type: '', message: '' });
  };

  const handleRemoveCustomField = (index) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const allTouched = {
      name: true, prn: true, class: true, division: true,
      degree: true, yearOfEnrollment: true, email: true,
    };
    setTouched(allTouched);

    const errors = validateStudentFields({
      name:             formData.name,
      prn:              formData.prn,
      class:            formData.class,
      division:         formData.division,
      degree:           formData.degree,
      yearOfEnrollment: formData.yearOfEnrollment,
      email:            formData.email,
    });
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(`sf-${firstErrorField}`);
      if (el) el.focus();
      return;
    }

    setLoading(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/super-admin/students/${studentId}`
        : `${API_BASE_URL}/super-admin/students`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({
          name:             formData.name.trim(),
          prn:              formData.prn.trim().toUpperCase(),
          class:            formData.class.trim(),
          division:         formData.division.trim(),
          degree:           formData.degree.trim(),
          yearOfEnrollment: formData.yearOfEnrollment.trim(),
          email:            formData.email.trim().toLowerCase(),
          customFields:     formData.customFields,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const beErrors = {};
          data.errors.forEach(({ field, message }) => { beErrors[field] = message; });
          setFieldErrors(beErrors);
        }
        throw new Error(
          data.message ||
          (isEditMode ? 'Failed to update student' : 'Failed to add student')
        );
      }

      setFeedback({
        type: 'success',
        message: isEditMode
          ? `Student '${formData.name}' updated successfully.`
          : `Student '${formData.name}' added successfully.`,
      });

      // Brief pause so the user sees the success banner, then hand off
      setTimeout(() => {
        onSuccess(data.student || data);
      }, 900);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message ||
          (isEditMode ? 'Error updating student.' : 'Error adding student.'),
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Escape key closes modal ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  const inputClass = (field) =>
    `sf-input${fieldErrors[field] && touched[field] ? ' sf-input-error' : ''}`;

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="sf-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Edit Student' : 'Add New Student'}
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              )}
            </div>
            <div>
              <h2 className="sf-title">
                {isEditMode ? 'Edit Student' : 'Add New Student'}
              </h2>
              <p className="sf-subtitle">
                {isEditMode
                  ? 'Update the student\'s enrollment information'
                  : 'Register a new student into the university system'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="sf-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="sf-body">

          {/* Feedback banner */}
          {feedback.message && (
            <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>
              {feedback.type === 'success'
                ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                : <AlertCircle size={16} style={{ flexShrink: 0 }} />
              }
              <span>{feedback.message}</span>
            </div>
          )}

          {fetching ? (
            <div className="sf-loading">
              <Loader2 size={26} className="spin-animate" />
              <p>Loading student details…</p>
            </div>
          ) : (
            <form
              id="student-form"
              onSubmit={handleSubmit}
              className="sf-form"
              noValidate
            >
              {/* ── Section: Basic Info ── */}
              <div className="sf-section-label">Basic Information</div>

              {/* Row 1: Name + PRN */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="sf-name">
                    Full Name <span className="sf-required">*</span>
                  </label>
                  <input
                    id="sf-name"
                    name="name"
                    type="text"
                    className={inputClass('name')}
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError message={touched.name ? fieldErrors.name : ''} />
                </div>

                <div className="sf-group">
                  <label className="sf-label" htmlFor="sf-prn">
                    PRN <span className="sf-required">*</span>
                  </label>
                  <input
                    id="sf-prn"
                    name="prn"
                    type="text"
                    className={inputClass('prn')}
                    placeholder="e.g. PRN2024001"
                    value={formData.prn}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError message={touched.prn ? fieldErrors.prn : ''} />
                </div>
              </div>

              {/* Row 2: Email (full width) */}
              <div className="sf-row">
                <div className="sf-group sf-group-full">
                  <label className="sf-label" htmlFor="sf-email">
                    Email Address
                    <span className="sf-optional">optional</span>
                  </label>
                  <input
                    id="sf-email"
                    name="email"
                    type="email"
                    className={inputClass('email')}
                    placeholder="e.g. student@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    inputMode="email"
                  />
                  <FieldError message={touched.email ? fieldErrors.email : ''} />
                </div>
              </div>

              {/* ── Section: Enrollment Details ── */}
              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>
                Enrollment Details
              </div>

              {/* Row 3: Class + Division */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="sf-class">
                    Class <span className="sf-required">*</span>
                  </label>
                  <input
                    id="sf-class"
                    name="class"
                    type="text"
                    className={inputClass('class')}
                    placeholder="e.g. First Year"
                    value={formData.class}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError message={touched.class ? fieldErrors.class : ''} />
                </div>

                <div className="sf-group">
                  <label className="sf-label" htmlFor="sf-division">
                    Division <span className="sf-required">*</span>
                  </label>
                  <input
                    id="sf-division"
                    name="division"
                    type="text"
                    className={inputClass('division')}
                    placeholder="e.g. A, B, C"
                    value={formData.division}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    maxLength={1}
                  />
                  <FieldError message={touched.division ? fieldErrors.division : ''} />
                </div>
              </div>

              {/* Row 4: Degree + Year of Enrollment */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label" htmlFor="sf-degree">
                    Degree <span className="sf-required">*</span>
                  </label>
                  <input
                    id="sf-degree"
                    name="degree"
                    type="text"
                    className={inputClass('degree')}
                    placeholder="e.g. B.Tech Computer Science"
                    value={formData.degree}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                  />
                  <FieldError message={touched.degree ? fieldErrors.degree : ''} />
                </div>

                <div className="sf-group">
                  <label className="sf-label" htmlFor="sf-yearOfEnrollment">
                    Year of Enrollment <span className="sf-required">*</span>
                  </label>
                  <input
                    id="sf-yearOfEnrollment"
                    name="yearOfEnrollment"
                    type="text"
                    className={inputClass('yearOfEnrollment')}
                    placeholder="e.g. 2024"
                    value={formData.yearOfEnrollment}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="off"
                  />
                  <FieldError message={touched.yearOfEnrollment ? fieldErrors.yearOfEnrollment : ''} />
                </div>
              </div>

              {/* ── Section: Custom Fields ── */}
              <div className="sf-section-label" style={{ marginTop: '0.25rem' }}>
                Custom Fields
                <span className="sf-optional">optional</span>
              </div>

              <div className="sf-custom-input-row">
                <div className="sf-group" style={{ flex: 1 }}>
                  <label className="sf-label" htmlFor="sf-customFieldKey">Field Name</label>
                  <input
                    id="sf-customFieldKey"
                    type="text"
                    className="sf-input"
                    placeholder="e.g. Blood Group"
                    value={customFieldKey}
                    onChange={(e) => setCustomFieldKey(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomField(); } }}
                  />
                </div>
                <div className="sf-group" style={{ flex: 1 }}>
                  <label className="sf-label" htmlFor="sf-customFieldValue">Value</label>
                  <input
                    id="sf-customFieldValue"
                    type="text"
                    className="sf-input"
                    placeholder="e.g. O+"
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomField(); } }}
                  />
                </div>
                <button
                  type="button"
                  className="sf-add-custom-btn"
                  onClick={handleAddCustomField}
                  title="Add custom field"
                >
                  <Plus size={15} />
                  <span>Add</span>
                </button>
              </div>

              {formData.customFields.length > 0 && (
                <div className="sf-custom-list">
                  {formData.customFields.map((field, index) => (
                    <div key={index} className="sf-custom-item">
                      <span className="sf-custom-key">{field.key}</span>
                      <span className="sf-custom-sep">:</span>
                      <span className="sf-custom-val">{field.value}</span>
                      <button
                        type="button"
                        className="sf-custom-remove"
                        onClick={() => handleRemoveCustomField(index)}
                        title={`Remove ${field.key}`}
                        aria-label={`Remove ${field.key}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="sf-footer">
          <button
            type="button"
            className="sf-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="student-form"
            className="sf-btn-save"
            disabled={loading || fetching}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="spin-animate" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>{isEditMode ? 'Update Student' : 'Add Student'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default StudentFormModal;
