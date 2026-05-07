import { type ReactElement } from "react";
import type { NextPage } from "next";

import Layout from "@layout/index";

import "@assets/scss/common.scss";
import "@assets/scss/live-calls.scss";

import WallboardsLiveView from "@components/communications/wallboards-live/WallboardsLiveView";

const LiveCallDashboard: NextPage & {
  getLayout?: (page: ReactElement) => React.ReactNode;
} = () => <WallboardsLiveView />;

LiveCallDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LiveCallDashboard;
