import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { AIFaqsTenantPageView } from "@page-modules/chat/ai-faqs/tenant/components/AIFaqsTenantPageView";
import { useAIFaqsTenantPage } from "@page-modules/chat/ai-faqs/tenant/useAIFaqsTenantPage";

const AIChatFAQsTenant = () => {
  const ctx = useAIFaqsTenantPage();
  return <AIFaqsTenantPageView ctx={ctx} />;
};

AIChatFAQsTenant.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIChatFAQsTenant;
