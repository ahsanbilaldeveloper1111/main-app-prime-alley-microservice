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

import {  ListDratCustomerProfile } from "@utils/tms/tmsProfiling";
import Link from "next/link";
import { m } from "framer-motion";

interface SelectOption {
  value: number;
  label: string;
}

const CustomerProfilingDraftList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      
      {key: "id",name: "Company",selector: (row: any) => row.email,sortable: true,
        cell: (row: any) => {
          return <div>
            <p>{row?.data?.companyName}</p>
          </div>
        }
      },
      {key: "id",name: "User Id",selector: (row: any) => row.id,sortable: true,
        cell: (row: any) => {
          return <div>
            <p>{row?.data?.userId}</p>
          </div>
        }
      },
      {key: "id",name: "Extension Number",selector: (row: any) => row.id,sortable: true,
        cell: (row: any) => {
          return <div>
            <p>{row?.data?.extensionNumber || 'N/A'}</p>
          </div>
        }
      },
      {key: "created_at",name: "Data Time",selector: (row: any) => row.id,sortable: true,
        cell: (row: any) => {
          return <div>
            <p>{moment(row?.created_at).format('DD-MM-YYYY HH:mm:ss')}</p>
          </div>
        }
      },

     
      {key: 'action', action: true, name: 'Action', selector: (row: any) => row.action, sortable: true,
        cell: (row: any) => {
          return <div className="d-flex gap-2">
            <Button size="sm" variant="outline-primary" onClick={() => {
              console.log(row);
            }}>Edit</Button>
            <Button size="sm" variant="outline-danger" onClick={() => {
              console.log(row);
            }}>Delete</Button>
          </div>
        }
      },
      
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchCustomerProfilingDraft = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListDratCustomerProfile();
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
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0 d-flex align-items-center">
            List Customer Profiling Draft
            </h2>
            <Link className="btn btn-sm btn-outline-primary ms-2" href="/tms/profiling/user/create">Create User Profile</Link>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchCustomerProfilingDraft}
          title="Customer Profiling Draft"
          searchPlaceholder="Search Customer Profiling Draft..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
        />
      

    </React.Fragment>
  );
};

CustomerProfilingDraftList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerProfilingDraftList;