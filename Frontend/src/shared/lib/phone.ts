export function isValidRuPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) return true;
  if (digits.length === 11 && (digits.startsWith("8") || digits.startsWith("7"))) return true;
  return false;
}

/** Цифры номера без кода страны (10 цифр, с 9…) */
function ruNationalDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("8") || digits.startsWith("7")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

/** Маска ввода: +7 (900) 123-45-67 */
export function formatRuPhoneInput(value: string): string {
  const d = ruNationalDigits(value);
  if (d.length === 0) return "";

  let out = "+7";
  if (d.length > 0) {
    out += ` (${d.slice(0, 3)}`;
  }
  if (d.length >= 3) {
    out += `) ${d.slice(3, 6)}`;
  }
  if (d.length > 6) {
    out += `-${d.slice(6, 8)}`;
  }
  if (d.length > 8) {
    out += `-${d.slice(8, 10)}`;
  }
  return out;
}

export function normalizeRuPhone(value: string): string {
  const d = ruNationalDigits(value);
  if (d.length === 10) return `+7${d}`;
  if (d.length === 11 && (d.startsWith("7") || d.startsWith("8"))) {
    return `+7${d.slice(1)}`;
  }
  const raw = value.replace(/\D/g, "");
  if (raw.length === 11 && raw.startsWith("7")) return `+${raw}`;
  if (raw.length === 11 && raw.startsWith("8")) return `+7${raw.slice(1)}`;
  return value.trim();
}

export const RU_PHONE_PLACEHOLDER = "+7 (900) 123-45-67";

export const RU_PHONE_ERROR = "Укажите корректный российский номер телефона";
