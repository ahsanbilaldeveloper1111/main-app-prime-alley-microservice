/** Split compact E.164 (+CC...) for readable display */
const E164_DISPLAY_SPLIT = /^\+(\d{1,3})(\d+)$/;

/** Display E.164-ish numbers as +<countryCode> <rest> for readability */
export function formatPhoneForDisplay(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  if (raw.includes(" ")) return raw;
  const matched = E164_DISPLAY_SPLIT.exec(raw);
  if (!matched) return raw;
  const countryCode = matched[1];
  const subscriber = matched[2];
  return `+${countryCode} ${subscriber}`;
}
