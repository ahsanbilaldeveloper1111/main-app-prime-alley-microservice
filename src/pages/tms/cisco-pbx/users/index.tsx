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
import {
  ListTickets,
  CreateTicket,
  UpdateTicketDetails,
  DeleteTicket,
  GetComments,
  GetAssigneeComments,
  AddComment,
  AddAssigneeComment,
} from "@utils/tickets";
import { GetHierarchyData } from "@utils/users";
import { GetAllStatuses } from "@utils/ticket-statuses";
import { GetAllTypes } from "@utils/ticket-types";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";
import Select from "react-select";

import { getCiscoPbxUsers } from "@utils/tms/List";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxUsers = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "ClusterName",name: "Cluster Name",selector: (row: any) => row.ClusterName,sortable: true},
      {key: "firstName",name: "First Name",selector: (row: any) => row.firstName,sortable: true},
      {key: "middleName",name: "Middle Name",selector: (row: any) => row.middleName,sortable: true},
      {key: "lastName",name: "Last Name",selector: (row: any) => row.lastName,sortable: true},
      {key: "emMaxLoginTime",name: "Max Login Time",selector: (row: any) => row.emMaxLoginTime,sortable: true},
      {key: "userid",name: "User ID",selector: (row: any) => row.userid,sortable: true},
      {key: "mailid",name: "Mail ID",selector: (row: any) => row.mailid,sortable: true},
      {key: "department",name: "Department",selector: (row: any) => row.department,sortable: true},
      {key: "manager",name: "Manager",selector: (row: any) => row.manager,sortable: true},
      {key: "userLocale",name: "User Locale",selector: (row: any) => row.userLocale,sortable: true},
      {key: "primaryExtensionPattern",name: "Primary Extension Pattern",selector: (row: any) => row.primaryExtensionPattern,sortable: true},
      {key: "routePartitionName",name: "Route Partition Name",selector: (row: any) => row.routePartitionName,sortable: true},
      {key: "associatedPc",name: "Associated PC",selector: (row: any) => row.associatedPc,sortable: true},
      {key: "enableCti",name: "Enable CTI",selector: (row: any) => row.enableCti,sortable: true},
      {key: "subscribeCallingSearchSpaceName",name: "Subscribe Calling Search Space Name",selector: (row: any) => row.subscribeCallingSearchSpaceName,sortable: true},
      {key: "enableMobility",name: "Enable Mobility",selector: (row: any) => row.enableMobility,sortable: true},
      {key: "remoteDestinationLimit",name: "Remote Destination Limit",selector: (row: any) => row.remoteDestinationLimit,sortable: true},
      {key: "status",name: "Status",selector: (row: any) => row.status,sortable: true},
      {key: "homeCluster",name: "Home Cluster",selector: (row: any) => row.homeCluster,sortable: true},
      {key: "imAndPresenceEnable",name: "IM and Presence Enable",selector: (row: any) => row.imAndPresenceEnable,sortable: true},
      {key: "serviceProfile",name: "Service Profile",selector: (row: any) => row.serviceProfile,sortable: true},

          ],
      []
    );


  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchCiscoPbxUsers = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await getCiscoPbxUsers({ page, perPage, search, filters: currentFilters });
    },
    [memoizedFilters]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/users"
        subTitle="Cisco PBX Users"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Cisco PBX Users
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchCiscoPbxUsers}
          title="Cisco PBX Users"
          searchPlaceholder="Search users..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
      

    </React.Fragment>
  );
};

CiscoPbxUsers.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxUsers;
