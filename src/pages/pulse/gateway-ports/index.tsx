import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import { ListPorts } from "@utils/ports";
import { UpdatePortMobileNumber } from "@utils/GsmManagement";

import { Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";

import GsmPortFilter from "@components/filters/GsmPortFilter";

import PageSummaryGrid, { SummaryCard } from "@components/PageSummaryGrid";
import { FiEdit } from "react-icons/fi";

interface PortCompany {
  name?: string;
}

interface PortRecord {
  id: number | string;
  gsm?: {
    name?: string;
  };
  port_number?: string | number;
  mobile_number?: string;
  sim_status?: string;
  operator?: string;
  signal_status?: string;
  imei?: string;
  imsi?: string;
  iccid?: string;
  port_status?: string;
  status?: string;
  companies?: PortCompany[];
}

interface PortTableRow {
  id: string;
  deviceName: string;
  port: string;
  mobileNumber: string;
  simStatus: string;
  operator: string;
  signalStatus: string;
  imei: string;
  imsi: string;
  iccid: string;
  portStatus: string;
  companyName: string;
  status: string;
  raw: PortRecord;
}

function mapPortRecordToTableRow(item: PortRecord, idx: number): PortTableRow {
  const portNum = item.port_number;
  return {
    id: String(item.id ?? idx),
    deviceName: item.gsm?.name || "",
    port: portNum === undefined || portNum === null ? "" : String(portNum),
    mobileNumber: item.mobile_number || "",
    simStatus: item.sim_status || "",
    operator: item.operator || "",
    signalStatus: item.signal_status || "",
    imei: item.imei || "",
    imsi: item.imsi || "",
    iccid: item.iccid || "",
    portStatus: item.port_status || "",
    companyName: item.companies?.[0]?.name || "",
    status: item.status || "",
    raw: item,
  };
}

const MOBILE_NUMBER_REGEX = /^\+?[1-9]\d{0,15}$/;

const GsmPorts = () => {
  const { data: session } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});
  const prevFiltersRef = useRef(currentFilters);
  const [tableData, setTableData] = useState<PortTableRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [portSummary, setPortSummary] = useState({
    total_port: 0,
    online_port: 0,
    offline_port: 0,
    active_port: 0,
  });

  const summaryCards: SummaryCard[] = [
    {
      id: "total-gsms-count",
      title: "Total",
      value: portSummary.total_port,
      description: "Total Carrier Ports in the system",
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "assigned-gsms-count",
      title: "Registered",
      value: portSummary.online_port,
      description: "Registered Carrier Ports in the system",
      delay: 0.3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "unassigned-gsms-count",
      title: "Unregistered",
      value: portSummary.offline_port,
      description: "Unregistered Carrier Ports in the system",
      delay: 0.5,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "total-ports-count",
      title: "Active",
      value: portSummary.active_port,
      description: "Active Carrier Ports in the system",
      delay: 0.7,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
  ];

  const portColumns = useMemo<TableColumn<PortTableRow>[]>(() => {
    const isAdmin = session?.user?.is_admin === "1";
    const perms = session?.user?.permissions ?? [];

    const adminLeadColumns: TableColumn<PortTableRow>[] = isAdmin
      ? [
          {
            key: "deviceName",
            label: "DEVICE NAME",
            type: "text",
            sortable: true,
            render: (row: PortTableRow) => row.deviceName || "---",
          },
          {
            key: "port",
            label: "PORT",
            type: "text",
            sortable: true,
            render: (row: PortTableRow) => row.port || "---",
          },
        ]
      : [];

    const coreColumns: TableColumn<PortTableRow>[] = [
      {
        key: "mobileNumber",
        label: "PORT NUMBER",
        type: "text",
        sortable: true,
        render: (row: PortTableRow) => row.mobileNumber || "---",
      },
      {
        key: "simStatus",
        label: "PORT STATUS",
        type: "custom",
        sortable: true,
        render: (row: PortTableRow) => (
          <div>
            {row.simStatus === "REGISTER_OK" && (
              <span className="status-badge success">REGISTERED</span>
            )}
            {row.simStatus === "UNREGISTER_OK" && (
              <span className="status-badge danger">UNREGISTERED</span>
            )}
            {row.simStatus === "NO_SIM" && <span className="status-badge warning">NO SIM</span>}
            {row.simStatus === "POWER_OFF" && (
              <span className="status-badge danger">POWER OFF</span>
            )}
            {!row.simStatus && <span>---</span>}
          </div>
        ),
      },
      {
        key: "operator",
        label: "OPERATOR",
        type: "text",
        sortable: true,
        render: (row: PortTableRow) => row.operator || "---",
      },
      {
        key: "signalStatus",
        label: "SIGNAL",
        type: "custom",
        sortable: true,
        render: (row: PortTableRow) => (
          <div>
            {row.status === "up" && (
              <span className="status-badge success">
                <i className="fas fa-signal" />
              </span>
            )}
            {row.status === "down" && (
              <span className="status-badge danger">
                <i className="fas fa-signal-slash" />
              </span>
            )}
            {!row.status && <span>---</span>}
          </div>
        ),
      },
    ];

    const optionalColumns: TableColumn<PortTableRow>[] = [
      ...(perms.includes("imei-gsm-ports")
        ? [
            {
              key: "imei" as const,
              label: "IMEI",
              type: "text" as const,
              sortable: true,
              render: (row: PortTableRow) => row.imei || "---",
            },
          ]
        : []),
      ...(perms.includes("imsi-gsm-ports")
        ? [
            {
              key: "imsi" as const,
              label: "IMSI",
              type: "text" as const,
              sortable: true,
              render: (row: PortTableRow) => row.imsi || "---",
            },
          ]
        : []),
      ...(perms.includes("iccid-gsm-ports")
        ? [
            {
              key: "iccid" as const,
              label: "ICCID",
              type: "text" as const,
              sortable: true,
              render: (row: PortTableRow) => row.iccid || "---",
            },
          ]
        : []),
    ];

    const adminTailColumns: TableColumn<PortTableRow>[] = isAdmin
      ? [
          {
            key: "portStatus",
            label: "PORT STATUS",
            type: "custom",
            sortable: true,
            render: (row: PortTableRow) => (
              <div>
                {row.status === "up" && <span className="status-badge success">Active</span>}
                {row.status === "down" && (
                  <span className="status-badge danger">Not Active</span>
                )}
                {!row.status && <span>---</span>}
              </div>
            ),
          },
          {
            key: "companyName",
            label: "COMPANY",
            type: "text",
            sortable: true,
            render: (row: PortTableRow) => row.companyName || "---",
          },
        ]
      : [];

    return [
      ...adminLeadColumns,
      ...coreColumns,
      ...optionalColumns,
      ...adminTailColumns,
    ];
  }, [session?.user?.is_admin, session?.user?.permissions]);

  const fetchGsmPorts = useCallback(async (page = 1, perPage = 15, search = "") => {
    setLoading(true);
    try {
      const response = await ListPorts({ page, perPage, search, filters: currentFilters });

      if (response?.summary) {
        setPortSummary(response.summary);
      }

      const mapRows = (records: PortRecord[]) =>
        records.map((item, idx) => mapPortRecordToTableRow(item, idx));

      if (response?.data) {
        const dataArray: PortRecord[] = Array.isArray(response.data) ? response.data : [];
        const mappedData = mapRows(dataArray);
        setTableData(mappedData);
        setTotalRecords(response.total || response.metadata?.total_records || mappedData.length);
      } else {
        const dataArray: PortRecord[] = Array.isArray(response)
          ? response
          : response?.dataList || response?.records || [];
        const mappedData = mapRows(dataArray);
        setTableData(mappedData);
        setTotalRecords(response?.total || response?.metadata?.total_records || mappedData.length);
      }
    } catch (error) {
      console.error("Error fetching GSM ports:", error);
      toast.error("Failed to load GSM ports");
      setTableData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const handleFiltersChange = (filters: Record<string, unknown>) => {
    setCurrentFilters(filters);
  };

  useEffect(() => {
    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(prevFiltersRef.current);

    if (filtersChanged) {
      prevFiltersRef.current = currentFilters;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }

    fetchGsmPorts(filtersChanged ? 1 : currentPage, recordsPerPage).catch((err) => {
      console.error("fetchGsmPorts failed", err);
    });
  }, [currentFilters, currentPage, recordsPerPage, refreshKey, fetchGsmPorts]);

  const handlePaginationChange = (page: number, rowsPerPage: number) => {
    if (rowsPerPage !== recordsPerPage) {
      setRecordsPerPage(rowsPerPage);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      return;
    }

    setCurrentPage(page);
  };

  const handleUpdateMobileNumber = (id: number, currentMobileNumber?: string) => {
    setSelectedPortId(id);
    setMobileNumber(currentMobileNumber || "");
    setShowUpdateMobileNumberModal(true);
  };

  const [showUpdateMobileNumberModal, setShowUpdateMobileNumberModal] = useState(false);
  const [showUpdateMobileNumberSubmitModal, setShowUpdateMobileNumberSubmitModal] = useState(false);

  const handleCloseUpdateModal = () => {
    setShowUpdateMobileNumberModal(false);
    setMobileNumber("");
    setSelectedPortId(null);
    setIsUpdating(false);
  };

  const submitMobileNumberUpdate = async () => {
    if (!selectedPortId) {
      toast.error("No port selected");
      return;
    }

    if (!mobileNumber.trim()) {
      toast.error("Please enter a mobile number");
      return;
    }

    if (!MOBILE_NUMBER_REGEX.test(mobileNumber.trim())) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setIsUpdating(true);

    try {
      const success = await UpdatePortMobileNumber(selectedPortId.toString(), mobileNumber.trim());

      if (success) {
        setShowUpdateMobileNumberModal(false);
        setShowUpdateMobileNumberSubmitModal(true);
        setRefreshKey((prev) => prev + 1);
        setMobileNumber("");
        setSelectedPortId(null);
      } else {
        toast.error("Failed to update mobile number");
      }
    } catch (error) {
      console.error("Error updating mobile number:", error);
      toast.error("An error occurred while updating mobile number");
    } finally {
      setIsUpdating(false);
    }
  };

  const canUpdateMobile =
    session?.user?.is_admin === "1" &&
    session?.user?.permissions?.includes("update-mobile-number-gsm-ports");

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Carrier Ports" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="align-items-center">
              <Col md={3}>
                <h2 className="mb-0 d-flex align-items-center">Carrier Ports</h2>
              </Col>
              <Col md={9} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <GsmPortFilter onFiltersChange={handleFiltersChange} showExport={false} />
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <PageSummaryGrid cards={summaryCards} />

      {session?.user?.permissions?.includes("list-gsm-ports") && (
        <GenericTable<PortTableRow>
          data={tableData}
          columns={portColumns}
          uniqueKey="id"
          loading={loading}
          loadingMessage="Loading GSM ports..."
          emptyMessage="No GSM ports found."
          showToolbar={false}
          showToolbarActions={false}
          showActions={canUpdateMobile}
          actionsLabel="Actions"
          customizableColumns={false}
          pagination={{
            currentPage,
            rowsPerPage: recordsPerPage,
            totalRows: totalRecords,
            pageSizeOptions: [10, 15, 25, 50],
          }}
          onPaginationChange={handlePaginationChange}
          actions={
            canUpdateMobile
              ? [
                  {
                    label: "Update Mobile Number",
                    icon: <FiEdit className="me-2" />,
                    onClick: (row: PortTableRow) => {
                      handleUpdateMobileNumber(Number(row.id), row.mobileNumber);
                    },
                    className: "action-edit",
                  },
                ]
              : []
          }
          hover={true}
          striped={false}
          size="md"
        />
      )}

      {showUpdateMobileNumberSubmitModal && (
        <dialog
          open
          id="gateway-ports-success-modal"
          className="modal customModal"
          style={{ display: "flex", border: "none", padding: 0, background: "transparent", maxWidth: "100vw" }}
          aria-labelledby="gateway-ports-success-title"
        >
          <div className="modal-content">
            <button
              type="button"
              className="close-btn border-0 bg-transparent p-0"
              aria-label="Close"
              onClick={() => setShowUpdateMobileNumberSubmitModal(false)}
            >
              <i className="fas fa-times" aria-hidden />
            </button>
            <h2 id="gateway-ports-success-title">Successful!</h2>
            <p id="gateway-ports-success-text">
              The GSM ports mobile number has been successfully updated.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowUpdateMobileNumberSubmitModal(false);
                  setMobileNumber("");
                  setSelectedPortId(null);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </dialog>
      )}

      {showUpdateMobileNumberModal && (
        <dialog
          open
          id="gateway-ports-update-modal"
          className="modal customModal"
          style={{ display: "flex", border: "none", padding: 0, background: "transparent", maxWidth: "100vw" }}
          aria-labelledby="gateway-ports-update-title"
        >
          <div className="modal-content">
            <button
              type="button"
              className="close-btn border-0 bg-transparent p-0"
              aria-label="Close"
              onClick={handleCloseUpdateModal}
            >
              <i className="fas fa-times" aria-hidden />
            </button>
            <h2 id="gateway-ports-update-title">Update Mobile Number!</h2>

            <div className="form-group mb-3">
              <label htmlFor="mobile_number">Mobile Number</label>
              <input
                type="text"
                className="form-control"
                id="mobile_number"
                placeholder="Enter Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isUpdating) {
                    e.preventDefault();
                    submitMobileNumberUpdate().catch((err) => console.error(err));
                  }
                }}
                disabled={isUpdating}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseUpdateModal}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  submitMobileNumberUpdate().catch((err) => console.error(err));
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <span className="d-inline-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" aria-hidden />
                    <output className="mb-0">Updating…</output>
                  </span>
                ) : (
                  "Update Mobile Number"
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </React.Fragment>
  );
};

GsmPorts.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmPorts;
