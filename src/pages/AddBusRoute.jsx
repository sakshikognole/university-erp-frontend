import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, Plus, X, MapPin, Bus, User, Navigation } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const AddBusRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    routeId: '',
    hasCustomName: false,
    routeName: '',
    driverId: '',
    driverName: '',
    vehicleId: '',
    vehicleName: '',
    stops: [],
    status: 'ACTIVE',
  });

  const [stopInput, setStopInput] = useState('');

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchDriversAndVehicles();
    if (isEditMode) {
      loadRouteDetails();
    } else {
      fetchNextRouteId();
    }
  }, [id]);

  const fetchDriversAndVehicles = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/transport/drivers`, { headers: authHeader() }),
        fetch(`${API_BASE_URL}/transport/vehicles`, { headers: authHeader() }),
      ]);

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData);
      }
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setVehicles(vehiclesData);
      }
    } catch (err) {
      console.warn('Error fetching dropdown data:', err);
    }
  };

  const fetchNextRouteId = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/transport/routes/next-id`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, routeId: data.nextId || 1 }));
      }
    } catch (err) {
      console.warn('Could not auto-fetch route ID:', err);
    }
  };

  const loadRouteDetails = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transport/routes/${id}`, {
        headers: authHeader(),
      });

      if (res.ok) {
        const route = await res.json();
        setFormData({
          routeId: route.routeId || '',
          hasCustomName: Boolean(route.hasCustomName || route.routeName),
          routeName: route.routeName || '',
          driverId: route.driverId || '',
          driverName: route.driverName || '',
          vehicleId: route.vehicleId || '',
          vehicleName: route.vehicleName || '',
          stops: route.stops || [],
          status: route.status || 'ACTIVE',
        });
      } else {
        setFeedback({ type: 'error', message: 'Bus route not found.' });
      }
    } catch (err) {
      console.error('Error fetching route details:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server.' });
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        routeName: checked ? prev.routeName : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDriverChange = (e) => {
    const selectedDriverName = e.target.value;
    const selectedDriver = drivers.find((d) => d.name === selectedDriverName);
    setFormData((prev) => ({
      ...prev,
      driverName: selectedDriverName,
      driverId: selectedDriver ? selectedDriver.driverId : '',
    }));
  };

  const handleVehicleChange = (e) => {
    const selectedVehicleName = e.target.value;
    const selectedVehicle = vehicles.find((v) => v.name === selectedVehicleName);
    setFormData((prev) => ({
      ...prev,
      vehicleName: selectedVehicleName,
      vehicleId: selectedVehicle ? selectedVehicle.vehicleId : '',
    }));
  };

  // Process stop addition helper
  const addStopToList = (stopName) => {
    const trimmed = stopName.trim();
    if (trimmed && !formData.stops.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        stops: [...prev.stops, trimmed],
      }));
    }
  };

  // Comma trigger & input change handler
  const handleStopInputChange = (e) => {
    const value = e.target.value;
    // Check if the user typed a comma anywhere
    if (value.includes(',')) {
      const parts = value.split(',');
      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          // If before the last comma, add immediately
          if (part.trim()) addStopToList(part);
        } else {
          // The remainder after the last comma stays in input or gets added if empty
          setStopInput(part.trim() ? part : '');
        }
      });
      // If trailing comma was typed, clear input
      if (value.endsWith(',')) {
        setStopInput('');
      }
    } else {
      setStopInput(value);
    }
  };

  // Enter key or button click to add stop
  const handleStopKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (stopInput.trim()) {
        addStopToList(stopInput);
        setStopInput('');
      }
    }
  };

  const handleAddStopClick = () => {
    if (stopInput.trim()) {
      addStopToList(stopInput);
      setStopInput('');
    }
  };

  const handleRemoveStop = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (formData.routeId === '' || formData.routeId === null) {
      setFeedback({ type: 'error', message: 'Route ID is required (numeric).' });
      return;
    }

    if (!formData.driverName) {
      setFeedback({ type: 'error', message: 'Please select or enter a Driver Name.' });
      return;
    }

    if (!formData.vehicleName) {
      setFeedback({ type: 'error', message: 'Please select or enter a Vehicle Name.' });
      return;
    }

    if (formData.hasCustomName && !formData.routeName.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a Route Name or uncheck the custom Route Name option.' });
      return;
    }

    setLoading(true);

    const payload = {
      routeId: Number(formData.routeId),
      hasCustomName: formData.hasCustomName,
      routeName: formData.hasCustomName ? formData.routeName.trim() : '',
      driverId: formData.driverId || null,
      driverName: formData.driverName.trim(),
      vehicleId: formData.vehicleId || '',
      vehicleName: formData.vehicleName.trim(),
      stops: formData.stops,
      status: formData.status,
    };

    try {
      const url = isEditMode
        ? `${API_BASE_URL}/transport/routes/${id}`
        : `${API_BASE_URL}/transport/routes`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.message || 'Failed to save bus route.' });
        setLoading(false);
        return;
      }

      setFeedback({
        type: 'success',
        message: isEditMode ? 'Bus route updated successfully!' : 'Bus route created successfully!',
      });
      setTimeout(() => navigate('/transport'), 1200);
    } catch (err) {
      console.error('Error submitting bus route:', err);
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
              {isEditMode ? 'Edit Bus Route' : 'Add Bus Route'}
            </h1>
            <p className="page-subtitle">Configure transport bus route, driver, vehicle, and sequential stops</p>
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

      <div className="card" style={{ maxWidth: '780px' }}>
        {fetching ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin-animate" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading route details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-section">
              <h3 className="form-section-title">Route Identification</h3>

              {/* Route ID & Checkbox for Route Name */}
              <div className="form-row" style={{ alignItems: 'flex-start' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="routeId" className="form-label">
                    Route ID (Numeric) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    id="routeId"
                    name="routeId"
                    className="form-input"
                    placeholder="e.g. 1, 2, 101"
                    value={formData.routeId}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1.2, paddingTop: '1.8rem' }}>
                  <label
                    htmlFor="hasCustomName"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="hasCustomName"
                      name="hasCustomName"
                      checked={formData.hasCustomName}
                      onChange={handleInputChange}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
                    />
                    <span>Add Custom Route Name</span>
                  </label>
                </div>
              </div>

              {/* Conditional Route Name field */}
              {formData.hasCustomName && (
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="routeName" className="form-label">
                    Route Name (Letters & Numbers) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="routeName"
                    name="routeName"
                    className="form-input"
                    placeholder="e.g. North City Express - Route 1A"
                    value={formData.routeName}
                    onChange={handleInputChange}
                    required={formData.hasCustomName}
                  />
                </div>
              )}
            </div>

            <div className="form-section" style={{ marginTop: '1.75rem' }}>
              <h3 className="form-section-title">Assignment (Driver & Vehicle)</h3>

              <div className="form-row">
                {/* Driver Name Dropdown */}
                <div className="form-group">
                  <label htmlFor="driverName" className="form-label">
                    Driver Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="driverName"
                    name="driverName"
                    className="form-input"
                    value={formData.driverName}
                    onChange={handleDriverChange}
                    required
                  >
                    <option value="">-- Select Driver --</option>
                    {drivers.map((d) => (
                      <option key={d._id || d.driverId} value={d.name}>
                        {d.name} (ID: {d.driverId})
                      </option>
                    ))}
                  </select>
                  {drivers.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                      No drivers found.{' '}
                      <button
                        type="button"
                        style={{ color: '#2563eb', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
                        onClick={() => navigate('/transport/add-driver')}
                      >
                        Add a driver first
                      </button>
                    </span>
                  )}
                </div>

                {/* Vehicle Name Dropdown */}
                <div className="form-group">
                  <label htmlFor="vehicleName" className="form-label">
                    Vehicle Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="vehicleName"
                    name="vehicleName"
                    className="form-input"
                    value={formData.vehicleName}
                    onChange={handleVehicleChange}
                    required
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v._id || v.vehicleId} value={v.name}>
                        {v.name} ({v.vehicleId}{v.vehicleNumber ? ` - ${v.vehicleNumber}` : ''})
                      </option>
                    ))}
                  </select>
                  {vehicles.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                      No vehicles found.{' '}
                      <button
                        type="button"
                        style={{ color: '#2563eb', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
                        onClick={() => navigate('/transport/add-vehicle')}
                      >
                        Add a vehicle first
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stops Section with Comma Trigger */}
            <div className="form-section" style={{ marginTop: '1.75rem' }}>
              <h3 className="form-section-title">Bus Route Stops</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Enter stop names below. Type a <strong>comma ( , )</strong> or press <strong>Enter</strong> to instantly add each stop to the route sequence.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <MapPin
                    size={18}
                    style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Type stop name and press ',' or Enter (e.g. City Center,)"
                    value={stopInput}
                    onChange={handleStopInputChange}
                    onKeyDown={handleStopKeyDown}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddStopClick}
                  disabled={!stopInput.trim()}
                  style={{ height: '42px', padding: '0 1.25rem' }}
                >
                  <Plus size={16} />
                  <span>Add Stop</span>
                </button>
              </div>

              {/* Stops list sequence */}
              {formData.stops.length > 0 ? (
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(243, 244, 246, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  {formData.stops.map((stop, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: 500, color: '#1f2937' }}>{stop}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          borderRadius: '50%',
                        }}
                        title={`Remove stop ${stop}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px dashed #d1d5db',
                    color: '#6b7280',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                  }}
                >
                  No stops added yet. Type a stop name and comma above to add stops.
                </div>
              )}
            </div>

            <div className="form-actions-row" style={{ marginTop: '2rem' }}>
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
                    <span>{isEditMode ? 'Update Route' : 'Save Bus Route'}</span>
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

export default AddBusRoute;
