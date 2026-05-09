import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { GetCompanyDetails, GetPaymentMethods } from "@utils/accounting";
import { getAllUsers } from "@utils/users";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  hasDefaultPaymentMethod,
  normalizePaymentMethods,
  pickDisplayPaymentMethod,
} from "@components/billings/shared/paymentMethods";
import { commonActions } from "./overviewConstants";
import { extractSummaryUsersCount } from "./overviewHelpers";

export function useBillingOverviewPage() {
  const { data: session } = useSession();
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyRes, paymentMethodsRes, usersRes] = await Promise.all([
          GetCompanyDetails({ crm_company_id: "" }),
          GetPaymentMethods(),
          getAllUsers({ page: 1, perPage: 1 }),
        ]);

        setCompanyDetails(companyRes);
        setPaymentMethods(paymentMethodsRes);
        setUsersCount(extractSummaryUsersCount(usersRes));
      } catch (err) {
        console.error("Overview API error:", err);
      }
    };
    void fetchData();
  }, []);

  const paymentMethodsList = normalizePaymentMethods(paymentMethods);
  const displayPaymentMethod = pickDisplayPaymentMethod(paymentMethodsList);
  const hasDefaultAccount = hasDefaultPaymentMethod(paymentMethodsList);
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
