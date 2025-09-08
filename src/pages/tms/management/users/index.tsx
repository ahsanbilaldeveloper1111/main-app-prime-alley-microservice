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

import { ListUsers } from "@utils/tms/tmsUserManagement";

interface SelectOption {
  value: number;
  label: string;
}

const TmsUserManagement = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      {key: "email",name: "Email",selector: (row: any) => row.email,sortable: true},
      {key: "user_type",name: "User Type",selector: (row: any) => row.user_type,sortable: true},
      {key: "guid",name: "GUID",selector: (row: any) => row.guid,sortable: true},
      {key: "imagicle",name: "Imagicle",selector: (row: any) => row.imagicle,sortable: true},
      {key: "status",name: "Status",selector: (row: any) => row.status,sortable: true},
      {key: "username",name: "Username",selector: (row: any) => row.username,sortable: true},
      {key: "phone_no",name: "Phone No",selector: (row: any) => row.phone_no,sortable: true},
      {key: "id",name: "ID",selector: (row: any) => row.id,sortable: true},
      {key: "company",name: "Company",selector: (row: any) => row.company,sortable: true},
      {key: "user_access_info",name: "User Access Info",selector: (row: any) => {
        if (typeof row.user_access_info === 'object' && row.user_access_info !== null) {
          return JSON.stringify(row.user_access_info);
        }
        return row.user_access_info || '-';
      },sortable: true},
      {key: "blocked_permissions",name: "Blocked Permissions",selector: (row: any) => {
        if (typeof row.blocked_permissions === 'object' && row.blocked_permissions !== null) {
          return JSON.stringify(row.blocked_permissions);
        }
        return row.blocked_permissions || '-';
      },sortable: true},
      {key: "extended_permissions",name: "Extended Permissions",selector: (row: any) => {
        if (typeof row.extended_permissions === 'object' && row.extended_permissions !== null) {
          return JSON.stringify(row.extended_permissions);
        }
        return row.extended_permissions || '-';
      },sortable: true},
      {key: "ranks",name: "Ranks",selector: (row: any) => {
        if (typeof row.ranks === 'object' && row.ranks !== null) {
          return JSON.stringify(row.ranks);
        }
        return row.ranks || '-';
      },sortable: true},
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchData = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListUsers({page, perPage, search, filters: currentFilters});
      },
      [memoizedFilters]
    );


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Management"
        mainLink="/tms/management"
        subTitle="Users"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
            List Users
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchData}
          title="Users"
          searchPlaceholder="Search Users..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
      

    </React.Fragment>
  );
};

TmsUserManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TmsUserManagement;