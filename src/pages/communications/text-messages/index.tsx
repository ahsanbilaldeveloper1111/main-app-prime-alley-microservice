import { type ReactElement } from "react";
import type { NextPage } from "next";

import Layout from "@layout/index";

import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/text-messages-page.scss";

import TextMessagesView from "@components/communications/TextMessagesView";

const GsmInbox: NextPage & {
  getLayout?: (page: ReactElement) => React.ReactNode;
} = () => <TextMessagesView />;

GsmInbox.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmInbox;
