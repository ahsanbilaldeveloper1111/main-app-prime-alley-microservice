import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import CustomerDashboard from "./customer/dashboard";
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const Billing = () => {
    const { data:session, status } = useSession();
  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Billing" />

      <PageHeader title="Billing" showSearch={false} />

      {session?.user?.permissions?.includes(HEADER_CONSTANTS.PERMISSIONS.VIEW_CUSTOMER_DASHBOARD_BILLING) && (
        <CustomerDashboard />
      )}
    </React.Fragment>
  );
};

Billing.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Billing;
