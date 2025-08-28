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

import { ListDeviePool } from "@utils/tmsCisxoPbx";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxListDevicePool = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "ClusterName",name: "Cluster Name",selector: (row: any) => row.ClusterName,sortable: true},
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      {key: "dateTimeSettingName",name: "Date Time Setting Name",selector: (row: any) => row.dateTimeSettingName,sortable: true},
      {key: "callManagerGroupName",name: "Call Manager Group Name",selector: (row: any) => row.callManagerGroupName,sortable: true},
      {key: "mediaResourceListName",name: "Media Resource List Name",selector: (row: any) => row.mediaResourceListName,sortable: true},
      {key: "regionName",name: "Region Name",selector: (row: any) => row.regionName,sortable: true},
      {key: "networkLocale",name: "Network Locale",selector: (row: any) => row.networkLocale,sortable: true},
      {key: "srstName",name: "SRST Name",selector: (row: any) => row.srstName,sortable: true},
      {key: "locationName",name: "Location Name",selector: (row: any) => row.locationName,sortable: true},
      {key: "cgpnTransformationCssName",name: "CGPN Transformation CSS Name",selector: (row: any) => row.cgpnTransformationCssName,sortable: true},
      {key: "cdpnTransformationCssName",name: "CDPN Transformation CSS Name",selector: (row: any) => row.cdpnTransformationCssName,sortable: true},
      {key: "localRouteGroupName",name: "Local Route Group Name",selector: (row: any) => row.localRouteGroupName,sortable: true},
      {key: "mraServiceDomain",name: "MRA Service Domain",selector: (row: any) => row.mraServiceDomain,sortable: true},
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchDevicePool = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListDeviePool();
      },
      [memoizedFilters]
    );


      

      

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/device-pool"
        subTitle="Cisco PBX Device Pool"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              List Device Pool
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchDevicePool}
          title="Cisco PBX Device Pool"
          searchPlaceholder="Search device pool..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
        />
      

    </React.Fragment>
  );
};

CiscoPbxListDevicePool.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListDevicePool;