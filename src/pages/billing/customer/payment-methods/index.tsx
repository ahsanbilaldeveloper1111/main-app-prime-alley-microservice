import "@assets/scss/datatable-style.scss";
import "@assets/scss/billing.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { PaymentMethodsPageView } from "@page-modules/billing/customer/payment-methods/components/PaymentMethodsPageView";

const PaymentMethods = () => {
  return <PaymentMethodsPageView />;
};

PaymentMethods.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PaymentMethods;
