import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { AIFaqsGlobalPageView } from "./components/AIFaqsGlobalPageView";
import { useAIFaqsGlobalPage } from "./useAIFaqsGlobalPage";

const AIChatFAQsGlobal = () => {
  const ctx = useAIFaqsGlobalPage();
  return <AIFaqsGlobalPageView ctx={ctx} />;
};

AIChatFAQsGlobal.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIChatFAQsGlobal;
