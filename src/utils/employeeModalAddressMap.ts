import { Country, State, City } from "country-state-city";
import type { UserProfileAddress } from "@utils/staffManagement";

/** Country / state / city cascade fields for Add & Edit employee modals. */
export type EmployeeModalAddressBase = UserProfileAddress & {
  state?: string;
  countryCode?: string;
  stateCode?: string;
};

/**
 * Map API address to modal row (resolves ISO codes for country-state-city selects).
 * When API returns city/country but no state, resolve state from city.
 */
export function mapUserProfileAddressToModalFields(a: UserProfileAddress): EmployeeModalAddressBase {
  const countryName = a.country ?? "";
  let stateName = a.state ?? "";
  const cityName = (a.city ?? "").trim();
  const countries = Country.getAllCountries();
  const country = countries.find((c) => c.name === countryName);
  const countryCode = country?.isoCode ?? "";
  const states = countryCode ? State.getStatesOfCountry(countryCode) : [];
  let stateCode = states.find((s) => s.name === stateName)?.isoCode ?? "";
  if (countryCode && cityName && !stateCode) {
    for (const s of states) {
      const cities = City.getCitiesOfState(countryCode, s.isoCode);
      const match = cities.find(
        (c) =>
          (c.name ?? "").trim() === cityName || (c.name ?? "").toLowerCase() === cityName.toLowerCase(),
      );
      if (match) {
        stateName = s.name;
        stateCode = s.isoCode;
        break;
      }
    }
  }
  return {
    name: a.name ?? "",
    zip_code: a.zip_code ?? "",
    city: a.city ?? "",
    country: countryName,
    address: a.address ?? "",
    state: stateName,
    countryCode,
    stateCode,
  };
}
