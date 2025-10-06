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

import {ListRecordingProfile } from "@utils/tms/List";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxRecordingProfile = () => {
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
      {key: "recordingCssName",name: "Recording CSS Name",selector: (row: any) => row.recordingCssName,sortable: true},
      {key: "recorderDestination",name: "Recorder Destination",selector: (row: any) => row.recorderDestination,sortable: true},
      {key: "created_at",name: "Created At",selector: (row: any) => row.created_at,sortable: true},
      {key: "updated_at",name: "Updated At",selector: (row: any) => row.updated_at,sortable: true}
      
          ],
      []
    );


  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchRecordingProfile = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListRecordingProfile({ page, perPage, search, filters: currentFilters });
    },
    [memoizedFilters]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/recording-profile"
        subTitle="Cisco PBX Recording Profile"
      />
      

      <PageHeader
        title="Cisco PBX Recording Profile"
        showSearch={true}
        searchPlaceholder="Search recording profile..."
        searchValue={currentFilters?.search || ""}
        onSearchChange={(value: any) => handleFiltersChange({...currentFilters, search: value})}
      />


      
        <GenericListPage
          columns={columns}
          fetchData={fetchRecordingProfile}
          title="Cisco PBX Recording Profile"
          searchPlaceholder="Search recording profile..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"

        />
      

    </React.Fragment>
  );
};

CiscoPbxRecordingProfile.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxRecordingProfile;
