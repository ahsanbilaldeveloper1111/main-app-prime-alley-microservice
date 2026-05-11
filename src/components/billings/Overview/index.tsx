import { useBillingOverviewPage } from "./useBillingOverviewPage";
import { OverviewPageView } from "./OverviewPageView";

const OverviewPage = () => {
  const ctx = useBillingOverviewPage();
  return <OverviewPageView ctx={ctx} />;
};

export default OverviewPage;
