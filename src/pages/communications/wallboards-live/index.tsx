import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { WallboardsLiveListPage } from "@components/communications/WallboardsLiveListPage";

/** Live wallboard is implemented in `WallboardsLiveListPage`. */
const LiveCallDashboard = () => <WallboardsLiveListPage />;

LiveCallDashboard.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default LiveCallDashboard;
