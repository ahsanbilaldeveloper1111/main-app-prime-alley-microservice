import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getMinifiedCompanies } from "@utils/crm";
import { getErrorMessage } from "@utils/errors";

export type BillingCompanyOption = { id: string | number; name?: string };

/**
 * Loads CRM companies for “All companies” / company-scoped billing customer pages.
 * Centralizes duplicate `getMinifiedCompanies` + `useEffect` blocks.
 */
export function useMinifiedCompaniesForSelect(
  errorToastId?: string,
): { companyOptions: BillingCompanyOption[] } {
  const [companyOptions, setCompanyOptions] = useState<BillingCompanyOption[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        if (!cancelled) {
          setCompanyOptions(result ?? []);
        }
      } catch (error) {
        if (cancelled) return;
        setCompanyOptions([]);
        const message = getErrorMessage(error);
        if (errorToastId) {
          toast.error(`Failed to load companies: ${message}`, {
            toastId: errorToastId,
          });
        } else {
          console.error("Error fetching companies:", error);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [errorToastId]);

  return { companyOptions };
}
