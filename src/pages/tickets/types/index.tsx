import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  ListTypes,
  CreateType,
  UpdateType,
  DeleteType,
} from "@utils/ticket-types";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";

const TicketTypes = () => {
  const { data: session, status } = useSession();

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row: any) => row.name,
        sortable: true,
      },
      {
        key: "description",
        name: "Description",
        selector: (row: any) => row.description,
        sortable: true,
      },
      {
        key: "color",
        name: "Color",
        selector: (row: any) => row.color,
        sortable: true,
        cell: (props: any) => {
          const bgColor = props.color;
          return (
            <span
              className="badge"
              style={{
                backgroundColor: bgColor,
                color: props.color,
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                display: "inline-block",
                marginRight: "5px",
              }}
            ></span>
          );
        },
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
        key: "Action",
        name: "ACTION",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="action-buttons-container">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleEditType(props)}
            >
              Edit
            </button>

            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteType(props)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [session?.user?.permissions]
  );

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchTypes = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListTypes({
        page,
        perPage,
        search,
        filters: memoizedFilters,
      });
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  const [selectedType, setSelectedType] = useState<any>(null);
  const [selectedTypeName, setSelectedTypeName] = useState<any>(null);
  const [selectedTypeDescription, setSelectedTypeDescription] =
    useState<any>(null);
  const [showEditTypeModal, setShowEditTypeModal] = useState<boolean>(false);

  const handleEditType = useCallback((props: any) => {
    setSelectedType(props.id);
    setSelectedTypeName(props.name);
    setSelectedTypeDescription(props.description);
    setShowEditTypeModal(true);
  }, []);

  const handleSubmitEditType = useCallback(async () => {
    const response = await UpdateType(
      selectedType,
      selectedTypeName,
      selectedTypeDescription
    );
    if (response) {
      setSelectedType(null);
      setSelectedTypeName(null);
      setSelectedTypeDescription(null);
      setShowEditTypeModal(false);
      setRefreshKey((prev) => prev + 1); // Trigger refresh
    }
  }, [selectedType, selectedTypeName, selectedTypeDescription]);

  const [showDeleteTypeModal, setShowDeleteTypeModal] =
    useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<string>("");

  const handleDeleteType = useCallback((props: any) => {
    setSelectedType(props.id);
    setSelectedTypeName(props.name);
    setShowDeleteTypeModal(true);
  }, []);

  const handleSubmitDeleteType = useCallback(async () => {
    const confirmDeleteValue = confirmDelete.trim().toLowerCase();
    if (confirmDeleteValue == "delete") {
      const response = await DeleteType(selectedType);
      if (response) {
        setSelectedType(null);
        setSelectedTypeName(null);
        setShowDeleteTypeModal(false);
        setConfirmDelete("");
        setRefreshKey((prev) => prev + 1); // Trigger refresh
      }
    } else {
      toast.error("Please type the word delete to confirm");
    }
  }, [confirmDelete, selectedType]);

  const [showCreateTypeModal, setShowCreateTypeModal] =
    useState<boolean>(false);
  const [newTypeName, setNewTypeName] = useState<string>("");
  const [newTypeDescription, setNewTypeDescription] = useState<string>("");

  const handleSubmitCreateType = useCallback(async () => {
    const response = await CreateType(newTypeName, newTypeDescription);
    if (response) {
      setNewTypeName("");
      setNewTypeDescription("");
      setShowCreateTypeModal(false);
      setRefreshKey((prev) => prev + 1); // Trigger refresh
    }
  }, [newTypeName, newTypeDescription]);

  const openCreateTypeModal = useCallback(
    () => setShowCreateTypeModal(true),
    []
  );
  const closeCreateTypeModal = useCallback(
    () => setShowCreateTypeModal(false),
    []
  );
  const openEditTypeModal = useCallback(() => setShowEditTypeModal(true), []);
  const closeEditTypeModal = useCallback(() => setShowEditTypeModal(false), []);
  const openDeleteTypeModal = useCallback(
    () => setShowDeleteTypeModal(true),
    []
  );
  const closeDeleteTypeModal = useCallback(
    () => setShowDeleteTypeModal(false),
    []
  );

  const handleNewTypeNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setNewTypeName(e.target.value),
    []
  );
  const handleNewTypeDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setNewTypeDescription(e.target.value),
    []
  );
  const handleEditTypeNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setSelectedTypeName(e.target.value),
    []
  );
  const handleEditTypeDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setSelectedTypeDescription(e.target.value),
    []
  );
  const handleConfirmDeleteChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setConfirmDelete(e.target.value),
    []
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Tickets"
        mainLink="/tickets/types"
        subTitle="Ticket Types"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Ticket Types
              <Button
                variant="outline-primary"
                size="sm"
                className="ms-3"
                onClick={openCreateTypeModal}
              >
                New Type
              </Button>
            </h2>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchTypes}
        title="Types"
        searchPlaceholder="Search types..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
      />

      {showEditTypeModal && (
        <Modal show={showEditTypeModal} onHide={closeEditTypeModal}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Ticket Type</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="editTypeName">Type Name</label>
              <input
                type="text"
                className="form-control"
                id="editTypeName"
                value={selectedTypeName}
                onChange={handleEditTypeNameChange}
                placeholder="Type Name"
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="editTypeDescription">Type Description</label>
              <textarea
                className="form-control"
                id="editTypeDescription"
                value={selectedTypeDescription}
                onChange={handleEditTypeDescriptionChange}
                placeholder="Type Description"
              ></textarea>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditTypeModal}>
              Close
            </Button>
            <Button variant="primary" onClick={() => handleSubmitEditType()}>
              Save changes
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showDeleteTypeModal && (
        <Modal show={showDeleteTypeModal} onHide={closeDeleteTypeModal}>
          <Modal.Header closeButton>
            <Modal.Title>Delete Ticket Type?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete this{" "}
              <b className="text-danger">{selectedTypeName}</b> ticket type?
            </p>
            <p>
              Type the word <b className="text-danger">delete</b> to confirm
            </p>
            <input
              type="text"
              className="form-control"
              id="confirmDelete"
              value={confirmDelete}
              onChange={handleConfirmDeleteChange}
              placeholder="Type the word delete to confirm"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeDeleteTypeModal}>
              Close
            </Button>
            <Button variant="danger" onClick={() => handleSubmitDeleteType()}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showCreateTypeModal && (
        <Modal show={showCreateTypeModal} onHide={closeCreateTypeModal}>
          <Modal.Header closeButton>
            <Modal.Title>New Ticket Type</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="newTypeName">Type Name</label>
              <input
                type="text"
                className="form-control"
                id="newTypeName"
                value={newTypeName}
                onChange={handleNewTypeNameChange}
                placeholder="Type Name"
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="newTypeDescription">Type Description</label>
              <textarea
                className="form-control"
                id="newTypeDescription"
                value={newTypeDescription}
                onChange={handleNewTypeDescriptionChange}
                placeholder="Type Description"
              ></textarea>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeCreateTypeModal}>
              Close
            </Button>
            <Button variant="primary" onClick={() => handleSubmitCreateType()}>
              Create
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </React.Fragment>
  );
};

TicketTypes.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TicketTypes;
