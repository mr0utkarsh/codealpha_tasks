/**
 * Client side validation used by the auth, profile and checkout forms.
 * The API validates everything again - this exists purely for fast feedback.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9()+\-.\s]{6,30}$/;
const POSTAL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,11}$/;

export function validateEmail(value) {
  const email = String(value ?? '').trim();
  if (!email) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
  return '';
}

export function validatePassword(value, { requireStrength = true } = {}) {
  const password = String(value ?? '');
  if (!password) return 'Enter your password.';
  if (!requireStrength) return '';
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 72) return 'Passwords must be 72 characters or fewer.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Include at least one letter and one number.';
  }
  return '';
}

export function validateName(value) {
  const name = String(value ?? '').trim();
  if (!name) return 'Enter your name.';
  if (name.length < 2) return 'Use at least 2 characters.';
  return '';
}

export function validatePhone(value) {
  const phone = String(value ?? '').trim();
  if (!phone) return 'Enter a contact number.';
  if (!PHONE_PATTERN.test(phone)) return 'Enter a valid phone number.';
  return '';
}

export function validateRequired(value, label) {
  if (!String(value ?? '').trim()) return `Enter your ${label.toLowerCase()}.`;
  return '';
}

export function validatePostalCode(value) {
  const postalCode = String(value ?? '').trim();
  if (!postalCode) return 'Enter the postal code.';
  if (!POSTAL_PATTERN.test(postalCode)) return 'Enter a valid postal code.';
  return '';
}

/* -------------------------------------------------------------------------- */
/* Simulated payment fields                                                    */
/* -------------------------------------------------------------------------- */

/** Strips everything except digits and groups them in fours. */
export function formatCardNumber(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

export function validateCardNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return 'Enter the card number.';
  if (digits.length < 13 || digits.length > 19) return 'Card numbers are 13 to 19 digits.';

  // Luhn checksum - a real structural check, no payment is ever processed.
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0 ? '' : 'That card number looks incorrect.';
}

export function formatExpiry(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateExpiry(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length !== 4) return 'Use the MM/YY format.';

  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return 'That month does not exist.';

  const expiry = new Date(year, month, 0, 23, 59, 59);
  if (expiry < new Date()) return 'That card has expired.';
  return '';
}

export function validateCvc(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length < 3 || digits.length > 4) return 'CVC is 3 or 4 digits.';
  return '';
}

/* -------------------------------------------------------------------------- */
/* Form level helpers                                                          */
/* -------------------------------------------------------------------------- */

/**
 * @param {Record<string, string>} errors
 * @returns {boolean}
 */
export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}

/**
 * Validates the whole shipping form and returns a map of errors.
 *
 * @param {Record<string, string>} values
 */
export function validateShippingForm(values) {
  return {
    fullName: validateName(values.fullName),
    email: validateEmail(values.email),
    phone: validatePhone(values.phone),
    addressLine1: String(values.addressLine1 ?? '').trim().length < 4 ? 'Enter the street address.' : '',
    city: String(values.city ?? '').trim().length < 2 ? 'Enter the city.' : '',
    state: String(values.state ?? '').trim().length < 2 ? 'Enter the state or region.' : '',
    postalCode: validatePostalCode(values.postalCode),
    country: String(values.country ?? '').trim().length < 2 ? 'Enter the country.' : '',
  };
}

/**
 * Validates the simulated card fields.
 *
 * @param {Record<string, string>} values
 */
export function validateCardForm(values) {
  return {
    cardNumber: validateCardNumber(values.cardNumber),
    cardName: validateName(values.cardName) ? 'Enter the name on the card.' : '',
    expiry: validateExpiry(values.expiry),
    cvc: validateCvc(values.cvc),
  };
}
