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

import {ListCustomUsers } from "@utils/tms/tmsCisxoPbx";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxCustomUsers = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "ClusterName",name: "Cluster Name",selector: (row: any) => row.ClusterName,sortable: true},
      {key: "userid",name: "User ID",selector: (row: any) => row.userid,sortable: true},
      {key: "firstname",name: "First Name",selector: (row: any) => row.firstname,sortable: true},
      {key: "lastname",name: "Last Name",selector: (row: any) => row.lastname,sortable: true},
      {key: "controlledDevice",name: "Controlled Device",selector: (row: any) => row.controlledDevice,sortable: true},
      {key: "associatedDevice",name: "Associated Device",selector: (row: any) => row.associatedDevice,sortable: true},
      {key: "PermissionGroup",name: "Permission Group",selector: (row: any) => row.PermissionGroup,sortable: true},
      {key: "ownedDevice",name: "Owned Device",selector: (row: any) => row.ownedDevice,sortable: true},
      {key: "directoryNumber",name: "Directory Number",selector: (row: any) => row.directoryNumber,sortable: true},
      {key: "partition",name: "Partition",selector: (row: any) => row.partition,sortable: true},
      {key: "controlledDevice_DN",name: "Controlled Device DN",selector: (row: any) => row.controlledDevice_DN,sortable: true},
      {key: "controlledDevice_Partition",name: "Controlled Device Partition",selector: (row: any) => row.controlledDevice_Partition,sortable: true},
      {key: "associatedDevice_DN",name: "Associated Device DN",selector: (row: any) => row.associatedDevice_DN,sortable: true},
      {key: "ownedDeviceDN",name: "Owned Device DN",selector: (row: any) => row.ownedDeviceDN,sortable: true},
      {key: "ownedDevicePartition",name: "Owned Device Partition",selector: (row: any) => row.ownedDevicePartition,sortable: true}
          ],
      []
    );


  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchCustomUsers = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListCustomUsers({ page, perPage, search, filters: currentFilters });
    },
    [memoizedFilters]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/custom-users"
        subTitle="Cisco PBX Custom Users"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Custom Users
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchCustomUsers}
          title="Cisco PBX Custom Users"
          searchPlaceholder="Search custom users..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
      

    </React.Fragment>
  );
};

CiscoPbxCustomUsers.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxCustomUsers;
