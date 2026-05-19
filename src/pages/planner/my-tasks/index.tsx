import React, { ReactElement } from "react";
import Layout from "@layout/index";
import MyDayTasksPage from "@components/planner/MyDayTasksPage";

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const PlannerMyTasksPage: NextPageWithLayout = () => <MyDayTasksPage />;  

PlannerMyTasksPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default PlannerMyTasksPage;
