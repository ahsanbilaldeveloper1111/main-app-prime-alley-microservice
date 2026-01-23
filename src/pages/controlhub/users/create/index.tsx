import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row, Col, Button } from "react-bootstrap";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import CreateUserProfile from "@pages/tms/profiling/user/create/CreateUserProfile";

const ControlhubUsersCreate = () => {
  const router = useRouter();

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Add User Profile"
        mainLink="/controlhub/users/create"
        subTitle="Add User Profile"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0 d-flex align-items-center">
              Add User Profile
            </h2>
            <Button
              variant="outline-secondary"
              onClick={() => router.back()}
              className="d-flex align-items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Users
            </Button>
          </div>
        </Col>
      </Row>
      
      <CreateUserProfile />
    </React.Fragment>
  );
};

ControlhubUsersCreate.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ControlhubUsersCreate;