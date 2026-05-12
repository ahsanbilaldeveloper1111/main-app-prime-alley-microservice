import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row, Col } from "react-bootstrap";
import CreateUserProfile from "@page-modules/tms/profiling/user/create/CreateUserProfile";

const UserProfileCreate = () => {
  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Create User Profile"
        mainLink="/tms/profiling/user/create"
        subTitle="Create User Profile"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0 d-flex align-items-center">
              Create User Profile
            </h2>
          </div>
        </Col>
      </Row>
      
      <CreateUserProfile />
    </React.Fragment>
  );
};

UserProfileCreate.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default UserProfileCreate;