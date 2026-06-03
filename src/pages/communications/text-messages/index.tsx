import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { TextMessagesListPage } from "@components/communications/TextMessagesListPage";

/** Text messages inbox is implemented in `TextMessagesListPage`. */
const GsmInbox = () => <TextMessagesListPage />;

GsmInbox.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default GsmInbox;
