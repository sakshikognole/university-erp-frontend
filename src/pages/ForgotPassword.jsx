import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Key,
  Mail,
  Lock,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
  KeyRound,
} from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { sendOtp, resetPassword } = useAuth();

  const [step, setStep] = useState(1); // Step 1: Request OTP, Step 2: Reset Password
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Request OTP (Step 1)
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setInfo('');
    setSuccess('');

    if (!identifier.trim()) {
      setError('Please enter your registered Email ID or PRN Number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(identifier.trim());
      setInfo(res.message || 'OTP generated successfully. For testing, use OTP: 000000');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Account not found with provided Email or PRN.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP in Step 2
  const handleResendOtp = async () => {
    setError('');
    setInfo('');
    setSuccess('');
    setResending(true);
    try {
      const res = await sendOtp(identifier.trim());
      setInfo(res.message || 'New OTP generated! For testing, use test OTP: 000000');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // Handle Reset Password (Step 2)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError('Please enter the 6-digit verification OTP (Test OTP: 000000).');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      return;
    }

    if (!newPassword) {
      setError('Please enter your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password should be at least 6 characters long.');
      return;
    }

    if (!retypePassword) {
      setError('Please retype your new password to confirm.');
      return;
    }

    if (newPassword !== retypePassword) {
      setError('New password and retyped password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(identifier.trim(), cleanOtp, newPassword, retypePassword);
      setSuccess(res.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = newPassword && retypePassword && newPassword === retypePassword;
  const passwordsMismatch = newPassword && retypePassword && newPassword !== retypePassword;

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-logo-icon">
            <Key size={32} />
          </div>
          <h1 className="auth-title">Password Recovery</h1>
          <p className="auth-subtitle">Verify Identity & Set New Credentials</p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator-bar">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-text">Request OTP</span>
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-text">Reset Password</span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="auth-alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="auth-alert alert-info">
            <RefreshCw size={18} />
            <span>{info}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert alert-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Step 1: Request OTP Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="recovery-identifier">
                Email ID or PRN Number
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="recovery-identifier"
                  type="text"
                  className="form-input"
                  placeholder="e.g. superadmin@university.edu or PRN2026001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <span className="input-help">
                We'll generate a 6-digit OTP for testing (<strong>000000</strong>) to verify your account.
              </span>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              <span>{loading ? 'Generating OTP...' : 'Send 6-Digit OTP'}</span>
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP & New Password Form */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="account-pill">
              <span className="account-pill-label">Resetting password for:</span>
              <span className="account-pill-value">{identifier}</span>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="otp-input">
                  6-Digit OTP Verification
                </label>
                <button
                  type="button"
                  className="resend-otp-btn"
                  onClick={handleResendOtp}
                  disabled={resending || loading}
                >
                  {resending ? 'Resending...' : 'Resend OTP'}
                </button>
              </div>
              <div className="input-wrapper">
                <ShieldCheck size={18} className="input-icon" />
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  className="form-input code-input"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                />
              </div>
              {/* <span className="input-help">
                Test OTP for verification is <strong>000000</strong>
              </span> */}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-password">
                New Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="retype-password">
                  Retype New Password
                </label>
                {passwordsMatch && (
                  <span className="password-match-badge match">
                    <Check size={12} /> Passwords match
                  </span>
                )}
                {passwordsMismatch && (
                  <span className="password-match-badge mismatch">
                    <X size={12} /> Passwords do not match
                  </span>
                )}
              </div>
              <div className="input-wrapper">
                <KeyRound size={18} className="input-icon" />
                <input
                  id="retype-password"
                  type={showRetypePassword ? 'text' : 'password'}
                  className={`form-input ${passwordsMismatch ? 'input-error' : ''}`}
                  placeholder="Retype new password"
                  value={retypePassword}
                  onChange={(e) => setRetypePassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowRetypePassword(!showRetypePassword)}
                  title={showRetypePassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showRetypePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || (retypePassword && !passwordsMatch)}
            >
              <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
            </button>

          </form>
        )}

        {/* Footer Navigation */}
        <div className="auth-footer">
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} />
            <span>Return to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

