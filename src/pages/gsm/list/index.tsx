import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useEffect, useState, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { ListGsmManagement, updateGsm, deleteGsm } from "@utils/GsmManagement";

import { Column } from "@components/CustomDataTable";
import { Button, Card, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import GsmListFilter from "@components/filters/GsmListFilter";

import "@assets/scss/common.scss";

import { motion } from "framer-motion";
import imgStatus1 from "@assets/images/widget/img-status-1.svg";
import imgStatus2 from "@assets/images/widget/img-status-2.svg";
import imgStatus3 from "@assets/images/widget/img-status-3.svg";
import imgStatus4 from "@assets/images/widget/img-status-4.svg";

import AddGsmModal from "@pages/gsm/partial/AddGsmModal";

import GsmDetailModel from "@pages/gsm/partial/GsmDetailModel";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from "@components/PageSummaryGrid";
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye, FiPlus } from "react-icons/fi";
import { getDashboardData, ViewGsm } from "@utils/GsmAssign";

const GsmList = () => {
  const { data: session, status } = useSession();

  const columns: Column[] = [
    {
      key: "ip_address",
      name: "IP Address",
      selector: (row: any) => row.ip_address,
      sortable: true,
    },
    {
      key: "name",
      name: "Name",
      selector: (row: any) => row.name,
      sortable: true,
    },
    {
      key: "username",
      name: "Username",
      selector: (row: any) => row.username,
      sortable: true,
    },
    {
      key: "device_status",
      name: "Device Status",
      selector: (row: any) => row.device_status,
      sortable: true,
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {row?.device_status ? (
            <>
              <div className="text-gray-700 text-sm font-medium uppercase device-status-container">
                <div
                  className={`device-status-dot ${
                    row.device_status === "power_on"
                      ? "active animate-ping"
                      : ""
                  }`}
                ></div>

                {row?.device_status?.toUpperCase() || "OFFLINE"}
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-lg">---</div>
          )}
        </div>
      ),
    },
    {
      key: "companies",
      name: "Companies",
      selector: (row: any) => row.company_name,
      sortable: true,
    },
    // { key: 'status', name: 'Status', selector: (row: any) => row.status, sortable: true,
    //   cell: (row: any) => (
    //     <span className={`badge ${row.status == "active" ? 'bg-success' : 'bg-danger'}`}>{row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span>
    //   )
    //  },
    {
      key: "Action",
      name: "ACTION",
      selector: (row: any) => row.id,
      sortable: false,
      cell: (props: any) => (
        <DatatableActionButton
          actions={[

            ...(session?.user?.permissions?.includes('edit-gsm-management') ? [
            {
              label: "Edit",
              icon: <FiEdit className="me-2" />,
              onClick: () => handleEditGsm(props),
              className: "action-edit",
            },
            ] : []),

            ...(session?.user?.permissions?.includes('view-gsm-management') ? [
            {
              label: "View",
              icon: <FiEye className="me-2" />,
              onClick: () => setShowGsmDetailsModel(true),
              className: "action-view",
            },
            ] : []),

            ...(session?.user?.permissions?.includes('delete-gsm-management') ? [
            {
              label: "Delete",
              icon: <FiTrash2 className="me-2" />,
              onClick: () => handleDeleteGsm(props),
              className: "action-delete",
            },
            ] : []),
          ]}
        />
      ),
    },
  ];

  const [showAddGsmModal, setShowAddGsmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  // GSM Summary Data
  const [gsmSummary, setGsmSummary] = useState({
    total_gsm: 0,
    assigned_to_company: 0,
    not_assigned_to_company: 0,
    total_port: 0,
  });

  // Create cards data for PageSummaryGrid
  const summaryCards: SummaryCard[] = [
    {
      id: "total-gsms",
      title: "Total GSMs",
      value: gsmSummary.total_gsm,
      description: "Total devices in the system",
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "assigned-gsms",
      title: "Assigned GSMs",
      value: gsmSummary.assigned_to_company,
      description: "GSMs linked to a company",
      delay: 0.3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "unassigned-gsms",
      title: "Unassigned GSMs",
      value: gsmSummary.not_assigned_to_company,
      description: "GSMs awaiting assignment",
      delay: 0.5,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
    {
      id: "total-ports",
      title: "Total Ports",
      value: gsmSummary.total_port,
      description: "Overall port capacity",
      delay: 0.7,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: "style-2",
    },
  ];

  const fetchGsm = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const response = await ListGsmManagement({
        page,
        perPage,
        search,
        filters: currentFilters,
      });

      // Calculate summary data when data is fetched
      if (response && response?.summary) {
        console.log("REDASDA SETTING GSM SUMMARY", response.summary )
        setGsmSummary(response.summary);
      }

      return response;
    },
    [currentFilters]
  );

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  const handleExport = async (
    exportType: string,
    filters: Record<string, any>
  ) => {
    // try {
    //     const response = await ExportCallLogs({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
    //     console.log(response);
    // } catch (error) {
    //     console.error('Export error:', error);
    //     toast.error('Export failed. Please try again.');
    // }
  };

  const [showEditGsmModal, setShowEditGsmModal] = useState(false);
  const [editGsmId, setEditGsmId] = useState("");
  const [editGsmName, setEditGsmName] = useState("");
  const [editGsmIpAddress, setEditGsmIpAddress] = useState("");
  const [editGsmUsername, setEditGsmUsername] = useState("");
  const [editGsmPassword, setEditGsmPassword] = useState("");
  const [editGsmStatus, setEditGsmStatus] = useState("");

  const handleEditGsm = (props: any) => {
    setShowEditGsmModal(true);
    setEditGsmId(props.id);
    setEditGsmName(props.name);
    setEditGsmIpAddress(props.ip_address);
    setEditGsmUsername(props.username);
    setEditGsmPassword(props.password);
    setEditGsmStatus(props.status);
    setShowEditGsmModal(true);
  };

  const handleSubmitEditGsm = async () => {
    if (
      editGsmName == "" ||
      editGsmIpAddress == "" ||
      editGsmUsername == "" ||
      editGsmPassword == ""
    ) {
      toast.error("Please fill all the fields");
      return;
    }

    try {
      const response = await updateGsm(
        editGsmId,
        editGsmName,
        editGsmIpAddress,
        editGsmUsername,
        editGsmPassword,
        editGsmStatus
      );
      if (response) {
        setShowEditGsmModal(false);
        setEditGsmName("");
        setEditGsmIpAddress("");
        setEditGsmUsername("");
        setEditGsmPassword("");
        setEditGsmStatus("");
        setRefreshKey(refreshKey + 1);

        // Show success message
        setSuccessModalTitle("Successfully Updated");
        setSuccessModalDescription(
          "The GSM device has been successfully updated."
        );
        setShowSuccessModal(true);
      } else {
        toast.error("Failed to update GSM device");
      }
    } catch (error) {
      console.error("Error updating GSM:", error);
      toast.error("An error occurred while updating the GSM device");
    }
  };

  const [showDeleteGsmModal, setShowDeleteGsmModal] = useState<boolean>(false);
  const [selectedGsm, setSelectedGsm] = useState<string>("");
  const [selectedGsmName, setSelectedGsmName] = useState<string>("");

  const handleDeleteGsm = (props: any) => {
    setSelectedGsm(props.id);
    setSelectedGsmName(props.name);
    setShowDeleteGsmModal(true);
  };

  const handleSubmitDeleteGsm = async () => {
    try {
      const response = await deleteGsm(selectedGsm);
      if (response) {
        setShowDeleteGsmModal(false);
        setSelectedGsm("");
        setSelectedGsmName("");
        setRefreshKey(refreshKey + 1);

        // Show success message
        setSuccessModalTitle("Successfully Deleted");
        setSuccessModalDescription(
          "The GSM device has been successfully deleted."
        );
        setShowSuccessModal(true);
      } else {
        toast.error("Failed to delete GSM");
      }
    } catch (error) {
      console.error("Error deleting GSM:", error);
      toast.error("An error occurred while deleting the GSM device");
    }
  };

  const [showExportSuccessfulModal, setShowExportSuccessfulModal] =
    useState(false);

  const handleExportSuccessful = async () => {
    setShowExportSuccessfulModal(true);
  };

  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  const [showGsmDetailsModel, setShowGsmDetailsModel] = useState(false);

  return (
    <React.Fragment>
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.3;
          }
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Telco Gateway Management" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5}>
                <h2 className="mb-0">Telco Gateway Management</h2>

                {/* {session?.user?.permissions?.includes('add-gsm-management') && (
                          <Button variant="outline-primary" size="sm" className="ms-3" onClick={() => setShowCreateGsmModal(true)}>New Gsm</Button>
                      )}

                      </h2>
                    </Col>
                    <Col md={7} className="d-flex justify-content-end">
                      <GsmListFilter onFiltersChange={handleFiltersChange} onExport={handleExport} /> */}
              </Col>

              <Col md={7} className="d-flex justify-content-end">
                <div className="action-buttons">
                  
                  {session?.user?.permissions?.includes('list-gsm-management') && (
                  <div className="search-container">
                    <i className="fas fa-search search-icon"></i>
                    <input
                      type="text"
                      className="search-bar"
                      placeholder="Search GSM, Company..."
                      onChange={(e) =>
                        handleFiltersChange({
                          ...currentFilters,
                          search: e.target.value,
                        })
                      }
                    />
                  </div>
                  )}

