import type { UserProfileAddress } from "@utils/staffManagement";

export type AddressRowForPayload = Pick<
  UserProfileAddress,
  "name" | "zip_code" | "city" | "country" | "address"
>;

/**
 * Drops rows where every field is blank after trim.
 * Returns an empty array when nothing remains (callers should still send `addresses: []` to the API).
 */
export function buildAddressesForUserProfilePayload(
  rows: readonly AddressRowForPayload[]
): UserProfileAddress[] {
  const mapped = rows.map(({ name, zip_code, city, country, address }) => ({
    name: (name ?? "").toString().trim(),
    zip_code: (zip_code ?? "").toString().trim(),
    city: (city ?? "").toString().trim(),
    country: (country ?? "").toString().trim(),
    address: (address ?? "").toString().trim(),
  }));
  return mapped.filter((row) => Object.values(row).some((value) => value.length > 0));
}
