import { useEffect, useState } from "react";

import { getMinifiedCompanies } from "@utils/crm";

export type MinifiedCompanyOption = { id: string | number; name?: string };

/**
 * Loads CRM company options with `send_all: "true"` once on mount.
 * Shared by billing pages to avoid duplicating the same effect + try/catch.
 */
export function useMinifiedCompaniesSendAll(): MinifiedCompanyOption[] {
  const [companies, setCompanies] = useState<MinifiedCompanyOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        if (!cancelled) setCompanies(result ?? []);
      } catch (e) {
        console.error("Error fetching companies:", e);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return companies;
}
