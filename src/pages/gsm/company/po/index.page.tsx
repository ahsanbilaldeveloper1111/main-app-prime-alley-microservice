import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { CompanyPOPageView } from "./components/CompanyPOPageView";
import { useCompanyPOPage } from "./useCompanyPOPage";

const CompanyPO = () => {
  const ctx = useCompanyPOPage();
  return <CompanyPOPageView ctx={ctx} />;
};

CompanyPO.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CompanyPO;
