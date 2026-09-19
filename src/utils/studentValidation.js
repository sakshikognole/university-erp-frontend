/**
 * studentValidation.js
 * Shared validation rules for the Student module.
 * Used by StudentForm (Add/Edit) and BulkUploadStudents.
 * All rules must match the backend studentValidation.js so that
 * frontend feedback and backend enforcement are identical.
 */

// ---------------------------------------------------------------------------
// PRN â-- must match "PRN" (case-insensitive) followed by 4-digit year and
// 3-digit sequence, e.g. PRN2024001.  The schema stores it uppercased.
// ---------------------------------------------------------------------------
export const PRN_REGEX = /^PRN\d{4}\d{3}$/i;

// ---------------------------------------------------------------------------
// Name â-- letters (including accented / Unicode letters), spaces, hyphens,
// apostrophes, and dots (for initials like "Dr. A. Smith").
// Must have at least two words (first + last name).
// ---------------------------------------------------------------------------
export const NAME_VALID_CHARS_REGEX = /^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF' . -]+$/;

// ---------------------------------------------------------------------------
// Year of Enrollment â-- 4-digit year between 1900 and (current year + 1).
// Stored as a string in the DB.
// ---------------------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_MIN = 1900;
export const YEAR_MAX = CURRENT_YEAR + 1;

// ---------------------------------------------------------------------------
// Class â-- free-text describing a year level such as "First Year",
// "Second Year", "Third Year", "Fourth Year", "FY", "SY", "TY", etc.
// Must contain at least one letter; reject pure-number / pure-symbol values.
// ---------------------------------------------------------------------------
export const CLASS_VALID_REGEX = /^[A-Za-z0-9 .\-/]+$/;

// ---------------------------------------------------------------------------
// Degree â-- descriptive text like "B.Tech Computer Science".
// Must start with a letter and contain at least one letter.
// Allow letters, digits, spaces, dots, hyphens, parentheses, ampersands,
// commas (e.g. "B.Sc. (Computer Science)").
// ---------------------------------------------------------------------------
export const DEGREE_VALID_REGEX = /^[A-Za-z][A-Za-z0-9 .()\-&,/]+$/;

// ---------------------------------------------------------------------------
// Division â-- single letter A-Z (case insensitive), optionally followed by
// a space and a word like "Division" (e.g. "A", "B Division").
// ---------------------------------------------------------------------------
export const DIVISION_VALID_REGEX = /^[A-Za-z][A-Za-z0-9 . -]*$/;

// ---------------------------------------------------------------------------
// validateName
// Returns an error string or "" if valid.
// ---------------------------------------------------------------------------
export function validateName(raw) {
  if (!raw || raw.trim().length === 0) {
    return 'Name is required.';
  }
  const name = raw.trim();

  // Reject leading/trailing quotes
  if (/^["']|["']$/.test(name)) {
    return 'Name must not be enclosed in quotes.';
  }

  // Reject numeric-only
  if (/^\d+$/.test(name)) {
    return 'Name must contain letters only.';
  }

  // Reject alphanumeric (letters mixed with digits)
  if (/\d/.test(name)) {
    return 'Name must not contain numbers.';
  }

  // Reject invalid special characters
  if (!NAME_VALID_CHARS_REGEX.test(name)) {
    return "Name must contain only letters, spaces, hyphens, apostrophes, or dots.";
  }

  // Require at least two words (first + last name)
  const words = name.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) {
    return 'Enter your first name and last name.';
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
  const prn = raw.trim().toUpperCase();

  if (!PRN_REGEX.test(prn)) {
    return 'Invalid PRN format. Expected format: PRN followed by 4-digit year and 3-digit number (e.g. PRN2024001).';
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

  // Must contain at least one letter
  if (!/[A-Za-z]/.test(cls)) {
    return 'Class must contain letters (e.g. First Year, Second Year).';
  }

  if (!CLASS_VALID_REGEX.test(cls)) {
    return 'Class contains invalid characters. Use letters, numbers, spaces, dots, or hyphens.';
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
    return 'Degree must start with a letter and contain only letters, numbers, spaces, dots, hyphens, or parentheses (e.g. B.Tech Computer Science).';
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
    return 'Division is required (e.g. A, B, C).';
  }
  const div = raw.trim();

  if (!DIVISION_VALID_REGEX.test(div)) {
    return 'Division must start with a letter and contain only letters, numbers, spaces, or hyphens (e.g. A, B Division).';
  }

  return '';
}

// ---------------------------------------------------------------------------
// validateStudentFields
// Validates all student fields at once.
// Returns an object: { field: errorMessage }
// An empty object means all fields are valid.
// ---------------------------------------------------------------------------
export function validateStudentFields({ name, prn, class: cls, division, degree, yearOfEnrollment }) {
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

  return errors;
}
