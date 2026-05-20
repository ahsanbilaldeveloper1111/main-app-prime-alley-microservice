/**
 * Shared CTI DN / PSTN address comparison (digit-tail normalization).
 * Used by floating call bar, dialer transfer, and call-state merge.
 */

export function normalizeCtiAddressDigits(address?: string): string {
  if (!address) {
    return "";
  }
  const digitsOnly = address.replaceAll(/\D/g, "");
  if (!digitsOnly) {
    return "";
  }
  return digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
}

/** True when two addresses refer to the same party (exact or digit-tail match). */
export function ctiAddressesEquivalent(
  a: string | undefined,
  b: string | undefined,
): boolean {
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  const na = normalizeCtiAddressDigits(a);
  const nb = normalizeCtiAddressDigits(b);
  return na !== "" && na === nb;
}

/** True when `address` matches `userAddress` (extension / DN). */
export function ctiAddressMatchesUser(
  address: string | undefined,
  userAddress: string | null | undefined,
): boolean {
  if (!address || !userAddress) {
    return false;
  }
  return ctiAddressesEquivalent(address, userAddress);
}
