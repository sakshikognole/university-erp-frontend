import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Save, AlertCircle, CheckCircle2, Loader2, Plus, X } from 'lucide-react';

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

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

  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

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
  }, [id]);

  const loadStudentDetails = async () => {
    setFetching(true);
    try {
      // First try single student endpoint
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
          const found = allStudents.find((s) => s._id === id || s.prn === id || s.prn === id.toUpperCase());
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
      setFeedback({ type: 'error', message: 'Unable to connect to server to load student details.' });
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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'prn' ? value.toUpperCase() : value,
    }));
  };

  const handleAddCustomField = () => {
    if (!customFieldKey.trim() || !customFieldValue.trim()) {
      setFeedback({ type: 'error', message: 'Please enter both key and value for custom field.' });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { key: customFieldKey.trim(), value: customFieldValue.trim() }],
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!formData.name || !formData.prn || !formData.class || !formData.degree || !formData.yearOfEnrollment) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields.' });
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
          prn: formData.prn.trim(),
          class: formData.class.trim(),
          division: formData.division.trim(),
          degree: formData.degree.trim(),
          yearOfEnrollment: formData.yearOfEnrollment.trim(),
          customFields: formData.customFields,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
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

  return (
    <div className="page-container">
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
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading student details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prn">
                  PRN <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="prn"
                  name="prn"
                  type="text"
                  className="form-input"
                  placeholder="e.g. PRN2024001"
                  value={formData.prn}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="class">
                  Class <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="class"
                  name="class"
                  type="text"
                  className="form-input"
                  placeholder="e.g. First Year"
                  value={formData.class}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="division">
                  Division
                </label>
                <input
                  id="division"
                  name="division"
                  type="text"
                  className="form-input"
                  placeholder="e.g. A, B, C"
                  value={formData.division}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="degree">
                  Degree <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="degree"
                  name="degree"
                  type="text"
                  className="form-input"
                  placeholder="e.g. B.Tech Computer Science"
                  value={formData.degree}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="yearOfEnrollment">
                  Year of Enrollment <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="yearOfEnrollment"
                  name="yearOfEnrollment"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2024"
                  value={formData.yearOfEnrollment}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Custom Fields</h3>
              
              <div className="custom-fields-input-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="customFieldKey">
                    Field Name/Key
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

            <div className="form-actions-row" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/students')}
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
