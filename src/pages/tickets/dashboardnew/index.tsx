// import '@assets/scss/datatable-style.scss';
import React, { ReactElement } from 'react';
import Layout from '@layout/index';
// import BreadcrumbItem from '@common/BreadcrumbItem';
import TicketDashboardUpdated from '@components/tickets/ticketDashboardUpdated';

const TicketsDashboard = () => {
    return (
        <React.Fragment>
            {/* <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/list" subTitle="Tickets" /> */}
            <TicketDashboardUpdated />
        </React.Fragment>
    );
};

TicketsDashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketsDashboard;
