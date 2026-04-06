import type { ReactElement } from "react";
import Layout from "@layout/index";
import BillingHistoryPage from "@components/billings/BillingHistoryPage";

/**
 * Standalone route for payment / billing history (same UI and data as Account & Billing → Billing History).
 */
const PaymentsPage = () => <BillingHistoryPage />;

PaymentsPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PaymentsPage;
