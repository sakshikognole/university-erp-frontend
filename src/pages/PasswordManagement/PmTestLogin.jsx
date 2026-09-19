/**
 * PmTestLogin.jsx
 *
 * Standalone test-login page at /password-management/test-login.
 *
 * Purpose: verify that a password updated via the Password Management
 * flows actually persisted in the database.
 *
 * Accepts email + password, calls POST /api/password-mgmt/test-login,
 * and shows a clear success or failure message.
 *
 * IMPORTANT: This is NOT the main ERP login page. It only authenticates
 * the two demo accounts and returns a plain confirmation â-- no JWT, no session.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { testLogin } from './pmService';

// Pre-fill hints so testers can quickly switch between the two demo accounts
const DEMO_ACCOUNTS = [
  { label: 'First-Time Login', email: 'firsttime@universityerp.test' },
  { label: 'Normal Login', email: 'login@universityerp.test' },
];

const PmTestLogin = () => {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null); // { type: 'success'|'error', message, account? }

  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('');
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    if (!email.trim()) {
      setResult({ type: 'error', message: 'Please enter an email address.' });
      return;
    }
    if (!password) {
      setResult({ type: 'error', message: 'Please enter a password.' });
      return;
    }

    setLoading(true);
    try {
      const data = await testLogin(email.trim().toLowerCase(), password);
      setResult({
        type: 'success',
        message: data.message || 'Login successful.',
        account: data.account,
      });
    } catch (err) {
      setResult({
        type: 'error',
        message: err.message || 'Invalid email or password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-icon">
            <FlaskConical size={32} />
          </div>
          <h1 className="auth-title">Test Login</h1>
          <p className="auth-subtitle">
            Verify that the updated password was saved correctly
          </p>
        </div>

        {/* Info banner */}
        <div className="auth-alert alert-info" style={{ marginBottom: '1.25rem' }}>
          <FlaskConical size={16} />
          <span>
            Only the two demo accounts are accepted here. This page does not
            affect the main ERP login.
          </span>
        </div>

        {/* Quick-fill buttons */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p className="input-label">Quick fill demo account</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {DEMO_ACCOUNTS.map((acct) => (
              <button
                key={acct.email}
                type="button"
                className="secondary-btn"
                style={{ flex: 1, minWidth: '120px', fontSize: '0.8125rem' }}
                onClick={() => handleQuickFill(acct.email)}
              >
                {acct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result message */}
        {result && (
          <div
            className={`pm-result-box ${result.type}`}
            role="alert"
            aria-live="polite"
          >
            {result.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <div>
              <div>{result.message}</div>
              {result.account && (
                <div style={{ fontSize: '0.8125rem', opacity: 0.85, marginTop: '0.2rem' }}>
                  Authenticated as: {result.account.name} ({result.account.email})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="pm-test-email">
              Email
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="pm-test-email"
                type="email"
                className="form-input"
                placeholder="e.g. firsttime@universityerp.test"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setResult(null); }}
                autoComplete="email"
                aria-label="Email address"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="pm-test-password">
              Password
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="pm-test-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter the updated password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setResult(null); }}
                autoComplete="current-password"
                aria-label="Password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            aria-busy={loading}
          >
            <span>{loading ? 'Logging in...' : 'Login'}</span>
            <LogIn size={18} />
          </button>

        </form>

        {/* Footer navigation */}
        <div className="auth-footer" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/password-management" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to Password Management</span>
          </Link>
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} />
            <span>Return to main login</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PmTestLogin;
