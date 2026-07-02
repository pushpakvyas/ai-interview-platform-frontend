// Shared password policy: at least 8 characters, with at least one
// uppercase letter, one lowercase letter, one number, and one special
// character. Used anywhere a plaintext password is collected, before it
// gets SHA-256 hashed client-side (see utils/hash.js) and sent to the API.
export const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "number", label: "One number", test: (v) => /\d/.test(v) },
  { key: "special", label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function getPasswordFailures(password = "") {
  return PASSWORD_REQUIREMENTS.filter((r) => !r.test(password));
}

export function isPasswordValid(password = "") {
  return PASSWORD_REGEX.test(password);
}

export function passwordErrorMessage() {
  return "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";
}
