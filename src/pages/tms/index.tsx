import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import TmsDashboardOverview from '@components/TmsDashboardOverview';

const TmsDashboard = () => {
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Automation" mainLink="/tms" subTitle="Automation Dashboard" />
            <TmsDashboardOverview />
        </React.Fragment>
    );
};

TmsDashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TmsDashboard;