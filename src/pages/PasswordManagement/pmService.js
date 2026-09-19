---/**
 * pmService.js
 *
 * Isolated API service for the Password Management demo module.
 * All calls go to /api/password-mgmt/* -----" completely separate from
 * the existing AuthContext and /api/auth/* endpoints.
 *
 * To swap the test OTP for a real email/SMS provider later, only the
 * backend controller needs to change. This service layer stays the same.
 */

const API_BASE = 'http://localhost:5000/api/password-mgmt';

/**
 * Generic fetch wrapper -----" throws an Error with the server's message on failure.
 */
const apiCall = async (endpoint, body) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An unexpected error occurred. Please try again.');
  }

  return data;
};

/**
 * First-Time Login flow -----" Step 1.
 * Sends the default password to the backend for verification,
 * which then issues a test OTP.
 */
export const initFirstTime = (currentPassword) =>
  apiCall('/firsttime/init', { currentPassword });

/**
 * Normal Login flow -----" Step 1.
 * No credentials needed -----" backend issues a test OTP for the demo account.
 */
export const initLogin = () => apiCall('/login/init', {});

/**
 * Shared OTP verification for both flows.
 * @param {'firsttime'|'login'} flow
 * @param {string} otp  6-digit OTP string
 */
export const verifyOtp = (flow, otp) => apiCall('/verify-otp', { flow, otp });

/**
 * Update password after successful OTP verification.
 * @param {'firsttime'|'login'} flow
 * @param {string} newPassword
 * @param {string} retypePassword
 */
export const updatePassword = (flow, newPassword, retypePassword) =>
  apiCall('/update-password', { flow, newPassword, retypePassword });

/**
 * Test Login -----" verifies the updated password actually works in the database.
 * @param {string} email
 * @param {string} password
 */
export const testLogin = (email, password) =>
  apiCall('/test-login', { email, password });
