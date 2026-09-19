/**
 * PmOtpScreen.jsx
 *
 * Shared OTP verification screen for both flows.
 *
 * flow = 'firsttime':
 *   â-¢ Appears after PmFirstTimeSetup.
 *   â-¢ Receives `pendingPassword` ({ newPassword, retypePassword }) from parent.
 *   â-¢ After OTP is verified, immediately calls updatePassword â-- one round-trip
 *     instead of two, keeping the UX tight.
 *
 * flow = 'login':
 *   â-¢ Appears first (no current-password step).
 *   â-¢ After OTP is verified, parent transitions to PmNewPasswordScreen.
 *   â-¢ `pendingPassword` is null for this flow.
 *
 * Test OTP: 000000
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  FlaskConical,
} from 'lucide-react';
import { verifyOtp, updatePassword, initLogin, initFirstTime } from './pmService';
import PmStepIndicator from './PmStepIndicator';

const FLOW_META = {
  firsttime: {
    account: 'firsttime@universityerp.test',
    title: 'First-Time Login',
    subtitle: 'Enter your OTP to confirm',
  },
  login: {
    account: 'login@universityerp.test',
    title: 'Login',
    subtitle: 'Verify OTP to set new password',
  },
};

const DEFAULT_PASSWORD = '123456';

/**
 * Props:
 *   flow            'firsttime' | 'login'
 *   steps           string[]
 *   currentStep     number (1-based)
 *   pendingPassword { newPassword, retypePassword } | null
 *   onSuccess       () => void  â-- called when OTP verified (+ password saved for firsttime)
 *   onBack          () => void
 */
const PmOtpScreen = ({ flow, steps, currentStep, pendingPassword, onSuccess, onBack }) => {
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');

  const meta = FLOW_META[flow] || FLOW_META.login;

  // Auto-initiate OTP on mount for the 'login' flow.
  // For 'firsttime', the OTP was already issued by PmFirstTimeSetup's API call.
  useEffect(() => {
    if (flow === 'login') {
      initLogin()
        .then((res) => setInfo(res.message || 'OTP generated. Use test OTP: 000000'))
        .catch((err) => setError(err.message || 'Failed to generate OTP. Please try again.'));
    } else {
      setInfo('OTP generated. Enter the test OTP below to confirm your identity.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    if (error) setError('');
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      let res;
      if (flow === 'login') {
        res = await initLogin();
      } else {
        res = await initFirstTime(DEFAULT_PASSWORD);
      }
      setInfo(res.message || 'New OTP generated. Use test OTP: 000000');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    if (cleanOtp.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    try {
      // Step 1 â-- verify the OTP on the backend.
      await verifyOtp(flow, cleanOtp);

      // Step 2 â-- for 'firsttime', immediately save the password now that OTP
      // has been confirmed. The password was collected on the previous screen
      // and threaded here via pendingPassword.
      if (flow === 'firsttime' && pendingPassword) {
        await updatePassword(
          flow,
          pendingPassword.newPassword,
          pendingPassword.retypePassword
        );
      }

      // Notify parent to advance the state machine.
      onSuccess();
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* Header */}
      <div className="auth-header">
        <div className="auth-logo-icon">
          <ShieldCheck size={32} />
        </div>
        <h1 className="auth-title">{meta.title}</h1>
        <p className="auth-subtitle">{meta.subtitle}</p>
      </div>

      <PmStepIndicator steps={steps} current={currentStep} />

      {/* Account pill */}
      <div className="account-pill" style={{ marginBottom: '1rem' }}>
        <span className="account-pill-label">Demo account:</span>
        <span className="account-pill-value">{meta.account}</span>
      </div>

      {/* Test-mode hint */}
      <div className="auth-alert alert-info" style={{ marginBottom: '1rem' }}>
        <FlaskConical size={16} />
        <span>
          Test mode â-- use OTP&nbsp;<strong>000000</strong>
        </span>
      </div>

      {/* Feedback */}
      {error && (
        <div className="auth-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {info && !error && (
        <div className="auth-alert alert-info">
          <RefreshCw size={16} />
          <span>{info}</span>
        </div>
      )}

      {/* OTP form */}
      <form onSubmit={handleVerify} className="auth-form">
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="pm-otp-input">
              6-Digit OTP
            </label>
          </div>
          <div className="input-wrapper">
            <ShieldCheck size={18} className="input-icon" />
            <input
              id="pm-otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="form-input code-input"
              placeholder="000000"
              value={otp}
              onChange={handleOtpChange}
              autoFocus
              autoComplete="one-time-code"
              aria-label="6-digit OTP"
              aria-describedby="pm-otp-help"
            />
          </div>
          <span id="pm-otp-help" className="input-help">
            Enter the 6-digit code. For testing, use <strong>000000</strong>.
          </span>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button
              type="button"
              className="resend-otp-btn"
              onClick={handleResend}
              disabled={resending || loading}
              aria-label="Resend OTP"
            >
              {resending ? (
                <>
                  <RefreshCw
                    size={13}
                    style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }}
                  />
                  Resending...
                </>
              ) : (
                'Resend OTP'
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading || otp.length !== 6}
          aria-busy={loading}
        >
          <span>
            {loading
              ? flow === 'firsttime'
                ? 'Verifying & Saving...'
                : 'Verifying...'
              : 'Verify OTP'}
          </span>
          <CheckCircle2 size={18} />
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

export default PmOtpScreen;
