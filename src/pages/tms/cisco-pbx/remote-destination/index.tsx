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

import {ListRemoteDestination } from "@utils/tms/List";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxRemoteDestination = () => {
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
      {key: "destination",name: "Destination",selector: (row: any) => row.destination,sortable: true},
      {key: "answerTooSoonTimer",name: "Answer Too Soon Timer",selector: (row: any) => row.answerTooSoonTimer,sortable: true},
      {key: "answerTooLateTimer",name: "Answer Too Late Timer",selector: (row: any) => row.answerTooLateTimer,sortable: true},
      {key: "delayBeforeRingingCell",name: "Delay Before Ringing Cell",selector: (row: any) => row.delayBeforeRingingCell,sortable: true},
      {key: "remoteDestinationProfileName",name: "Remote Destination Profile Name",selector: (row: any) => row.remoteDestinationProfileName,sortable: true},
      {key: "ctiRemoteDeviceName",name: "CTI Remote Device Name",selector: (row: any) => row.ctiRemoteDeviceName,sortable: true},
      {key: "dualModeDeviceName",name: "Dual Mode Device Name",selector: (row: any) => row.dualModeDeviceName,sortable: true},
      {key: "isMobilePhone",name: "Is Mobile Phone",selector: (row: any) => row.isMobilePhone,sortable: true},
      {key: "enableMobileConnect",name: "Enable Mobile Connect",selector: (row: any) => row.enableMobileConnect,sortable: true},
      {key: "timeZone",name: "Time Zone",selector: (row: any) => row.timeZone,sortable: true},
      {key: "todAccessName",name: "TOD Access Name",selector: (row: any) => row.todAccessName,sortable: true},
      {key: "mobileSmartClientName",name: "Mobile Smart Client Name",selector: (row: any) => row.mobileSmartClientName,sortable: true},
      {key: "mobilityProfileName",name: "Mobility Profile Name",selector: (row: any) => row.mobilityProfileName,sortable: true},
      {key: "singleNumberReachVoicemail",name: "Single Number Reach Voicemail",selector: (row: any) => row.singleNumberReachVoicemail,sortable: true},
      {key: "dialViaOfficeReverseVoicemail",name: "Dial Via Office Reverse Voicemail",selector: (row: any) => row.dialViaOfficeReverseVoicemail,sortable: true},
      {key: "created_at",name: "Created At",selector: (row: any) => row.created_at,sortable: true},
      {key: "updated_at",name: "Updated At",selector: (row: any) => row.updated_at,sortable: true}
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchRemoteDestination = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListRemoteDestination({ page, perPage, search, filters: currentFilters });
      },
      [memoizedFilters]
    );

      

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/remote-destination"
        subTitle="Cisco PBX Remote Destination"
      />


      <PageHeader
        title="Cisco PBX Remote Destination"
        showSearch={true}
        searchPlaceholder="Search remote destination..."
        searchValue={currentFilters?.search || ""}
        onSearchChange={(value: any) => handleFiltersChange({...currentFilters, search: value})}
      />

      
        <GenericListPage
          columns={columns}
          fetchData={fetchRemoteDestination}
          title="Cisco PBX Remote Destination"
          searchPlaceholder="Search remote destination..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
        />
      

    </React.Fragment>
  );
};

CiscoPbxRemoteDestination.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxRemoteDestination;