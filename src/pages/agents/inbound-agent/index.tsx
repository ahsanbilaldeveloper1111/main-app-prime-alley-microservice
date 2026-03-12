import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BotsPage from "@pages/voicebot/inbound/bots";

const BotProfiles = () => {
  return <BotsPage />;
};

BotProfiles.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default BotProfiles;
