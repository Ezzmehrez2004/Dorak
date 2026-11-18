/*
 * Validation rules shared by the forms (instant feedback) and the mock
 * API (server-side check). Each function returns an object of
 * { fieldName: "message" }; an empty object means the input is valid.
 */

// Egyptian mobile numbers: 010, 011, 012 or 015 followed by 8 digits.
export const EGYPT_MOBILE = /^01[0125]\d{8}$/;

// Letters in any language (so Arabic names work), spaces, apostrophes, dots, hyphens.
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u;

export function normalizePhone(value) {
  return String(value ?? "").replace(/[\s-]/g, "");
}

export function validatePhone(value) {
  const phone = normalizePhone(value);
  if (!phone) return "Enter your mobile number.";
  if (!/^\d+$/.test(phone)) return "Use digits only, for example 01012345678.";
  if (!EGYPT_MOBILE.test(phone)) return "Enter an 11-digit Egyptian mobile number starting with 010, 011, 012 or 015.";
  return null;
}

export function validateRegister(values) {
  const errors = {};
  const name = String(values.name ?? "").trim();
  const password = String(values.password ?? "");

  if (!name) errors.name = "Enter your name so barbers can call you.";
  else if (name.length < 2) errors.name = "Name must be at least 2 characters.";
  else if (name.length > 40) errors.name = "Name must be 40 characters or fewer.";
  else if (!NAME_PATTERN.test(name)) errors.name = "Use letters only (Arabic or English).";

  const phoneError = validatePhone(values.phone);
  if (phoneError) errors.phone = phoneError;

  if (!password) errors.password = "Choose a password.";
  else if (password.length < 8) errors.password = "Use at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Include at least one letter and one number.";

  if (!values.confirmPassword) errors.confirmPassword = "Type your password again.";
  else if (values.confirmPassword !== password) errors.confirmPassword = "Passwords don't match.";

  if (!values.acceptRules) errors.acceptRules = "Agree to the fair queue rules to create an account.";

  return errors;
}

export function validateLogin(values) {
  const errors = {};
  const phoneError = validatePhone(values.phone);
  if (phoneError) errors.phone = phoneError;
  if (!values.password) errors.password = "Enter your password.";
  return errors;
}

export function validateJoin(values, serviceIds = []) {
  const errors = {};

  if (!values.serviceId) errors.serviceId = "Choose a service.";
  else if (serviceIds.length && !serviceIds.includes(Number(values.serviceId))) errors.serviceId = "Choose a service from the list.";

  if (values.type !== "walk_in" && values.type !== "priority") errors.type = "Choose walk-in or priority.";
  else if (values.type === "priority" && !values.acceptFee) errors.acceptFee = "Confirm the priority fee, or switch to walk-in.";

  return errors;
}

export function validateReview(values) {
  const errors = {};
  const rating = Number(values.rating);
  const comment = String(values.comment ?? "").trim();

  if (!values.rating) errors.rating = "Choose a rating from 1 to 5 stars.";
  else if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Rating must be between 1 and 5.";

  if (comment.length > 300) errors.comment = `Keep your comment under 300 characters (now ${comment.length}).`;

  return errors;
}

export function validateCode(values) {
  const code = String(values.code ?? "").trim();
  if (!code) return { code: "Enter the 6-digit code from the SMS." };
  if (!/^\d{6}$/.test(code)) return { code: "The code is 6 digits, for example 482913." };
  return {};
}
