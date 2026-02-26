import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { useSession } from "next-auth/react";

interface SelectOption {
  value: number;
  label: string;
}

const UnifiedOpsList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

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
            <h2 className="mb-0 d-flex align-items-center">
            Management
            </h2>
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