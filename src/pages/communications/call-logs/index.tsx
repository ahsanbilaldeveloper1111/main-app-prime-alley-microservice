import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { CallLogsListPage } from "@components/communications/CallLogsListPage";

/** Call logs list, stats, and filters are implemented in `CallLogsListPage`. */
const CallLogs = () => <CallLogsListPage />;

CallLogs.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default CallLogs;
