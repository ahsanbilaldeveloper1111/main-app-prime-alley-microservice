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

import {ListRecordingProfile } from "@utils/tms/List";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxRecordingProfile = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

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
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Recording Profile
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchRecordingProfile}
          title="Cisco PBX Recording Profile"
          searchPlaceholder="Search recording profile..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
      

    </React.Fragment>
  );
};

CiscoPbxRecordingProfile.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxRecordingProfile;
