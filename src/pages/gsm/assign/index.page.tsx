import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import "@assets/scss/common.scss";
import { useGsmAssignPage } from "./useGsmAssignPage";
import { GsmAssignPageView } from "./components/GsmAssignPageView";

const GsmAssign = () => {
  const ctx = useGsmAssignPage();
  return <GsmAssignPageView ctx={ctx} />;
};

GsmAssign.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmAssign;
