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

import {ListAppUsers } from "@utils/tmsCisxoPbx";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxAppUsers = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  ;

  const columns: Column[] = useMemo(
    () => [
      {key: "ClusterName",name: "Cluster Name",selector: (row: any) => row.ClusterName,sortable: true},
      {key: "userid",name: "User ID",selector: (row: any) => row.userid,sortable: true},
      {key: "presenceGroupName",name: "Presence Group Name",selector: (row: any) => row.presenceGroupName,sortable: true},
      {key: "acceptPresenceSubscription",name: "Accept Presence Subscription",selector: (row: any) => row.acceptPresenceSubscription,sortable: true},
      {key: "acceptOutOfDialogRefer",name: "Accept Out of Dialog Refer",selector: (row: any) => row.acceptOutOfDialogRefer,sortable: true},
      {key: "acceptUnsolicitedNotification",name: "Accept Unsolicited Notification",selector: (row: any) => row.acceptUnsolicitedNotification,sortable: true},
      {key: "allowReplaceHeader",name: "Allow Replace Header",selector: (row: any) => row.allowReplaceHeader,sortable: true},
      {key: "isStandard",name: "Is Standard",selector: (row: any) => row.isStandard,sortable: true}
      
          ],
      []
    );


  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchAppUsers = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListAppUsers();
    },
    [memoizedFilters]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/app-users"
        subTitle="Cisco PBX App Users"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              App Users
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={ListAppUsers}
          title="Cisco PBX App Users"
          searchPlaceholder="Search app users..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
        />
      

    </React.Fragment>
  );
};

CiscoPbxAppUsers.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxAppUsers;
