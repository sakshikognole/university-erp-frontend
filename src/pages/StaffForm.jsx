import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const StaffForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    staffId: '',
    email: '',
    phone: '',
    dateOfJoining: '',
    role: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
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
      loadStaffDetails();
    }
  }, [id]);

  const loadStaffDetails = async () => {
    setFetching(true);
    try {
      // First try single staff endpoint
      const res = await fetch(`${API_BASE_URL}/super-admin/staff/${id}`, {
        headers: authHeader(),
      });

      if (res.ok) {
        const staff = await res.json();
        populateStaffData(staff);
      } else {
        // Fallback: search all staff
        const allRes = await fetch(`${API_BASE_URL}/super-admin/staff`, {
          headers: authHeader(),
        });
        if (allRes.ok) {
          const allStaff = await allRes.json();
          const found = allStaff.find((s) => s._id === id || s.staffId === id || s.staffId === id.toUpperCase());
          if (found) {
            populateStaffData(found);
          } else {
            setFeedback({ type: 'error', message: 'Staff member not found.' });
          }
        } else {
          setFeedback({ type: 'error', message: 'Failed to load staff details.' });
        }
      }
    } catch (err) {
      console.error('Error fetching staff details:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server to load staff details.' });
    } finally {
      setFetching(false);
    }
  };

  const populateStaffData = (staff) => {
    let formattedDate = '';
    if (staff.dateOfJoining) {
      try {
        formattedDate = new Date(staff.dateOfJoining).toISOString().slice(0, 10);
      } catch {
        formattedDate = staff.dateOfJoining;
      }
    }

    setFormData({
      name: staff.name || '',
      staffId: staff.staffId || '',
      email: staff.email || '',
      phone: staff.phone || '',
      dateOfJoining: formattedDate,
      role: staff.role || '',
      bankName: staff.bankDetails?.bankName || '',
      accountHolderName: staff.bankDetails?.accountHolderName || '',
      accountNumber: staff.bankDetails?.accountNumber || '',
      ifscCode: staff.bankDetails?.ifscCode || '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'staffId' || name === 'ifscCode' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!formData.name || !formData.staffId || !formData.email || !formData.phone || !formData.dateOfJoining || !formData.role) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/super-admin/staff/${id}`
        : `${API_BASE_URL}/super-admin/staff`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({
          name: formData.name.trim(),
          staffId: formData.staffId.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          dateOfJoining: formData.dateOfJoining,
          role: formData.role.trim(),
          bankDetails: {
            bankName: formData.bankName.trim(),
            accountHolderName: formData.accountHolderName.trim(),
            accountNumber: formData.accountNumber.trim(),
            ifscCode: formData.ifscCode.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || (isEditMode ? 'Failed to update staff member' : 'Failed to add staff member'));
      }

      setFeedback({
        type: 'success',
        message: isEditMode
          ? `Staff member '${formData.name}' updated successfully.`
          : 'Staff member added successfully.',
      });

      setTimeout(() => {
        navigate('/staff');
      }, 1200);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || (isEditMode ? 'Error updating staff member.' : 'Error adding staff member.'),
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
            onClick={() => navigate('/staff')}
            title="Back to Staff"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {isEditMode ? 'Edit Staff Member' : 'Add New Staff'}
            </h1>
            <p className="page-subtitle">
              {isEditMode
                ? 'Update staff member profile, role assignment, and bank details'
                : 'Register a new staff member into the university system'}
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
            <p>Loading staff details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-layout">
            <div className="form-section">
              <h3 className="form-section-title">Personal Information</h3>
              
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
                    placeholder="e.g. Jane Smith"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="staffId">
                    Staff ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="staffId"
                    name="staffId"
                    type="text"
                    className="form-input"
                    placeholder="e.g. STF2024001"
                    value={formData.staffId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. jane.smith@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Phone Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="dateOfJoining">
                    Date of Joining <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="dateOfJoining"
                    name="dateOfJoining"
                    type="date"
                    className="form-input"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="role">
                    Role <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="role"
                    name="role"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Professor, Lecturer, Admin"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '2rem' }}>
              <h3 className="form-section-title">Bank Details</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="bankName">
                    Bank Name
                  </label>
                  <input
                    id="bankName"
                    name="bankName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. State Bank of India"
                    value={formData.bankName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="accountHolderName">
                    Account Holder Name
                  </label>
                  <input
                    id="accountHolderName"
                    name="accountHolderName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jane Smith"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="accountNumber">
                    Account Number
                  </label>
                  <input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1234567890"
                    value={formData.accountNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ifscCode">
                    IFSC Code
                  </label>
                  <input
                    id="ifscCode"
                    name="ifscCode"
                    type="text"
                    className="form-input"
                    placeholder="e.g. SBIN0001234"
                    value={formData.ifscCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions-row" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => navigate('/staff')}
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
                    <span>{isEditMode ? 'Update Staff' : 'Save Staff'}</span>
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

export default StaffForm;
