import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { useGsmSyncPage } from "@page-modules/gsm/sync/useGsmSyncPage";
import { GsmSyncPageView } from "@page-modules/gsm/sync/components/GsmSyncPageView";

const GsmSync = () => {
  const ctx = useGsmSyncPage();
  return <GsmSyncPageView ctx={ctx} />;
};

GsmSync.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmSync;
