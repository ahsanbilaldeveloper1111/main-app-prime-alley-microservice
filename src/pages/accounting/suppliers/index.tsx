import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  getInventorySuppliers,
  createInventorySupplier,
  updateInventorySupplier,
  deleteInventorySupplier,
  getInventorySupplier,
  InventorySupplierData,
  InventorySupplierCreateUpdatePayload,
} from "@utils/accounting";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import "@assets/scss/gsm-assign.scss";
import "@assets/scss/dashboard-card.scss";
import "@assets/scss/common.scss";

const SupplierList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  // Supplier Management
  const [selectedSupplier, setSelectedSupplier] = useState<InventorySupplierData | null>(null);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState<boolean>(false);
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<boolean>(false);
  const [creatingSupplier, setCreatingSupplier] = useState<boolean>(false);
  const [showDeleteSupplierModal, setShowDeleteSupplierModal] = useState<boolean>(false);
  const [confirmDeleteSupplier, setConfirmDeleteSupplier] = useState<string>("");

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row: InventorySupplierData) => row.name,
        sortable: true,
        cell: (props: InventorySupplierData) => (
          <div>
            <div className="fw-bold text-primary">{props.name}</div>
            {props.contact_person && (
              <div className="text-muted small">Contact: {props.contact_person}</div>
            )}
          </div>
        ),
      },
      {
        key: "email",
        name: "Email",
        selector: (row: InventorySupplierData) => row.email,
        sortable: true,
        cell: (props: InventorySupplierData) => (
          <span className="text-muted">
            {props.email || "No email"}
          </span>
        ),
      },
      {
        key: "phone",
        name: "Phone",
        selector: (row: InventorySupplierData) => row.phone,
        sortable: true,
        cell: (props: InventorySupplierData) => (
          <span className="text-muted">
            {props.phone || "No phone"}
          </span>
        ),
      },
      {
        key: "address",
        name: "Address",
        selector: (row: InventorySupplierData) => row.address,
        sortable: true,
        cell: (props: InventorySupplierData) => (
          <div className="text-muted small">
            {props.address ? (
              <div>
                <div>{props.address}</div>
                {props.city && <div>{props.city}</div>}
                {props.state && <div>{props.state}</div>}
                {props.zip_code && <div>{props.zip_code}</div>}
                {props.country && <div>{props.country}</div>}
              </div>
            ) : (
              "No address"
            )}
          </div>
        ),
      },
      {
        key: "is_active",
        name: "Status",
        selector: (row: InventorySupplierData) => row.is_active,
        sortable: true,
        cell: (props: InventorySupplierData) => (
          <span
            className={`status-badge ${
              props.is_active ? "success" : "danger"
            }`}
          >
            {props.is_active ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: InventorySupplierData) => row.created_at,
        sortable: true,
        cell: (props: InventorySupplierData) => (
          <span className="text-muted">
            {moment(props.created_at).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: InventorySupplierData) => row.id,
        sortable: false,
        cell: (props: InventorySupplierData) => (
          <div className="action-buttons-container">
            <button
              className="btn btn-sm btn-outline-primary me-1"
              onClick={() => handleEditSupplier(props)}
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteSupplier(props)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [session?.user?.permissions]
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchSuppliers = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await getInventorySuppliers({
          page,
          per_page: perPage,
          search,
          ...memoizedFilters,
        });

        return {
          data: response.data,
          total: response.pagination.total,
          page: response.pagination.current_page,
          per_page: response.pagination.per_page,
          last_page: response.pagination.last_page,
        };
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        throw error;
      }
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  // Edit Supplier Modal
  const handleEditSupplier = useCallback((props: InventorySupplierData) => {
    setSelectedSupplier(props);
    setShowEditSupplierModal(true);
  }, []);

  const handleSubmitEditSupplier = useCallback(async () => {
    if (!selectedSupplier) return;

    if (!selectedSupplier.name) {
      toast.error("Please enter a supplier name");
      return;
    }

    setEditingSupplier(true);
    try {
      const supplierData: InventorySupplierCreateUpdatePayload = {
        name: selectedSupplier.name,
        email: selectedSupplier.email || "",
        phone: selectedSupplier.phone || "",
        address: selectedSupplier.address || "",
        is_active: selectedSupplier.is_active ?? true,
      };

      const response = await updateInventorySupplier(selectedSupplier.id, supplierData);

      if (response) {
        setSelectedSupplier(null);
        setShowEditSupplierModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Supplier updated successfully");
      }
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast.error("Failed to update supplier");
    } finally {
      setEditingSupplier(false);
    }
  }, [selectedSupplier]);

  // Create Supplier Modal
  const [newSupplier, setNewSupplier] = useState<InventorySupplierCreateUpdatePayload>({
    name: "",
    email: "",
    phone: "",
    address: "",
    is_active: true,
  });

  const handleSubmitCreateSupplier = useCallback(async () => {
    if (!newSupplier.name) {
      toast.error("Please enter a supplier name");
      return;
    }

    setCreatingSupplier(true);
    try {
      const response = await createInventorySupplier(newSupplier);

      if (response) {
        setNewSupplier({
          name: "",
          email: "",
          phone: "",
          address: "",
          is_active: true,
        });
        setShowCreateSupplierModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Supplier created successfully");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      toast.error("Failed to create supplier");
    } finally {
      setCreatingSupplier(false);
    }
  }, [newSupplier]);

  // Modal handlers
  const openCreateSupplierModal = useCallback(
    () => setShowCreateSupplierModal(true),
    []
  );
  const closeCreateSupplierModal = useCallback(() => {
    setShowCreateSupplierModal(false);
    setNewSupplier({
      name: "",
      email: "",
      phone: "",
      address: "",
      is_active: true,
    });
  }, []);

  const closeEditSupplierModal = useCallback(() => {
    setShowEditSupplierModal(false);
    setSelectedSupplier(null);
  }, []);

  // Input handlers
  const handleNewSupplierChange = useCallback(
    (field: keyof InventorySupplierCreateUpdatePayload, value: any) => {
      setNewSupplier((prev: InventorySupplierCreateUpdatePayload) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleEditSupplierChange = useCallback(
    (field: keyof InventorySupplierData, value: any) => {
      setSelectedSupplier((prev: InventorySupplierData | null) => ({
        ...prev!,
        [field]: value,
      }));
    },
    []
  );
  
  // Supplier Delete Handlers
  const handleDeleteSupplier = useCallback((props: InventorySupplierData) => {
    setSelectedSupplier(props);
    setShowDeleteSupplierModal(true);
  }, []);

  const handleSubmitDeleteSupplier = useCallback(async () => {
    if (!selectedSupplier) return;

    const confirmDeleteValue = confirmDeleteSupplier.trim();
    if (confirmDeleteValue === "DELETE") {
      try {
        await deleteInventorySupplier(selectedSupplier.id);
        setSelectedSupplier(null);
        setShowDeleteSupplierModal(false);
        setConfirmDeleteSupplier("");
        setRefreshKey((prev) => prev + 1);
        toast.success("Supplier deleted successfully");
      } catch (error) {
        console.error("Error deleting supplier:", error);
        toast.error("Failed to delete supplier");
      }
    } else {
      toast.error("Please type the word DELETE to confirm");
    }
  }, [confirmDeleteSupplier, selectedSupplier]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Suppliers" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">Suppliers</h2>
              </Col>

              <Col md={8} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateSupplierModal}
                  >
                    New Supplier
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchSuppliers}
        title="Suppliers"
        searchPlaceholder="Search suppliers..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={true}
        tableStyle="table-style-2"
      />

      {/* Create Supplier Modal */}
      {showCreateSupplierModal && (
        <Modal
          show={showCreateSupplierModal}
          onHide={closeCreateSupplierModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Supplier</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newSupplierName">Supplier Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newSupplierName"
                    value={newSupplier.name}
                    onChange={(e) =>
                      handleNewSupplierChange("name", e.target.value)
                    }
                    placeholder="Enter supplier name"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newSupplierEmail">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="newSupplierEmail"
                    value={newSupplier.email}
                    onChange={(e) =>
                      handleNewSupplierChange("email", e.target.value)
                    }
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newSupplierPhone">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="newSupplierPhone"
                    value={newSupplier.phone}
                    onChange={(e) =>
                      handleNewSupplierChange("phone", e.target.value)
                    }
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newSupplierStatus">Status</label>
                  <select
                    className="form-control"
                    id="newSupplierStatus"
                    value={newSupplier.is_active ? "active" : "inactive"}
                    onChange={(e) =>
                      handleNewSupplierChange("is_active", e.target.value === "active")
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newSupplierAddress">Address</label>
                  <textarea
                    className="form-control"
                    id="newSupplierAddress"
                    value={newSupplier.address}
                    onChange={(e) =>
                      handleNewSupplierChange("address", e.target.value)
                    }
                    rows={3}
                    placeholder="Enter address..."
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeCreateSupplierModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitCreateSupplier}
              disabled={creatingSupplier}
            >
              {creatingSupplier ? "Creating..." : "Create Supplier"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplierModal && selectedSupplier && (
        <Modal
          show={showEditSupplierModal}
          onHide={closeEditSupplierModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Edit Supplier: {selectedSupplier.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editSupplierName">Supplier Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editSupplierName"
                    value={selectedSupplier.name || ""}
                    onChange={(e) =>
                      handleEditSupplierChange("name", e.target.value)
                    }
                    placeholder="Enter supplier name"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editSupplierEmail">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="editSupplierEmail"
                    value={selectedSupplier.email || ""}
                    onChange={(e) =>
                      handleEditSupplierChange("email", e.target.value)
                    }
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editSupplierPhone">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="editSupplierPhone"
                    value={selectedSupplier.phone || ""}
                    onChange={(e) =>
                      handleEditSupplierChange("phone", e.target.value)
                    }
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editSupplierStatus">Status</label>
                  <select
                    className="form-control"
                    id="editSupplierStatus"
                    value={selectedSupplier.is_active ? "active" : "inactive"}
                    onChange={(e) =>
                      handleEditSupplierChange("is_active", e.target.value === "active")
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="editSupplierAddress">Address</label>
                  <textarea
                    className="form-control"
                    id="editSupplierAddress"
                    value={selectedSupplier.address || ""}
                    onChange={(e) =>
                      handleEditSupplierChange("address", e.target.value)
                    }
                    rows={3}
                    placeholder="Enter address..."
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditSupplierModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitEditSupplier}
              disabled={editingSupplier}
            >
              {editingSupplier ? "Updating..." : "Update Supplier"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Supplier Modal */}
      {showDeleteSupplierModal && selectedSupplier && (
        <Modal
          show={showDeleteSupplierModal}
          onHide={() => setShowDeleteSupplierModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Supplier?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete supplier{" "}
              <b className="text-danger">{selectedSupplier.name}</b>?
            </p>
            <p>
              This action cannot be undone.
            </p>
            <p>
              Type the word <b className="text-danger">DELETE</b> to confirm
            </p>
            <input
              type="text"
              className="form-control"
              id="confirmDeleteSupplier"
              value={confirmDeleteSupplier}
              onChange={(e) => setConfirmDeleteSupplier(e.target.value)}
              placeholder="Type the word DELETE to confirm"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteSupplierModal(false)}
            >
              Close
            </Button>
            <Button variant="danger" onClick={handleSubmitDeleteSupplier}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </React.Fragment>
  );
};

SupplierList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SupplierList;
