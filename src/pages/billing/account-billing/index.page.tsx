import { ReactElement } from "react";
import Layout from "@layout/index";
import { useAccountBillingPage } from "./useAccountBillingPage";
import { AccountBillingPageView } from "./components/AccountBillingPageView";

const AccountBilling = () => {
  const ctx = useAccountBillingPage();
  return <AccountBillingPageView ctx={ctx} />;
};

AccountBilling.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AccountBilling;
