import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useRouter } from "next/router";
import CreateTicket from "../partials/create-ticket";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "react-bootstrap";

const NewTicketPage = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push('/help-center/my-tickets');
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Help Center" mainLink="/help-center" subTitle="Create Ticket" />
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/help-center/my-tickets" style={{ textDecoration: 'none' }}>
          <Button
            variant="link"
            style={{
              textDecoration: 'none',
              color: '#6c757d',
              fontSize: '14px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <ChevronLeft size={16} /> My Tickets
          </Button>
        </Link>
        <span style={{ color: '#6c757d', margin: '0 8px' }}>›</span>
        <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Create Ticket</span>
      </div>
      <CreateTicket onBack={handleBack} />
    </React.Fragment>
  );
};

NewTicketPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default NewTicketPage;

