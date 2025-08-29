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

import { ListPhone } from "@utils/tms/tmsCisxoPbx";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxListPhone = () => {
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
      {key: "commonDeviceConfigName",name: "Common Device Config Name",selector: (row: any) => row.commonDeviceConfigName,sortable: true},
      {key: "commonPhoneConfigName",name: "Common Phone Config Name",selector: (row: any) => row.commonPhoneConfigName,sortable: true},
      {key: "networkLocation",name: "Network Location",selector: (row: any) => row.networkLocation,sortable: true},
      {key: "locationName",name: "Location Name",selector: (row: any) => row.locationName,sortable: true},
      {key: "mediaResourceListName",name: "Media Resource List Name",selector: (row: any) => row.mediaResourceListName,sortable: true},
      {key: "networkHoldMohAudioSourceId",name: "Network Hold MOH Audio Source ID",selector: (row: any) => row.networkHoldMohAudioSourceId,sortable: true}, 
      {key: "userHoldMohAudioSourceId",name: "User Hold MOH Audio Source ID",selector: (row: any) => row.userHoldMohAudioSourceId,sortable: true},
      {key: "securityProfileName",name: "Security Profile Name",selector: (row: any) => row.securityProfileName,sortable: true},
      {key: "sipProfileName",name: "SIP Profile Name",selector: (row: any) => row.sipProfileName,sortable: true},
      {key: "cgpnTransformationCssName",name: "CGPN Transformation CSS Name",selector: (row: any) => row.cgpnTransformationCssName,sortable: true},
      {key: "useDevicePoolCgpnTransformCss",name: "Use Device Pool CGPN Transform CSS",selector: (row: any) => row.useDevicePoolCgpnTransformCss,sortable: true},
      {key: "phoneTemplateName",name: "Phone Template Name",selector: (row: any) => row.phoneTemplateName,sortable: true},
      {key: "userLocale",name: "User Locale",selector: (row: any) => row.userLocale,sortable: true},
      {key: "networkLocale",name: "Network Locale",selector: (row: any) => row.networkLocale,sortable: true},
      {key: "softkeyTemplateName",name: "Softkey Template Name",selector: (row: any) => row.softkeyTemplateName,sortable: true},
      {key: "loginUserId",name: "Login User ID",selector: (row: any) => row.loginUserId,sortable: true},
      {key: "enableExtensionMobility",name: "Enable Extension Mobility",selector: (row: any) => row.enableExtensionMobility,sortable: true},
      {key: "currentProfileName",name: "Current Profile Name",selector: (row: any) => row.currentProfileName,sortable: true},
      {key: "loginTime",name: "Login Time",selector: (row: any) => row.loginTime,sortable: true},
      {key: "loginDuration",name: "Login Duration",selector: (row: any) => row.loginDuration,sortable: true},
      {key: "builtInBridgeStatus",name: "Built In Bridge Status",selector: (row: any) => row.builtInBridgeStatus,sortable: true},
      {key: "ownerUserName",name: "Owner User Name",selector: (row: any) => row.ownerUserName,sortable: true},
      {key: "subscribeCallingSearchSpaceName",name: "Subscribe Calling Search Space Name",selector: (row: any) => row.subscribeCallingSearchSpaceName,sortable: true},
      {key: "rerouteCallingSearchSpaceName",name: "Reroute Calling Search Space Name",selector: (row: any) => row.rerouteCallingSearchSpaceName,sortable: true},
      {key: "allowCtiControlFlag",name: "Allow CTI Control Flag",selector: (row: any) => row.allowCtiControlFlag,sortable: true},
      {key: "digestUser",name: "Digest User",selector: (row: any) => row.digestUser,sortable: true},
      {key: "mraServiceDomain",name: "MRA Service Domain",selector: (row: any) => row.mraServiceDomain,sortable: true},
      {key: "allowMraMode",name: "Allow MRA Mode",selector: (row: any) => row.allowMraMode,sortable: true},
      
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchPhone = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListPhone();
      },
      [memoizedFilters]
    );


      

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/phone"
        subTitle="Cisco PBX Phone"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              List Phone
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchPhone}
          title="Cisco PBX Phone"
          searchPlaceholder="Search phone..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
        />
      

    </React.Fragment>
  );
};

CiscoPbxListPhone.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListPhone;