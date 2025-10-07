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

import { ListLocation } from "@utils/tms/List";

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

const CiscoPbxListLocation = () => {
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
      {key: "id",name: "ID",selector: (row: any) => row.id,sortable: true},
      {key: "withinAudioBandwidth",name: "Within Audio Bandwidth",selector: (row: any) => row.withinAudioBandwidth,sortable: true},
      {key: "withinVideoBandwidth",name: "Within Video Bandwidth",selector: (row: any) => row.withinVideoBandwidth,sortable: true},
      {key: "withinImmersiveKbits",name: "Within Immersive Kbits",selector: (row: any) => row.withinImmersiveKbits,sortable: true},
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchLocation = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListLocation({ page, perPage, search, filters: currentFilters });
      },
      [memoizedFilters]
    );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/locations"
        subTitle="Cisco PBX Locations"
      />

      <PageHeader
        title="Cisco PBX Locations"
        showSearch={true}
        searchPlaceholder="Search locations..."
        searchValue={currentFilters?.search || ""}
        onSearchChange={(value: any) => handleFiltersChange({...currentFilters, search: value})}
      />

      
        <GenericListPage
          columns={columns}
          fetchData={fetchLocation}
          title="Cisco PBX Locations"
          searchPlaceholder="Search locations..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
        />
      

    </React.Fragment>
  );
};

CiscoPbxListLocation.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListLocation;