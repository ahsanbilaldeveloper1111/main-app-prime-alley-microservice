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

import { ListDeviePool, ListRoutePartition } from "@utils/tms/List";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxListRoutePartition = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  const columns: Column[] = useMemo(
    () => [
      {key: "ClusterName",name: "Cluster Name",selector: (row: any) => row.ClusterName,sortable: true},
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      {key: "description",name: "Description",selector: (row: any) => row.description,sortable: true},
      {key: "dialPlanWizardGenId",name: "Dial Plan Wizard Gen ID",selector: (row: any) => row.dialPlanWizardGenId,sortable: true},
      {key: "timeScheduleIdName",name: "Time Schedule ID Name",selector: (row: any) => row.timeScheduleIdName,sortable: true},
      {key: "useOriginatingDeviceTimeZone",name: "Use Originating Device Time Zone",selector: (row: any) => row.useOriginatingDeviceTimeZone,sortable: true},
      {key: "timeZone",name: "Time Zone",selector: (row: any) => row.timeZone,sortable: true},
      {key: "partitionUsage",name: "Partition Usage",selector: (row: any) => row.partitionUsage,sortable: true},
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchRoutePartition = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListRoutePartition({ page, perPage, search, filters: currentFilters });
      },
      [memoizedFilters]
    );


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/route-partitions"
        subTitle="Cisco PBX Route Partitions"
      />
     

      <PageHeader
        title="Cisco PBX Route Partitions"
        showSearch={true}
        searchPlaceholder="Search route partitions..."
        searchValue={currentFilters?.search || ""}
        onSearchChange={(value: any) => handleFiltersChange({...currentFilters, search: value})}
      />

      
        <GenericListPage
          columns={columns}
          fetchData={fetchRoutePartition}
          title="Cisco PBX Route Partitions"
          searchPlaceholder="Search route partitions..."
          defaultPageSize={15}
          filters={memoizedFilters}
            refreshKey={refreshKey}
            search={false}
            tableStyle="table-style-2"
        />
      

    </React.Fragment>
  );
};

CiscoPbxListRoutePartition.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListRoutePartition;