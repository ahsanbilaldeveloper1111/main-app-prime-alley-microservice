import { useEffect, useState } from "react";
import { GetCompanyDetails } from "@utils/accounting";

export function useCompanyInfoPage() {
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = (await GetCompanyDetails()) as any;
        if (!cancelled) {
          setCompanyDetails(res);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("GetCompanyDetails error:", err);
          setCompanyDetails(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { companyDetails, loading };
}
