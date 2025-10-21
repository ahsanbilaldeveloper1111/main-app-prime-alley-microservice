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

import {
  getResellers,
  createReseller,
  updateReseller,
  deleteReseller,
  ResellerData,
} from "@utils/accounting";
import { Column } from "@components/CustomDataTable";
import {
  Button,
  Modal,
  Row,
  Col,
  DropdownItem,
  DropdownMenu,
  Dropdown,
  DropdownToggle,
  Card,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";


import { FiMoreVertical } from "react-icons/fi";
import { Link } from "feather-icons-react";
import moment from "moment";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
import EmptyState from "@components/EmptyState";

interface Summary {
  total_resellers: number;
  total_resellers_companies: number;
  total_revenue: number;
  total_active: number;
  total_inactive: number;
}

const ResellerList = () => {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedReseller, setSelectedReseller] = useState<ResellerData | null>(
    null
  );

  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [showExportSuccessfulModal, setShowExportSuccessfulModal] =
    useState(false);

  const [summary, setSummary] = useState<Summary>({
    total_resellers: 0,
    total_resellers_companies: 0,
    total_revenue: 0,
    total_active: 0,
    total_inactive: 0,
  });
  const summaryCards: SummaryCard[] = [
    {
      id: "total-resellers",
      title: "Total Resellers",
      value: summary?.total_resellers || 0,
      description: "Total resellers in the system",
    },
    {
      id: "total-resellers-companies",
      title: "Resellers Companies",
      value: summary?.total_resellers_companies || 0,
      description: "Resellers companies in the system",
    },
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: summary?.total_revenue || 0,
      description: "Total revenue in the system",
      suffix: "USD",
      valueType: "currency",
    },
    {
      id: "total-active",
      title: "Total Active",
      value: summary?.total_active || 0,
      description: "Total active resellers in the system",
    },
  ];

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    parent_id: null as number | null,
    organization_unit: "",
    phone: "",
    email: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true);
  const [currentFilters, setCurrentFilters] = useState<{ search?: string }>({
    search: "",
  });

  // Table columns
  const columns: Column[] = useMemo(
    () => [
      // {
      //   key: "id",
      //   name: "ID",
      //   selector: (row: any) => row.id,
      //   sortable: true,
      //   cell: (props: any) => (
      //     <span className="fw-bold text-primary">#{props.id}</span>
      //   ),
      // },
      {
        key: "name",
        name: "Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => <div className="">{props.name}</div>,
      },
      {
        key: "phone",
        name: "Phone",
        selector: (row: any) => row.phone,
        sortable: true,
        cell: (props: any) => <div className="">{props.phone || "-"}</div>,
      },
      {
        key: "email",
        name: "Email",
        selector: (row: any) => row.email,
        sortable: true,
        cell: (props: any) => <div className="">{props.email || "-"}</div>,
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {moment(props.created_at).format("YYYY-MM-DD ")}
          </span>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <DatatableActionButton
            actions={[
              {
                label: 'Edit',
                icon: <FiEdit />,
                onClick: () => handleEditReseller(props),
                className: 'gap-2'
              },
              {
                label: 'View As Reseller',
                icon: <FiEye />,
                onClick: () => handleViewAsReseller(props),
                className: 'gap-2'
              },
              {
                label: 'Delete',
                icon: <FiTrash2 />,
                onClick: () => handleDeleteReseller(props),
                className: 'text-danger gap-2'
              }
            ]}
          />
        ),
      },
    ],
    []
  );

  const filters = useMemo(() => ({}), []);

  // Fetch resellers function
  const fetchResellers = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await getResellers({
        page,
        per_page: perPage,
        search:currentFilters.search,
      });
    },
    [currentFilters.search]
  );

  // Reset form data
  const resetFormData = useCallback(() => {
    setFormData({
      name: "",
      parent_id: null,
      organization_unit: "",
      phone: "",
      email: "",
    });
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback((filters: any) => {
    //console.log('Filters changed:', filters);
    setCurrentFilters(filters);
  }, []);

  // Handle create reseller
  const handleCreateReseller = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a reseller name");
      return;
    }

    setIsLoading(true);
    try {
      await createReseller(formData);
      // toast.success("Reseller created successfully");
      setShowCreateModal(false);
      setSuccessModalTitle("Successfully Created");
      setSuccessModalDescription(
        "The reseller data has been successfully created."
      );
      setShowExportSuccessfulModal(true);
      resetFormData();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error creating reseller:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, resetFormData]);

  // Handle edit reseller
  const handleEditReseller = useCallback((reseller: ResellerData) => {
    setSelectedReseller(reseller);
    setFormData({
      name: reseller.name,
      parent_id: reseller.parent_id,
      organization_unit: reseller.organization_unit || "",
      phone: reseller.phone || "",
      email: reseller.email || "",
    });
    setShowEditModal(true);
  }, []);

  // Handle view as reseller
  const [showViewAsResellerModal, setShowViewAsResellerModal] =
    useState<boolean>(false);
  const handleViewAsReseller = useCallback((reseller: ResellerData) => {
    setSelectedReseller(reseller);
    setShowViewAsResellerModal(true);
  }, []);

  // Handle update reseller
  const handleUpdateReseller = useCallback(async () => {
    if (!selectedReseller) return;

    if (!formData.name.trim()) {
      toast.error("Please enter a reseller name");
      return;
    }

    setIsLoading(true);
    try {
      await updateReseller(selectedReseller.id, formData);
      //toast.success("Reseller updated successfully");
      setShowEditModal(false);
      setSelectedReseller(null);
      setSuccessModalTitle("Successfully Updated");
      setSuccessModalDescription(
        "The reseller data has been successfully updated."
      );
      setShowExportSuccessfulModal(true);
      resetFormData();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating reseller:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedReseller, formData, resetFormData]);

  // Handle delete reseller
  const handleDeleteReseller = useCallback((reseller: ResellerData) => {
    setSelectedReseller(reseller);
    setShowDeleteModal(true);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedReseller) return;

    setIsLoading(true);
    try {
      await deleteReseller(selectedReseller.id);
      toast.success("Reseller deleted successfully");
      setShowDeleteModal(false);
      setSelectedReseller(null);
      setSuccessModalTitle("Successfully Deleted");
      setSuccessModalDescription(
        "The reseller data has been successfully deleted."
      );
      setShowExportSuccessfulModal(true);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting reseller:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedReseller]);

  // Modal handlers
  const openCreateModal = useCallback(() => {
    resetFormData();
    setShowCreateModal(true);
  }, [resetFormData]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    resetFormData();
  }, [resetFormData]);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedReseller(null);
    resetFormData();
  }, [resetFormData]);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedReseller(null);
  }, []);

  // Form input handlers
  const handleInputChange = useCallback(
    (field: string, value: string | number | null) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const [chartVisible, setChartVisible] = React.useState(false);

  useEffect(() => {
    // Start with both states false
    setIsChartLoading(true);
    setChartVisible(false);

    // After a brief delay, show the chart and hide loading
    const timer = setTimeout(() => {
      setChartVisible(true);
      setIsChartLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const [trendsChart, setTrendsChart] = React.useState<{
    series: { name: string; data: number[] }[];
    options: ApexOptions;
  }>({
    series: [
      {
        name: "Usage & Revenue Trends",
        data: [100, 300, 100, 400, 500, 600, 700, 500, 900, 200, 600, 100],
      },
    ],
    options: {
      chart: {
        type: "area",
        height: 350,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
      },

      xaxis: {
        categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
      },
      yaxis: {
        opposite: false,
      },
      legend: {
        horizontalAlign: "left",
      },
    },
  });

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Accounting"
        mainLink="/accounting/resellers"
        subTitle="Resellers"
      />

      <PageHeader
        title="Resellers"
        showSearch={true}
        searchPlaceholder="Search reseller..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) =>
          handleFiltersChange({ ...currentFilters, search: value })
        }
        buttons={
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            New Reseller
          </Button>
        }
      />

      <PageSummaryGrid cards={summaryCards} />

      <Card>
        <Card.Body>
          <div style={{ position: "relative", minHeight: "350px" }}>
            {isChartLoading && (
              <div
                style={{ position: "absolute", width: "100%", height: "100%" }}
              >
                <EmptyState
                  title="Loading..."
                  description="Loading usage and revenue trends..."
                  className="table-empty-state"
                />
              </div>
            )}
            <div
              style={{
                opacity: chartVisible ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            >
              <h5 className="app-title-heading">Usage & Revenue Trends</h5>
              <ReactApexChart
                options={trendsChart.options}
                series={trendsChart.series}
                type="area"
                height={350}
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      <GenericListPage
        columns={columns}
        fetchData={fetchResellers}
        title="Resellers"
        searchPlaceholder="Search resellers..."
        defaultPageSize={15}
        refreshKey={refreshKey}
        search={false}
        filters={filters}
        tableStyle="table-style-2"
      />

      {showCreateModal && (
        <FormModal
          show={showCreateModal}
          onHide={() => closeCreateModal()}
          title="Create New Reseller"
          desc="Please fill in the details below to create a new reseller."
          formHtml={
            <>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label htmlFor="createName" className="mb-0">
                      Reseller Name *
                    </label>
                    <p className="text-muted mb-3">
                      Enter the full name of the reseller
                    </p>
                    <input
                      type="text"
                      className="form-control"
                      id="createName"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter reseller name"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="createPhone" className="mb-0">
                      Phone
                    </label>
                    <p className="text-muted mb-3">
                      Enter the phone number
                    </p>
                    <input
                      type="text"
                      className="form-control"
                      id="createPhone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Enter phone number"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="createEmail" className="mb-0">
                      Email
                    </label>
                    <p className="text-muted mb-3">
                      Enter the email address
                    </p>
                    <input
                      type="email"
                      className="form-control"
                      id="createEmail"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter email address"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </>
          }
          submitButtonText={isLoading ? "Creating..." : "Submit"}
          cancelButtonText="Cancel"
          onSubmit={handleCreateReseller}
        />
      )}

      {showEditModal && (
        <FormModal
          show={showEditModal}
          onHide={() => closeEditModal()}
          title={`Edit Reseller #${selectedReseller?.id}`}
          desc="Please fill in the details below to edit the reseller."
          formHtml={
            <>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label htmlFor="editName" className="mb-0">
                      Reseller Name *
                    </label>
                    <p className="text-muted mb-3">
                      Enter the full name of the reseller
                    </p>
                    <input
                      type="text"
                      className="form-control"
                      id="editName"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter reseller name"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editPhone" className="mb-0">
                      Phone
                    </label>
                    <p className="text-muted mb-3">
                      Enter the phone number
                    </p>
                    <input
                      type="text"
                      className="form-control"
                      id="editPhone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Enter phone number"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editEmail" className="mb-0">
                      Email
                    </label>
                    <p className="text-muted mb-3">
                      Enter the email address
                    </p>
                    <input
                      type="email"
                      className="form-control"
                      id="editEmail"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter email address"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </>
          }
          submitButtonText={isLoading ? "Updating..." : "Submit"}
          cancelButtonText="Cancel"
          onSubmit={handleUpdateReseller}
        />
      )}

      {showViewAsResellerModal && (
        <FormModal
          show={showViewAsResellerModal}
          onHide={() => setShowViewAsResellerModal(false)}
          title={`View As Reseller #${selectedReseller?.id}`}
          desc="Your form description"
          formHtml={
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Reseller Name</th>
                  <th>Reseller ID</th>
                  <th>Reseller Organization Unit</th>
                  <th>Phone</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedReseller?.name}</td>
                  <td>{selectedReseller?.parent_id}</td>
                  <td>{selectedReseller?.organization_unit}</td>
                  <td>{selectedReseller?.phone || "-"}</td>
                  <td>{selectedReseller?.email || "-"}</td>
                </tr>
              </tbody>
            </table>
          }
          submitButtonText="Submit"
          cancelButtonText="Cancel"
          onSubmit={() => setShowViewAsResellerModal(false)}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          show={showDeleteModal}
          onHide={closeDeleteModal}
          title="Delete Reseller"
          description="Are you sure you want to delete this reseller?"
          targetName={selectedReseller?.name || ""}
          onConfirm={handleConfirmDelete}
        />
      )}

      {showExportSuccessfulModal && (
        <SuccessfulModal
          show={showExportSuccessfulModal}
          onHide={() => setShowExportSuccessfulModal(false)}
          title={successModalTitle}
          description={successModalDescription}
        />
      )}
    </React.Fragment>
  );
};

ResellerList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ResellerList;
