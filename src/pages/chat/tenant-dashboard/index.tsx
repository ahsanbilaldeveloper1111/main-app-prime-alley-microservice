import "@assets/scss/common.scss";
import "@assets/scss/datatable-style.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";

import Layout from "@layout/index";
import { ChatbotsTenantDashboardView } from "@page-modules/chat/tenant-dashboard/ChatbotsTenantDashboardView";
import { useChatbotsTenantDashboard } from "@page-modules/chat/tenant-dashboard/useChatbotsTenantDashboard";

const ChatbotsTenantDashboardPage = () => {
  const ctx = useChatbotsTenantDashboard();
  return <ChatbotsTenantDashboardView ctx={ctx} />;
};

ChatbotsTenantDashboardPage.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);

export default ChatbotsTenantDashboardPage;
