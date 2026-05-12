import React, { ReactElement } from "react";
import Layout from "@layout/index";

type NextPageWithLayout<P = {}> = React.FC<P> & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const PlannerMyTasksPage: NextPageWithLayout = () => {
  return (
    <Layout>
    <div className="page-container"></div>
    </Layout>
  );
};

PlannerMyTasksPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default PlannerMyTasksPage;
