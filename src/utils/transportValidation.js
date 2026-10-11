/**
 * transportValidation.js
 *
 * Shared validation helpers for all Transport sub-modules.
 * Mirrors the backend validation in transportController.js.
 *
 * Defects addressed:
 *   D2  Route name
 *   D8  Driver name
 *   D9-11 Contact number (+91 XXXXXXXXXX)
 *   D12 Duplicate license (UI hint only — backend enforces uniqueness)
 *   D13 License number format
 *   D14 Vehicle ID format
 *   D16 Vehicle name/model
 *   D17 Registration number
 *   D18/19 Bus Pass ID (BP-XXXX)
 *   D20 Valid Till Date (not in past)
 *   Imp-21 License mandatory
 *   Imp-23 Registration mandatory
 */

// ── Route Name ──────────────────────────────────────────────────────────────
// Allow letters (including international), digits, spaces, hyphens, commas,
// parentheses, slashes, colons.  Reject purely-special-char strings.
const ROUTE_NAME_RE = /^[\p{L}\p{N}\s\-,()/:]+$/u;
const ROUTE_HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

export const validateRouteName = (raw) => {
  const v = (raw || '').trim();
  if (!v) return 'Route Name is required.';
  if (!ROUTE_HAS_LETTER_OR_DIGIT.test(v))
    return 'Route Name must contain at least one letter or digit.';
  if (!ROUTE_NAME_RE.test(v))
    return 'Route Name contains unsupported characters. Use letters, numbers, spaces, hyphens, commas, or parentheses.';
  return null;
};

// ── Driver Name ─────────────────────────────────────────────────────────────
// Must contain at least one Unicode letter.
// Allow letters, spaces, hyphens, apostrophes, periods (initials).
const DRIVER_NAME_RE = /^[\p{L}\s\-'.]+$/u;
const HAS_LETTER = /\p{L}/u;

export const validateDriverName = (raw) => {
  const v = (raw || '').trim();
  if (!v) return 'Enter a valid driver name.';
  if (!HAS_LETTER.test(v)) return 'Enter a valid driver name.';
  if (!DRIVER_NAME_RE.test(v)) return 'Enter a valid driver name.';
  return null;
};

// ── Contact Number ───────────────────────────────────────────────────────────
// Exact format: +91 followed by exactly one space and exactly 10 digits.
const CONTACT_RE = /^\+91 \d{10}$/;

export const validateContact = (raw) => {
  const v = (raw || '').trim();
  if (!v) return null; // optional field — absence is allowed on its own
  if (!CONTACT_RE.test(v))
    return 'Enter a valid contact number in the format +91 XXXXXXXXXX.';
  return null;
};

// ── Driving License Number ───────────────────────────────────────────────────
// Indian DL format: SS-RR-YYYY-NNNNNNN
//   SS   = 2-letter state code (e.g. MH, DL, KA)
//   RR   = 2-digit RTO code   (e.g. 14, 04, 12)
//   YYYY = 4-digit year       (e.g. 2019)
//   N…   = 7-digit serial     (e.g. 0012345)
// Some older formats omit hyphens, some use slashes.
// We accept both hyphenated and non-hyphenated forms.
// Rejects: special chars (@, #, etc.), alpha-only, digit-only.
// Pattern: 2 letters + optional sep + 2 digits + optional sep + 4 digits + optional sep + 7 digits
const LICENSE_RE = /^[A-Z]{2}[-/ ]?\d{2}[-/ ]?\d{4}[-/ ]?\d{7}$/i;

export const validateLicense = (raw) => {
  const v = (raw || '').trim().toUpperCase();
  if (!v) return 'License number is required.';
  if (!LICENSE_RE.test(v)) return 'Enter a valid driving license number.';
  return null;
};

// ── Vehicle ID ───────────────────────────────────────────────────────────────
// Can be alphanumeric with hyphens (e.g. BUS-101, 1, V001).
// Reject purely special-char strings and empty values.
const VEHICLE_ID_RE = /^[\p{L}\p{N}-]+$/u;

export const validateVehicleId = (raw) => {
  const v = (raw || '').trim();
  if (!v) return 'Vehicle ID is required.';
  if (!VEHICLE_ID_RE.test(v))
    return 'Vehicle ID must contain only letters, numbers, and hyphens (e.g. BUS-101).';
  return null;
};

// ── Vehicle Name / Model ─────────────────────────────────────────────────────
// Allow letters, digits, spaces, hyphens, dots (for decimal models like 10.90).
// Reject purely-special-char strings.
const VEHICLE_NAME_RE = /^[\p{L}\p{N}\s\-.]+$/u;
const NAME_HAS_ALNUM = /[\p{L}\p{N}]/u;

export const validateVehicleName = (raw) => {
  const v = (raw || '').trim();
  if (!v) return 'Enter a valid vehicle name or model.';
  if (!NAME_HAS_ALNUM.test(v)) return 'Enter a valid vehicle name or model.';
  if (!VEHICLE_NAME_RE.test(v)) return 'Enter a valid vehicle name or model.';
  return null;
};

// ── Registration / Plate Number ──────────────────────────────────────────────
// Indian vehicle registration: SS DD LL DDDD  (SS=state, DD=district digits,
// LL=letter series 1-3 chars, DDDD=1-4 digit serial).
// Also accept older/test-format plates with hyphens.
// Key: must start with 2 alpha chars (state code) and contain only
// alphanumeric chars and hyphens.  Reject @, #, $, % etc.
const REG_RE = /^[A-Z]{2}[- ]?\d{1,2}[- ]?[A-Z]{1,3}[- ]?\d{1,4}$/i;

export const validateRegistration = (raw) => {
  const v = (raw || '').trim().toUpperCase();
  if (!v) return 'Vehicle registration number is required.';
  if (!REG_RE.test(v))
    return 'Enter a valid vehicle registration number.';
  return null;
};

// ── Bus Pass ID ──────────────────────────────────────────────────────────────
// Required format: BP- followed by exactly 4 digits (case-insensitive input,
// stored as uppercase).
const PASS_ID_RE = /^BP-\d{4}$/i;

export const validateBusPassId = (raw) => {
  const v = (raw || '').trim();
  if (!v) return 'Pass ID is required.';
  if (!PASS_ID_RE.test(v))
    return 'Enter a valid Bus ID in the format BP-1001.';
  return null;
};

// ── Valid Till Date ───────────────────────────────────────────────────────────
// Must not be in the past.  Compare as local calendar dates to avoid UTC shift.
export const validateValidTill = (raw) => {
  const v = (raw || '').trim();
  if (!v) return 'Valid Till Date is required.';
  const selected = new Date(v + 'T00:00:00'); // force local midnight
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected < today) return 'Valid Till Date cannot be in the past.';
  return null;
};
