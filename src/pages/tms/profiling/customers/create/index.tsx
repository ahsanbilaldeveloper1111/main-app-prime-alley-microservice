import "@assets/scss/datatable-style.scss";
import "@assets/scss/wizard.scss";
import React, {
  ReactElement
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Form, Modal, Row, ProgressBar } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import CreateProfileWizard from "./CreateProfileWizard";

import "@assets/scss/tms.scss";
import Link from "next/link";

const CustomerProfilingWizard = () => {
  const { data: session, status } = useSession();
  
  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Create Customer Profiling"
        mainLink="/tms/profiling/create/wizard"
        subTitle="Customer Profiling Wizard"
      />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0">
              Create Customer Profiling
            </h2> 
            </div>
        </Col>
      </Row>
      
      <CreateProfileWizard />
    </React.Fragment>
  );
};

CustomerProfilingWizard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerProfilingWizard;
