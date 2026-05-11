import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useRouter } from "next/router";
import TicketDetail from "../partials/ticket-details";

const TicketDetailPage = () => {
  const router = useRouter();
  const ticketId = router.query.id as string;

  const handleBack = () => {
    router.push('/help-center/my-tickets');
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Help Center" mainLink="/help-center" subTitle="Ticket Detail" />
      <TicketDetail ticketId={ticketId} onBack={handleBack} />
    </React.Fragment>
  );
};

TicketDetailPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TicketDetailPage;

