import React, { ReactElement } from "react";
import Layout from "@layout/index";
import "@page-modules/audit-logs/auditLogsPage.scss";
import { AuditLogsScreen } from "@page-modules/audit-logs/AuditLogsScreen";
import { useAuditLogsPage } from "@page-modules/audit-logs/useAuditLogsPage";

function AuditLogsNewPage() {
  const vm = useAuditLogsPage();
  return <AuditLogsScreen {...vm} />;
}

AuditLogsNewPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default AuditLogsNewPage;
