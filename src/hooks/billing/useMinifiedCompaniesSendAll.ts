import { useEffect, useRef, useState } from "react";

import { getMinifiedCompanies } from "@utils/crm";

export type MinifiedCompanyOption = { id: string | number; name?: string };

export interface UseMinifiedCompaniesSendAllOptions {
  /** When false, no request is made (default: true). */
  enabled?: boolean;
  /** Optional handler after logging (e.g. toast). Hook clears the list on error. */
  onError?: (error: unknown) => void;
}

/**
 * Loads CRM company options with `send_all: "true"`.
 * Shared by billing UIs to avoid duplicating the same effect + try/catch.
 */
export function useMinifiedCompaniesSendAll(
  options?: UseMinifiedCompaniesSendAllOptions,
): MinifiedCompanyOption[] {
  const enabled = options?.enabled ?? true;
  const onErrorRef = useRef(options?.onError);
  onErrorRef.current = options?.onError;

  const [companies, setCompanies] = useState<MinifiedCompanyOption[]>([]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const load = async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        if (!cancelled) setCompanies(result ?? []);
      } catch (e) {
        console.error("Error fetching companies:", e);
        if (!cancelled) {
          setCompanies([]);
          onErrorRef.current?.(e);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return companies;
}
