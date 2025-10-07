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

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";


import { ListUnifiedOps } from "@utils/tms/List";

interface SelectOption {
  value: number;
  label: string;
}

const UnifiedOpsList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({search: ""});

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
        return await ListUnifiedOps({ page, perPage, search: search || memoizedFilters?.search || "", filters: currentFilters });
      },
      [memoizedFilters,currentFilters]
    );

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
    setRefreshKey((oldKey) => oldKey + 1);
  };


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Unified Ops"
        mainLink="/tms/unified-ops"
        subTitle="Unified Ops"
      />
      
        <PageHeader
          title="Unified Ops"
          showSearch={true}
          searchPlaceholder="Search Unified Ops..."
          searchValue={currentFilters?.search || ""}
          onSearchChange={(value: any) => handleFiltersChange({...currentFilters, search: value})}
        />

      
        <GenericListPage
          columns={columns}
          fetchData={fetchUnifiedOps}
          title="Unified Ops"
          searchPlaceholder="Search Unified Ops..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
        />
      

    </React.Fragment>
  );
};

UnifiedOpsList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default UnifiedOpsList;