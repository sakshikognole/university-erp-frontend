import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import {
  validateName,
  validatePRN,
  validateClass,
  validateDivision,
  validateDegree,
  validateYearOfEnrollment,
  validateStudentFields,
} from '../utils/studentValidation';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = `${_NODE_URL}/api`;

// ---------------------------------------------------------------------------
// FieldError â-- small red helper text shown beneath an invalid input
// ---------------------------------------------------------------------------
const FieldError = ({ message }) =>
  message ? (
    <p className="field-error-msg" role="alert">
      <AlertCircle size={13} style={{ flexShrink: 0 }} />
      {message}
    </p>
  ) : null;

// ---------------------------------------------------------------------------
// StudentForm â-- used for both Add (/add-student) and Edit (/students/edit/:id)
// ---------------------------------------------------------------------------
const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    name: '',
    prn: '',
    class: '',
    division: '',
    degree: '',
    yearOfEnrollment: '',
    customFields: [],
  });

  // Per-field validation error messages
  const [fieldErrors, setFieldErrors] = useState({});
  // Track which fields the user has already touched (to show errors on blur)
  const [touched, setTouched] = useState({});

  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  // â--â-- Validators per field name â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const FIELD_VALIDATORS = {
    name: validateName,
    prn: validatePRN,
    class: validateClass,
    division: validateDivision,
    degree: validateDegree,
    yearOfEnrollment: validateYearOfEnrollment,
  };

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    if (isEditMode) {
      loadStudentDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadStudentDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/students/${id}`, {
        headers: authHeader(),
      });

      if (res.ok) {
        const student = await res.json();
        populateStudentData(student);
      } else {
        // Fallback: search all students
        const allRes = await fetch(`${API_BASE_URL}/super-admin/students`, {
          headers: authHeader(),
        });
        if (allRes.ok) {
          const allStudents = await allRes.json();
          const found = allStudents.find(
            (s) => s._id === id || s.prn === id || s.prn === id.toUpperCase()
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
      name: student.name || '',
      prn: student.prn || '',
      class: student.class || '',
      division: student.division || '',
      degree: student.degree || '',
      yearOfEnrollment: student.yearOfEnrollment || '',
      customFields: Array.isArray(student.customFields) ? student.customFields : [],
    });
    // Pre-validate so errors show on load for already-invalid legacy data
    // but only show them when the user touches the fields, so clear touched.
    setFieldErrors({});
    setTouched({});
  };

  // â--â-- onChange: update value + re-validate if already touched â--â--â--â--â--â--â--â--â--â--â--
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === 'prn' ? value.toUpperCase() : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Live-validate only for fields already touched (so errors clear as user types)
    if (touched[name] && FIELD_VALIDATORS[name]) {
      const err = FIELD_VALIDATORS[name](newValue);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  // â--â-- onBlur: mark field as touched + validate immediately â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (FIELD_VALIDATORS[name]) {
      const err = FIELD_VALIDATORS[name](value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  // â--â-- Custom fields â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
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

  // â--â-- Submit â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    // Mark all validated fields as touched so every error is visible
    setTouched({ name: true, prn: true, class: true, division: true, degree: true, yearOfEnrollment: true });

    // Run full validation
    const errors = validateStudentFields({
      name: formData.name,
      prn: formData.prn,
      class: formData.class,
      division: formData.division,
      degree: formData.degree,
      yearOfEnrollment: formData.yearOfEnrollment,
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFeedback({
        type: 'error',
        message: 'Please fix the highlighted errors before saving.',
      });
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorField);
      if (el) el.focus();
      return;
    }

    setLoading(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/super-admin/students/${id}`
        : `${API_BASE_URL}/super-admin/students`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({
          name: formData.name.trim(),
          prn: formData.prn.trim().toUpperCase(),
          class: formData.class.trim(),
          division: formData.division.trim(),
          degree: formData.degree.trim(),
          yearOfEnrollment: formData.yearOfEnrollment.trim(),
          customFields: formData.customFields,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If backend returned field-level errors, surface them
        if (data.errors && Array.isArray(data.errors)) {
          const beErrors = {};
          data.errors.forEach(({ field, message }) => {
            beErrors[field] = message;
          });
          setFieldErrors(beErrors);
        }
        throw new Error(data.message || (isEditMode ? 'Failed to update student' : 'Failed to add student'));
      }

      setFeedback({
        type: 'success',
        message: isEditMode
          ? `Student '${formData.name}' updated successfully.`
          : 'Student added successfully.',
      });

      setTimeout(() => {
        navigate('/students');
      }, 1200);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || (isEditMode ? 'Error updating student.' : 'Error adding student.'),
      });
    } finally {
      setLoading(false);
    }
  };

  // â--â-- Helper: CSS class for inputs with errors â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const inputClass = (field) =>
    `form-input${fieldErrors[field] && touched[field] ? ' input-error' : ''}`;

  // â--â-- Render â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/students')}
            title="Back to Students"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEditMode ? 'Edit Student' : 'Add New Student'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update existing student records and enrollment information'
                : 'Register a new student into the university system'}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback banner */}
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

      <div className="card" style={{ maxWidth: '720px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2
              size={28}
              className="spin-animate"
              style={{ margin: '0 auto 0.75rem auto' }}
            />
            <p>Loading student details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout" noValidate>

            {/* â--â-- Row 1: Name + PRN â--â-- */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="name"
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

              <div className="form-group">
                <label className="form-label" htmlFor="prn">
                  PRN <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="prn"
                  name="prn"
                  type="text"
                  className={inputClass('prn')}
                  placeholder="e.g. PRN2024001"
                  value={formData.prn}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                  inputMode="text"
                />
                <FieldError message={touched.prn ? fieldErrors.prn : ''} />
              </div>
            </div>

            {/* â--â-- Row 2: Class + Division â--â-- */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="class">
                  Class <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="class"
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

              <div className="form-group">
                <label className="form-label" htmlFor="division">
                  Division <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="division"
                  name="division"
                  type="text"
                  className={inputClass('division')}
                  placeholder="e.g. A, B, C"
                  value={formData.division}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                <FieldError message={touched.division ? fieldErrors.division : ''} />
              </div>
            </div>

            {/* â--â-- Row 3: Degree + Year of Enrollment â--â-- */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="degree">
                  Degree <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="degree"
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

              <div className="form-group">
                <label className="form-label" htmlFor="yearOfEnrollment">
                  Year of Enrollment <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="yearOfEnrollment"
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

            {/* â--â-- Custom Fields â--â-- */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Custom Fields</h3>

              <div className="custom-fields-input-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="customFieldKey">
                    Field Name / Key
                  </label>
                  <input
                    id="customFieldKey"
                    name="customFieldKey"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Blood Group, Address"
                    value={customFieldKey}
                    onChange={(e) => setCustomFieldKey(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="customFieldValue">
                    Value
                  </label>
                  <input
                    id="customFieldValue"
                    name="customFieldValue"
                    type="text"
                    className="form-input"
                    placeholder="e.g. O+, Mumbai"
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddCustomField}
                  style={{ marginTop: '1.75rem' }}
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              {formData.customFields.length > 0 && (
                <div className="custom-fields-list">
                  {formData.customFields.map((field, index) => (
                    <div key={index} className="custom-field-item">
                      <div className="custom-field-content">
                        <span className="custom-field-key">{field.key}:</span>
                        <span className="custom-field-value">{field.value}</span>
                      </div>
                      <button
                        type="button"
                        className="custom-field-remove-btn"
                        onClick={() => handleRemoveCustomField(index)}
                        title="Remove field"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* â--â-- Actions â--â-- */}
            <div className="form-actions-row" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/students')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="books-btn books-btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin-animate" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isEditMode ? 'Update Student' : 'Save Student'}</span>
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

export default StudentForm;
