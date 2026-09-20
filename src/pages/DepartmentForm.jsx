import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = `${_NODE_URL}/api`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared validation helpers — mirror the backend rules exactly.
// Single source of truth for all Department field constraints.
// Covers DEF-003 through DEF-014.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a Department ID string.
 * Rules:
 *  - Required, non-empty.
 *  - Minimum 2 characters.
 *  - Must NOT be purely numeric (rejects "0", "123", etc. — DEF-006, DEF-013).
 *  - Must contain only letters, digits, and hyphens (e.g. CS-101, DEPT01).
 * Returns an error message string or null on success.
 */
export function validateDepartmentId(raw) {
  const val = (raw || '').trim();
  if (!val) return 'Department ID is required.';
  if (val.length < 2) return 'Department ID must be at least 2 characters.';
  // Reject purely numeric values, including 0 and negative integers
  if (/^-?\d+$/.test(val)) {
    return 'Department ID must be alphanumeric (e.g. CS-101). Purely numeric values are not allowed.';
  }
  // Allow only letters, digits, hyphens
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(val)) {
    return 'Department ID may only contain letters, digits, and hyphens (e.g. CS-101, ENG-01).';
  }
  return null;
}

/**
 * Validate a Department Name string.
 * Rules:
 *  - Required, non-empty.
 *  - Minimum 5 characters.
 *  - Must start with a letter.
 *  - Must NOT contain any digit (rejects "Computer123", "CSE123" — DEF-003, DEF-005, DEF-010, DEF-012).
 *  - Must consist only of letters, spaces, and standard punctuation (&, -, (, ), /, ., ', ,).
 *  - Must NOT be a short abbreviation: 1–4 all-uppercase letters with no spaces (DEF-008, DEF-014).
 * Returns an error message string or null on success.
 */
