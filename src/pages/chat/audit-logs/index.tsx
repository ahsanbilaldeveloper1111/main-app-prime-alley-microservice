import "@assets/scss/common.scss";
import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";

import Layout from "@layout/index";
import { ChatAdminAuditLogView } from "@page-modules/chat/admin-audit-log/ChatAdminAuditLogView";
import { useChatAdminAuditLogPage } from "@page-modules/chat/admin-audit-log/useChatAdminAuditLogPage";

const ChatAdminAuditLogsPage = () => {
  const ctx = useChatAdminAuditLogPage();
  return <ChatAdminAuditLogView ctx={ctx} />;
};

ChatAdminAuditLogsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default ChatAdminAuditLogsPage;
