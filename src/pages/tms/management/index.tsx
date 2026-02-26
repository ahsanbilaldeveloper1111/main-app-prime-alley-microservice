import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row, Col } from "react-bootstrap";

interface SelectOption {
  value: number;
  label: string;
}

const UnifiedOpsList = () => {
  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Management"
        mainLink="/tms/management"
        subTitle="Management"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">Management</h2>
          </div>
        </Col>
      </Row>
    </React.Fragment>
  );
};

UnifiedOpsList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default UnifiedOpsList;
