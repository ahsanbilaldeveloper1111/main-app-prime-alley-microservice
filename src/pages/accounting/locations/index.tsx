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
import PageSummaryGrid from "@components/PageSummaryGrid";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import { FiEdit, FiTrash2 } from "react-icons/fi";
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
            <div className="fw-bold text-primary">{props.name}</div>
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
        key: "created_at",
        name: "Created",
        selector: (row: InventoryLocationData) => row.created_at,
        sortable: true,
        cell: (props: InventoryLocationData) => (
          <span className="text-muted">
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
          <TableAction
                    actions={[
                        {
                            label: 'Edit',
                            icon: FiEdit,
                            onClick: () => handleEditLocation(props),
                            variant: 'edit'
                        },
                        {
                            label: 'Delete',
                            icon: FiTrash2,
                            onClick: () => handleDeleteLocation(props),
                            variant: 'delete'
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
    if (confirmDeleteValue === "DELETE") {
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
    } else {
      toast.error("Please type the word DELETE to confirm");
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
        <Modal
          show={showCreateLocationModal}
          onHide={closeCreateLocationModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Location</Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeCreateLocationModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitCreateLocation}
              disabled={creatingLocation}
            >
              {creatingLocation ? "Creating..." : "Create Location"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Location Modal */}
      {showEditLocationModal && selectedLocation && (
        <Modal
          show={showEditLocationModal}
          onHide={closeEditLocationModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Edit Location: {selectedLocation.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditLocationModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitEditLocation}
              disabled={editingLocation}
            >
              {editingLocation ? "Updating..." : "Update Location"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Location Modal */}
      {showDeleteLocationModal && selectedLocation && (
        <Modal
          show={showDeleteLocationModal}
          onHide={() => setShowDeleteLocationModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Location?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete location{" "}
              <b className="text-danger">{selectedLocation.name}</b>?
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
              id="confirmDeleteLocation"
              value={confirmDeleteLocation}
              onChange={(e) => setConfirmDeleteLocation(e.target.value)}
              placeholder="Type the word DELETE to confirm"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteLocationModal(false)}
            >
              Close
            </Button>
            <Button variant="danger" onClick={handleSubmitDeleteLocation}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </React.Fragment>
  );
};

LocationList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LocationList;
