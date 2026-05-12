import { useAccountBillingCompanyDetailsQuery } from "@page-modules/billing/account-billing/useAccountBillingCompanyDetailsQuery";

export function useCompanyInfoPage() {
  const companyDetailsQuery = useAccountBillingCompanyDetailsQuery("session");

  return {
    companyDetails: companyDetailsQuery.data ?? null,
    loading: companyDetailsQuery.isPending || companyDetailsQuery.isFetching,
  };
}
