---/**
 * staffValidation.js  (frontend)
 * Shared validation rules for the Staff module.
 * Used by StaffForm (Add/Edit).
 * Keep these rules in sync with backend-node-express-mongo/utils/staffValidation.js.
 */

// ---------------------------------------------------------------------------
// Staff ID -----" must match "STF" + 4-digit year + 3-digit sequence
// e.g. STF2024001
// ---------------------------------------------------------------------------
export const STAFF_ID_REGEX = /^STF\d{4}\d{3}$/i;

// ---------------------------------------------------------------------------
// Name -----" letters (including Unicode), spaces, hyphens, apostrophes, dots.
// Must have at least two words (first + last name).
// ---------------------------------------------------------------------------
export const NAME_VALID_CHARS_REGEX = /^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF'. -]+$/;

// ---------------------------------------------------------------------------
// Email -----" local part: letters/digits/._+-, domain: letters/digits/hyphens,
// TLD: 2-6 letters. Rejects pure-numeric local parts longer than 15 digits.
// ---------------------------------------------------------------------------
export const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]{1,64}@[A-Za-z0-9.\-]+\.[A-Za-z]{2,6}$/;
const EMAIL_LOCAL_INVALID_CHARS = /[^A-Za-z0-9._%+\-]/;

// ---------------------------------------------------------------------------
// Phone -----" exactly 10 digits, first digit 6-----"9 (Indian mobile)
// ---------------------------------------------------------------------------
export const PHONE_REGEX = /^[6-9]\d{9}$/;

// ---------------------------------------------------------------------------
// Valid roles -----" must match the existing values accepted by the Staff module.
// ---------------------------------------------------------------------------
export const VALID_ROLES = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Head of Department',
  'Dean',
  'Principal',
  'Admin',
  'Librarian',
  'Lab Assistant',
  'Accountant',
  'Clerk',
  'Security',
  'Peon',
  'Other',
];

// ---------------------------------------------------------------------------
// validateName
// ---------------------------------------------------------------------------
export function validateName(raw) {
  if (!raw || raw.trim().length === 0) return 'Name is required.';
  const name = raw.trim();

  if (/^["']|["']$/.test(name)) return 'Name must not be enclosed in quotes.';
  if (/^\d+$/.test(name)) return 'Name must contain letters only.';
  if (/\d/.test(name)) return 'Name must not contain numbers.';
  if (!NAME_VALID_CHARS_REGEX.test(name))
    return "Name must contain only letters, spaces, hyphens, apostrophes, or dots.";

  const words = name.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) return 'Enter full name (first name and last name).';

  return '';
}

// ---------------------------------------------------------------------------
// validateStaffId
// ---------------------------------------------------------------------------
export function validateStaffId(raw) {
  if (!raw || raw.trim().length === 0) return 'Staff ID is required.';
  const id = raw.trim().toUpperCase();
  if (!STAFF_ID_REGEX.test(id))
    return 'Invalid Staff ID. Expected format: STF followed by 4-digit year and 3-digit number (e.g. STF2024001).';
  return '';
}

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------
export function validateEmail(raw) {
  if (!raw || raw.trim().length === 0) return 'Email address is required.';
  const email = raw.trim();

  if (email.length > 254) return 'Email address is too long.';

  const atIndex = email.lastIndexOf('@');
  if (atIndex < 1) return 'Enter a valid email address (e.g. name@university.edu).';

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);

  // Reject local parts with invalid characters (catches #$%^& etc.)
  if (EMAIL_LOCAL_INVALID_CHARS.test(localPart))
    return 'Email address contains invalid characters before @.';

  // Reject excessively long numeric local parts (e.g. 1234567788776554433456)
  if (/^\d+$/.test(localPart) && localPart.length > 15)
    return 'Email address local part is invalid.';

  // Domain must have at least one dot
  if (!domainPart.includes('.'))
    return 'Email domain is invalid (e.g. @university.edu).';

  if (!EMAIL_REGEX.test(email))
    return 'Enter a valid email address (e.g. name@university.edu).';

  return '';
}

// ---------------------------------------------------------------------------
// validatePhone
// ---------------------------------------------------------------------------
export function validatePhone(raw) {
  if (!raw || raw.trim().length === 0) return 'Phone number is required.';
  const phone = raw.trim().replace(/\s/g, '');

  if (!/^\d+$/.test(phone)) return 'Phone number must contain only digits.';
  if (phone.length !== 10) return 'Phone number must be exactly 10 digits.';
  if (!PHONE_REGEX.test(phone)) return 'Enter a valid 10-digit Indian mobile number (starts with 6-----"9).';

  return '';
}

// ---------------------------------------------------------------------------
// validateRole
// ---------------------------------------------------------------------------
export function validateRole(raw) {
  if (!raw || raw.trim().length === 0) return 'Role is required.';
  const role = raw.trim();
  if (!VALID_ROLES.includes(role))
    return `Select a valid role from the list.`;
  return '';
}

// ---------------------------------------------------------------------------
// validateStaffFields -----" validate all required fields at once
// Returns { fieldName: errorMessage }. Empty object = all valid.
// ---------------------------------------------------------------------------
export function validateStaffFields({ name, staffId, email, phone, role }) {
  const errors = {};

  const nameErr = validateName(name);
  if (nameErr) errors.name = nameErr;

  const staffIdErr = validateStaffId(staffId);
  if (staffIdErr) errors.staffId = staffIdErr;

  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  const phoneErr = validatePhone(phone);
  if (phoneErr) errors.phone = phoneErr;

  const roleErr = validateRole(role);
  if (roleErr) errors.role = roleErr;

  return errors;
}
