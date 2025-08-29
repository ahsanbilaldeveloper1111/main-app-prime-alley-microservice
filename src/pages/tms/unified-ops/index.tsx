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

import { ListUnifiedOps } from "@utils/tms/tmsUnifiedOps";

interface SelectOption {
  value: number;
  label: string;
}

const UnifiedOpsList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "UserID",name: "User ID",selector: (row: any) => row.UserID,sortable: true},
      {key: "TelephoneNumber",name: "Telephone Number",selector: (row: any) => row.TelephoneNumber,sortable: true},
      {key: "Company",name: "Company",selector: (row: any) => row.Company,sortable: true},
      {key: "Department",name: "Department",selector: (row: any) => row.Department,sortable: true},
      {key: "AllowLocalDNCLCalls",name: "Allow Local DNCL Calls",selector: (row: any) => row.AllowLocalDNCLCalls,sortable: true},
      {key: "AllowApiDNCLCalls",name: "Allow API DNCL Calls",selector: (row: any) => row.AllowApiDNCLCalls,sortable: true},
      {key: "AllowRepetitiveCalls",name: "Allow Repetitive Calls",selector: (row: any) => row.AllowRepetitiveCalls,sortable: true},
      {key: "IndividualRepetitiveCallsAllowDaily",name: "Individual Repetitive Calls Allow Daily",selector: (row: any) => row.IndividualRepetitiveCallsAllowDaily,sortable: true},
      {key: "IndividualRepetitiveCallsAllowWeekly",name: "Individual Repetitive Calls Allow Weekly",selector: (row: any) => row.IndividualRepetitiveCallsAllowWeekly,sortable: true},
      {key: "CallRepFollowCompSettings",name: "Call Rep Follow Comp Settings",selector: (row: any) => row.CallRepFollowCompSettings,sortable: true},
      {key: "CompanyRepetitiveCallsAllowDaily",name: "Company Repetitive Calls Allow Daily",selector: (row: any) => row.CompanyRepetitiveCallsAllowDaily,sortable: true},
      {key: "CompanyRepetitiveCallsAllowWeekly",name: "Company Repetitive Calls Allow Weekly",selector: (row: any) => row.CompanyRepetitiveCallsAllowWeekly,sortable: true},
      
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchUnifiedOps = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListUnifiedOps();
      },
      [memoizedFilters]
    );


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Unified Ops"
        mainLink="/tms/unified-ops"
        subTitle="Unified Ops"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
            List Unified Ops
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchUnifiedOps}
          title="Unified Ops"
          searchPlaceholder="Search Unified Ops..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
        />
      

    </React.Fragment>
  );
};

UnifiedOpsList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default UnifiedOpsList;