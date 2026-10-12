/**
 * announcementValidation.js
 *
 * Shared title-validation logic for Add Announcement, Edit Announcement,
 * and the backend controller.  One source of truth so all three surfaces
 * enforce identical rules and produce identical messages.
 *
 * Rules (in priority order):
 *   1. Empty / whitespace-only  → 'Title is required.'
 *   2. Pure numeric             → 'This field does not accept pure numeric values.'
 *   3. Only special characters  → 'This field does not accept only special characters.
 *                                   Please enter a valid announcement title.'
 *   4. Special chars + numbers (no letters) →
 *                                  'This field does not accept a combination of special
 *                                   characters and numeric values. Please enter a valid
 *                                   announcement title.'
 *   5. Contains unsupported characters (anything outside the allowed set) →
 *                                  'Please enter a valid announcement title.'
 *   null → valid
 *
 * Allowed characters: Unicode letters (including diacritics / international),
 *   digits, space, hyphen, apostrophe, comma, period, colon, semicolon,
 *   parentheses, brackets, forward slash, ampersand, hash, exclamation,
 *   question mark, quote marks (", '), and em/en dashes.
 *
 * Rejected characters: @, $, %, ^, *, +, =, {, }, |, \, ~, `, <, >, and
 *   any other character not in the allowed set.
 */

// A character is "allowed" if it is a Unicode letter/digit or one of the
// explicitly permitted punctuation characters.
// We use Unicode property escapes (\p{L} etc.) with the 'u' flag so
// international letters (Élodie, Ärztekammer, मुख्य, etc.) are accepted.
const ALLOWED_CHAR_RE = /^[\p{L}\p{N}\p{M} \-'",.:;()/&#!?"""''\u2013\u2014]+$/u;

// Detects a string that contains at least one Unicode letter
const HAS_LETTER_RE = /\p{L}/u;

// Detects a string that is purely decimal digits (with optional spaces)
const PURE_NUMERIC_RE = /^[\d\s]+$/;

/**
 * Validate an announcement title.
 *
 * @param {string} raw  - The raw (untrimmed) value from the input.
 * @returns {string|null}  Error message string, or null if valid.
 */
export const validateAnnouncementTitle = (raw) => {
  const v = (raw || '').trim();

  // Rule 1: required
  if (!v) return 'Title is required.';

  // Rule 2: pure numeric (digits only, no letters, no symbols)
  if (PURE_NUMERIC_RE.test(v)) {
    return 'This field does not accept pure numeric values.';
  }

  // Determine what categories of characters are present
  const hasLetter  = HAS_LETTER_RE.test(v);
  const hasDigit   = /\d/.test(v);
  // "special" = anything that is not a letter, digit, or whitespace
  const hasSpecial = /[^\p{L}\p{N}\s]/u.test(v);

  // Rule 3: only special characters — no letters, no digits
  if (!hasLetter && !hasDigit && hasSpecial) {
    return 'This field does not accept only special characters. Please enter a valid announcement title.';
  }

  // Rule 4: combination of special chars + digits, still no letters
  if (!hasLetter && hasDigit && hasSpecial) {
    return 'This field does not accept a combination of special characters and numeric values. Please enter a valid announcement title.';
  }

  // Rule 5: unsupported characters present (even if the title also contains letters)
  if (!ALLOWED_CHAR_RE.test(v)) {
    return 'Please enter a valid announcement title.';
  }

  // Valid — must contain at least one letter (rules above already block
  // purely-numeric and purely-symbolic cases, so this is a belt-and-braces check)
  if (!hasLetter) {
    return 'Please enter a valid announcement title.';
  }

  return null; // valid
};
