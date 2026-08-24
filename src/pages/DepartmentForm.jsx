import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const DepartmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (isEditMode) {
      loadDepartmentDetails();
    }
  }, [id]);

  const loadDepartmentDetails = async () => {
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
      }
    } catch (err) {
      console.warn('Backend unavailable, checking fallback data:', err);
      // Fallback check from localStorage or mock
      const stored = localStorage.getItem('erp_departments_custom');
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = parsed.find((d) => d._id === id || d.departmentId === id);
        if (found) {
          setFormData({
            departmentId: found.departmentId,
            name: found.name,
          });
        }
      }
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'departmentId' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!formData.departmentId.trim() || !formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Please fill in both Department ID and Department Name.' });
      return;
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
        throw new Error(data.message || 'Failed to save department.');
      }

      setFeedback({
        type: 'success',
        message: isEditMode
          ? 'Department updated successfully.'
          : 'Department created successfully.',
      });

      // Update local storage backup
      const stored = localStorage.getItem('erp_departments_custom');
      let depts = stored ? JSON.parse(stored) : [];
      if (isEditMode) {
        depts = depts.map((d) =>
          d._id === id || d.departmentId === id ? { ...d, ...formData } : d
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

      setTimeout(() => {
        navigate('/departments');
      }, 1000);
    } catch (err) {
      console.warn('API submission error, applying fallback storage:', err);
      // Local fallback
      const stored = localStorage.getItem('erp_departments_custom');
      let depts = stored ? JSON.parse(stored) : [];
      if (isEditMode) {
        depts = depts.map((d) =>
          d._id === id || d.departmentId === id ? { ...d, ...formData } : d
        );
      } else {
        const exists = depts.some((d) => d.departmentId === formData.departmentId.trim());
        if (exists) {
          setFeedback({ type: 'error', message: `Department with ID '${formData.departmentId}' already exists.` });
          setLoading(false);
          return;
        }
        depts.unshift({
          _id: `dept_${Date.now()}`,
          departmentId: formData.departmentId.trim(),
          name: formData.name.trim(),
          createdAt: new Date().toISOString(),
        });
      }
      localStorage.setItem('erp_departments_custom', JSON.stringify(depts));

      setFeedback({
        type: 'success',
        message: isEditMode
          ? 'Department updated successfully.'
          : 'Department created successfully.',
      });

      setTimeout(() => {
        navigate('/departments');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="department-form">
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="departmentId">
                Department ID <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="departmentId"
                name="departmentId"
                type="text"
                className="form-input"
                placeholder="e.g. CS-101, IT-102, ENG-01"
                value={formData.departmentId}
                onChange={handleChange}
                required
                autoFocus={!isEditMode}
              />
              <span className="form-hint">
                Custom alphanumeric identifier. It is unique and not autoincremented.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" htmlFor="name">
                Department Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Computer Science & Engineering"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <span className="form-hint">
                Full descriptive name of the university department.
              </span>
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
                    <span>{isEditMode ? 'Update Department' : 'Save Department'}</span>
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
