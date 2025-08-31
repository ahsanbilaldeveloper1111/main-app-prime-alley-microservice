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

import { getCiscoPbxUsers,getCiscoPbxUsersDirectory } from "@utils/tms/tmsCisxoPbx";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxUsersDirectory = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "ClusterName",name: "Cluster Name",selector: (row: any) => row.ClusterName,sortable: true},
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      {key: "ldapDn",name: "LDAP DN",selector: (row: any) => row.ldapDn,sortable: true},
      {key: "userSearchBase",name: "User Search Base",selector: (row: any) => row.userSearchBase,sortable: true},
      {key: "repeatable",name: "Repeatable",selector: (row: any) => row.repeatable,sortable: true},
      {key: "intervalValue",name: "Interval Value",selector: (row: any) => row.intervalValue,sortable: true},
      {key: "scheduleUnit",name: "Schedule Unit",selector: (row: any) => row.scheduleUnit,sortable: true},
      {key: "nextExecTime",name: "Next Exec Time",selector: (row: any) => row.nextExecTime,sortable: true},
      {key: "accessControlGroup",name: "Access Control Group",selector: (row: any) => row.accessControlGroup,sortable: true},
      {key: "CreatedDate",name: "Created Date",selector: (row: any) => row.CreatedDate,sortable: true},
      {key: "ModifiedDate",name: "Modified Date",selector: (row: any) => row.ModifiedDate,sortable: true},
      {key: "IsActive",name: "Is Active",selector: (row: any) => row.IsActive,sortable: true}

          ],
      []
    );


  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchCiscoPbxUsersDirectory = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await getCiscoPbxUsersDirectory();
    },
    [memoizedFilters]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/users-directory"
        subTitle="Cisco PBX Users Directory"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Ldap Users Directory
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={getCiscoPbxUsersDirectory}
          title="Cisco PBX Users Directory"
          searchPlaceholder="Search users directory..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
        />
      

    </React.Fragment>
  );
};

CiscoPbxUsersDirectory.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxUsersDirectory;