export function validateDepartmentName(raw) {
  const val = (raw || '').trim();
  if (!val) return 'Department Name is required.';
  if (val.length < 5) {
    return 'Please enter the full descriptive department name (minimum 5 characters).';
  }
  if (!/^[A-Za-z]/.test(val)) {
    return 'Please enter a valid department name.';
  }
  // Reject any digits — covers purely numeric and mixed combos (DEF-003, DEF-005)
  if (/\d/.test(val)) {
    return 'Please enter a valid department name in the specified format. Digits are not allowed in department names.';
  }
  // Only allowed characters: letters, space, & - ( ) / . ' ,
  if (!/^[A-Za-z\s&\-(). /,'\u0026]+$/.test(val)) {
    return 'Please enter a valid department name. Only letters, spaces, and standard punctuation (&, -, /, etc.) are allowed.';
  }
  // Reject short all-uppercase abbreviations with no spaces — CS, IT, EEE, MECH etc. (DEF-008)
  if (/^[A-Z]{1,4}$/.test(val)) {
    return 'Please enter the full descriptive department name (e.g. "Computer Science" instead of "CS").';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

const DepartmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: _user, authLoading } = useAuth();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    departmentId: '',
    name: '',
  });

  // Per-field validation error messages (shown inline, cleared on valid input)
  const [fieldErrors, setFieldErrors] = useState({
    departmentId: '',
    name: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // DEF-001/002: useCallback must be declared BEFORE the useEffect that depends
  // on it, otherwise React sees it as undefined on the first render cycle and
  // the edit-mode load never fires after a page refresh.
  const loadDepartmentDetails = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/departments`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.find((d) => d._id === id || d.departmentId === id);
        if (found) {
          setFormData({
            departmentId: found.departmentId || found.code || '',
            name: found.name || '',
          });
        } else {
          setFeedback({ type: 'error', message: 'Department not found.' });
        }
      } else {
        throw new Error('API returned non-OK status');
      }
    } catch (err) {
      console.warn('Backend unavailable, checking local cache:', err);
      const stored = localStorage.getItem('erp_departments_custom');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const found = parsed.find((d) => d._id === id || d.departmentId === id);
          if (found) {
            setFormData({
              departmentId: found.departmentId || '',
              name: found.name || '',
            });
          } else {
            setFeedback({ type: 'error', message: 'Department not found. It may have been deleted.' });
          }
        } catch {
          setFeedback({ type: 'error', message: 'Unable to load department details. Please try again.' });
        }
      } else {
        setFeedback({ type: 'error', message: 'Unable to load department details. Please check your connection.' });
      }
    } finally {
      setFetching(false);
    }
  }, [id]);

  // Fire the load only after auth has settled and we're in edit mode
  useEffect(() => {
    if (isEditMode && !authLoading) {
      loadDepartmentDetails();
    }
  }, [isEditMode, authLoading, loadDepartmentDetails]);

  // Validate a single field on change and update fieldErrors
  const validateField = (fieldName, value) => {
    let error = '';
    if (fieldName === 'departmentId') {
      error = validateDepartmentId(value) || '';
    } else if (fieldName === 'name') {
      error = validateDepartmentName(value) || '';
    }
    setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processed = name === 'departmentId' ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: processed }));
    // Live validation — show errors as the user types
    validateField(name, processed);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const processed = name === 'departmentId' ? value.toUpperCase() : value;
    validateField(name, processed);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    // Full form validation before any network request
    const deptIdError = validateDepartmentId(formData.departmentId);
    const nameError = validateDepartmentName(formData.name);

    setFieldErrors({
      departmentId: deptIdError || '',
      name: nameError || '',
    });

    if (deptIdError || nameError) {
      // Focus the first invalid field
      if (deptIdError) {
        document.getElementById('departmentId')?.focus();
      } else {
        document.getElementById('name')?.focus();
      }
      return; // do NOT proceed with the API call
    }

    setLoading(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/super-admin/departments/${id}`
        : `${API_BASE_URL}/super-admin/departments`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({
          departmentId: formData.departmentId.trim(),
          name: formData.name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Surface the exact backend error to the user — do NOT fall back to a fake success
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to save department. Please try again.',
        });
        setLoading(false);
        return;
      }

      // Real success — update local cache and navigate
      const stored = localStorage.getItem('erp_departments_custom');
      let depts = [];
      try { depts = stored ? JSON.parse(stored) : []; } catch { depts = []; }

      if (isEditMode) {
        depts = depts.map((d) =>
          d._id === id || d.departmentId === id
            ? { ...d, departmentId: formData.departmentId.trim(), name: formData.name.trim() }
            : d
        );
      } else {
        depts.unshift({
          _id: data.department?._id || `dept_${Date.now()}`,
          departmentId: formData.departmentId.trim(),
          name: formData.name.trim(),
          createdAt: new Date().toISOString(),
        });
      }
      localStorage.setItem('erp_departments_custom', JSON.stringify(depts));

      setFeedback({
        type: 'success',
        message: isEditMode ? 'Department updated successfully.' : 'Department created successfully.',
      });

      setTimeout(() => {
        navigate('/departments');
      }, 900);
    } catch (err) {
      // Network / fetch error — do NOT show fake success
      console.error('API submission error:', err);
      setFeedback({
        type: 'error',
        message: 'Unable to connect to the server. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show a spinner while auth is still settling (prevents blank-panel flash on refresh)
  if (authLoading) {
    return (
      <div className="page-container">
        <div className="table-loading-state">
          <Loader2 size={24} className="spin-animate" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Top Header & Breadcrumb */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/departments')}
            title="Back to Departments"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEditMode ? 'Edit Department' : 'Add New Department'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update existing academic department parameters and naming.'
                : 'Register a new academic department into the university system.'}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ marginBottom: '1.5rem' }}
          role="alert"
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="card department-form-card" style={{ maxWidth: '640px' }}>
        {fetching ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={24} className="spin-animate" style={{ margin: '0 auto 0.5rem auto' }} />
            <p>Loading department details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="department-form" noValidate>
            {/* Department ID Field */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="departmentId">
                Department ID <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="departmentId"
                name="departmentId"
                type="text"
                className={`form-input${fieldErrors.departmentId ? ' input-error' : ''}`}
                placeholder="e.g. CS-101, IT-102, ENG-01"
                value={formData.departmentId}
                onChange={handleChange}
                onBlur={handleBlur}
                autoFocus={!isEditMode}
                aria-describedby="departmentId-hint departmentId-error"
                aria-invalid={Boolean(fieldErrors.departmentId)}
              />
              {fieldErrors.departmentId ? (
                <span
                  id="departmentId-error"
                  className="form-field-error"
                  role="alert"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem', fontSize: '0.8125rem', color: '#ef4444' }}
                >
                  <AlertCircle size={13} />
                  {fieldErrors.departmentId}
                </span>
              ) : (
                <span id="departmentId-hint" className="form-hint">
                  Alphanumeric identifier with optional hyphens. Must be unique (e.g. CS-101).
                </span>
              )}
            </div>

            {/* Department Name Field */}
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" htmlFor="name">
                Department Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
                placeholder="e.g. Computer Science & Engineering"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-describedby="name-hint name-error"
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name ? (
                <span
                  id="name-error"
                  className="form-field-error"
                  role="alert"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem', fontSize: '0.8125rem', color: '#ef4444' }}
                >
                  <AlertCircle size={13} />
                  {fieldErrors.name}
                </span>
              ) : (
                <span id="name-hint" className="form-hint">
                  Full descriptive name of the university department.
                </span>
              )}
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/departments')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || fetching}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '130px', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin-animate" />
                    <span>{isEditMode ? 'Saving...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isEditMode ? 'Save Changes' : 'Create Department'}</span>
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

export default DepartmentForm;
