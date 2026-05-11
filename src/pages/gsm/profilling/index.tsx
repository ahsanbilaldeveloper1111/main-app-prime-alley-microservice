import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@layout/index";
import "@assets/scss/datatable-style.scss";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Col, Dropdown, Row } from "react-bootstrap";
import dynamic from "next/dynamic";
import type {
  ConditionalStyles,
  TableColumn,
  TableProps,
} from "react-data-table-component";
import GsmInboxFilter from "@components/filters/GsmInboxFilter";

import "@assets/scss/gsm-dashboard.scss";
import "@assets/scss/gsm-assign.scss";
import "@assets/scss/dashboard-card.scss";

type GsmInboxTableRow = {
  id: number;
  name: string;
  port: string;
  mobile_number: string;
  sender_number: string;
  message: string;
  created_at: string;
};

const DataTable = dynamic(
  () => import("react-data-table-component").then((mod) => mod.default),
  { ssr: false }
) as React.ComponentType<TableProps<GsmInboxTableRow>>;

const paginationComponentOptions = {
  rowsPerPageText: "Data per page",
  rangeSeparatorText: "of",
  selectAllRowsItem: true,
  selectAllRowsItemText: "",
};

const ROWS_PAGE_OPTIONS = [5, 10, 25, 50, 100] as const;

const INBOX_COLUMN_IDS = [
  "name",
  "port",
  "mobile_number",
  "sender_number",
  "message",
  "created_at",
] as const satisfies readonly Exclude<keyof GsmInboxTableRow, "id">[];

type InboxColumnId = (typeof INBOX_COLUMN_IDS)[number];

function isInboxColumnId(value: string): value is InboxColumnId {
  return (INBOX_COLUMN_IDS as readonly string[]).includes(value);
}

function rowMatchesSearch(row: GsmInboxTableRow, searchLower: string): boolean {
  if (!searchLower) {
    return true;
  }
  const values: string[] = [
    row.name,
    row.port,
    row.mobile_number,
    row.sender_number,
    row.message,
    row.created_at,
  ];
  return values.some((v) => String(v ?? "").toLowerCase().includes(searchLower));
}

const GsmInbox = () => {
  const [inboxTableRows] = useState<GsmInboxTableRow[]>([]);

  useEffect(() => {
    // @ts-expect-error — bootstrap bundle path has no official TypeScript typings
    void import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  const allColumns = useMemo<TableColumn<GsmInboxTableRow>[]>(
    () => [
      {
        id: "name",
        name: "Gsm Name",
        selector: (row) => row.name,
        sortable: true,
      },
      {
        id: "port",
        name: "Port",
        selector: (row) => row.port,
        sortable: true,
      },
      {
        id: "mobile_number",
        name: "Mobile Number",
        selector: (row) => row.mobile_number,
        sortable: true,
      },
      {
        id: "sender_number",
        name: "Sender Number",
        selector: (row) => row.sender_number,
        sortable: true,
      },
      {
        id: "message",
        name: "Message",
        selector: (row) => row.message,
        sortable: true,
      },
      {
        id: "created_at",
        name: "DateTime",
        selector: (row) => row.created_at,
        sortable: true,
      },
    ],
    []
  );

  const [visibleColumns, setVisibleColumns] = useState<InboxColumnId[]>(() => [...INBOX_COLUMN_IDS]);

  const [pageSize, setPageSize] = useState(5);

  const onChangeInSelect = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
  }, []);

  const handlePerRowsChange = useCallback((newPerPage: number) => {
    setPageSize(newPerPage);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  const searchLower = searchTerm.trim().toLowerCase();

  const filteredData = useMemo(
    () => inboxTableRows.filter((row) => rowMatchesSearch(row, searchLower)),
    [inboxTableRows, searchLower]
  );

  const toggleColumnVisibility = useCallback((columnId: InboxColumnId) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId) ? prev.filter((key) => key !== columnId) : [...prev, columnId]
    );
  }, []);

  const conditionalRowStyles = useMemo<ConditionalStyles<GsmInboxTableRow>[]>(
    () => [
      {
        when: () => true,
        style: {
          animation: "fadeInUp 0.9s ease-in-out",
        },
      },
    ],
    []
  );

  const visibleColumnsData = useMemo(
    () =>
      allColumns.filter((col) => {
        const id = col.id;
        return typeof id === "string" && isInboxColumnId(id) && visibleColumns.includes(id);
      }),
    [allColumns, visibleColumns]
  );

  return (
    <>
      <BreadcrumbItem mainTitle="Gsm" mainLink="/call-recordings/dashboard" subTitle="Call Recordings" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title ">
            <h2 className="mb-0 d-flex align-items-center">
              Gsm Inbox
              <GsmInboxFilter />
            </h2>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col sm={12} md={6}>
          <div className="dataTables_length" id="dom-jqry_length">
            <label className="d-flex align-items-center">
              Show{" "}
              <select
                onChange={onChangeInSelect}
                className="form-select form-select-sm mx-1"
                style={{ width: "auto" }}
                value={pageSize}
              >
                {ROWS_PAGE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>{" "}
              entries
            </label>
          </div>
        </Col>

        <Col sm={12} md={6}>
          <div className="d-flex align-items-center justify-content-end gap-2">
            <div>
              <label className="d-flex align-items-center justify-content-end gap-1">
                <span>Search:</span>
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder=""
                  aria-controls="dom-jqry"
                  onChange={handleSearchChange}
                  value={searchTerm}
                />
              </label>
            </div>

            <div className="d-flex align-items-center justify-content-end">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  Columns ({visibleColumns.length}/{allColumns.length})
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Header>Select Columns to Show</Dropdown.Header>
                  <Dropdown.Divider />
                  {allColumns.map((column) => {
                    const columnId = column.id;
                    if (typeof columnId !== "string" || !isInboxColumnId(columnId)) {
                      return null;
                    }
                    return (
                      <div key={columnId} className="px-3 py-1">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={visibleColumns.includes(columnId)}
                            onChange={() => {
                              toggleColumnVisibility(columnId);
                            }}
                            id={`column-${columnId}`}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`column-${columnId}`}
                            style={{ cursor: "pointer" }}
                          >
                            {column.name}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Col>
      </Row>

      {visibleColumnsData.length > 0 ? (
        <DataTable
          key={`datatable-${pageSize}`}
          striped
          columns={visibleColumnsData}
          data={filteredData}
          paginationComponentOptions={paginationComponentOptions}
          pagination
          paginationPerPage={pageSize}
          paginationRowsPerPageOptions={[...ROWS_PAGE_OPTIONS]}
          onChangeRowsPerPage={handlePerRowsChange}
          highlightOnHover
          pointerOnHover
          conditionalRowStyles={conditionalRowStyles}
          className="table-bordered"
        />
      ) : (
        <div className="text-center p-4 border rounded">
          <p className="mb-0">No columns selected. Please select at least one column to display the table.</p>
        </div>
      )}
    </>
  );
};

GsmInbox.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmInbox;
