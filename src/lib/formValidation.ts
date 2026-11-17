export function normalizeText(value: string) {
  return value.trim();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

export function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^([0-9])\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (Number(digits[9]) !== checkDigit) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i);
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  return Number(digits[10]) === checkDigit;
}

export function isValidDateNotInFuture(value: string) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

export function isValidCrm(value: string) {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{2,4}\d{4,8}$/.test(normalized) || /^\d{5,9}$/.test(normalized);
}
