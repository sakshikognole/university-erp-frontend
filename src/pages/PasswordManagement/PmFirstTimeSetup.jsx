---/**
 * PmFirstTimeSetup.jsx
 *
 * First-Time Login -----" Step 1 screen.
 *
 * Fields:
 *   ------- Current Password  -----" pre-filled "123456" but editable; user must enter
 *                         their actual current password (which may have been
 *                         changed from the default on a previous run).
 *   ------- New Password      -----" user enters chosen password
 *   ------- Retype Password   -----" must match; red border + inline error if not
 *
 * On Save:
 *   1. Validates all fields client-side.
 *   2. Calls POST /api/password-mgmt/firsttime/init with the current password
 *      the user typed; backend verifies it and issues a test OTP.
 *   3. Calls onSuccess(newPassword, retypePassword) so the parent can carry
 *      these values to the OTP screen, which commits the change after verify.
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
  ShieldCheck,
} from 'lucide-react';
import { initFirstTime } from './pmService';
import PmStepIndicator from './PmStepIndicator';

const PmFirstTimeSetup = ({ steps, currentStep, onSuccess, onBack }) => {
  // Pre-filled with the default but editable -----" user types their real current password
  const [currentPassword, setCurrentPassword] = useState('123456');
  const [newPassword, setNewPassword]          = useState('');
  const [retypePassword, setRetypePassword]    = useState('');
  const [showCurrent, setShowCurrent]          = useState(false);
  const [showNew, setShowNew]                  = useState(false);
  const [showRetype, setShowRetype]            = useState(false);
  const [loading, setLoading]                  = useState(false);
  const [error, setError]                      = useState('');

  // Only show mismatch once the user has started typing the retype field
  const retypeTouched     = retypePassword.length > 0;
  const passwordsMatch    = retypeTouched && newPassword === retypePassword;
  const passwordsMismatch = retypeTouched && newPassword !== retypePassword;

  const validate = () => {
    if (!currentPassword)
      return 'Current password cannot be empty.';
    if (!newPassword)
      return 'New password cannot be empty.';
    if (newPassword.length < 6)
      return 'New password must be at least 6 characters.';
    if (newPassword === currentPassword)
      return 'New password cannot be the same as your current password.';
    if (!retypePassword)
      return 'Please retype your new password.';
    if (newPassword !== retypePassword)
      return 'Passwords do not match.';
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
      // Send the user-typed current password to backend for verification.
      // Backend issues a test OTP if it matches.
      await initFirstTime(currentPassword);
      // Pass the new passwords up so the OTP screen can commit them after verify.
      onSuccess(newPassword, retypePassword);
    } catch (err) {
      setError(err.message || 'Failed to initiate first-time setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo-icon">
          <Lock size={32} />
        </div>
        <h1 className="auth-title">First-Time Login</h1>
        <p className="auth-subtitle">Verify your current password and set a new one</p>
      </div>

      <PmStepIndicator steps={steps} current={currentStep} />

      <div className="account-pill" style={{ marginBottom: '1rem' }}>
        <span className="account-pill-label">Demo account:</span>
        <span className="account-pill-value">firsttime@universityerp.test</span>
      </div>

      {error && (
        <div className="auth-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="auth-form" noValidate>

        {/* --"-----"--- Current Password (editable, pre-filled with default) --"-----"--- */}
        <div className="form-group">
          <label className="form-label" htmlFor="pm-current-password">
            Current Password
          </label>
          <div className="input-wrapper">
            <ShieldCheck size={18} className="input-icon" />
            <input
              id="pm-current-password"
              type={showCurrent ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
              aria-label="Current password"
              aria-describedby="current-pass-help"
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowCurrent((p) => !p)}
              tabIndex={-1}
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
            >
              {showCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <span id="current-pass-help" className="input-help">
            Default is <strong>123456</strong>. If you changed it before, enter your updated password.
          </span>
        </div>

        {/* --"-----"--- New Password --"-----"--- */}
        <div className="form-group">
          <label className="form-label" htmlFor="pm-new-password">
            New Password
          </label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input
              id="pm-new-password"
              type={showNew ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
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

        {/* --"-----"--- Retype Password --"-----"--- */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="pm-retype-password">
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
              id="pm-retype-password"
              type={showRetype ? 'text' : 'password'}
              className={`form-input ${passwordsMismatch ? 'input-error' : ''}`}
              placeholder="Retype your new password"
              value={retypePassword}
              onChange={(e) => { setRetypePassword(e.target.value); setError(''); }}
              autoComplete="new-password"
              aria-label="Retype new password"
              aria-invalid={passwordsMismatch}
              aria-describedby={passwordsMismatch ? 'retype-error' : undefined}
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
            <span id="retype-error" className="pm-field-error" role="alert">
              Passwords do not match.
            </span>
          )}
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading || passwordsMismatch}
          aria-busy={loading}
        >
          <span>{loading ? 'Saving...' : 'Save & Continue'}</span>
        </button>

      </form>

      <div className="auth-footer">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};

export default PmFirstTimeSetup;
