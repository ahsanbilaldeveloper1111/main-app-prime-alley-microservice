import "@assets/scss/common.scss";
import "@assets/scss/datatable-style.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";

import Layout from "@layout/index";
import { ChatbotsAdminDashboardView } from "@page-modules/chat/admin-dashboard/ChatbotsAdminDashboardView";
import { useChatbotsAdminDashboard } from "@page-modules/chat/admin-dashboard/useChatbotsAdminDashboard";

const ChatbotsAdminDashboardPage = () => {
  const ctx = useChatbotsAdminDashboard();
  return <ChatbotsAdminDashboardView ctx={ctx} />;
};

ChatbotsAdminDashboardPage.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);

export default ChatbotsAdminDashboardPage;
