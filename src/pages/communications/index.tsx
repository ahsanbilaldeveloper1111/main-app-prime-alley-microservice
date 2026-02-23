import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import CommunicationsDashboard from "./dashboard";

const CommunicationsPage = () => {
  return <CommunicationsDashboard />;
};

CommunicationsPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CommunicationsPage;
