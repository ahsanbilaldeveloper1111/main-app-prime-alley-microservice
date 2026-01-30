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
import { Button, Card, Form, Row,Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import moment from "moment";
import PageHeader from "@components/PageHeader";
import { Plus, Edit, Trash2, Info, Ticket, List, CheckCircle, Tag } from "lucide-react";
import ConfirmModal from "@pages/partial/ConfirmModal";
import FormModal from "@pages/partial/FormModal";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { GlobalDateTimeFormat } from "@utils/Helper";

const TicketTypes = () => {
  const { data: session, status } = useSession();

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Type Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => {
          return (
            <div className="d-flex align-items-center gap-2">
              {/* <div className="rounded-circle" style={{ 
                width: '8px', height: '8px',
                 backgroundColor: props.color,
                 flexShrink: 0,
                 display: 'inline-block',
                 borderRadius: '50%' }}></div> */}
              <span style={{ fontWeight: '500', fontSize: '0.938rem', color: 'rgb(33, 37, 41)' }}>
                {props.name}
                </span>
                </div>
          );
        },
      },
      {
        key: "description",
        name: "Description",
        selector: (row: any) => row.description,
        sortable: true,
      },
      // {
      //   key: "color",
      //   name: "Color",
      //   selector: (row: any) => row.color,
      //   sortable: true,
      //   cell: (props: any) => {
      //     const bgColor = props.color;
      //     return (
      //       <span
      //         className="badge"
      //         style={{
      //           backgroundColor: bgColor,
      //           color: props.color,
      //           width: "20px",
      //           height: "20px",
      //           borderRadius: "50%",
      //           display: "inline-block",
      //           marginRight: "5px",
      //         }}
      //       ></span>
      //     );
      //   },
      // },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {moment(props.created_at).format(GlobalDateTimeFormat)}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          // <div className="action-buttons-container">
          //   {session?.user?.permissions?.includes(
          //     "update-ticket-types-tickets"
          //   ) && (
          //     <button
          //       className="btn btn-sm btn-outline-primary"
          //       onClick={() => handleEditType(props)}
          //     >
          //       Edit
          //     </button>
          //   )}
          //   {session?.user?.permissions?.includes(
          //     "delete-ticket-type-tickets"
          //   ) && (
          //     <button
          //       className="btn btn-sm btn-outline-danger"
          //       onClick={() => handleDeleteType(props)}
          //       disabled={props?.tickets_count > 0}
          //     >
          //       Delete
          //     </button>
          //   )}
          // </div>
          <div className="d-flex gap-2">
            {session?.user?.permissions?.includes('update-ticket-types-tickets') && (
              <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-primary" title="Edit">
                <Edit size={16}  onClick={() => handleEditType(props)} />
              </Button>
            )}
            {session?.user?.permissions?.includes('delete-ticket-type-tickets') && (
              <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-danger" title="Delete">
                <Trash2 size={16}  onClick={() => handleDeleteType(props)} />
              </Button>
            )}
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
    const response = await DeleteType(selectedType);
      if (response) {
        setSelectedType(null);
        setSelectedTypeName(null);
        setShowDeleteTypeModal(false);
        setConfirmDelete("");
        setRefreshKey((prev) => prev + 1); // Trigger refresh
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



      <PageHeader
        title="Ticket Types"
        description="Manage ticket types and their properties"
        showSearch={false}
        buttons={
          <>
          {session?.user?.permissions?.includes("add-ticket-type-tickets") && (
            <Button variant="primary" onClick={openCreateTypeModal} className="shadow-sm">
               <Plus size={18} className="me-2" />
               Add Type
            </Button>
          )}
          </>
        }
        leftGrid={3}
        rightGrid={9}
      />

      {session?.user?.permissions?.includes("view-ticket-types-tickets") && (
        <GenericListPage
          columns={columns}
          fetchData={fetchTypes}
          title="Types"
          searchPlaceholder="Search types..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
          tableStyle="table-style-2"
        />
      )}

      {showEditTypeModal && (
        
        <FormModal
          show={showEditTypeModal}
          onHide={closeEditTypeModal}
          title="Edit Ticket Type"
          titleIcon={<Ticket size={20} className="text-primary" />}
          desc="Fill in the details below to edit the ticket type"
          formHtml={<>
          
          <div className="form-group mb-3">
            <label htmlFor="editTypeName" className="fw-semibold d-flex align-items-center gap-2 form-label">Type Name <span className="text-danger">*</span>
            <span 
              className="text-muted" 
              title="Enter a clear name that represents the ticket type"
              style={{ cursor: 'help' }}
            >
              <Info size={14} />
            </span>
            </label>
            <input type="text" className="form-control" id="editTypeName" value={selectedTypeName} onChange={handleEditTypeNameChange} placeholder="e.g., Incident, Problem, Service Request" required />

            <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
            <Info size={12} />
            <span style={{ fontSize: '0.813rem' }}> Use descriptive names that clearly indicate the type of ticket. </span>
            </Form.Text>
          </div>

          <div className="form-group mb-3">
            <label htmlFor="editTypeDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">Type Description 
            <span 
              className="text-muted" 
              title="Enter a description that explains the ticket type"
              style={{ cursor: 'help' }}
            >
              <Info size={14} />
            </span>
            </label>
            <textarea className="form-control" id="editTypeDescription" value={selectedTypeDescription} onChange={handleEditTypeDescriptionChange} placeholder="e.g., A problem that occurs when the user tries to login to the system" rows={3} required />

            <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
            <Info size={12} />
            <span style={{ fontSize: '0.813rem' }}> Provide a clear definition to help users select the correct type. </span>
            </Form.Text>
          </div>

          </>}
          submitButtonText="Update Type"
          isSubmitDisabled={!selectedTypeName}
          cancelButtonText="Cancel"
          onSubmit={handleSubmitEditType}
          onCancel={closeEditTypeModal}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
        />
      )}

      {showDeleteTypeModal && (
        <ConfirmModal
          show={showDeleteTypeModal}
          onHide={closeDeleteTypeModal}
          title="Delete Ticket Type?"
          description="Are you sure you want to delete this {targetName} ticket type? This action cannot be undone."
          targetName={selectedTypeName}
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          onConfirm={handleSubmitDeleteType}
          onCancel={closeDeleteTypeModal}
        />
   
      )}

      {showCreateTypeModal && (
      
        <FormModal
          show={showCreateTypeModal}
          onHide={closeCreateTypeModal}
          title="New Ticket Type"
          titleIcon={<Ticket size={20} className="text-primary" />}
          desc="Fill in the details below to create a new ticket type"
          formHtml={<>


          <div className="form-group mb-3">
            <label htmlFor="newTypeName" className="fw-semibold d-flex align-items-center gap-2 form-label">Type Name <span className="text-danger">*</span>
            <span 
              className="text-muted" 
              title="Enter a clear name that represents the ticket type"
              style={{ cursor: 'help' }}
            >
              <Info size={14} />
            </span>
            </label>
            <input type="text" className="form-control" id="newTypeName" value={newTypeName} onChange={handleNewTypeNameChange} placeholder="e.g., Incident, Problem, Service Request" required />

            <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
            <Info size={12} />
              <span style={{ fontSize: '0.813rem' }}> Use descriptive names that clearly indicate the type of ticket. </span>
            </Form.Text>
                
          </div>


          <div className="form-group mb-3">
            <label htmlFor="newTypeDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">Type Description 
            <span 
              className="text-muted" 
              title="Enter a description that explains the ticket type"
              style={{ cursor: 'help' }}
            >
              <Info size={14} />
            </span>
            </label>
            <textarea className="form-control" id="newTypeDescription" value={newTypeDescription} onChange={handleNewTypeDescriptionChange} placeholder="e.g., A problem that occurs when the user tries to login to the system" rows={3} required />

            <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
            <Info size={12} />
            <span style={{ fontSize: '0.813rem' }}> Provide a clear definition to help users select the correct type. </span>
            </Form.Text>
          </div>

          </>}
          submitButtonText="Create Type"
          isSubmitDisabled={!newTypeName}
          cancelButtonText="Cancel"
          onSubmit={handleSubmitCreateType}
          onCancel={closeCreateTypeModal}
        />
      )}
    </React.Fragment>
  );
};

TicketTypes.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TicketTypes;
