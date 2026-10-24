/**
 * studentValidation.js
 * Shared validation rules for the Student module.
 * Used by StudentForm (Add/Edit) and BulkUploadStudents.
 * All rules must match the backend studentValidation.js so that
 * frontend feedback and backend enforcement are identical.
 */

// ---------------------------------------------------------------------------
// PRN — alphanumeric only, at least 2 characters, no spaces or symbols.
// Stored uppercased. Accepts any format: PRN2024001, 2024001, ABC123, etc.
// ---------------------------------------------------------------------------
export const PRN_REGEX = /^[A-Za-z0-9]{2,}$/;

// ---------------------------------------------------------------------------
// Name — letters (including accented / Unicode letters), spaces, hyphens,
// apostrophes, and dots (for initials like "Dr. A. Smith").
// Must have at least two words (first + last name).
// ---------------------------------------------------------------------------
export const NAME_VALID_CHARS_REGEX = /^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF' . -]+$/;

// ---------------------------------------------------------------------------
// Year of Enrollment — 4-digit year between 1900 and (current year + 1).
// Stored as a string in the DB.
// ---------------------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_MIN = 1900;
export const YEAR_MAX = CURRENT_YEAR + 1;

// ---------------------------------------------------------------------------
// Class — free-text describing a year level such as "First Year",
// "Second Year", "Third Year", "Fourth Year", "FY", "SY", "TY", etc.
// Must contain at least one letter; reject pure-number / pure-symbol values.
// ---------------------------------------------------------------------------
export const CLASS_VALID_REGEX = /^[A-Za-z0-9 .\-/]+$/;

// ---------------------------------------------------------------------------
// Degree — descriptive text like "B.Tech Computer Science".
// Must start with a letter and contain at least one letter.
// Allow letters, digits, spaces, dots, hyphens, parentheses, ampersands,
// commas (e.g. "B.Sc. (Computer Science)").
// ---------------------------------------------------------------------------
export const DEGREE_VALID_REGEX = /^[A-Za-z][A-Za-z0-9 .()\-&,/]+$/;

// ---------------------------------------------------------------------------
// Division — single letter A-Z (case insensitive), optionally followed by
// a space and a word like "Division" (e.g. "A", "B Division").
// ---------------------------------------------------------------------------
export const DIVISION_VALID_REGEX = /^[A-Za-z][A-Za-z0-9 . -]*$/;

// ---------------------------------------------------------------------------
// Email — standard email format. Field is optional.
// ---------------------------------------------------------------------------
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// validateName
// Returns an error string or "" if valid.
// ---------------------------------------------------------------------------
export function validateName(raw) {
  if (!raw || raw.trim().length === 0) {
    return 'Name is required.';
  }
  const name = raw.trim();

  // Reject purely numeric
  if (/^\d+$/.test(name)) {
    return 'Invalid name. Please enter a valid name.';
  }

  // Must contain at least one letter
  if (!/[A-Za-z]/.test(name)) {
    return 'Invalid name. Please enter a valid name.';
  }

  // No digits allowed
  if (/\d/.test(name)) {
    return 'Invalid name. Please enter a valid name.';
  }

  // No special characters — only letters, spaces, hyphens, apostrophes, dots
  if (/[^A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s'\-.]/.test(name)) {
    return 'Invalid name. Please enter a valid name.';
  }

  return '';
}

// ---------------------------------------------------------------------------
// validatePRN
// ---------------------------------------------------------------------------
export function validatePRN(raw) {
  if (!raw || raw.trim().length === 0) {
    return 'PRN is required.';
  }
  const prn = raw.trim();

  if (!PRN_REGEX.test(prn)) {
    return 'Invalid PRN. Only letters and numbers are allowed (e.g. PRN2024001, 2024001).';
  }
  return '';
}

// ---------------------------------------------------------------------------
// validateClass
// ---------------------------------------------------------------------------
export function validateClass(raw) {
  if (!raw || raw.trim().length === 0) {
    return 'Class is required.';
  }
  const cls = raw.trim();

  // Letters and spaces only — no numbers, symbols, or special characters
  if (!/^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s]+$/.test(cls)) {
    return 'Invalid class. Please enter a valid class (e.g. First Year, Second Year).';
  }

  return '';
}

// ---------------------------------------------------------------------------
// validateDegree
// ---------------------------------------------------------------------------
export function validateDegree(raw) {
  if (!raw || raw.trim().length === 0) {
    return 'Degree is required.';
  }
  const deg = raw.trim();

  // Must start with a letter and contain letters
  if (!DEGREE_VALID_REGEX.test(deg)) {
    return 'Invalid Degree. Please enter a valid degree. (e.g., B.Tech, B.Sc, M.Sc, MBA)';
  }

  return '';
}

// ---------------------------------------------------------------------------
// validateYearOfEnrollment
// ---------------------------------------------------------------------------
export function validateYearOfEnrollment(raw) {
  if (!raw || raw.trim().length === 0) {
    return 'Year of Enrollment is required.';
  }
  const val = raw.trim();

  // Must be exactly 4 digits
  if (!/^\d{4}$/.test(val)) {
    return 'Year of Enrollment must be a 4-digit year (e.g. 2024).';
  }

  const year = parseInt(val, 10);
  if (year < YEAR_MIN || year > YEAR_MAX) {
    return `Year of Enrollment must be between ${YEAR_MIN} and ${YEAR_MAX}.`;
  }

  return '';
}

// ---------------------------------------------------------------------------
// validateDivision
// ---------------------------------------------------------------------------
export function validateDivision(raw) {
  if (!raw || raw.trim().length === 0) {
    return 'Division is required.';
  }
  const div = raw.trim();

  if (!/^[A-Za-z]$/.test(div)) {
    return 'Division must be a single letter (e.g. A, B, C).';
  }

  return '';
}

// ---------------------------------------------------------------------------
// validateEmail
// Email is optional — empty value is acceptable.
// ---------------------------------------------------------------------------
export function validateEmail(raw) {
  if (!raw || raw.trim().length === 0) return '';
  if (!EMAIL_REGEX.test(raw.trim())) {
    return 'Invalid email address. Please enter a valid email (e.g. student@university.edu).';
  }
  return '';
}

// ---------------------------------------------------------------------------
// validateStudentFields
// Validates all student fields at once.
// Returns an object: { field: errorMessage }
// An empty object means all fields are valid.
// ---------------------------------------------------------------------------
export function validateStudentFields({ name, prn, class: cls, division, degree, yearOfEnrollment, email }) {
  const errors = {};

  const nameErr = validateName(name);
  if (nameErr) errors.name = nameErr;

  const prnErr = validatePRN(prn);
  if (prnErr) errors.prn = prnErr;

  const classErr = validateClass(cls);
  if (classErr) errors.class = classErr;

  const divErr = validateDivision(division);
  if (divErr) errors.division = divErr;

  const degreeErr = validateDegree(degree);
  if (degreeErr) errors.degree = degreeErr;

  const yearErr = validateYearOfEnrollment(yearOfEnrollment);
  if (yearErr) errors.yearOfEnrollment = yearErr;

  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  return errors;
}
