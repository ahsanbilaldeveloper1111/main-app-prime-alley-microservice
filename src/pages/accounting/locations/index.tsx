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
  getInventoryLocations,
  createInventoryLocation,
  updateInventoryLocation,
  deleteInventoryLocation,
  getInventoryLocation,
  InventoryLocationData,
  InventoryLocationCreateUpdatePayload,
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

const LocationList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<{search?: string}>({});

  // Location Management
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocationData | null>(null);
  const [showEditLocationModal, setShowEditLocationModal] = useState<boolean>(false);
  const [showCreateLocationModal, setShowCreateLocationModal] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<boolean>(false);
  const [creatingLocation, setCreatingLocation] = useState<boolean>(false);
  const [showDeleteLocationModal, setShowDeleteLocationModal] = useState<boolean>(false);
  const [confirmDeleteLocation, setConfirmDeleteLocation] = useState<string>("");

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row: InventoryLocationData) => row.name,
        sortable: true,
        cell: (props: InventoryLocationData) => (
          <div>
            <div>{props.name}</div>
            {props.contact_person && (
              <div className="text-muted small">Contact: {props.contact_person}</div>
            )}
          </div>
        ),
      },
      {
        key: "address",
        name: "Address",
        selector: (row: InventoryLocationData) => row.address,
        sortable: true,
        cell: (props: InventoryLocationData) => (
          <div >
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
        selector: (row: InventoryLocationData) => row.created_at,
        sortable: true,
        cell: (props: InventoryLocationData) => (
          <span >
            {moment(props.created_at).format("DD/MM/YYYY")}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: InventoryLocationData) => row.id,
        sortable: false,
        cell: (props: InventoryLocationData) => (
          <>
          <DatatableActionButton
                    actions={[
                        {
                            label: 'Edit',
                            icon: <FiEdit />,
                            onClick: () => handleEditLocation(props),
                            className: 'gap-2'
                        },
                        {
                            label: 'Delete',
                            icon: <FiTrash2 />,
                            onClick: () => handleDeleteLocation(props),
                            className: 'text-danger gap-2'
                        },
                    ]}
                />
          </>


        ),
      },
    ],
    [session?.user?.permissions]
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchLocations = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const response = await getInventoryLocations({
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
        console.error("Error fetching locations:", error);
        throw error;
      }
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: {search?: string}) => {
    setCurrentFilters(filters);
  }, []);

  // Edit Location Modal
  const handleEditLocation = useCallback((props: InventoryLocationData) => {
    setSelectedLocation(props);
    setShowEditLocationModal(true);
  }, []);

  const handleSubmitEditLocation = useCallback(async () => {
    if (!selectedLocation) return;

    if (!selectedLocation.name) {
      toast.error("Please enter a location name");
      return;
    }

    setEditingLocation(true);
    try {
      const locationData: InventoryLocationCreateUpdatePayload = {
        name: selectedLocation.name,
        address: selectedLocation.address || "",
        city: selectedLocation.city || "",
        state: selectedLocation.state || "",
        zip_code: selectedLocation.zip_code || "",
        country: selectedLocation.country || "",
      };

      const response = await updateInventoryLocation(selectedLocation.id, locationData);

      if (response) {
        setSelectedLocation(null);
        setShowEditLocationModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Location updated successfully");
      }
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    } finally {
      setEditingLocation(false);
    }
  }, [selectedLocation]);

  // Create Location Modal
  const [newLocation, setNewLocation] = useState<InventoryLocationCreateUpdatePayload>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
  });

  const handleSubmitCreateLocation = useCallback(async () => {
    if (!newLocation.name) {
      toast.error("Please enter a location name");
      return;
    }

    setCreatingLocation(true);
    try {
      const response = await createInventoryLocation(newLocation);

      if (response) {
        setNewLocation({
          name: "",
          address: "",
          city: "",
          state: "",
          zip_code: "",
          country: "",
        });
        setShowCreateLocationModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Location created successfully");
      }
    } catch (error) {
      console.error("Error creating location:", error);
      toast.error("Failed to create location");
    } finally {
      setCreatingLocation(false);
    }
  }, [newLocation]);

  // Modal handlers
  const openCreateLocationModal = useCallback(
    () => setShowCreateLocationModal(true),
    []
  );
  const closeCreateLocationModal = useCallback(() => {
    setShowCreateLocationModal(false);
    setNewLocation({
      name: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "",
    });
  }, []);

  const closeEditLocationModal = useCallback(() => {
    setShowEditLocationModal(false);
    setSelectedLocation(null);
  }, []);

  // Input handlers
  const handleNewLocationChange = useCallback(
    (field: keyof InventoryLocationCreateUpdatePayload, value: any) => {
      setNewLocation((prev: InventoryLocationCreateUpdatePayload) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleEditLocationChange = useCallback(
    (field: keyof InventoryLocationData, value: any) => {
      setSelectedLocation((prev: InventoryLocationData | null) => ({
        ...prev!,
        [field]: value,
      }));
    },
    []
  );
  
  // Location Delete Handlers
  const handleDeleteLocation = useCallback((props: InventoryLocationData) => {
    setSelectedLocation(props);
    setShowDeleteLocationModal(true);
  }, []);

  const handleSubmitDeleteLocation = useCallback(async () => {
    if (!selectedLocation) return;

    const confirmDeleteValue = confirmDeleteLocation.trim();
    try {
      await deleteInventoryLocation(selectedLocation.id);
      setSelectedLocation(null);
      setShowDeleteLocationModal(false);
      setConfirmDeleteLocation("");
      setRefreshKey((prev) => prev + 1);
      toast.success("Location deleted successfully");
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  }, [confirmDeleteLocation, selectedLocation]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Locations" />

      <PageHeader
        title="Locations"
        showSearch={true}
        searchPlaceholder="Search locations..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
        buttons={
          <Button variant="primary" size="sm" onClick={openCreateLocationModal}>New Location</Button>
        }
      />

     

      <GenericListPage
        columns={columns}
        fetchData={fetchLocations}
        title="Locations"
        searchPlaceholder="Search locations..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={false}
        tableStyle="table-style-2"
      />

      {/* Create Location Modal */}
      {showCreateLocationModal && (
        <FormModal
          show={showCreateLocationModal}
          onHide={closeCreateLocationModal}
          title="Create New Location"
          desc="Fill in the details below to create a new location"
          formHtml={
            <>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label htmlFor="newLocationName">Location Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newLocationName"
                      value={newLocation.name}
                      onChange={(e) =>
                        handleNewLocationChange("name", e.target.value)
                      }
                      placeholder="Enter location name"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label htmlFor="newLocationAddress">Address</label>
                    <textarea
                      className="form-control"
                      id="newLocationAddress"
                      value={newLocation.address}
                      onChange={(e) =>
                        handleNewLocationChange("address", e.target.value)
                      }
                      rows={3}
                      placeholder="Enter address..."
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="newLocationCity">City</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newLocationCity"
                      value={newLocation.city}
                      onChange={(e) =>
                        handleNewLocationChange("city", e.target.value)
                      }
                      placeholder="Enter city"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="newLocationState">State/Province</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newLocationState"
                      value={newLocation.state}
                      onChange={(e) =>
                        handleNewLocationChange("state", e.target.value)
                      }
                      placeholder="Enter state/province"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="newLocationZipCode">ZIP/Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newLocationZipCode"
                      value={newLocation.zip_code}
                      onChange={(e) =>
                        handleNewLocationChange("zip_code", e.target.value)
                      }
                      placeholder="Enter ZIP/postal code"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="newLocationCountry">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      id="newLocationCountry"
                      value={newLocation.country}
                      onChange={(e) =>
                        handleNewLocationChange("country", e.target.value)
                      }
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>
            </>
          }
          submitButtonText={creatingLocation ? "Creating..." : "Create Location"}
          cancelButtonText="Close"
          onSubmit={handleSubmitCreateLocation}
          onCancel={closeCreateLocationModal}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
        />
      )}

      {/* Edit Location Modal */}
      {showEditLocationModal && selectedLocation && (
        <FormModal
          show={showEditLocationModal}
          onHide={closeEditLocationModal}
          title={`Edit Location: ${selectedLocation.name}`}
          desc="Update the location details below"
          formHtml={
            <>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label htmlFor="editLocationName">Location Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="editLocationName"
                      value={selectedLocation.name || ""}
                      onChange={(e) =>
                        handleEditLocationChange("name", e.target.value)
                      }
                      placeholder="Enter location name"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group mb-3">
                    <label htmlFor="editLocationAddress">Address</label>
                    <textarea
                      className="form-control"
                      id="editLocationAddress"
                      value={selectedLocation.address || ""}
                      onChange={(e) =>
                        handleEditLocationChange("address", e.target.value)
                      }
                      rows={3}
                      placeholder="Enter address..."
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editLocationCity">City</label>
                    <input
                      type="text"
                      className="form-control"
                      id="editLocationCity"
                      value={selectedLocation.city || ""}
                      onChange={(e) =>
                        handleEditLocationChange("city", e.target.value)
                      }
                      placeholder="Enter city"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editLocationState">State/Province</label>
                    <input
                      type="text"
                      className="form-control"
                      id="editLocationState"
                      value={selectedLocation.state || ""}
                      onChange={(e) =>
                        handleEditLocationChange("state", e.target.value)
                      }
                      placeholder="Enter state/province"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editLocationZipCode">ZIP/Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      id="editLocationZipCode"
                      value={selectedLocation.zip_code || ""}
                      onChange={(e) =>
                        handleEditLocationChange("zip_code", e.target.value)
                      }
                      placeholder="Enter ZIP/postal code"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label htmlFor="editLocationCountry">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      id="editLocationCountry"
                      value={selectedLocation.country || ""}
                      onChange={(e) =>
                        handleEditLocationChange("country", e.target.value)
                      }
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>
            </>
          }
          submitButtonText={editingLocation ? "Updating..." : "Update Location"}
          cancelButtonText="Close"
          onSubmit={handleSubmitEditLocation}
          onCancel={closeEditLocationModal}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
        />
      )}

      {/* Delete Location Modal */}
      {showDeleteLocationModal && selectedLocation && (
        <ConfirmModal
          show={showDeleteLocationModal}
          onHide={() => setShowDeleteLocationModal(false)}
          title="Delete Location?"
          description="Are you sure you want to delete location {targetName}? This action cannot be undone."
          targetName={selectedLocation.name}
          confirmButtonText="Delete"
          cancelButtonText="Close"
          onConfirm={handleSubmitDeleteLocation}
          onCancel={() => setShowDeleteLocationModal(false)}
        />
      )}
    </React.Fragment>
  );
};

LocationList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LocationList;
