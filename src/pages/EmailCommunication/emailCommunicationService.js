/**
 * emailCommunicationService.js
 *
 * API service for the Email Communication module.
 * Follows the same conventions as other page service files in this project:
 *  - Hardcoded base URL matching the project convention
 *  - Native fetch (axios is installed but unused project-wide)
 *  - Bearer token read from localStorage
 *  - Throws Error with server message on non-2xx responses
 */

const API_BASE_URL = 'http://localhost:5000/api';

const authHeader = () => {
  const token = localStorage.getItem('erp_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Send a custom email to the confirmed recipient list.
 *
 * @param {string[]} recipients  Array of validated email addresses.
 * @param {string}   subject     Email subject line.
 * @param {string}   body        Email body (plain text / line breaks).
 * @returns {Promise<object>}    Resolves with the server response body.
 *
 * The server may return:
 *   200  — all emails sent
 *   207  — partial success  (response.ok is false for 207 in some fetch impls;
 *           we handle it explicitly below)
 *   400  — validation error
 *   401/403 — auth error
 *   502  — complete delivery failure
 *   500  — server error
 */
export const sendEmail = async (recipients, subject, body) => {
  const response = await fetch(`${API_BASE_URL}/email-communication/send`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ recipients, subject, body }),
  });

  const data = await response.json();

  // 207 Multi-Status = partial success — not an error, but not full success.
  // Treat 200 and 207 as "handled" responses; everything else throws.
  if (response.status === 200 || response.status === 207) {
    return { ...data, status: response.status };
  }

  if (!response.ok) {
    throw new Error(data.message || 'An unexpected error occurred. Please try again.');
  }

  return { ...data, status: response.status };
};
