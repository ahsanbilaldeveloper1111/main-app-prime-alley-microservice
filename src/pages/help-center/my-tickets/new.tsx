import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useRouter } from "next/router";
import CreateTicket from "../partials/create-ticket";

const NewTicketPage = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push('/help-center/my-tickets');
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Help Center" mainLink="/help-center" subTitle="Create Ticket" />
      <CreateTicket onBack={handleBack} />
    </React.Fragment>
  );
};

NewTicketPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default NewTicketPage;

