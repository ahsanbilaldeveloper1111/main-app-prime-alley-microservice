import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { CallRecordingsListPage } from "@components/communications/CallRecordingsListPage";

/** Call recordings list is implemented in `CallRecordingsListPage`. */
const CallRecordings = () => <CallRecordingsListPage />;

CallRecordings.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default CallRecordings;
