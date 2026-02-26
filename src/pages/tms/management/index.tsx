import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";
import Select from "react-select";

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