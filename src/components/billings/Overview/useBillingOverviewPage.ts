import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  hasDefaultPaymentMethod,
  normalizePaymentMethods,
  pickDisplayPaymentMethod,
} from "@components/billings/shared/paymentMethods";
import { commonActions } from "./overviewConstants";
import { useBillingStripePortalPaymentMethodsQuery } from "@page-modules/billing/customer/useBillingStripePortalPaymentMethodsQuery";
import { useAccountBillingCompanyDetailsQuery } from "@page-modules/billing/account-billing/useAccountBillingCompanyDetailsQuery";
import { useAccountBillingOverviewUsersSummaryQuery } from "@page-modules/billing/account-billing/useAccountBillingOverviewUsersSummaryQuery";

export function useBillingOverviewPage() {
  const { data: session } = useSession();
  const companyDetailsQuery = useAccountBillingCompanyDetailsQuery("tenant");
  const paymentMethodsQuery = useBillingStripePortalPaymentMethodsQuery();
  const usersSummaryQuery = useAccountBillingOverviewUsersSummaryQuery();

  const companyDetails = (companyDetailsQuery.data ?? null) as any;
  const paymentMethodsList = normalizePaymentMethods(paymentMethodsQuery.data);
  const displayPaymentMethod = pickDisplayPaymentMethod(paymentMethodsList);
  const hasDefaultAccount = hasDefaultPaymentMethod(paymentMethodsList);
  const usersCount = usersSummaryQuery.data ?? null;
  const seatsText =
    usersCount === null ? "—/—" : `${usersCount.toLocaleString()}/${usersCount.toLocaleString()}`;
  const canViewStaticBillingSections = Boolean(
    session?.user?.permissions?.includes(
      HEADER_CONSTANTS.PERMISSIONS.VIEW_STATIC_SECTIONS_BILLING,
    ),
  );
  const visibleCommonActions = useMemo(
    () =>
      commonActions.filter(
        (action) => !action.isStaticSection || canViewStaticBillingSections,
      ),
    [canViewStaticBillingSections],
  );

  return {
    session,
    companyDetails,
    displayPaymentMethod,
    hasDefaultAccount,
    seatsText,
    visibleCommonActions,
  };
}

export type BillingOverviewPageContext = ReturnType<typeof useBillingOverviewPage>;
