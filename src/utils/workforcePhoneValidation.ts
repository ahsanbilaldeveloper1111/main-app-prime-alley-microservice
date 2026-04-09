import { isValidPhoneNumber } from "react-phone-number-input";

/** Empty is allowed (optional field). Any non-empty value must be a valid E.164 number (same rules as `PhoneInput`). */
export function isOptionalWorkforcePhoneValid(value: string | null | undefined): boolean {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") {
    return true;
  }
  return isValidPhoneNumber(trimmed);
}
