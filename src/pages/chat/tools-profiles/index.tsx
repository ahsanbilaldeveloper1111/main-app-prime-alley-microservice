import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { ToolsProfilesPageView } from "./components/ToolsProfilesPageView";
import { useToolsProfilesPage } from "./useToolsProfilesPage";

const ToolProfiles = () => {
  const ctx = useToolsProfilesPage();
  return <ToolsProfilesPageView ctx={ctx} />;
};

ToolProfiles.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ToolProfiles;
