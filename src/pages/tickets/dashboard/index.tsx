import '@assets/scss/datatable-style.scss';
import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import TicketDashboard from '@components/tickets/TicketDashboard';

const TicketsDashboard = () => {
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/list" subTitle="Tickets" />
            <TicketDashboard />
        </React.Fragment>
    );
};

TicketsDashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketsDashboard;
