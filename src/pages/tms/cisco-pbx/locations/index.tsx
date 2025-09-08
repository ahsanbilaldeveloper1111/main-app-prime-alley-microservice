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

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxListLocation = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

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
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              List Locations
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchLocation}
          title="Cisco PBX Locations"
          searchPlaceholder="Search locations..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
      

    </React.Fragment>
  );
};

CiscoPbxListLocation.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListLocation;