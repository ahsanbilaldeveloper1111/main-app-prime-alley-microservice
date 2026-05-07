import React, { ReactElement } from "react";
import Layout from "@layout/index";
import "./auditLogsPage.scss";
import { AuditLogsScreen } from "./AuditLogsScreen";
import { useAuditLogsPage } from "./useAuditLogsPage";

function AuditLogsNewPage() {
  const vm = useAuditLogsPage();
  return <AuditLogsScreen {...vm} />;
}

AuditLogsNewPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default AuditLogsNewPage;
