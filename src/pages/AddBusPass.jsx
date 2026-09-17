import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CreditCard,
  Ticket,
  Navigation,
  Calendar,
  UserCheck,
  Search,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const AddBusPass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [routes, setRoutes] = useState([]);
  const [availableFromStops, setAvailableFromStops] = useState([]);

  // Student verification states
  const [verifyingStudent, setVerifyingStudent] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [studentError, setStudentError] = useState('');

  const [formData, setFormData] = useState({
    passId: '',
    studentId: '',
    studentName: '',
    routeId: '',
    fromStop: '',
    toStop: 'Main University Campus',
    paymentStatus: 'PAID',
    validTill: '',
  });

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchRoutes();
    if (isEditMode) {
      loadPassDetails();
    } else {
      fetchNextPassId();
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      const dateStr = sixMonthsLater.toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, validTill: dateStr }));
    }
  }, [id]);

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/transport/routes`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (err) {
      console.warn('Error loading routes:', err);
    }
  };

  const loadPassDetails = async () => {
    setFetching(true);
    try {
      const [passRes, routesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/transport/passes/${id}`, { headers: authHeader() }),
        fetch(`${API_BASE_URL}/transport/routes`, { headers: authHeader() }),
      ]);

      let loadedRoutes = [];
      if (routesRes.ok) {
        loadedRoutes = await routesRes.json();
        setRoutes(loadedRoutes);
      }

      if (passRes.ok) {
        const pass = await passRes.json();
        const dateStr = pass.validTill ? new Date(pass.validTill).toISOString().split('T')[0] : '';
        setFormData({
          passId: pass.passId || '',
          studentId: pass.studentId || '',
          studentName: pass.studentName || '',
          routeId: pass.routeId !== undefined ? pass.routeId : '',
          fromStop: pass.fromStop || '',
          toStop: pass.toStop || 'Main University Campus',
          paymentStatus: pass.paymentStatus || 'PAID',
          validTill: dateStr,
        });

        // Verify loaded student
        if (pass.studentId) {
          verifyStudentPRN(pass.studentId);
        }

        // Set stops for current route
        const activeRoute = loadedRoutes.find((r) => String(r.routeId) === String(pass.routeId));
        if (activeRoute && activeRoute.stops) {
          setAvailableFromStops(activeRoute.stops);
        }
      } else {
        setFeedback({ type: 'error', message: 'Bus pass not found.' });
      }
    } catch (err) {
      console.error('Error fetching pass details:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server.' });
    } finally {
      setFetching(false);
    }
  };

  const fetchNextPassId = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/transport/passes/next-id`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.nextPassId) {
          setFormData((prev) => ({ ...prev, passId: data.nextPassId }));
        }
      }
    } catch (err) {
      console.warn('Error fetching next pass ID:', err);
    }
  };

  // Verify student PRN against database
  const verifyStudentPRN = async (prnToVerify) => {
    const prn = (prnToVerify || formData.studentId || '').trim();
    if (!prn) {
      setStudentInfo(null);
      setStudentError('');
      return null;
    }

    setVerifyingStudent(true);
    setStudentError('');

    try {
      const res = await fetch(`${API_BASE_URL}/transport/verify-student/${encodeURIComponent(prn)}`, {
        headers: authHeader(),
      });

      const data = await res.json();
      if (res.ok && data.valid && data.student) {
        setStudentInfo(data.student);
        setStudentError('');
        setFormData((prev) => ({
          ...prev,
          studentId: data.student.prn,
          studentName: data.student.name,
        }));
        return data.student;
      } else {
        setStudentInfo(null);
        setStudentError(data.message || `No enrolled student found with PRN "${prn}".`);
        return null;
      }
    } catch (err) {
      console.error('Error checking student PRN:', err);
      setStudentError('Failed to connect to server to verify student PRN.');
      return null;
    } finally {
      setVerifyingStudent(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'studentId') {
      setStudentInfo(null);
      setStudentError('');
    }
  };

  const handleStudentIdBlur = () => {
    if (formData.studentId.trim()) {
      verifyStudentPRN(formData.studentId);
    }
  };

  const handleRouteChange = (e) => {
    const selectedRouteId = e.target.value;
    const selectedRoute = routes.find((r) => String(r.routeId) === String(selectedRouteId));

    setFormData((prev) => ({
      ...prev,
      routeId: selectedRouteId,
      fromStop: '', // reset from stop when route changes
    }));

    if (selectedRoute && selectedRoute.stops && selectedRoute.stops.length > 0) {
      setAvailableFromStops(selectedRoute.stops);
    } else {
      setAvailableFromStops([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!formData.passId.trim()) {
      setFeedback({ type: 'error', message: 'Pass ID is required.' });
      return;
    }

    if (!formData.studentId.trim()) {
      setFeedback({ type: 'error', message: 'Student PRN / ID is required.' });
      return;
    }

    // Verify student PRN exists before saving
    let validStudent = studentInfo;
    if (!validStudent) {
      validStudent = await verifyStudentPRN(formData.studentId);
    }

    if (!validStudent) {
      setFeedback({
        type: 'error',
        message: `Student with PRN '${formData.studentId.trim()}' does not exist. Please enter a valid enrolled student PRN.`,
      });
      return;
    }

    if (!formData.routeId) {
      setFeedback({ type: 'error', message: 'Please select a Bus Route.' });
      return;
    }

    if (!formData.fromStop.trim()) {
      setFeedback({ type: 'error', message: 'Please select or enter the "From" stop.' });
      return;
    }

    if (!formData.toStop.trim()) {
      setFeedback({ type: 'error', message: '"To" stop cannot be empty.' });
      return;
    }

    if (!formData.validTill) {
      setFeedback({ type: 'error', message: 'Please select validity expiry date.' });
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode
        ? `${API_BASE_URL}/transport/passes/${id}`
        : `${API_BASE_URL}/transport/passes`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({
          passId: formData.passId.trim(),
          studentId: validStudent.prn,
          studentName: validStudent.name,
          routeId: Number(formData.routeId),
          fromStop: formData.fromStop.trim(),
          toStop: formData.toStop.trim(),
          paymentStatus: formData.paymentStatus,
          validTill: formData.validTill,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.message || 'Failed to save bus pass.' });
        setLoading(false);
        return;
      }

      setFeedback({
        type: 'success',
        message: isEditMode ? 'Bus Pass updated successfully!' : 'Bus Pass issued successfully!',
      });
      setTimeout(() => navigate('/transport'), 1200);
    } catch (err) {
      console.error('Error saving bus pass:', err);
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
              {isEditMode ? 'Edit Bus Pass' : 'Add Bus Pass'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update bus pass route, validity date, and payment status'
                : 'Issue a new transport bus pass for an enrolled student'}
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
            <p>Loading bus pass details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-section">
              <h3 className="form-section-title">Pass & Student Verification</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="passId" className="form-label">
                    Pass ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="passId"
                    name="passId"
                    className="form-input"
                    placeholder="e.g. BP-1001"
                    value={formData.passId}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="studentId" className="form-label">
                    Student PRN / ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      className={`form-input ${studentError ? 'form-input-error' : ''}`}
                      style={{
                        paddingRight: '2.5rem',
                        borderColor: studentInfo ? '#22c55e' : studentError ? '#ef4444' : undefined,
                      }}
                      placeholder="Enter Student PRN (e.g. PRN1001)"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      onBlur={handleStudentIdBlur}
                      required
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {verifyingStudent ? (
                        <Loader2 size={16} className="spin-animate" style={{ color: '#6b7280' }} />
                      ) : studentInfo ? (
                        <CheckCircle2 size={18} style={{ color: '#22c55e' }} title="Student verified" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => verifyStudentPRN(formData.studentId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '2px',
                          }}
                          title="Verify Student PRN"
                        >
                          <Search size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {studentError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#ef4444',
                        fontSize: '0.8rem',
                        marginTop: '4px',
                      }}
                    >
                      <AlertCircle size={14} />
                      <span>{studentError}</span>
                    </div>
                  )}

                  {studentInfo && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '6px 10px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.82rem',
                        color: '#15803d',
                      }}
                    >
                      <UserCheck size={15} />
                      <span>
                        <strong>{studentInfo.name}</strong> • {studentInfo.degree || 'Student'} ({studentInfo.class || 'Enrolled'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="studentName" className="form-label">
                  Student Name (Auto-filled on PRN verification)
                </label>
                <input
                  type="text"
                  id="studentName"
                  name="studentName"
                  className="form-input"
                  placeholder="Auto-populated from verified student record"
                  value={formData.studentName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '1.75rem' }}>
              <h3 className="form-section-title">Route & Stops</h3>

              <div className="form-group">
                <label htmlFor="routeId" className="form-label">
                  Select Route <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="routeId"
                  name="routeId"
                  className="form-input"
                  value={formData.routeId}
                  onChange={handleRouteChange}
                  required
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map((r) => (
                    <option key={r._id || r.routeId} value={r.routeId}>
                      Route #{r.routeId}{r.routeName ? ` - ${r.routeName}` : ''} ({r.stops ? r.stops.length : 0} stops)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row" style={{ marginTop: '1rem' }}>
                {/* From Stop */}
                <div className="form-group">
                  <label htmlFor="fromStop" className="form-label">
                    Stops: From <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {availableFromStops.length > 0 ? (
                    <select
                      id="fromStop"
                      name="fromStop"
                      className="form-input"
                      value={formData.fromStop}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">-- Select Boarding Stop --</option>
                      {availableFromStops.map((stop, idx) => (
                        <option key={idx} value={stop}>
                          {stop} (Stop #{idx + 1})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="fromStop"
                      name="fromStop"
                      className="form-input"
                      placeholder="Enter boarding stop"
                      value={formData.fromStop}
                      onChange={handleInputChange}
                      required
                    />
                  )}
                </div>

                {/* To Stop (Default College Name) */}
                <div className="form-group">
                  <label htmlFor="toStop" className="form-label">
                    Stops: To <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="toStop"
                    name="toStop"
                    className="form-input"
                    placeholder="e.g. Main University Campus"
                    value={formData.toStop}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="form-helper" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Defaulted to College/University Campus.
                  </span>
                </div>
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '1.75rem' }}>
              <h3 className="form-section-title">Validity & Payment</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentStatus" className="form-label">
                    Payment Status <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="paymentStatus"
                    name="paymentStatus"
                    className="form-input"
                    value={formData.paymentStatus}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="validTill" className="form-label">
                    Valid Till Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    id="validTill"
                    name="validTill"
                    className="form-input"
                    value={formData.validTill}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
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
                    <span>{isEditMode ? 'Update Bus Pass' : 'Issue Bus Pass'}</span>
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

export default AddBusPass;
