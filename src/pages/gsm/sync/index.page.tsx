import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { useGsmSyncPage } from "./useGsmSyncPage";
import { GsmSyncPageView } from "./components/GsmSyncPageView";

const GsmSync = () => {
  const ctx = useGsmSyncPage();
  return <GsmSyncPageView ctx={ctx} />;
};

GsmSync.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmSync;
