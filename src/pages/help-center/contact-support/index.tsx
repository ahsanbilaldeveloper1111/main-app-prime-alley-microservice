import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useRouter } from "next/router";
import ContactSupport from "../partials/contact-support";

const ContactSupportPage = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push('/help-center');
  };

  const handleStartChat = () => {
    console.log('Start chat clicked');
  };

  const handleRequestCall = () => {
    console.log('Request call clicked');
  };

  const handleSendMessage = () => {
    router.push('/help-center/my-tickets/new');
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Help Center" mainLink="/help-center" subTitle="Contact Support" />
      <ContactSupport 
        onBack={handleBack}
        onStartChat={handleStartChat}
        onRequestCall={handleRequestCall}
        onSendMessage={handleSendMessage}
      />
    </React.Fragment>
  );
};

ContactSupportPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ContactSupportPage;

