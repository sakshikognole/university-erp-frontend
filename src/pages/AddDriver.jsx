import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, UserCheck, Phone, CreditCard } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const AddDriver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [idLoading, setIdLoading] = useState(!isEditMode);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    driverId: '',
    name: '',
    phone: '',
    licenseNumber: '',
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
      loadDriverDetails();
    } else {
      fetchNextDriverId();
    }
  }, [id]);

  const loadDriverDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/drivers/${id}`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const driver = await res.json();
        setFormData({
          driverId: driver.driverId || '',
          name: driver.name || '',
          phone: driver.phone || '',
          licenseNumber: driver.licenseNumber || '',
          status: driver.status || 'ACTIVE',
        });
      } else {
        setFeedback({ type: 'error', message: 'Driver not found.' });
      }
    } catch (err) {
      console.error('Error fetching driver details:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server.' });
    } finally {
      setFetching(false);
    }
  };

  const fetchNextDriverId = async () => {
    setIdLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/drivers/next-id`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, driverId: data.nextId || 101 }));
      } else {
        setFormData((prev) => ({ ...prev, driverId: 101 }));
      }
    } catch (err) {
      console.warn('Could not auto-generate driver ID:', err);
      setFormData((prev) => ({ ...prev, driverId: 101 }));
    } finally {
      setIdLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Driver Name is required.' });
      return;
    }

    setLoading(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/transport/drivers/${id}`
        : `${API_BASE_URL}/transport/drivers`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({
          driverId: Number(formData.driverId),
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.message || 'Failed to save driver.' });
        setLoading(false);
        return;
      }

      setFeedback({
        type: 'success',
        message: isEditMode ? 'Driver updated successfully!' : 'Driver added successfully!',
      });
      setTimeout(() => navigate('/transport'), 1200);
    } catch (err) {
      console.error('Error saving driver:', err);
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
              {isEditMode ? 'Edit Driver' : 'Add Driver'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update driver credentials and license details'
                : 'Register a new driver for campus transport vehicles'}
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
            <p>Loading driver details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-section">
              <h3 className="form-section-title">Driver Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="driverId" className="form-label">
                    Driver ID {isEditMode ? '' : '(Auto-Generated)'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      id="driverId"
                      name="driverId"
                      className="form-input"
                      value={formData.driverId}
                      onChange={handleInputChange}
                      placeholder={idLoading ? 'Generating ID...' : 'e.g. 101'}
                      required
                    />
                    {idLoading && (
                      <Loader2
                        size={16}
                        className="spin-animate"
                        style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-secondary)' }}
                      />
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="form-input"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="name" className="form-label">
                  Driver Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    className="form-input"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="licenseNumber" className="form-label">
                    License Number
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    className="form-input"
                    placeholder="e.g. DL-0420110012345"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                  />
                </div>
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
                    <span>{isEditMode ? 'Update Driver' : 'Save Driver'}</span>
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

export default AddDriver;
