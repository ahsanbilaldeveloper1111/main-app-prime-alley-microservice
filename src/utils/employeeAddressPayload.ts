import type { UserProfileAddress } from "@utils/staffManagement";

export type AddressRowForPayload = Pick<
  UserProfileAddress,
  "name" | "zip_code" | "city" | "country" | "address"
>;

/**
 * Drops rows where every field is blank after trim.
 * Returns `undefined` when nothing remains so callers can omit `addresses` from the API body.
 */
export function buildAddressesForUserProfilePayload(
  rows: readonly AddressRowForPayload[]
): UserProfileAddress[] | undefined {
  const mapped = rows.map(({ name, zip_code, city, country, address }) => ({
    name: (name ?? "").toString().trim(),
    zip_code: (zip_code ?? "").toString().trim(),
    city: (city ?? "").toString().trim(),
    country: (country ?? "").toString().trim(),
    address: (address ?? "").toString().trim(),
  }));
  const nonEmpty = mapped.filter((row) => Object.values(row).some((value) => value.length > 0));
  return nonEmpty.length > 0 ? nonEmpty : undefined;
}
