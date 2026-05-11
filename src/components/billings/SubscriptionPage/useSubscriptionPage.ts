import { useEffect, useState } from "react";
import { GetCompanyDetails, GetPaymentMethods } from "@utils/accounting";
import { hasDefaultPaymentMethod, normalizePaymentMethods, pickDisplayPaymentMethod } from "@components/billings/shared/paymentMethods";

export function useSubscriptionPage() {
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [companyRes, paymentMethodsRes] = await Promise.all([
          GetCompanyDetails({ crm_company_id: "" }),
          GetPaymentMethods(),
        ]);
        if (!cancelled) {
          setCompanyDetails(companyRes);
          setPaymentMethods(paymentMethodsRes);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("SubscriptionPage API error:", err);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const paymentMethodsList = normalizePaymentMethods(paymentMethods);
  const displayPaymentMethod = pickDisplayPaymentMethod(paymentMethodsList);
  const hasDefaultAccount = hasDefaultPaymentMethod(paymentMethodsList);

  return {
    companyDetails,
    displayPaymentMethod,
    hasDefaultAccount,
  };
}
