/**
 * PmOtpPage.jsx
 *
 * Route-level wrapper for the OTP step of the Password Management flow.
 * Lives at /password-management/otp so the OTP screen has its own URL.
 *
 * Expects React Router location.state:
 *   {
 *     flow:            'firsttime' | 'login'
 *     pendingPassword: { newPassword, retypePassword } | null   (firsttime only)
 *   }
 *
 * If state is missing (e.g. user navigated directly) they are redirected back
 * to /password-management.
 */

import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import PmOtpScreen from './PmOtpScreen';

const PmOtpPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  const state = location.state || {};
  const { flow, pendingPassword } = state;

  // Guard — cannot land here without a valid flow in location state.
  if (!flow || (flow !== 'firsttime' && flow !== 'login')) {
    return <Navigate to="/password-management" replace />;
  }

  // ── Step config mirrors PasswordManagementPage ──────────────────────────
  const firstTimeSteps = ['Setup', 'OTP', 'Done'];
  const loginSteps     = ['OTP', 'New Password', 'Done'];

  const steps       = flow === 'firsttime' ? firstTimeSteps : loginSteps;
  const currentStep = 2; // OTP is always step 2 in both flows

  // ── Navigation callbacks ─────────────────────────────────────────────────
  const handleSuccess = () => {
    if (flow === 'firsttime') {
      // firsttime: OTP screen already saved the password → go to success
      navigate('/password-management', { state: { screen: 'success', completedFlow: 'firsttime' } });
    } else {
      // login: OTP verified → proceed to new-password screen
      navigate('/password-management', { state: { screen: 'login-newpassword' } });
    }
  };

  const handleBack = () => {
    if (flow === 'firsttime') {
      navigate('/password-management', { state: { screen: 'firsttime-setup' } });
    } else {
      navigate('/password-management', { state: { screen: 'landing' } });
    }
  };

  return (
    <div className="auth-container">
      <PmOtpScreen
        flow={flow}
        steps={steps}
        currentStep={currentStep}
        pendingPassword={pendingPassword || null}
        onSuccess={handleSuccess}
        onBack={handleBack}
      />
    </div>
  );
};

export default PmOtpPage;
