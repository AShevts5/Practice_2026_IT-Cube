export function isValidRuPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) return true;
  if (digits.length === 11 && (digits.startsWith("8") || digits.startsWith("7"))) return true;
  return false;
}

export function normalizeRuPhone(value: string): string {
  return value.trim();
}

export const RU_PHONE_HINT = "Формат: +79001234567, 89001234567 или 9001234567";

export const RU_PHONE_ERROR = "Укажите корректный российский номер телефона";
