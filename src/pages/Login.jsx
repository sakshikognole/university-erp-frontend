import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, UserCheck, BookOpen, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { loginAdmin, loading } = useAuth();

  const [adminType, setAdminType] = useState('SUPER_ADMIN'); // SUPER_ADMIN, SUB_ADMIN, TEACHER
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const adminOptions = [
    { id: 'SUPER_ADMIN', label: 'Super Admin', icon: ShieldCheck, desc: 'Full System Control' },
    { id: 'SUB_ADMIN', label: 'Sub Admin', icon: UserCheck, desc: 'Departmental Management' },
    { id: 'TEACHER', label: 'Teacher Login', icon: BookOpen, desc: 'Faculty & Academics' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please enter both Email ID and Password.');
      return;
    }

    try {
      const res = await loginAdmin(email, password, adminType);

      setSuccess(res.message || 'Login successful. Redirecting...');

      setTimeout(() => {
        if (res.user.adminType === 'SUPER_ADMIN') {
          navigate('/super-admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 800);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
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
          <h1 className="auth-title">University ERP Portal</h1>
          <p className="auth-subtitle">Admin Authentication Management System</p>
        </div>

        {/* Admin Type Selector */}
        <div className="admin-type-selector">
          <label className="input-label">Select Admin Access Level</label>
          <div className="admin-tabs">
            {adminOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = adminType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`admin-tab-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setAdminType(opt.id);
                    setError('');
                  }}
                >
                  <Icon size={18} className="tab-icon" />
                  <span className="tab-label">{opt.label}</span>
                </button>
              );
            })}
          </div>
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
            <ShieldCheck size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Email ID
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email-input"
                type="email"
                className="form-input"
                placeholder="e.g. superadmin@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            <span>{loading ? 'Authenticating...' : `Sign In as ${adminOptions.find(o => o.id === adminType)?.label}`}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-footer">
          <span className="footer-text">Student Portal Access?</span>
          <Link to="/login/student" className="footer-link">
            Switch to Student Login
          </Link>
        </div>

        {/* Demo Credentials Helper
        <div className="demo-credentials-box">
          <p className="demo-title">Default Demo Credentials:</p>
          <p>Super Admin: <code>superadmin@university.edu</code> | Pass: <code>Admin@123</code></p>
          <p>Sub Admin: <code>subadmin@university.edu</code> | Pass: <code>SubAdmin@123</code></p>
          <p>Teacher: <code>teacher@university.edu</code> | Pass: <code>Teacher@123</code></p>
        </div> */}

      </div>
    </div>
  );
};

export default Login;
