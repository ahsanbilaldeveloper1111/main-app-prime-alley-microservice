import '@assets/scss/datatable-style.scss';
import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import TicketDashboard from '@components/tickets/TicketDashboard';

const TicketsPage = () => {
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/list" subTitle="Tickets" />
            <TicketDashboard />
        </React.Fragment>
    );
};

TicketsPage.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketsPage;
