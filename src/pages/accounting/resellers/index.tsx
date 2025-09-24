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
import { Button, Modal, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";

const ResellerList = () => {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedReseller, setSelectedReseller] = useState<ResellerData | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    parent_id: null as number | null,
    organization_unit: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Table columns
  const columns: Column[] = useMemo(
    () => [
      {
        key: "id",
        name: "ID",
        selector: (row: any) => row.id,
        sortable: true,
        cell: (props: any) => (
          <span className="fw-bold text-primary">#{props.id}</span>
        ),
      },
      {
        key: "name",
        name: "Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div className="fw-bold">{props.name}</div>
        ),
      },
      {
        key: "parent_id",
        name: "Parent ID",
        selector: (row: any) => row.parent_id,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">{props.parent_id || "N/A"}</span>
        ),
      },
      {
        key: "organization_unit",
        name: "Organization Unit",
        selector: (row: any) => row.organization_unit,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">{props.organization_unit || "N/A"}</span>
        ),
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {moment(props.created_at).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="action-buttons-container">
            <Button
              variant="outline-primary"
              size="sm"
              className="me-1"
              onClick={() => handleEditReseller(props)}
            >
              Edit
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleDeleteReseller(props)}
            >
              Delete
            </Button>
          </div>
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
        search,
      });
    },
    []
  );

  // Reset form data
  const resetFormData = useCallback(() => {
    setFormData({
      name: "",
      parent_id: null,
      organization_unit: "",
    });
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
      toast.success("Reseller created successfully");
      setShowCreateModal(false);
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
    });
    setShowEditModal(true);
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
      toast.success("Reseller updated successfully");
      setShowEditModal(false);
      setSelectedReseller(null);
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
  const handleInputChange = useCallback((field: string, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Accounting"
        mainLink="/accounting/resellers"
        subTitle="Resellers"
      />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Resellers
              <Button
                variant="outline-primary"
                size="sm"
                className="ms-3"
                onClick={openCreateModal}
              >
                New Reseller
              </Button>
            </h2>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchResellers}
        title="Resellers"
        searchPlaceholder="Search resellers..."
        defaultPageSize={15}
        refreshKey={refreshKey}
        search={true}
        filters={filters}
      />

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={closeCreateModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Reseller</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label htmlFor="createName">Name *</label>
                <input
                  type="text" 
                  className="form-control"
                  id="createName"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter reseller name"
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label htmlFor="createParentId">Parent ID</label>
                <input
                  type="number"
                  className="form-control"
                  id="createParentId"
                  value={formData.parent_id || ""}
                  onChange={(e) => handleInputChange("parent_id", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter parent ID (optional)"
                />
              </div>
            </div>
          </div>
          
          <div className="form-group mb-3">
            <label htmlFor="createOrganizationUnit">Organization Unit</label>
            <input
              type="text"
              className="form-control"
              id="createOrganizationUnit"
              value={formData.organization_unit}
              onChange={(e) => handleInputChange("organization_unit", e.target.value)}
              placeholder="Enter organization unit (optional)"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeCreateModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateReseller}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Reseller"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={closeEditModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Reseller #{selectedReseller?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label htmlFor="editName">Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="editName"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter reseller name"
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label htmlFor="editParentId">Parent ID</label>
                <input
                  type="number"
                  className="form-control"
                  id="editParentId"
                  value={formData.parent_id || ""}
                  onChange={(e) => handleInputChange("parent_id", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter parent ID (optional)"
                />
              </div>
            </div>
          </div>
          
          <div className="form-group mb-3">
            <label htmlFor="editOrganizationUnit">Organization Unit</label>
            <input
              type="text"
              className="form-control"
              id="editOrganizationUnit"
              value={formData.organization_unit}
              onChange={(e) => handleInputChange("organization_unit", e.target.value)}
              placeholder="Enter organization unit (optional)"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeEditModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateReseller}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Reseller"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={closeDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Reseller</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the reseller{" "}
            <strong className="text-danger">{selectedReseller?.name}</strong>?
          </p>
          <p className="text-muted">
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Reseller"}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

ResellerList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ResellerList;
