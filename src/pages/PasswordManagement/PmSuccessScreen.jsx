/**
 * PmSuccessScreen.jsx
 *
 * Final screen shown after a successful password update in either flow.
 * Displays a clear success message and links to the Test Login page
 * so the user can verify the update worked.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FlaskConical, ArrowLeft } from 'lucide-react';

const FLOW_META = {
  firsttime: {
    account: 'firsttime@universityerp.test',
    label: 'First-Time Login',
  },
  login: {
    account: 'login@universityerp.test',
    label: 'Login',
  },
};

const PmSuccessScreen = ({ flow, onGoHome }) => {
  const meta = FLOW_META[flow] || FLOW_META.login;

  return (
    <div className="auth-card">
      {/* Success icon */}
      <div className="auth-header">
        <div className="auth-logo-icon pm-success-icon">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="auth-title">Password Updated Successfully</h1>
        <p className="auth-subtitle">
          Your new password has been saved for the {meta.label} demo account.
        </p>
      </div>

      {/* Success confirmation */}
      <div className="auth-alert alert-success" style={{ marginBottom: '1.5rem' }}>
        <CheckCircle2 size={18} />
        <span>Password updated successfully.</span>
      </div>

      {/* Account pill showing which account was updated */}
      <div className="account-pill" style={{ marginBottom: '1.5rem' }}>
        <span className="account-pill-label">Updated account:</span>
        <span className="account-pill-value">{meta.account}</span>
      </div>

      {/* Next step guidance */}
      <p className="pm-success-hint">
        You can now verify the update by going to the Test Login page and
        signing in with your new password.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Link
          to="/password-management/test-login"
          className="submit-btn"
          style={{ textDecoration: 'none', textAlign: 'center' }}
        >
          <FlaskConical size={18} />
          <span>Go to Test Login</span>
        </Link>

        <button type="button" className="secondary-btn" onClick={onGoHome}>
          <ArrowLeft size={16} />
          <span>Back to Password Management</span>
        </button>
      </div>
    </div>
  );
};

export default PmSuccessScreen;
