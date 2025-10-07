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

import { ListSipTrunks } from "@utils/tms/List";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxListSipTrunks = () => {
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
      {key: "product",name: "Product",selector: (row: any) => row.product,sortable: true},
      {key: "model",name: "Model",selector: (row: any) => row.model,sortable: true},
      {key: "class",name: "Class",selector: (row: any) => row.class,sortable: true},
      {key: "protocol",name: "Protocol",selector: (row: any) => row.protocol,sortable: true},
      {key: "protocolSide",name: "Protocol Side",selector: (row: any) => row.protocolSide,sortable: true},
      {key: "callingSearchSpaceName",name: "Calling Search Space Name",selector: (row: any) => row.callingSearchSpaceName,sortable: true},
      {key: "devicePoolName",name: "Device Pool Name",selector: (row: any) => row.devicePoolName,sortable: true},
      {key: "networkLocation",name: "Network Location",selector: (row: any) => row.networkLocation,sortable: true},
      {key: "locationName",name: "Location Name",selector: (row: any) => row.locationName,sortable: true},
      {key: "mediaResourceListName",name: "Media Resource List Name",selector: (row: any) => row.mediaResourceListName,sortable: true},
      {key: "networkHoldMohAudioSourceId",name: "Network Hold MOH Audio Source ID",selector: (row: any) => row.networkHoldMohAudioSourceId,sortable: true},
      {key: "userHoldMohAudioSourceId",name: "User Hold MOH Audio Source ID",selector: (row: any) => row.userHoldMohAudioSourceId,sortable: true},
      {key: "securityProfileName",name: "Security Profile Name",selector: (row: any) => row.securityProfileName,sortable: true},
      {key: "sipProfileName",name: "SIP Profile Name",selector: (row: any) => row.sipProfileName,sortable: true},
      {key: "cgpnTransformationCssName",name: "CGPN Transformation CSS Name",selector: (row: any) => row.cgpnTransformationCssName,sortable: true},
      {key: "useDevicePoolCgpnTransformCss",name: "Use Device Pool CGPN Transform CSS",selector: (row: any) => row.useDevicePoolCgpnTransformCss,sortable: true},
      {key: "subscribeCallingSearchSpaceName",name: "Subscribe Calling Search Space Name",selector: (row: any) => row.subscribeCallingSearchSpaceName,sortable: true},
      {key: "rerouteCallingSearchSpaceName",name: "Reroute Calling Search Space Name",selector: (row: any) => row.rerouteCallingSearchSpaceName,sortable: true},
      {key: "referCallingSearchSpaceName",name: "Refer Calling Search Space Name",selector: (row: any) => row.referCallingSearchSpaceName,sortable: true},
      {key: "mtpRequired",name: "MTP Required",selector: (row: any) => row.mtpRequired,sortable: true},
      {key: "dtmfSignalingMethod",name: "DTMF Signaling Method",selector: (row: any) => row.dtmfSignalingMethod,sortable: true},
      {key: "routeClassSignalling",name: "Route Class Signalling",selector: (row: any) => row.routeClassSignalling,sortable: true},
      {key: "sipTrunkType",name: "SIP Trunk Type",selector: (row: any) => row.sipTrunkType,sortable: true},
      {key: "runOnEveryNode",name: "Run On Every Node",selector: (row: any) => row.runOnEveryNode,sortable: true},
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchSipTrunks = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListSipTrunks({ page, perPage, search, filters: currentFilters });
      },
      [memoizedFilters]
    );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/sip-trunks"
        subTitle="Cisco PBX SIP Trunks"
      />
    

      <PageHeader
        title="Cisco PBX SIP Trunks"
        showSearch={true}
        searchPlaceholder="Search sip trunks..."
        searchValue={currentFilters?.search || ""}
        onSearchChange={(value: any) => handleFiltersChange({...currentFilters, search: value})}
      />

      
        <GenericListPage
          columns={columns}
          fetchData={fetchSipTrunks}
          title="Cisco PBX SIP Trunks"
          searchPlaceholder="Search sip trunks..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
        />
      

    </React.Fragment>
  );
};

CiscoPbxListSipTrunks.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListSipTrunks;