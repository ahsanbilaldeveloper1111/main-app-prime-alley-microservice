import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Column } from "@components/CustomDataTable";
import { Row, Col } from "react-bootstrap";
import moment from "moment";

import { ListCustomerProfilingLogs } from "@utils/tms/tmsProfiling";
import Link from "next/link";

interface SelectOption {
  value: number;
  label: string;
}

const CustomerProfilingLogs = () => {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {
        key: "applicant_details",
        name: "Applicant ID",
        selector: (row: any) => row.applicant_details,
        sortable: true,
        cell: (row: any) => {
          return (
            <div>
              <p>{row.applicant_details?.userid}</p>
            </div>
          );
        },
      },
      {
        key: "company",
        name: "Company",
        selector: (row: any) => row.company,
        sortable: true,
        cell: (row: any) => {
          return (
            <div>
              <p>{row?.applicant_details?.company?.name}</p>
            </div>
          );
        },
      },

      {
        key: "action_performed_by",
        name: "Action Performed By",
        selector: (row: any) => row.action_performed_by,
        sortable: true,
        cell: (row: any) => {
          return (
            <div>
              <p>{row?.user?.name}</p>
            </div>
          );
        },
      },

      {
        key: "status",
        name: "Status",
        selector: (row: any) => row.status,
        sortable: true,
        cell: (row: any) => {
          return (
            <span
              className={` text-uppercase badge ${row.status === "processed" ? "bg-success" : "bg-warning"}`}
            >
              {row.status}
            </span>
          );
        },
      },
      {
        key: "created_at",
        name: "Data/Time",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (row: any) => {
          return (
            <div>
              <p>{moment(row.created_at).format("DD-MM-YYYY HH:mm:ss")}</p>
            </div>
          );
        },
      },

      {
        key: "action",
        action: true,
        name: "Action",
        selector: (row: any) => row.action,
        sortable: true,
        cell: (row: any) => {
          return (
            <div className="d-flex gap-2">
              <Link
                href={`/tms/profiling/logs/${row.id}`}
                className="btn btn-sm btn-outline-primary"
              >
                View
              </Link>
            </div>
          );
        },
      },
    ],
    [],
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchCustomerProfilingLogs = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListCustomerProfilingLogs({
        page,
        perPage,
        search,
        filters: currentFilters,
      });
    },
    [memoizedFilters],
  );

  const [detailsModal, setDetailsModal] = useState(false);
  const [details, setDetails] = useState(null);

  const handleAction = (row: any) => {
    console.log(row);
    setDetails(row);
    setDetailsModal(true);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Error Logs"
        mainLink="/tms/profiling/logs"
        subTitle="Error Logs"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">Error Logs</h2>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchCustomerProfilingLogs}
        title="Error Logs"
        searchPlaceholder="Search Error Logs..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={true}
      />
    </React.Fragment>
  );
};

CustomerProfilingLogs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerProfilingLogs;
