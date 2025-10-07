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

import { ListCSS } from "@utils/tms/List";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";



interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxListCSS = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  const columns: Column[] = useMemo(
    () => [
      {key: "ClusterName",name: "Cluster Name",selector: (row: any) => row.ClusterName,sortable: true},
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      {key: "description",name: "Description",selector: (row: any) => row.description,sortable: true},
      {key: "partitionUsage",name: "Partition Usage",selector: (row: any) => row.partitionUsage,sortable: true},
    ],
    []
  );

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchCSS = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListCSS({ page, perPage, search, filters: currentFilters });
      },
      [memoizedFilters]
    );


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/css"
        subTitle="Cisco PBX CSS"
      />
      

      <PageHeader
        title="Cisco PBX CSS"
        showSearch={true}
        searchPlaceholder="Search CSS..."
        searchValue={currentFilters?.search || ""}
        onSearchChange={(value: any) => handleFiltersChange({...currentFilters, search: value})}
      />

      
        <GenericListPage
          columns={columns}
          fetchData={fetchCSS}
          title="Cisco PBX CSS"
          searchPlaceholder="Search CSS..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"

        />
      

    </React.Fragment>
  );
};

CiscoPbxListCSS.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListCSS;