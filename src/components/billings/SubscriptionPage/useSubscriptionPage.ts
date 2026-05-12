import {
  hasDefaultPaymentMethod,
  normalizePaymentMethods,
  pickDisplayPaymentMethod,
} from "@components/billings/shared/paymentMethods";
import { useBillingStripePortalPaymentMethodsQuery } from "@page-modules/billing/customer/useBillingStripePortalPaymentMethodsQuery";
import { useAccountBillingCompanyDetailsQuery } from "@page-modules/billing/account-billing/useAccountBillingCompanyDetailsQuery";

export function useSubscriptionPage() {
  const companyDetailsQuery = useAccountBillingCompanyDetailsQuery("tenant");
  const paymentMethodsQuery = useBillingStripePortalPaymentMethodsQuery();

  const companyDetails = companyDetailsQuery.data ?? null;
  const paymentMethodsList = normalizePaymentMethods(paymentMethodsQuery.data);
  const displayPaymentMethod = pickDisplayPaymentMethod(paymentMethodsList);
  const hasDefaultAccount = hasDefaultPaymentMethod(paymentMethodsList);

  return {
    companyDetails,
    displayPaymentMethod,
    hasDefaultAccount,
  };
}
