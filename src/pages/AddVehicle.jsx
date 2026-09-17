import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, Bus } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const AddVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    vehicleId: '',
    name: '',
    vehicleNumber: '',
    capacity: 40,
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
      loadVehicleDetails();
    }
  }, [id]);

  const loadVehicleDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/vehicles/${id}`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const vehicle = await res.json();
        setFormData({
          vehicleId: vehicle.vehicleId || '',
          name: vehicle.name || '',
          vehicleNumber: vehicle.vehicleNumber || '',
          capacity: vehicle.capacity || 40,
          status: vehicle.status || 'ACTIVE',
        });
      } else {
        setFeedback({ type: 'error', message: 'Vehicle not found.' });
      }
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server.' });
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!formData.vehicleId.trim() || !formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Vehicle ID and Vehicle Name are required.' });
      return;
    }

    setLoading(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/transport/vehicles/${id}`
        : `${API_BASE_URL}/transport/vehicles`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({
          vehicleId: formData.vehicleId.trim(),
          name: formData.name.trim(),
          vehicleNumber: formData.vehicleNumber.trim(),
          capacity: Number(formData.capacity) || 40,
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.message || 'Failed to save vehicle.' });
        setLoading(false);
        return;
      }

      setFeedback({
        type: 'success',
        message: isEditMode ? 'Vehicle updated successfully!' : 'Vehicle added successfully!',
      });
      setTimeout(() => navigate('/transport'), 1200);
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server. Please try again.' });
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
            onClick={() => navigate('/transport')}
            title="Back to Transport"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEditMode ? 'Edit Vehicle' : 'Add Vehicle'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update fleet vehicle information and seating capacity'
                : 'Register a new bus or transport vehicle in the fleet'}
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

      <div className="card" style={{ maxWidth: '640px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading vehicle details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-section">
              <h3 className="form-section-title">Vehicle Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vehicleId" className="form-label">
                    Vehicle ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="vehicleId"
                    name="vehicleId"
                    className="form-input"
                    placeholder="e.g. BUS-101 or 1"
                    value={formData.vehicleId}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Vehicle Name / Model <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    placeholder="e.g. Tata Starbus 40-Seater"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="vehicleNumber" className="form-label">
                    Registration / Plate Number
                  </label>
                  <input
                    type="text"
                    id="vehicleNumber"
                    name="vehicleNumber"
                    className="form-input"
                    placeholder="e.g. MH-12-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="capacity" className="form-label">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    className="form-input"
                    placeholder="e.g. 40"
                    min="1"
                    value={formData.capacity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="status" className="form-label">
                  Operational Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="form-input"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="ACTIVE">Active (In Service)</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-actions-row" style={{ marginTop: '1.75rem' }}>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/transport')}
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
                    <span>{isEditMode ? 'Update Vehicle' : 'Save Vehicle'}</span>
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

export default AddVehicle;
