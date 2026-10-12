/**
 * alumniValidation.js
 *
 * Shared validation helpers for Add Alumni, Edit Alumni, Bulk Upload, and
 * the backend controller.  A single source of truth so every entry point
 * enforces identical rules.
 *
 * Defects addressed: D10, D11, D12 (name), D13 (email), D14 (phone), I-B (contact)
 */

// ── Name ─────────────────────────────────────────────────────────────────────

/**
 * A name that is valid for a real human being must contain:
 *   • at least one Unicode letter (covers diacritics, international scripts)
 *   • at least two space-separated word tokens (full-name requirement)
 *
 * Allowed: "Priya Sharma", "Élodie Martín", "O'Brien Murphy", "Jean-Luc Picard"
 * Rejected: "12345", "!@#$", "Priya" (single word), "   ", ""
 */
const NAME_HAS_LETTER = /\p{L}/u;

export const validateName = (raw) => {
  const v = (raw || '').trim().replace(/\s+/g, ' ');
  if (!v) return 'Enter a valid full name';
  if (!NAME_HAS_LETTER.test(v)) return 'Enter a valid full name';
  // Require at least two words (first name + last name)
  const words = v.split(' ').filter(Boolean);
  if (words.length < 2) return 'Enter a valid full name';
  return null; // valid
};

// ── Email ─────────────────────────────────────────────────────────────────────

/**
 * Practical email format check: local-part @ domain . tld
 * Trims whitespace before validating.
 * Returns null when the field is empty (email is optional unless I-B kicks in).
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validateEmail = (raw) => {
  const v = (raw || '').trim();
  if (!v) return null; // optional field — absence handled separately by I-B
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return null;
};

// ── Phone ─────────────────────────────────────────────────────────────────────

/**
 * Exactly 10 numeric digits.  Stored as a string so leading zeros are kept.
 * Strips a leading "+91" or "0" country / trunk prefix before counting.
 * Returns null when empty (phone is optional unless I-B kicks in).
 */
const DIGITS_ONLY = /^\d+$/;

export const validatePhone = (raw) => {
  const v = (raw || '').trim();
  if (!v) return null; // optional — absence handled separately
  // Strip optional country code prefix (+91 or 0) and spaces
  const digits = v.replace(/^\+91\s?/, '').replace(/^0/, '').replace(/\s/g, '');
  if (!DIGITS_ONLY.test(digits) || digits.length !== 10)
    return 'Enter a valid 10-digit phone number';
  return null;
};

// ── Contact requirement (Improvement B) ───────────────────────────────────────

/**
 * At least one of email or phone must be present.
 * Returns null when the requirement is satisfied.
 */
export const validateContactRequired = (email, phone) => {
  const e = (email || '').trim();
  const p = (phone || '').trim();
  if (!e && !p) return 'Enter at least an email address or phone number.';
  return null;
};

// ── Graduation year ───────────────────────────────────────────────────────────

export const validateGraduationYear = (raw) => {
  const y = Number(raw);
  if (!raw && raw !== 0) return 'Graduation Year is required.';
  if (isNaN(y) || y < 1900 || y > new Date().getFullYear() + 5)
    return 'Enter a valid graduation year.';
  return null;
};

// ── Run all field validations for a single alumni record ──────────────────────

/**
 * @param {object} fields  - { name, graduationYear, email, phone, ... }
 * @param {object} options - { requireContact: boolean }
 * @returns {object}       - { field: errorMessage } — empty object = valid
 */
export const validateAlumniFields = (fields, { requireContact = true } = {}) => {
  const errors = {};

  const nameErr = validateName(fields.name);
  if (nameErr) errors.name = nameErr;

  const yearErr = validateGraduationYear(fields.graduationYear);
  if (yearErr) errors.graduationYear = yearErr;

  const emailErr = validateEmail(fields.email);
  if (emailErr) errors.email = emailErr;

  const phoneErr = validatePhone(fields.phone);
  if (phoneErr) errors.phone = phoneErr;

  if (requireContact) {
    const contactErr = validateContactRequired(fields.email, fields.phone);
    if (contactErr) errors._contact = contactErr;
  }

  return errors;
};
