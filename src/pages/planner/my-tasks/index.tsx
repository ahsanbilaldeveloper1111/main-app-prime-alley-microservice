import React, { ReactElement } from "react";
import Layout from "@layout/index";
import MyDayTasksPage from "../../../components/planner/MyDayTasksPage";

const PlannerMyTasksPage = () => <MyDayTasksPage />;

PlannerMyTasksPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default PlannerMyTasksPage;
