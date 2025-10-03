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
  getInventories,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventory,
  getProductCategories,
  getInventoryLocations,
  getInventorySuppliers,
  InventoryData,
  InventoryCreateUpdatePayload,
  ProductCategoryData,
  InventoryLocationData,
  InventorySupplierData,
} from "@utils/accounting";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";

import { motion } from "framer-motion";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";



const InventoryList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<{search?: string}>({});

  const [categories, setCategories] = useState<ProductCategoryData[]>([]);
  const [locations, setLocations] = useState<InventoryLocationData[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplierData[]>([]);

  // Inventory Management
  const [selectedInventory, setSelectedInventory] = useState<InventoryData | null>(null);
  const [showEditInventoryModal, setShowEditInventoryModal] = useState<boolean>(false);
  const [showCreateInventoryModal, setShowCreateInventoryModal] = useState<boolean>(false);
  const [editingInventory, setEditingInventory] = useState<boolean>(false);
  const [creatingInventory, setCreatingInventory] = useState<boolean>(false);
  const [showDeleteInventoryModal, setShowDeleteInventoryModal] = useState<boolean>(false);
  const [confirmDeleteInventory, setConfirmDeleteInventory] = useState<string>("");

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row: InventoryData) => row.name,
        sortable: true,
        cell: (props: InventoryData) => (
          <div>
            <div >{props.name}</div>
            {props.description && (
              <div 
                className="text-muted small" 
                dangerouslySetInnerHTML={{ __html: props.description }}
              />
            )}
          </div>
        ),
      },
      {
        key: "category",
        name: "Category",
        selector: (row: InventoryData) => row.category?.name,
        sortable: true,
        cell: (props: InventoryData) => (
          <span className="status-badge info">
            {props.category?.name || "No Category"}
          </span>
        ),
      },
      {
        key: "current_stock",
        name: "Stock",
        selector: (row: InventoryData) => row.current_stock,
        sortable: true,
        cell: (props: InventoryData) => (
          <div>
            <div>Items: {props.current_stock}</div>
            <div className="text-muted small">
              Min: {props.minimum_stock} | Max: {props.maximum_stock}
            </div>
          </div>
        ),
      },
      {
        key: "base_price",
        name: "Price",
        selector: (row: InventoryData) => row.base_price,
        sortable: true,
        cell: (props: InventoryData) => (
          <span>
            ${parseFloat(props.base_price || "0").toFixed(2)}
          </span>
        ),
      },
      {
        key: "status",
        name: "Status",
        selector: (row: InventoryData) => row.status,
        sortable: true,
        cell: (props: InventoryData) => {
          const statusColors = {
            in_stock: "success",
            low_stock: "warning",
            out_of_stock: "danger",
          };
          return (
            <span
              className={`text-capitalize status-badge ${
                statusColors[props.status as keyof typeof statusColors] ||
                "secondary"
              }`}
            >
              {props.status.replace('_', ' ')}
            </span>
          );
        },
      },
      {
        key: "last_updated",
        name: "Last Updated",
        selector: (row: InventoryData) => row.last_updated,
        sortable: true,
        cell: (props: InventoryData) => (
          <span className="text-muted">
            {moment(props.last_updated).format("DD/MM/YYYY HH:mm")}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: InventoryData) => row.id,
        sortable: false,
        cell: (props: InventoryData) => (
          <>
          <DatatableActionButton
                    actions={[
                        {
                            label: 'Edit',
                            icon: <FiEdit />,
                            onClick: () => handleEditInventory(props),
                            className: 'gap-2'
                        },
                        {
                            label: 'Delete',
                            icon: <FiTrash2 />,
                            onClick: () => handleDeleteInventory(props),
                            className: 'text-danger gap-2'
                        }
                    ]}
                />
          </>



        ),
      },
    ],
    [session?.user?.permissions]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await getProductCategories();
      setCategories(categoriesData.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const locationsData = await getInventoryLocations();
      setLocations(locationsData.data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const suppliersData = await getInventorySuppliers();
      setSuppliers(suppliersData.data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchLocations();
    fetchSuppliers();
  }, [fetchCategories, fetchLocations, fetchSuppliers]);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchInventories = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await getInventories({
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
        console.error("Error fetching inventories:", error);
        throw error;
      }
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  // Edit Inventory Modal
  const handleEditInventory = useCallback((props: InventoryData) => {
    setSelectedInventory(props);
    setShowEditInventoryModal(true);
  }, []);

  const handleSubmitEditInventory = useCallback(async () => {
    if (!selectedInventory) return;

    if (!selectedInventory.name) {
      toast.error("Please enter a name");
      return;
    }
    if (!selectedInventory.category_id) {
      toast.error("Please select a category");
      return;
    }
    if (!selectedInventory.base_price || parseFloat(selectedInventory.base_price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setEditingInventory(true);
    try {
      const inventoryData: InventoryCreateUpdatePayload = {
        name: selectedInventory.name,
        description: selectedInventory.description || "",
        base_price: selectedInventory.base_price,
        category_id: selectedInventory.category_id,
        location_id: selectedInventory.location_id,
        supplier_id: selectedInventory.supplier_id,
        current_stock: selectedInventory.current_stock,
        minimum_stock: selectedInventory.minimum_stock,
        maximum_stock: selectedInventory.maximum_stock,
        reorder_point: selectedInventory.reorder_point,
        status: selectedInventory.status,
        notes: selectedInventory.notes,
      };

      const response = await updateInventory(selectedInventory.id, inventoryData);

      if (response) {
        setSelectedInventory(null);
        setShowEditInventoryModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Inventory updated successfully");
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast.error("Failed to update inventory");
    } finally {
      setEditingInventory(false);
    }
  }, [selectedInventory]);

  // Create Inventory Modal
  const [newInventory, setNewInventory] = useState<InventoryCreateUpdatePayload>({
    name: "",
    description: "",
    base_price: "",
    category_id: "",
    location_id: null,
    supplier_id: null,
    current_stock: 0,
    minimum_stock: 0,
    maximum_stock: 0,
    reorder_point: null,
    status: "in_stock",
    notes: "",
  });

  const handleSubmitCreateInventory = useCallback(async () => {
    if (!newInventory.name) {
      toast.error("Please enter a name");
      return;
    }
    if (!newInventory.category_id) {
      toast.error("Please select a category");
      return;
    }
    if (!newInventory.base_price || parseFloat(newInventory.base_price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setCreatingInventory(true);
    try {
      const response = await createInventory(newInventory);

      if (response) {
        setNewInventory({
          name: "",
          description: "",
          base_price: "",
          category_id: "",
          location_id: null,
          supplier_id: null,
          current_stock: 0,
          minimum_stock: 0,
          maximum_stock: 0,
          reorder_point: null,
          status: "in_stock",
          notes: "",
        });
        setShowCreateInventoryModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Inventory created successfully");
      }
    } catch (error) {
      console.error("Error creating inventory:", error);
      toast.error("Failed to create inventory");
    } finally {
      setCreatingInventory(false);
    }
  }, [newInventory]);

  // Modal handlers
  const openCreateInventoryModal = useCallback(
    () => setShowCreateInventoryModal(true),
    []
  );
  const closeCreateInventoryModal = useCallback(() => {
    setShowCreateInventoryModal(false);
    setNewInventory({
      name: "",
      description: "",
      base_price: "",
      category_id: "",
      location_id: null,
      supplier_id: null,
      current_stock: 0,
      minimum_stock: 0,
      maximum_stock: 0,
      reorder_point: null,
      status: "in_stock",
      notes: "",
    });
  }, []);

  const closeEditInventoryModal = useCallback(() => {
    setShowEditInventoryModal(false);
    setSelectedInventory(null);
  }, []);

  // Input handlers
  const handleNewInventoryChange = useCallback(
    (field: keyof InventoryCreateUpdatePayload, value: any) => {
      setNewInventory((prev: InventoryCreateUpdatePayload) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleEditInventoryChange = useCallback(
    (field: keyof InventoryData, value: any) => {
      setSelectedInventory((prev: InventoryData | null) => ({
        ...prev!,
        [field]: value,
      }));
    },
    []
  );
  
  // Inventory Delete Handlers
  const handleDeleteInventory = useCallback((props: InventoryData) => {
    setSelectedInventory(props);
    setShowDeleteInventoryModal(true);
  }, []);

  const handleSubmitDeleteInventory = useCallback(async () => {
    if (!selectedInventory) return;

    const confirmDeleteValue = confirmDeleteInventory.trim();
    try {
      await deleteInventory(selectedInventory.id);
      setSelectedInventory(null);
      setShowDeleteInventoryModal(false);
      setConfirmDeleteInventory("");
      setRefreshKey((prev) => prev + 1);
      toast.success("Inventory deleted successfully");
    } catch (error) {
      console.error("Error deleting inventory:", error);
      toast.error("Failed to delete inventory");
    }
  }, [confirmDeleteInventory, selectedInventory]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Inventory" />

      <PageHeader
        title="Inventory"
        showSearch={true}
        searchPlaceholder="Search inventory..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
        buttons={
          <Button variant="primary" size="sm" onClick={openCreateInventoryModal}>New Inventory Item</Button>
        }
      />

     

      <GenericListPage
        columns={columns}
        fetchData={fetchInventories}
        title="Inventory"
        searchPlaceholder="Search inventory..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={false}
        tableStyle="table-style-2"
      />

      {/* Create Inventory Modal */}
      <FormModal
        show={showCreateInventoryModal}
        onHide={closeCreateInventoryModal}
        title="Create New Inventory Item"
        desc="Fill in the details below to create a new inventory item"
        formHtml={
          <>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryName">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newInventoryName"
                    value={newInventory.name}
                    onChange={(e) =>
                      handleNewInventoryChange("name", e.target.value)
                    }
                    placeholder="Enter inventory item name"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryCategory">Category</label>
                  <select
                    className="form-control"
                    id="newInventoryCategory"
                    value={newInventory.category_id}
                    onChange={(e) =>
                      handleNewInventoryChange("category_id", e.target.value)
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((category: ProductCategoryData) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryDescription">Description</label>
                  <textarea
                    className="form-control"
                    id="newInventoryDescription"
                    value={newInventory.description}
                    onChange={(e) =>
                      handleNewInventoryChange("description", e.target.value)
                    }
                    rows={3}
                    placeholder="Enter description..."
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryBasePrice">Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="newInventoryBasePrice"
                    value={newInventory.base_price}
                    onChange={(e) =>
                      handleNewInventoryChange("base_price", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryCurrentStock">Current Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    id="newInventoryCurrentStock"
                    value={newInventory.current_stock}
                    onChange={(e) =>
                      handleNewInventoryChange("current_stock", parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryStatus">Status</label>
                  <select
                    className="form-control"
                    id="newInventoryStatus"
                    value={newInventory.status}
                    onChange={(e) =>
                      handleNewInventoryChange("status", e.target.value)
                    }
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryMinStock">Minimum Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    id="newInventoryMinStock"
                    value={newInventory.minimum_stock}
                    onChange={(e) =>
                      handleNewInventoryChange("minimum_stock", parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryMaxStock">Maximum Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    id="newInventoryMaxStock"
                    value={newInventory.maximum_stock}
                    onChange={(e) =>
                      handleNewInventoryChange("maximum_stock", parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryReorderPoint">Reorder Point</label>
                  <input
                    type="number"
                    className="form-control"
                    id="newInventoryReorderPoint"
                    value={newInventory.reorder_point || ""}
                    onChange={(e) =>
                      handleNewInventoryChange("reorder_point", e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryLocation">Location</label>
                  <select
                    className="form-control"
                    id="newInventoryLocation"
                    value={newInventory.location_id || ""}
                    onChange={(e) =>
                      handleNewInventoryChange("location_id", e.target.value ? parseInt(e.target.value) : null)
                    }
                  >
                    <option value="">Select Location (Optional)</option>
                    {locations.map((location: InventoryLocationData) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newInventorySupplier">Supplier</label>
                  <select
                    className="form-control"
                    id="newInventorySupplier"
                    value={newInventory.supplier_id || ""}
                    onChange={(e) =>
                      handleNewInventoryChange("supplier_id", e.target.value ? parseInt(e.target.value) : null)
                    }
                  >
                    <option value="">Select Supplier (Optional)</option>
                    {suppliers.map((supplier: InventorySupplierData) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newInventoryNotes">Notes</label>
                  <textarea
                    className="form-control"
                    id="newInventoryNotes"
                    value={newInventory.notes || ""}
                    onChange={(e) =>
                      handleNewInventoryChange("notes", e.target.value)
                    }
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          </>
        }
        submitButtonText={creatingInventory ? "Creating..." : "Create Inventory Item"}
        cancelButtonText="Close"
        onSubmit={handleSubmitCreateInventory}
        onCancel={closeCreateInventoryModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

      {/* Edit Inventory Modal */}
      {showEditInventoryModal && selectedInventory && (
        <FormModal
          show={showEditInventoryModal}
          onHide={closeEditInventoryModal}
          title={`Edit Inventory: ${selectedInventory.name}`}
          desc="Update the inventory item details below"
          formHtml={
            <>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryName">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="editInventoryName"
                      value={selectedInventory.name || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("name", e.target.value)
                      }
                      placeholder="Enter inventory item name"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryCategory">Category</label>
                    <select
                      className="form-control"
                      id="editInventoryCategory"
                      value={selectedInventory.category_id || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("category_id", e.target.value)
                      }
                    >
                      <option value="">Select Category</option>
                      {categories.map((category: ProductCategoryData) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryDescription">Description</label>
                    <textarea
                      className="form-control"
                      id="editInventoryDescription"
                      value={selectedInventory.description || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("description", e.target.value)
                      }
                      rows={3}
                      placeholder="Enter description..."
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryBasePrice">Base Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      id="editInventoryBasePrice"
                      value={selectedInventory.base_price || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("base_price", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryCurrentStock">Current Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      id="editInventoryCurrentStock"
                      value={selectedInventory.current_stock || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("current_stock", parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryStatus">Status</label>
                    <select
                      className="form-control"
                      id="editInventoryStatus"
                      value={selectedInventory.status || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("status", e.target.value)
                      }
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryMinStock">Minimum Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      id="editInventoryMinStock"
                      value={selectedInventory.minimum_stock || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("minimum_stock", parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryMaxStock">Maximum Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      id="editInventoryMaxStock"
                      value={selectedInventory.maximum_stock || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("maximum_stock", parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryReorderPoint">Reorder Point</label>
                    <input
                      type="number"
                      className="form-control"
                      id="editInventoryReorderPoint"
                      value={selectedInventory.reorder_point || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("reorder_point", e.target.value ? parseInt(e.target.value) : null)
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryLocation">Location</label>
                    <select
                      className="form-control"
                      id="editInventoryLocation"
                      value={selectedInventory.location_id || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("location_id", e.target.value ? parseInt(e.target.value) : null)
                      }
                    >
                      <option value="">Select Location (Optional)</option>
                      {locations.map((location: InventoryLocationData) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventorySupplier">Supplier</label>
                    <select
                      className="form-control"
                      id="editInventorySupplier"
                      value={selectedInventory.supplier_id || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("supplier_id", e.target.value ? parseInt(e.target.value) : null)
                      }
                    >
                      <option value="">Select Supplier (Optional)</option>
                      {suppliers.map((supplier: InventorySupplierData) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label htmlFor="editInventoryNotes">Notes</label>
                    <textarea
                      className="form-control"
                      id="editInventoryNotes"
                      value={selectedInventory.notes || ""}
                      onChange={(e) =>
                        handleEditInventoryChange("notes", e.target.value)
                      }
                      rows={2}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </div>
            </>
          }
          submitButtonText={editingInventory ? "Updating..." : "Update Inventory Item"}
          cancelButtonText="Close"
          onSubmit={handleSubmitEditInventory}
          onCancel={closeEditInventoryModal}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
        />
      )}

      {/* Delete Inventory Modal */}
      {showDeleteInventoryModal && selectedInventory && (
        <ConfirmModal
          show={showDeleteInventoryModal}
          onHide={() => setShowDeleteInventoryModal(false)}
          title="Delete Inventory Item?"
          description="Are you sure you want to delete inventory item {targetName}? This action cannot be undone."
          targetName={selectedInventory.name}
          confirmButtonText="Delete"
          cancelButtonText="Close"
          onConfirm={handleSubmitDeleteInventory}
          onCancel={() => setShowDeleteInventoryModal(false)}
          confirmButtonVariant="danger"
          cancelButtonVariant="secondary"
          requireTextConfirmation={true}

        />
      )}
    </React.Fragment>
  );
};

InventoryList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default InventoryList;
