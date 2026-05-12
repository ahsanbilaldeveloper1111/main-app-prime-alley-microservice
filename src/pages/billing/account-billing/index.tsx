import { ReactElement } from "react";
import Layout from "@layout/index";
import { useAccountBillingPage } from "@page-modules/billing/account-billing/useAccountBillingPage";
import { AccountBillingPageView } from "@page-modules/billing/account-billing/components/AccountBillingPageView";

const AccountBilling = () => {
  const ctx = useAccountBillingPage();
  return <AccountBillingPageView ctx={ctx} />;
};

AccountBilling.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AccountBilling;
