import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, Plus, X } from 'lucide-react';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = `${_NODE_URL}/api`;

// Must match backend constants in superAdminController.js
const VENUE_ID_REGEX = /^[A-Z0-9]{1,10}(-[A-Z0-9]{1,10}){0,4}$/;
const VENUE_NAME_REGEX = /^[A-Za-z][A-Za-z0-9 ,.\-'()]{1,99}$/;

const VenueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [facilityInput, setFacilityInput] = useState({ name: '', details: '' });
  const [formData, setFormData] = useState({
    venueId: '',
    name: '',
    capacity: '',
    facilities: [],
    status: 'ACTIVE',
  });

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    if (isEditMode) {
      loadVenueDetails();
    }
  }, [id]);

  const loadVenueDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/venues/${id}`, {
        headers: authHeader(),
      });

      if (res.ok) {
        const venue = await res.json();
        setFormData({
          venueId: venue.venueId || '',
          name: venue.name || '',
          capacity: venue.capacity || '',
          facilities: venue.facilities || [],
          status: venue.status || 'ACTIVE',
        });
      } else {
        setFeedback({ type: 'error', message: 'Venue not found.' });
      }
    } catch (err) {
      console.error('Error fetching venue details:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server to load venue details.' });
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the field-level error as the user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const venueIdClean = formData.venueId.trim().toUpperCase();
    const nameClean = formData.name.trim();

    if (!venueIdClean) {
      errors.venueId = 'Venue ID is required.';
    } else if (!VENUE_ID_REGEX.test(venueIdClean)) {
      errors.venueId = 'Venue ID must contain only letters and digits, optionally separated by hyphens (e.g. HALL-101, LAB-CS-01).';
    }

    if (!nameClean) {
      errors.name = 'Venue Name is required.';
    } else if (!VENUE_NAME_REGEX.test(nameClean)) {
      errors.name = 'Venue Name must start with a letter and may only contain letters, digits, spaces, or basic punctuation ( , . - \' ( ) ).';
    }

    if (!formData.capacity) {
      errors.capacity = 'Capacity is required.';
    } else if (Number(formData.capacity) < 1) {
      errors.capacity = 'Capacity must be at least 1.';
    }

    if (!formData.status) {
      errors.status = 'Status is required.';
    }

    return errors;
  };

  const handleAddFacility = () => {
    const facilityName = facilityInput.name.trim();
    const facilityDetails = facilityInput.details.trim();
    
    if (facilityName && !formData.facilities.some(f => f.name === facilityName)) {
      setFormData((prev) => ({
        ...prev,
        facilities: [...prev.facilities, { name: facilityName, details: facilityDetails }],
      }));
      setFacilityInput({ name: '', details: '' });
    }
  };

  const handleRemoveFacility = (facilityName) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((f) => f.name !== facilityName),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFacility();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({ type: 'error', message: 'Please fix the errors below before saving.' });
      return;
    }
    setFieldErrors({});

    setLoading(true);

    const payload = {
      venueId: formData.venueId.trim(),
      name: formData.name.trim(),
      capacity: Number(formData.capacity),
      facilities: formData.facilities,
      status: formData.status.trim(),
    };

    try {
      const url = isEditMode
        ? `${API_BASE_URL}/super-admin/venues/${id}`
        : `${API_BASE_URL}/super-admin/venues`;

      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: 'error', message: data.message || 'Failed to save venue.' });
        setLoading(false);
        return;
      }

      setFeedback({ type: 'success', message: data.message || (isEditMode ? 'Venue updated successfully!' : 'Venue created successfully!') });
      setTimeout(() => navigate('/venues'), 1200);
    } catch (error) {
      console.error('Error submitting venue:', error);
      setFeedback({ type: 'error', message: 'Unable to connect to the server. Please try again.' });
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
            onClick={() => navigate('/venues')}
            title="Back to Venues"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEditMode ? 'Edit Venue' : 'Add New Venue'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update venue information and facility details'
                : 'Create a new venue record with facility information'}
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

      <div className="card venue-form-card" style={{ maxWidth: '720px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading venue details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-section">
              <h3 className="form-section-title">Venue Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="venueId" className="form-label">
                    Venue ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="venueId"
                    name="venueId"
                    className={`form-input${fieldErrors.venueId ? ' input-error' : ''}`}
                    placeholder="e.g. HALL-101"
                    value={formData.venueId}
                    onChange={handleInputChange}
                    required
                  />
                  {fieldErrors.venueId && (
                    <span className="form-field-error">{fieldErrors.venueId}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Venue Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
                    placeholder="e.g. Main Auditorium"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  {fieldErrors.name && (
                    <span className="form-field-error">{fieldErrors.name}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="capacity" className="form-label">
                    Capacity <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    className={`form-input${fieldErrors.capacity ? ' input-error' : ''}`}
                    placeholder="e.g. 500"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                  {fieldErrors.capacity && (
                    <span className="form-field-error">{fieldErrors.capacity}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    className={`form-input${fieldErrors.status ? ' input-error' : ''}`}
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                  {fieldErrors.status && (
                    <span className="form-field-error">{fieldErrors.status}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Facilities</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="facilityName" className="form-label">
                    Facility Name
                  </label>
                  <input
                    type="text"
                    id="facilityName"
                    className="form-input"
                    placeholder="e.g. Projector, AC, High-speed Wifi"
                    value={facilityInput.name}
                    onChange={(e) => setFacilityInput(prev => ({ ...prev, name: e.target.value }))}
                    onKeyDown={handleKeyPress}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="facilityDetails" className="form-label">
                    Details (Optional)
                  </label>
                  <input
                    type="text"
                    id="facilityDetails"
                    className="form-input"
                    placeholder="e.g. 4K resolution, Central AC system"
                    value={facilityInput.details}
                    onChange={(e) => setFacilityInput(prev => ({ ...prev, details: e.target.value }))}
                    onKeyDown={handleKeyPress}
                  />
                </div>
              </div>
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddFacility}
                disabled={!facilityInput.name.trim()}
                style={{ marginTop: '0.5rem' }}
              >
                <Plus size={16} />
                <span>Add Facility</span>
              </button>

              {formData.facilities.length > 0 && (
                <div className="custom-fields-list" style={{ marginTop: '1rem' }}>
                  {formData.facilities.map((facility, index) => (
                    <div key={index} className="custom-field-item">
                      <div className="custom-field-content">
                        <span className="custom-field-key">{facility.name}</span>
                        {facility.details && (
                          <span className="custom-field-value">{facility.details}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="custom-field-remove-btn"
                        onClick={() => handleRemoveFacility(facility.name)}
                        title="Remove facility"
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
                className="btn btn-secondary"
                onClick={() => navigate('/venues')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
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
                    <span>{isEditMode ? 'Update Venue' : 'Save Venue'}</span>
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

export default VenueForm;
