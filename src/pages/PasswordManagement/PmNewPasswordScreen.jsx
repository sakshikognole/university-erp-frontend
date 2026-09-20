/**
 * PmNewPasswordScreen.jsx
 *
 * Normal Login flow — final step.
 * Shows ONLY New Password + Retype Password (no current password field).
 *
 * Appears after OTP has been verified for the 'login' flow.
 * Calls POST /api/password-mgmt/update-password to commit the change.
 */

import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  Check,
} from 'lucide-react';
import { updatePassword } from './pmService';
import PmStepIndicator from './PmStepIndicator';

const PmNewPasswordScreen = ({ flow, steps, currentStep, onSuccess, onBack }) => {
  const [newPassword, setNewPassword]       = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [showNew, setShowNew]               = useState(false);
  const [showRetype, setShowRetype]         = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  // ── Real-time match state ─────────────────────────────────────────────────
  const retypeTouched     = retypePassword.length > 0;
  const passwordsMatch    = retypeTouched && newPassword === retypePassword;
  const passwordsMismatch = retypeTouched && newPassword !== retypePassword;

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!newPassword) return 'New password cannot be empty.';
    if (newPassword.length < 6) return 'New password must be at least 6 characters.';
    if (!retypePassword) return 'Please retype your new password.';
    if (newPassword !== retypePassword) return 'Passwords do not match.';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await updatePassword(flow, newPassword, retypePassword);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const accountEmail =
    flow === 'firsttime'
      ? 'firsttime@universityerp.test'
      : 'login@universityerp.test';

  return (
    <div className="auth-card">
      {/* Header */}
      <div className="auth-header">
        <div className="auth-logo-icon">
          <Lock size={32} />
        </div>
        <h1 className="auth-title">Set New Password</h1>
        <p className="auth-subtitle">OTP verified — choose your new password</p>
      </div>

      {/* Step indicator */}
      <PmStepIndicator steps={steps} current={currentStep} />

      {/* Account pill */}
      <div className="account-pill" style={{ marginBottom: '1rem' }}>
        <span className="account-pill-label">Demo account:</span>
        <span className="account-pill-value">{accountEmail}</span>
      </div>

      {/* Error alert */}
      {error && (
        <div className="auth-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="auth-form" noValidate>

        {/* New Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="pm-np-new-password">
            New Password
          </label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input
              id="pm-np-new-password"
              type={showNew ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              autoFocus
              autoComplete="new-password"
              aria-label="New password"
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowNew((p) => !p)}
              tabIndex={-1}
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>

        {/* Retype Password */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="pm-np-retype-password">
              Retype New Password
            </label>
            {passwordsMatch && (
              <span className="password-match-badge match" aria-live="polite">
                <Check size={12} /> Passwords match
              </span>
            )}
          </div>
          <div className="input-wrapper">
            <KeyRound size={18} className="input-icon" />
            <input
              id="pm-np-retype-password"
              type={showRetype ? 'text' : 'password'}
              className={`form-input ${passwordsMismatch ? 'input-error' : ''}`}
              placeholder="Retype your new password"
              value={retypePassword}
              onChange={(e) => { setRetypePassword(e.target.value); setError(''); }}
              autoComplete="new-password"
              aria-label="Retype new password"
              aria-invalid={passwordsMismatch}
              aria-describedby={passwordsMismatch ? 'np-retype-error' : undefined}
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowRetype((p) => !p)}
              tabIndex={-1}
              aria-label={showRetype ? 'Hide retype password' : 'Show retype password'}
            >
              {showRetype ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          {passwordsMismatch && (
            <span id="np-retype-error" className="pm-field-error" role="alert">
              Passwords do not match.
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading || passwordsMismatch}
          aria-busy={loading}
        >
          <span>{loading ? 'Saving...' : 'Save New Password'}</span>
        </button>

      </form>

      {/* Back navigation */}
      <div className="auth-footer">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};

export default PmNewPasswordScreen;
