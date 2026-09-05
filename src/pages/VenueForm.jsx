import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, Plus, X } from 'lucide-react';

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const VenueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
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

    if (!formData.venueId.trim() || !formData.name.trim() || !formData.capacity || !formData.status) {
      setFeedback({ type: 'error', message: 'Venue ID, Name, Capacity, and Status are required.' });
      return;
    }

    if (Number(formData.capacity) < 1) {
      setFeedback({ type: 'error', message: 'Capacity must be at least 1.' });
      return;
    }

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

      <div className="card" style={{ maxWidth: '720px' }}>
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
                    className="form-input"
                    placeholder="e.g. HALL-101"
                    value={formData.venueId}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Venue Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    placeholder="e.g. Main Auditorium"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
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
                    className="form-input"
                    placeholder="e.g. 500"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="form-input"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
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
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/venues')}
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
