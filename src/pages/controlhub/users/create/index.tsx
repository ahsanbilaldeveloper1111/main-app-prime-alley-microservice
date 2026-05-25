import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row, Col, Button } from "react-bootstrap";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import CreateUserProfile from "@page-modules/tms/profiling/user/create/CreateUserProfile";
import {
  DEFAULT_USERS_DIRECTORY_PATH,
  sanitizeReturnPath,
} from "@utils/controlhub/usersNavigation";

const ControlhubUsersCreate = () => {
  const router = useRouter();
  const usersListPath = useMemo(
    () => sanitizeReturnPath(router.query.returnTo, DEFAULT_USERS_DIRECTORY_PATH),
    [router.query.returnTo],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Add User Profile"
        mainLink={usersListPath}
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
              onClick={() => router.push(usersListPath)}
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