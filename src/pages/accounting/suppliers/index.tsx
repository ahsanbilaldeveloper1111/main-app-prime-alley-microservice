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

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";

import TableAction from "@components/TableAction";
const SupplierList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<{search?: string}>({});

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
            <div>{props.name}</div>
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
          <span>
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
          <span>
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
          <div>
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
          <>  
          <DatatableActionButton
                    actions={[
                      ...(session?.user?.permissions?.includes('edit-suppliers-billing') ? [
                        {
                            label: 'Edit',
                            icon: <FiEdit />,
                            onClick: () => handleEditSupplier(props),
                            className: 'gap-2'
                        },
                        ] : []),

                      ...(session?.user?.permissions?.includes('delete-suppliers-billing') ? [
                        {
                            label: 'Delete',
                            icon: <FiTrash2 />,
                            onClick: () => handleDeleteSupplier(props),
                            className: 'text-danger gap-2'
                        },
                        ] : []),
                    ]}

                />
          </>

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
  }, [confirmDeleteSupplier, selectedSupplier]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Suppliers" />

      <PageHeader
        title="Suppliers"
        showSearch={session?.user?.permissions?.includes('list-suppliers-billing')}
        searchPlaceholder="Search suppliers..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
        buttons={
          <>
          {session?.user?.permissions?.includes('add-suppliers-billing') && (
            <Button variant="primary" size="sm" onClick={openCreateSupplierModal}>New Supplier</Button>
          )}
          </>
        }
      />

      {session?.user?.permissions?.includes('list-suppliers-billing') && (
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
      )}

      {/* Create Supplier Modal */}
      {showCreateSupplierModal && (
        <FormModal
          show={showCreateSupplierModal}
          onHide={closeCreateSupplierModal}
          title="Create New Supplier"
          desc="Fill in the details below to create a new supplier"
          formHtml={
            <>
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
            </>
          }
          submitButtonText={creatingSupplier ? "Creating..." : "Create Supplier"}
          cancelButtonText="Close"
          onSubmit={handleSubmitCreateSupplier}
          onCancel={closeCreateSupplierModal}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
        />
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplierModal && selectedSupplier && (
        <FormModal
          show={showEditSupplierModal}
          onHide={closeEditSupplierModal}
          title={`Edit Supplier: ${selectedSupplier.name}`}
          desc="Update the supplier details below"
          formHtml={
            <>
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
            </>
          }
          submitButtonText={editingSupplier ? "Updating..." : "Update Supplier"}
          cancelButtonText="Close"
          onSubmit={handleSubmitEditSupplier}
          onCancel={closeEditSupplierModal}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
        />
      )}

      {/* Delete Supplier Modal */}
      {showDeleteSupplierModal && selectedSupplier && (
        <ConfirmModal
          show={showDeleteSupplierModal}
          onHide={() => setShowDeleteSupplierModal(false)}
          title="Delete Supplier?"
          description="Are you sure you want to delete supplier {targetName}? This action cannot be undone."
          targetName={selectedSupplier.name}
          confirmButtonText="Delete"
          cancelButtonText="Close"
          onConfirm={handleSubmitDeleteSupplier}
          onCancel={() => setShowDeleteSupplierModal(false)}
        />
      )}
    </React.Fragment>
  );
};

SupplierList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SupplierList;
