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

import { ListCustomerProfiling } from "@utils/tms/tmsProfiling";

interface SelectOption {
  value: number;
  label: string;
}

const CustomerProfilingList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      {key: "users_count",name: "Users Count",selector: (row: any) => row.users_count,sortable: true},
      {key: "iccids",name: "ICCID Group",selector: (row: any) => row.iccid_group,sortable: true,
        cell: (row: any) => {
          if (row.iccids && Array.isArray(row.iccids)) {
            const names = row.iccids.map((iccid: any) => iccid.name);
            return names.join(', ');
          }
          return '';
        }
      },
      {key:'organization_unit',name:'Organization Unit',selector: (row: any) => row.organization_unit,sortable: true},
      {action:true,name:'Action',selector: (row: any) => row.action,sortable: true,
        cell: (row: any) => {
          return <div className="d-flex gap-2">
            
            <Button size="sm" variant="outline-primary"  onClick={() => {
              console.log(row);
            }}>Edit</Button>

            <Button size="sm" variant="outline-danger" onClick={() => {
              console.log(row);
            }}>Delete</Button>

            <Button size="sm" variant="outline-primary" onClick={() => {
              console.log(row);
            }}>Create/Update ICCID</Button>


          </div>
        }
      },
      
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchCustomerProfiling = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListCustomerProfiling();
      },
      [memoizedFilters]
    );


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Customer Profiling"
        mainLink="/tms/profiling/customer"
        subTitle="Customer Profiling"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
            List Customer Profiling
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchCustomerProfiling}
          title="Customer Profiling"
          searchPlaceholder="Search Customer Profiling..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
      

    </React.Fragment>
  );
};

CustomerProfilingList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerProfilingList;