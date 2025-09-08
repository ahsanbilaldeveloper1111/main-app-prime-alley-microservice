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

import { getRanks } from "@utils/tms/tmsUserManagement";

interface SelectOption {
  value: number;
  label: string;
}

const TmsRankPermissions = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "id",name: "ID",selector: (row: any) => row.id,sortable: true},
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      {key: "description",name: "Description",selector: (row: any) => row.description,sortable: true},
      {key: "company_id",name: "Company ID",selector: (row: any) => row.company_id,sortable: true},
      {key: "created_at",name: "Created At",selector: (row: any) => row.created_at,sortable: true},
      {key: "updated_at",name: "Updated At",selector: (row: any) => row.updated_at,sortable: true},
      {key: "users_count",name: "Users Count",selector: (row: any) => row.users_count,sortable: true},
      {key: "permissions",name: "Permissions",selector: (row: any) => {
          if (!row.permissions || !Array.isArray(row.permissions)) {
            return "No permissions";
          }
          return row.permissions.map((permission: any) => permission.name || permission.action || "Unknown").join(", ");
        },sortable: true,
        render: (row: any) => {
          if (!row.permissions || !Array.isArray(row.permissions)) {
            return "No permissions";
          }
          return row.permissions.map((permission: any) => permission.name || permission.action || "Unknown").join(", ");
        }
      },
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchData = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await getRanks({page, perPage, search, filters: currentFilters});
      },
      [memoizedFilters]
    );


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Management"
        mainLink="/tms/management"
        subTitle="Rank Permissions"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
            List Rank Permissions
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchData}
          title="Rank Permissions"
          searchPlaceholder="Search Rank Permissions..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
      

    </React.Fragment>
  );
};

TmsRankPermissions.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TmsRankPermissions;