import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, KeyRound, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const StudentLogin = () => {
  const navigate = useNavigate();
  const { loginStudent, loading } = useAuth();

  const [prn, setPrn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!prn || !password) {
      setError('Please enter both PRN Number and Password.');
      return;
    }

    try {
      const res = await loginStudent(prn, password);
      setSuccess(res.message || 'Student authentication successful. Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your PRN number and password.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-logo-icon">
            <GraduationCap size={32} />
          </div>
          <h1 className="auth-title">Student Portal</h1>
          <p className="auth-subtitle">Permanent Registration Number (PRN) Sign In</p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="auth-alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert alert-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="prn-input">
              PRN Number
            </label>
            <div className="input-wrapper">
              <KeyRound size={18} className="input-icon" />
              <input
                id="prn-input"
                type="text"
                className="form-input"
                placeholder="e.g. PRN2026001"
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="student-password">
                Password
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="student-password"
                type="password"
                className="form-input"
                placeholder="Enter student password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            <span>{loading ? 'Authenticating...' : 'Sign In as Student'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-footer">
          <span className="footer-text">Administrative Access?</span>
          <Link to="/login" className="footer-link">
            Switch to Admin Login
          </Link>
        </div>

        {/* Demo Credentials Helper
        <div className="demo-credentials-box">
          <p className="demo-title">Default Student Demo Credential:</p>
          <p>PRN: <code>PRN2026001</code> | Password: <code>Student@123</code></p>
        </div> */}

      </div>
    </div>
  );
};

export default StudentLogin;
