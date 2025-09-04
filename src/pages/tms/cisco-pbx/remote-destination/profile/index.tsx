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

import { ListRemoteDestinationProfile } from "@utils/tms/tmsCisxoPbx";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxRemoteDestinationProfile = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

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
      {key: "networkHoldMohAudioSourceId",name: "Network Hold MOH Audio Source ID",selector: (row: any) => row.networkHoldMohAudioSourceId,sortable: true},
      {key: "userHoldMohAudioSourceId",name: "User Hold MOH Audio Source ID",selector: (row: any) => row.userHoldMohAudioSourceId,sortable: true},
      {key: "callInfoPrivacyStatus",name: "Call Info Privacy Status",selector: (row: any) => row.callInfoPrivacyStatus,sortable: true},
      {key: "userId",name: "User ID",selector: (row: any) => row.userId,sortable: true},
      {key: "ignorePresentationIndicators",name: "Ignore Presentation Indicators",selector: (row: any) => row.ignorePresentationIndicators,sortable: true},
      {key: "rerouteCallingSearchSpaceName",name: "Reroute Calling Search Space Name",selector: (row: any) => row.rerouteCallingSearchSpaceName,sortable: true},
      {key: "cgpnTransformationCssName",name: "CGPN Transformation CSS Name",selector: (row: any) => row.cgpnTransformationCssName,sortable: true},
      {key: "automatedAlternateRoutingCssName",name: "Automated Alternate Routing CSS Name",selector: (row: any) => row.automatedAlternateRoutingCssName,sortable: true},
      {key: "useDevicePoolCgpnTransformCss",name: "Use Device Pool CGPN Transform CSS",selector: (row: any) => row.useDevicePoolCgpnTransformCss,sortable: true},
      {key: "userLocale",name: "User Locale",selector: (row: any) => row.userLocale,sortable: true},
      {key: "networkLocale",name: "Network Locale",selector: (row: any) => row.networkLocale,sortable: true},
      {key: "primaryPhoneName",name: "Primary Phone Name",selector: (row: any) => row.primaryPhoneName,sortable: true},
      {key: "dndOption",name: "DND Option",selector: (row: any) => row.dndOption,sortable: true},
      {key: "dndStatus",name: "DND Status",selector: (row: any) => row.dndStatus,sortable: true},
      {key: "mobileSmartClientProfileName",name: "Mobile Smart Client Profile Name",selector: (row: any) => row.mobileSmartClientProfileName,sortable: true},
      {key: "created_at",name: "Created At",selector: (row: any) => row.created_at,sortable: true},
      {key: "updated_at",name: "Updated At",selector: (row: any) => row.updated_at,sortable: true}
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchRemoteDestinationProfile = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListRemoteDestinationProfile({ page, perPage, search, filters: currentFilters });
      },
      [memoizedFilters]
    );


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/remote-destination/profile"
        subTitle="Cisco PBX Remote Destination Profile"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Remote Destination Profile
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchRemoteDestinationProfile}
          title="Cisco PBX Remote Destination Profile"
          searchPlaceholder="Search remote destination profile..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
      

    </React.Fragment>
  );
};

CiscoPbxRemoteDestinationProfile.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxRemoteDestinationProfile;