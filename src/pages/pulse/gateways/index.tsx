import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useEffect, useState, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn, ToolbarConfig } from "@components/GenericTable";
import { ListGsmManagement, updateGsm, deleteGsm } from "@utils/GsmManagement";

import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import { Button, Modal, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";

import AddGsmModal from "@pages/gsm/partial/AddGsmModal";

import GsmDetailModel from "@pages/gsm/partial/GsmDetailModel";

import "@assets/scss/tabs.scss";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from "@components/PageSummaryGrid";

// Mapped GSM table row interface
interface GsmTableRow {
  id: string;
  ipAddress: string;
  name: string;
  username: string;
  deviceStatus: string;
  companyName: string;
}

interface GsmApiCompany {
  name?: string;
}

interface GsmApiRecord {
  id?: string | number;
  ID?: string | number;
  ip_address?: string;
  ipAddress?: string;
  IP?: string;
  name?: string;
  Name?: string;
  username?: string;
  Username?: string;
  device_status?: string;
  deviceStatus?: string;
  status?: string;
  company_name?: string;
  companyName?: string;
  company?: string;
  companies?: GsmApiCompany[];
}

function mapGsmRow(item: GsmApiRecord, idx: number): GsmTableRow {
  const companyName =
    item.company_name ||
    item.companyName ||
    item.company ||
    (item.companies && item.companies.length > 0 ? item.companies[0].name : "") ||
    "";

  return {
    id: String(item.id ?? item.ID ?? idx),
    ipAddress: item.ip_address || item.ipAddress || item.IP || "",
    name: item.name || item.Name || "",
    username: item.username || item.Username || "",
    deviceStatus: item.device_status || item.deviceStatus || item.status || "",
    companyName,
  };
}

const GsmList = () => {
  const { data: session } = useSession();

  // Table state
  const [tableData, setTableData] = useState<GsmTableRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal and filter state
  const [showAddGsmModal, setShowAddGsmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const currentFilters: Record<string, unknown> = {};


  // Table columns definition
  const gsmColumns = useMemo<TableColumn<GsmTableRow>[]>(() => {
    const columns: TableColumn<GsmTableRow>[] = [
      {
        key: "ipAddress",
        label: "IP ADDRESS",
        type: "text",
        sortable: true,
        render: (row: GsmTableRow) => row.ipAddress || "---",
      },
      {
        key: "name",
        label: "NAME",
        type: "text",
        sortable: true,
        render: (row: GsmTableRow) => row.name || "---",
      },
      {
        key: "username",
        label: "USERNAME",
        type: "text",
        sortable: true,
        render: (row: GsmTableRow) => row.username || "---",
      },
      {
        key: "deviceStatus",
        label: "DEVICE STATUS",
        type: "custom",
        sortable: true,
        render: (row: GsmTableRow) => (
          <div className="flex items-center gap-2">
            {row.deviceStatus ? (
              <div className="text-gray-700 text-sm font-medium uppercase device-status-container">
                <div
                  className={`device-status-dot ${
                    row.deviceStatus === "power_on" ? "active animate-ping" : ""
                  }`}
                ></div>
                {row.deviceStatus.toUpperCase() || "OFFLINE"}
              </div>
            ) : (
              <div className="text-gray-400 text-lg">---</div>
            )}
          </div>
        ),
      },
      {
        key: "companyName",
        label: "COMPANIES",
        type: "text",
        sortable: true,
        render: (row: GsmTableRow) => row.companyName || "---",
      },
    ];

    return columns;
  }, []);

  // Toolbar configuration
  const toolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchQuery,
      searchPlaceholder: "Search GSM, Company...",
      onSearchChange: setSearchQuery,
      onSearch: () => {},
      showFilterPills: false,
      showExportButton: false,
      showFiltersButton: false,
      showSortButton: false,
      showEditColumns: false,
      customActions: (
        <div className="d-flex gap-2">
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
      ),
    }),
    [searchQuery, session?.user?.permissions],
  );

  // Fetch GSM data - follows GenericListPage pattern
  const fetchGsmData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      setLoading(true);
      try {
        const response = await ListGsmManagement({
          page,
          perPage,
          search,
          filters: currentFilters,
        });

        if (response?.data) {
          // Primary response structure: response.data contains the array
          const dataArray = Array.isArray(response.data) ? (response.data as GsmApiRecord[]) : [];
          const mappedData: GsmTableRow[] = dataArray.map((item, idx) => mapGsmRow(item, idx));
          setTableData(mappedData);
          
          // Extract pagination metadata following API response structure
          // Expected: response.total, response.last_page, response.current_page, response.per_page
          const totalRecordsCount = response.total || response.metadata?.total_records || mappedData.length;
          setTotalRecords(totalRecordsCount);

          // Calculate summary data when data is fetched
          if (response?.summary) {
            setGsmSummary(response.summary);
          }
        } else {
          // Fallback: API might return array directly or in dataList/records properties
          const dataArray = Array.isArray(response)
            ? (response as GsmApiRecord[])
            : ((response?.dataList || response?.records || []) as GsmApiRecord[]);
          
          // Map fallback data to GsmTableRow format
          if (dataArray.length > 0 && dataArray[0]?.id !== undefined) {
            const mappedFallbackData: GsmTableRow[] = dataArray.map((item, idx) => mapGsmRow(item, idx));
            setTableData(mappedFallbackData);
            setTotalRecords(mappedFallbackData?.length || 0);
          } else {
            const mappedFallbackData: GsmTableRow[] = dataArray.map((item, idx) => mapGsmRow(item, idx));
            setTableData(mappedFallbackData);
            setTotalRecords(mappedFallbackData.length);
          }
        }
      } catch (err) {
        console.error("Error fetching GSM data:", err);
        toast.error("Failed to load GSM data");
        setTableData([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Handle pagination change callback
  const handlePaginationChange = (page: number, rowsPerPage: number) => {
    setCurrentPage(page);
    if (rowsPerPage !== recordsPerPage) {
      setRecordsPerPage(rowsPerPage);
    }
    // fetchGsmData will be called by useEffect when state updates
  };

  // Fetch data on mount and when pagination/search/filters change
  useEffect(() => {
    fetchGsmData(currentPage, recordsPerPage, searchQuery);
  }, [currentPage, recordsPerPage, searchQuery, fetchGsmData]);

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

  const [showEditGsmModal, setShowEditGsmModal] = useState(false);
  const [editGsmId, setEditGsmId] = useState("");
  const [editGsmName, setEditGsmName] = useState("");
  const [editGsmIpAddress, setEditGsmIpAddress] = useState("");
  const [editGsmUsername, setEditGsmUsername] = useState("");
  const [editGsmPassword, setEditGsmPassword] = useState("");
  const [editGsmStatus, setEditGsmStatus] = useState("");

  const handleEditGsm = (row: GsmTableRow) => {
    setShowEditGsmModal(true);
    setEditGsmId(row.id);
    setEditGsmName(row.name);
    setEditGsmIpAddress(row.ipAddress);
    setEditGsmUsername(row.username);
    setEditGsmPassword("");
    setEditGsmStatus("");
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

        // Show success message
        setSuccessModalTitle("Successfully Updated");
        setSuccessModalDescription(
          "The GSM device has been successfully updated."
        );
        setShowSuccessModal(true);

        // Refresh table data
        setCurrentPage(1);
        fetchGsmData(1, recordsPerPage, searchQuery);
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

  const handleDeleteGsm = (row: GsmTableRow) => {
    setSelectedGsm(row.id);
    setSelectedGsmName(row.name);
    setShowDeleteGsmModal(true);
  };

  const handleSubmitDeleteGsm = async () => {
    try {
      const response = await deleteGsm(selectedGsm);
      if (response) {
        setShowDeleteGsmModal(false);
        setSelectedGsm("");
        setSelectedGsmName("");

        // Show success message
        setSuccessModalTitle("Successfully Deleted");
        setSuccessModalDescription(
          "The GSM device has been successfully deleted."
        );
        setShowSuccessModal(true);

        // Refresh table data
        setCurrentPage(1);
        fetchGsmData(1, recordsPerPage, searchQuery);
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

              </Col>

              <Col md={7} className="d-flex justify-content-end">
                {/* Search and action buttons are now in GenericTable toolbar */}
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* GSM Summary Cards */}
      <PageSummaryGrid cards={summaryCards} />

      {session?.user?.permissions?.includes("list-gsm-management") && (
        <GenericTable<GsmTableRow>
          data={tableData}
          columns={gsmColumns}
          uniqueKey="id"
          loading={loading}
          loadingMessage="Loading GSM devices..."
          emptyMessage="No GSM devices found. Click 'New Assign' to add one."
          showToolbar={true}
          toolbar={toolbarConfig}
          showActions={true}
          actionsLabel="Actions"
          customizableColumns={false}
          showToolbarActions={false}
          pagination={{
            currentPage,
            rowsPerPage: recordsPerPage,
            totalRows: totalRecords,
            pageSizeOptions: [10, 15, 25, 50],
          }}
          onPaginationChange={handlePaginationChange}
          actions={[
            ...(session?.user?.permissions?.includes('edit-gsm-management') ? [
              {
                label: "Edit",
                icon: <FiEdit className="me-2" />,
                onClick: (row: GsmTableRow) => handleEditGsm(row),
                className: "action-edit",
              },
            ] : []),
            ...(session?.user?.permissions?.includes('view-gsm-management') ? [
              {
                label: "View",
                icon: <FiEye className="me-2" />,
                onClick: (row: GsmTableRow) => {
                  setShowGsmDetailsModel(true);
                },
                className: "action-view",
              },
            ] : []),
            ...(session?.user?.permissions?.includes('delete-gsm-management') ? [
              {
                label: "Delete",
                icon: <FiTrash2 className="me-2" />,
                onClick: (row: GsmTableRow) => handleDeleteGsm(row),
                className: "action-delete",
              },
            ] : []),
          ]}
          hover={true}
          striped={false}
          size="md"
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
        <ConfirmModal
          show={showDeleteGsmModal}
          onHide={() => setShowDeleteGsmModal(false)}
          title="Delete GSM?"
          description={`Are you sure you want to delete "${selectedGsmName}"? This action cannot be undone.`}
          targetName="this GSM device"
          onConfirm={handleSubmitDeleteGsm}
        />
      )}

      {showExportSuccessfulModal && (
        <SuccessfulModal
          show={showExportSuccessfulModal}
          onHide={() => setShowExportSuccessfulModal(false)}
          title="Export Successful!"
          description="The GSM data has been successfully exported as a JSON file."
          confirmButtonText="OK"
        />
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
            // Refresh table data
            setCurrentPage(1);
            fetchGsmData(1, recordsPerPage, searchQuery);
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
          onEdit={() => {}}
          onDelete={() => {}}
          showEditButton={true}
          showDeleteButton={true}
        />
      )}
    </React.Fragment>
  );
};

GsmList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmList;