{session?.user?.permissions?.includes('add-gsm-management') && (
                  <button
                    className="btn btn-primary"
                    id="new-assign-btn"
                    onClick={() => setShowAddGsmModal(true)}
                  >
                    <i className="fas fa-plus"></i> New Assign
                  </button>
                  )}


{session?.user?.permissions?.includes('export-gsm-managements') && (
                  <button
                    className="btn btn-export"
                    id="export-btn"
                    onClick={handleExportSuccessful}
                  >
                    <i className="fas fa-download"></i> Export
                  </button>
                  )}
                </div>
                
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* GSM Summary Cards */}
      <PageSummaryGrid cards={summaryCards} />

      {session?.user?.permissions?.includes("list-gsm-management") && (
        <GenericListPage
          columns={columns}
          fetchData={fetchGsm}
          title="GSM List"
          searchPlaceholder="Search gsm list..."
          defaultPageSize={15}
          filters={currentFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
          onFiltersClick={() => console.log("Filters clicked")}
          onExportClick={handleExportSuccessful}
          onNewClick={() => setShowAddGsmModal(true)}
          filtersText="Filters"
          exportText="Export"
          newText="New GSM"
        />
      )}

      {showEditGsmModal && (
        <Modal
          show={showEditGsmModal}
          onHide={() => setShowEditGsmModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Gsm</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="editGsmName">Gsm Name</label>
              <input
                type="text"
                className="form-control"
                id="editGsmName"
                value={editGsmName}
                onChange={(e) => setEditGsmName(e.target.value)}
                placeholder="Gsm Name"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="editGsmIpAddress">Ip Address</label>
              <input
                type="text"
                className="form-control"
                id="editGsmIpAddress"
                value={editGsmIpAddress}
                onChange={(e) => setEditGsmIpAddress(e.target.value)}
                placeholder="Gsm Ip Address"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="editGsmUsername">Username</label>
              <input
                type="text"
                className="form-control"
                id="editGsmUsername"
                value={editGsmUsername}
                onChange={(e) => setEditGsmUsername(e.target.value)}
                placeholder="Gsm Username"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="editGsmPassword">Password</label>
              <input
                type="password"
                className="form-control"
                id="editGsmPassword"
                value={editGsmPassword}
                onChange={(e) => setEditGsmPassword(e.target.value)}
                placeholder="Gsm Password"
                required
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowEditGsmModal(false)}
            >
              Close
            </Button>
            <Button variant="primary" onClick={() => handleSubmitEditGsm()}>
              Edit
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showDeleteGsmModal && (
        <>
          <ConfirmModal
            show={showDeleteGsmModal}
            onHide={() => setShowDeleteGsmModal(false)}
            title="Delete GSM?"
            description={`Are you sure you want to delete "${selectedGsmName}"? This action cannot be undone.`}
            targetName="this GSM device"
            onConfirm={handleSubmitDeleteGsm}
          />
        </>
      )}

      {showExportSuccessfulModal && (
        <>
          <SuccessfulModal
            show={showExportSuccessfulModal}
            onHide={() => setShowExportSuccessfulModal(false)}
            title="Export Successful!"
            description="The GSM data has been successfully exported as a JSON file."
            confirmButtonText="OK"
          />
        </>
      )}

      {showAddGsmModal && (
        <AddGsmModal
          show={showAddGsmModal}
          onHide={() => setShowAddGsmModal(false)}
          onSuccess={() => {
            setShowAddGsmModal(false);
            setSuccessModalTitle("Successfully Created");
            setSuccessModalDescription(
              "The GSM device has been successfully created."
            );
            setShowSuccessModal(true);
            setRefreshKey(refreshKey + 1);
          }}
        />
      )}

      {showSuccessModal && (
        <SuccessfulModal
          show={showSuccessModal}
          title={successModalTitle}
          description={successModalDescription}
          confirmButtonText="OK"
          onHide={() => setShowSuccessModal(false)}
        />
      )}

      {showGsmDetailsModel && (
        <>
          <GsmDetailModel
            show={showGsmDetailsModel}
            onHide={() => setShowGsmDetailsModel(false)}
            gsmData={{
              id: "GSM001",
              name: "Main GSM",
              status: "Active",
              location: "Building A",
              ports: [1, 2, 3, 5],
              lastSync: "2024-01-15 10:30:00",
              description: "Primary GSM unit for building A",
            }}
            onEdit={(data: any) => console.log("Edit:", data)}
            onDelete={(id: any) => console.log("Delete:", id)}
            showEditButton={true}
            showDeleteButton={true}
          />
        </>
      )}
    </React.Fragment>
  );
};

GsmList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmList;
