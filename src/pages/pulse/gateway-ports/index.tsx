import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { ListPorts } from "@utils/ports";
import { UpdatePortMobileNumber } from "@utils/GsmManagement";

import { Column } from "@components/CustomDataTable";
import { Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";

import GsmPortFilter from "@components/filters/GsmPortFilter";

import PageSummaryGrid, { SummaryCard } from "@components/PageSummaryGrid";
import { FiEdit } from "react-icons/fi";
import DatatableActionButton from "@components/DatatableActionButton";

const GsmPorts = () => {
  const { data: session } = useSession();

  const columns: Column[] = [
    ...(session?.user?.is_admin === "1"
      ? [
          {
            key: "ip_address",
            name: "Device Name ",
            selector: (row: any) => row?.gsm?.name,
            sortable: true,
          },

          {
            key: "port_number",
            name: "Port",
            selector: (row: any) => row.port_number,
            sortable: true,
          },
        ]
      : []),

    {
      key: "mobile_number",
      name: "Port Number",
      selector: (row: any) => row.mobile_number,
      sortable: true,
    },

    {
      key: "sim_status",
      name: "Port Status",
      selector: (row: any) => row.sim_status,
      sortable: true,
      cell: (props: any) => (
        <div>
          {props?.sim_status === "REGISTER_OK" && (
            <span className="status-badge success">REGISTERED</span>
          )}
          {props?.sim_status === "UNREGISTER_OK" && (
            <span className="status-badge danger">UNREGISTERED</span>
          )}
          {props?.sim_status === "NO_SIM" && (
            <span className="status-badge warning">NO SIM</span>
          )}
          {props?.sim_status === "POWER_OFF" && (
            <span className="status-badge danger">POWER OFF</span>
          )}
        </div>
      ),
    },
    {
      key: "operator",
      name: "Operator",
      selector: (row: any) => row.operator,
      sortable: true,
    },
    {
      key: "signal_status",
      name: "Signal",
      selector: (row: any) => row.signal_status,
      sortable: true,
      cell: (props: any) => (
        <div>
          {props?.status === "up" && (
            <span className="status-badge success">
              <i className="fas fa-signal"></i>
            </span>
          )}
          {props?.status === "down" && (
            <span className="status-badge danger">
              <i className="fas fa-signal-slash"></i>
            </span>
          )}
        </div>
      ),
    },

    ...(session?.user?.permissions?.includes("imei-gsm-ports")
      ? [
          {
            key: "imei",
            name: "IMEI",
            selector: (row: any) => row.imei,
            sortable: true,
          },
        ]
      : []),

    ...(session?.user?.permissions?.includes("imsi-gsm-ports")
      ? [
          {
            key: "imsi",
            name: "IMSI",
            selector: (row: any) => row.imsi,
            sortable: true,
          },
        ]
      : []),

    ...(session?.user?.permissions?.includes("iccid-gsm-ports")
      ? [
          {
            key: "iccid",
            name: "ICCID",
            selector: (row: any) => row.iccid,
            sortable: true,
          },
        ]
      : []),

    ...(session?.user?.is_admin === "1"
      ? [
          {
            key: "status",
            name: "Port Status",
            selector: (row: any) => row.port_status,
            sortable: true,
            cell: (props: any) => (
              <div>
                {props?.status === "up" && (
                  <span className="status-badge success">Active</span>
                )}
                {props?.status === "down" && (
                  <span className="status-badge danger">Not Active</span>
                )}
              </div>
            ),
          },

          {
            key: "companyies",
            name: "Company",
            selector: (row: any) => row.companies,
            sortable: true,
            cell: (props: any) => <div>{props?.companies?.[0]?.name}</div>,
          },
          {
            key: "Action",
            name: "action",
            selector: (row: any) => row.id,
            sortable: false,
            cell: (props: any) => (
              <div className="d-flex gap-3">
                {/* {session?.user?.permissions?.includes('update-mobile-number-gsm-ports') && 
                      props?.unassigned_ports?.length > 0 && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleUpdateMobileNumber(props.id)}>Update Mobile Number</button>
                    )}     */}

                <DatatableActionButton
                  actions={[
                    ...(session?.user?.permissions?.includes(
                      "update-mobile-number-gsm-ports",
                    )
                      ? [
                          {
                            label: "Update Mobile Number",
                            icon: <FiEdit className="me-2" />,
                            onClick: () =>
                              handleUpdateMobileNumber(
                                props.id,
                                props.mobile_number,
                              ),
                            className: "action-edit",
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Port Summary Data
  const [portSummary, setPortSummary] = useState({
    total_port: 0,
    online_port: 0,
    offline_port: 0,
    active_port: 0,
  });

  // Create cards data for PageSummaryGrid
  const summaryCards: SummaryCard[] = [
    {
      id: "total-gsms-count",
      title: "Total",
      value: portSummary?.total_port,
      description: "Total Carrier Ports in the system",
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "assigned-gsms-count",
      title: "Registered",
      value: portSummary?.online_port,
      description: "Registered Carrier Ports in the system",
      delay: 0.3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "unassigned-gsms-count",
      title: "Unregistered",
      value: portSummary?.offline_port,
      description: "Unregistered Carrier Ports in the system",
      delay: 0.5,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "total-ports-count",
      title: "Active",
      value: portSummary?.active_port,
      description: "Active Carrier Ports in the system",
      delay: 0.7,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
  ];

  const fetchGsmPorts = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const data = await ListPorts({
        page,
        perPage,
        search,
        filters: currentFilters,
      });
      setPortSummary(data?.summary);
      return data;
    },
    [currentFilters],
  );

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  const handleExport = async (
    exportType: string,
    filters: Record<string, any>,
  ) => {
    // try {
    //     const response = await ExportCallLogs({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
    //     console.log(response);
    // } catch (error) {
    //     console.error('Export error:', error);
    //     toast.error('Export failed. Please try again.');
    // }
  };

  const handleUpdateMobileNumber = async (
    id: number,
    currentMobileNumber?: string,
  ) => {
    setSelectedPortId(id);
    setMobileNumber(currentMobileNumber || "");
    setShowUpdateMobileNumberModal(true);
  };

  const [showExportSuccessfulModal, setShowExportSuccessfulModal] =
    useState(false);

  const handleExportSuccessful = async () => {
    setShowExportSuccessfulModal(true);
  };

  const [showUpdateMobileNumberModal, setShowUpdateMobileNumberModal] =
    useState(false);
  const [
    showUpdateMobileNumberSubmitModal,
    setShowUpdateMobileNumberSubmitModal,
  ] = useState(false);

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

    // Basic mobile number validation
    const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!mobileRegex.test(mobileNumber.trim())) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setIsUpdating(true);

    try {
      const success = await UpdatePortMobileNumber(
        selectedPortId.toString(),
        mobileNumber.trim(),
      );

      if (success) {
        setShowUpdateMobileNumberModal(false);
        setShowUpdateMobileNumberSubmitModal(true);
        setRefreshKey((prev) => prev + 1); // Refresh the data
        setMobileNumber(""); // Clear the form
        setSelectedPortId(null); // Clear selected port
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

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Carrier Ports" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="align-items-center">
              <Col md={3}>
                <h2 className="mb-0 d-flex align-items-center">
                  Carrier Ports
                </h2>
              </Col>
              <Col md={9} className="d-flex justify-content-end">
                <div className="action-buttons">
                  {/* <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search IP, ICCID, Mobile..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div> */}
                  <GsmPortFilter
                    onFiltersChange={handleFiltersChange}
                    showExport={false}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Port Summary Cards */}
      <PageSummaryGrid cards={summaryCards} />

      {session?.user?.permissions?.includes("list-gsm-ports") && (
        <GenericListPage
          columns={columns}
          fetchData={fetchGsmPorts}
          title="GSM Ports List"
          searchPlaceholder="Search ..."
          defaultPageSize={15}
          filters={currentFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
        />
      )}

      {showExportSuccessfulModal && (
        <div
          id="action-modal"
          className="modal customModal"
          style={{ display: "flex" }}
        >
          <div className="modal-content">
            <span
              className="close-btn"
              id="action-close-btn"
              onClick={() => setShowExportSuccessfulModal(false)}
            >
              <i className="fas fa-times"></i>
            </span>
            <h2 id="action-modal-title">Export Successful!</h2>
            <p id="action-modal-text">
              The GSM ports data has been successfully exported as a JSON file.
            </p>
            <div className="modal-footer">
              <button
                className="btn btn-export"
                id="action-cancel-btn"
                style={{ display: "none" }}
                onClick={() => setShowExportSuccessfulModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                id="action-confirm-btn"
                onClick={() => setShowExportSuccessfulModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateMobileNumberSubmitModal && (
        <div
          id="action-modal"
          className="modal customModal"
          style={{ display: "flex" }}
        >
          <div className="modal-content">
            <span
              className="close-btn"
              id="action-close-btn"
              onClick={() => setShowUpdateMobileNumberSubmitModal(false)}
            >
              <i className="fas fa-times"></i>
            </span>
            <h2 id="action-modal-title">Successful!</h2>
            <p id="action-modal-text">
              The GSM ports mobile number has been successfully updated.
            </p>
            <div className="modal-footer">
              <button
                className="btn btn-export"
                id="action-cancel-btn"
                style={{ display: "none" }}
                onClick={() => setShowUpdateMobileNumberSubmitModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                id="action-confirm-btn"
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
        </div>
      )}

      {showUpdateMobileNumberModal && (
        <div
          id="action-modal"
          className="modal customModal"
          style={{ display: "flex" }}
        >
          <div className="modal-content">
            <span
              className="close-btn"
              id="action-close-btn"
              onClick={handleCloseUpdateModal}
            >
              <i className="fas fa-times"></i>
            </span>
            <h2 id="action-modal-title">Update Mobile Number!</h2>

            <div className="form-group mb-3">
              <label htmlFor="mobile_number">Mobile Number</label>
              <input
                type="text"
                className="form-control"
                id="mobile_number"
                placeholder="Enter Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isUpdating) {
                    submitMobileNumberUpdate();
                  }
                }}
                disabled={isUpdating}
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary "
                id="action-cancel-btn"
                onClick={handleCloseUpdateModal}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                id="action-confirm-btn"
                onClick={() => submitMobileNumberUpdate()}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Updating...
                  </>
                ) : (
                  "Update Mobile Number"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

GsmPorts.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmPorts;
