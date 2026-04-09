import { parsePhoneNumberFromString, type PhoneNumber } from "libphonenumber-js";

/** Split compact E.164 (+CC...) when libphonenumber cannot parse */
const E164_DISPLAY_SPLIT = /^\+(\d{1,3})(\d+)$/;

/** `formatInternational()` omits a group break for some PK 9-digit mobiles; align with phone input (e.g. +92 347 726463). */
function refinePakistanNineDigitNationalDisplay(parsed: PhoneNumber, international: string): string {
  if (parsed.country !== "PK") {
    return international;
  }
  const nat = parsed.nationalNumber;
  if (nat.length !== 9 || !/^\d{9}$/.test(nat)) {
    return international;
  }
  return `+${parsed.countryCallingCode} ${nat.slice(0, 3)} ${nat.slice(3)}`;
}

/** Same spacing when we only have a string like "+92 347726463" (no parse / fallback path). */
function refinePakistanNineDigitString(value: string): string {
  const m = /^\+92 (\d{9})$/.exec(value.trim());
  if (!m) {
    return value;
  }
  const digits = m[1];
  return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`;
}

/**
 * Match international formatting from `react-phone-number-input` / add-edit modals (E.164 → readable groups).
 */
export function formatPhoneForDisplay(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";

  const parsed = parsePhoneNumberFromString(raw);
  if (parsed?.isPossible()) {
    const international = parsed.formatInternational();
    return refinePakistanNineDigitNationalDisplay(parsed, international);
  }

  if (raw.includes(" ")) {
    return refinePakistanNineDigitString(raw);
  }
  const matched = E164_DISPLAY_SPLIT.exec(raw);
  if (!matched) {
    return raw;
  }
  return refinePakistanNineDigitString(`+${matched[1]} ${matched[2]}`);
}
