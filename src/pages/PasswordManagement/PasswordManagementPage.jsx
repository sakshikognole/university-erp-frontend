/**
 * PasswordManagementPage.jsx
 *
 * Entry point for the isolated Password Management demo module.
 *
 * Flows:
 *   First-Time Login:
 *     /password-management  (firsttime-setup screen)
 *       â-- /password-management/otp  (state: { flow: 'firsttime', pendingPassword })
 *         â-- /password-management    (state: { screen: 'success', completedFlow: 'firsttime' })
 *
 *   Normal Login:
 *     /password-management  (landing screen)
 *       â-- /password-management/otp  (state: { flow: 'login' })
 *         â-- /password-management    (state: { screen: 'login-newpassword' })
 *           â-- /password-management  (state: { screen: 'success', completedFlow: 'login' })
 *
 * The OTP step now lives at its own URL (/password-management/otp).
 * All other sub-screens remain as internal state within this component,
 * but the component also reads location.state to allow PmOtpPage to
 * navigate back and signal which screen to show.
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, UserPlus, ArrowLeft, FlaskConical } from 'lucide-react';

import PmFirstTimeSetup from './PmFirstTimeSetup';
import PmNewPasswordScreen from './PmNewPasswordScreen';
import PmSuccessScreen from './PmSuccessScreen';

const PasswordManagementPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  // â--â-- Resolve initial screen from location.state (set by PmOtpPage callbacks) â--â--
  const inboundState = location.state || {};
  const resolveInitialScreen = () => {
    if (inboundState.screen) return inboundState.screen;
    return 'landing';
  };

  const [screen, setScreen]               = useState(resolveInitialScreen);
  const [completedFlow, setCompletedFlow] = useState(inboundState.completedFlow || null);

  // â--â-- Step config â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const firstTimeSteps = ['Setup', 'OTP', 'Done'];
  const loginSteps     = ['OTP', 'New Password', 'Done'];

  const firstTimeCurrentStep =
    screen === 'firsttime-setup' ? 1 :
    screen === 'success'         ? 3 : 0;

  const loginCurrentStep =
    screen === 'login-newpassword' ? 2 :
    screen === 'success'           ? 3 : 0;

  // â--â-- Transitions â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
  const goLanding        = () => { setScreen('landing'); setCompletedFlow(null); };
  const goFirstTimeSetup = () => setScreen('firsttime-setup');
  const goSuccess        = (flow) => { setCompletedFlow(flow); setScreen('success'); };
  const goLoginNewPass   = () => setScreen('login-newpassword');

  // First-Time: setup â-- OTP page (carries passwords via navigation state)
  const goFirstTimeOtp = (newPassword, retypePassword) => {
    navigate('/password-management/otp', {
      state: { flow: 'firsttime', pendingPassword: { newPassword, retypePassword } },
    });
  };

  // Normal Login: landing â-- OTP page
  const goLoginOtp = () => {
    navigate('/password-management/otp', {
      state: { flow: 'login', pendingPassword: null },
    });
  };

  return (
    <div className="auth-container">

      {/* â--â-- LANDING â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â-- */}
      {screen === 'landing' && (
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-icon">
              <KeyRound size={32} />
            </div>
            <h1 className="auth-title">Password Management</h1>
            <p className="auth-subtitle">
              Developer Demo â-- Password Setup &amp; Update Flows
            </p>
          </div>

          <div className="auth-alert alert-info" style={{ marginBottom: '1.5rem' }}>
            <FlaskConical size={18} />
            <span>
              Isolated demo module. Test OTP is&nbsp;<strong>000000</strong>.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <button type="button" className="pm-flow-btn" onClick={goFirstTimeSetup}>
              <div className="pm-flow-btn-icon">
                <UserPlus size={22} />
              </div>
              <div className="pm-flow-btn-text">
                <span className="pm-flow-btn-title">First-Time Login</span>
                <span className="pm-flow-btn-desc">
                  Verify default password â-- OTP â-- set new password
                </span>
              </div>
            </button>

            <button type="button" className="pm-flow-btn" onClick={goLoginOtp}>
              <div className="pm-flow-btn-icon">
                <LogIn size={22} />
              </div>
              <div className="pm-flow-btn-text">
                <span className="pm-flow-btn-title">Login</span>
                <span className="pm-flow-btn-desc">
                  OTP verification â-- set new password
                </span>
              </div>
            </button>
          </div>

          <div
            className="auth-footer"
            style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}
          >
            <Link to="/password-management/test-login" className="pm-test-link">
              <FlaskConical size={14} />
              <span>Test Login â-- verify updated password</span>
            </Link>
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} />
              <span>Return to main login</span>
            </Link>
          </div>
        </div>
      )}

      {/* â--â-- FIRST-TIME SETUP â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â-- */}
      {screen === 'firsttime-setup' && (
        <PmFirstTimeSetup
          steps={firstTimeSteps}
          currentStep={firstTimeCurrentStep}
          // Receives (newPassword, retypePassword) â-- navigates to /password-management/otp
          onSuccess={goFirstTimeOtp}
          onBack={goLanding}
        />
      )}

      {/* â--â-- NORMAL LOGIN NEW PASSWORD â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â-- */}
      {screen === 'login-newpassword' && (
        <PmNewPasswordScreen
          flow="login"
          steps={loginSteps}
          currentStep={loginCurrentStep}
          onSuccess={() => goSuccess('login')}
          onBack={goLoginOtp}
        />
      )}

      {/* â--â-- SUCCESS â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â-- */}
      {screen === 'success' && (
        <PmSuccessScreen
          flow={completedFlow}
          onGoHome={goLanding}
        />
      )}

    </div>
  );
};

export default PasswordManagementPage;
