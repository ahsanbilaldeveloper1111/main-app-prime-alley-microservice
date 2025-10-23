import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { getStages, createStage, deleteStage, updateStage } from "@utils/crm";
import { Column } from "@components/CustomDataTable";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Form,
  Alert,
} from "react-bootstrap";
import {
  FiTrash2,
  FiPlus,
  FiSave,
  FiEdit2,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";


interface Stage {
  id: number;
  name: string;
  sequence: number;
  is_won: boolean;
  fold: boolean;
  color: string;
  description?: string;
  is_default: boolean;
  active: boolean;
  type: 'lead' | 'opportunity';
  created_at: string;
  updated_at: string;
}

const StagesManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [stageToUpdate, setStageToUpdate] = useState<Stage | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: "",
    sequence: 1,
    is_won: false,
    fold: false,
    color: "#6c757d",
    description: "",
    is_default: false,
    active: true,
    type: 'lead' as 'lead' | 'opportunity',
  });

  const [currentFilters, setCurrentFilters] = useState({search: ""});
  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };



  const fetchStagesForTable = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const stagesData = await getStages();
        const searchTerm = currentFilters.search || search;
        const filteredStages = stagesData.filter((stage) => {
          if (!searchTerm) return true;
          return !!stage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 !!stage.description?.toLowerCase().includes(searchTerm.toLowerCase());
        });
        
        return {
          dataList: filteredStages,
          meta: {
            total: filteredStages.length,
            current_page: page,
            per_page: perPage,
            last_page: Math.ceil(filteredStages.length / perPage),
          },
        };
      } catch (error) {
        console.error("Failed to fetch stages:", error);
        return {
          dataList: [],
          meta: {
            total: 0,
            current_page: page,
            per_page: perPage,
            last_page: 1,
          },
        };
      }
    },
    [currentFilters]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createStage(formData);
      toast.success("Stage created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        sequence: 1,
        is_won: false,
        fold: false,
        color: "#6c757d",
        description: "",
        is_default: false,
        active: true,
        type: 'lead' as 'lead' | 'opportunity',
      });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Created");
      setSuccessModalDescription("Stage created successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to create stage");
      console.error("Create stage error:", error);
    }
  };

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false)
  const [successModalTitle, setSuccessModalTitle] = useState('')
  const [successModalDescription, setSuccessModalDescription] = useState('')
  const handleCloseSuccessfulModal = () => {
      setShowSuccessfulModal(false)
  }

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setStageToUpdate(null);
    setFormData({
      name: "",
      sequence: 1,
      is_won: false,
      fold: false,
      color: "#6c757d",
      description: "",
      is_default: false,
      active: true,
    });
  }

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageToUpdate) return;

    try {
      await updateStage(stageToUpdate.id, formData);
      toast.success("Stage updated successfully!");
      setShowUpdateModal(false);
      setStageToUpdate(null);
      setFormData({
        name: "",
        sequence: 1,
        is_won: false,
        fold: false,
        color: "#6c757d",
        description: "",
        is_default: false,
        active: true,
        type: 'lead' as 'lead' | 'opportunity',
      });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Updated");
      setSuccessModalDescription("Stage updated successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to update stage");
      console.error("Update stage error:", error);
    }
  };

  const handleDeleteStage = async () => {
    if (!stageToDelete) return;

    try {
      await deleteStage(stageToDelete.id);
      toast.success("Stage deleted successfully!");
      setShowDeleteModal(false);
      setStageToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Deleted");
      setSuccessModalDescription("Stage deleted successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to delete stage");
      console.error("Delete stage error:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (stage: Stage) => {
    if (stage.is_won) {
      return <span className="status-badge success">Won</span>;
    }
    if (stage.fold) {
      return <span className="status-badge danger">Fold</span>;
    }
    if (stage.is_default) {
      return <span className="status-badge primary">Default</span>;
    }
    return <span className="status-badge success">Active</span>;
  };

  // Memoized columns for the table
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Stage",
        selector: (row: Stage) => row.name,
        sortable: true
      },
      {
        key: "sequence",
        name: "Sequence",
        selector: (row: Stage) => row.sequence,
        sortable: true,
        cell: (props: Stage) => (
          <span className="status-badge info">{props.sequence}</span>
        ),
      },
      {
        key: "type",
        name: "Type",
        selector: (row: Stage) => row.type,
        sortable: true,
        cell: (props: Stage) => (
          <span className={`status-badge ${props.type === 'lead' ? 'primary' : 'success'}`}>
            {props.type.charAt(0).toUpperCase() + props.type.slice(1)}
          </span>
        ),
      },
      {
        key: "color",
        name: "Color",
        selector: (row: Stage) => row.color,
        sortable: false,
        cell: (props: Stage) => (
          <div className="d-flex align-items-center">
            <div
              className="me-2"
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: props.color,
                borderRadius: "4px"
              }}
            />
            <span className="status-badge info">{props.color}</span>
          </div>
        ),
      },
      {
        key: "description",
        name: "Description",
        selector: (row: Stage) => row.description || "",
        sortable: true,
        cell: (props: Stage) => (
          
            <p>{props.description || "No description"}</p>
         
        ),
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: Stage) => row.created_at,
        sortable: true,
        cell: (props: Stage) => (
          <p>
            {new Date(props.created_at).toLocaleDateString()}
          </p>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: Stage) => row.id,
        sortable: false,
        cell: (props: Stage) => (
          <DatatableActionButton
            actions={[
              {
                label: 'Edit',
                icon: <FiEdit2 />,
                onClick: () => {
                  setStageToUpdate(props);
                  setFormData({
                    name: props.name,
                    sequence: props.sequence,
                    is_won: props.is_won,
                    fold: props.fold,
                    color: props.color,
                    description: props.description || "",
                    is_default: props.is_default,
                    active: props.active,
                    type: props.type,
                  });
                  setShowUpdateModal(true);
                },
                className: 'text-primary',
              },
              {
                label: 'Delete',
                icon: <FiTrash2 />,
                onClick: () => {
                  setStageToDelete(props);
                  setShowDeleteModal(true);
                },
                className: 'text-danger',
              },
            ]}
          />
        ),
      },
    ],
    []
  );

  const filters = useMemo(() => ({}), []);

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Stages"
      />

      <PageHeader
        title="Stages"
        showSearch={true}
        searchPlaceholder="Search stages..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
        buttons={
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <FiPlus className="me-2" />
            New Stage
          </Button>
        }
      />

      <div className="container-fluid">
        
        {/* Stages List */}
        <div className="row">
          <div className="col-12">
            <GenericListPage
              columns={columns}
              fetchData={fetchStagesForTable}
              title="Stages"
              searchPlaceholder="Search stages..."
              defaultPageSize={15}
              refreshKey={refreshKey}
              filters={filters}
              search={false}
              tableStyle="table-style-2"
             
            />
          </div>
        </div>
      </div>

      {/* Create Stage Modal */}
      {/* <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Stage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" onClick={handleSubmit}>
            <FiSave className="me-2" />
            Create Stage
          </Button>
        </Modal.Footer>
      </Modal> */}



      <FormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        title="Create Stage"
        desc="Please fill in the details below to create a new stage."
        formHtml={
         <>
         <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stage Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter stage name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sequence *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.sequence}
                    onChange={(e) => handleInputChange("sequence", parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value as 'lead' | 'opportunity')}
                    required
                  >
                    <option value="lead">Lead</option>
                    <option value="opportunity">Opportunity</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                  />
                </Form.Group>
              </Col>
              {/* <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="checkbox"
                      label="Won Stage"
                      checked={formData.is_won}
                      onChange={(e) => handleInputChange("is_won", e.target.checked)}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Fold Stage"
                      checked={formData.fold}
                      onChange={(e) => handleInputChange("fold", e.target.checked)}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Default"
                      checked={formData.is_default}
                      onChange={(e) => handleInputChange("is_default", e.target.checked)}
                    />
                  </div>
                </Form.Group>
              </Col> */}
            </Row>


            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter stage description (optional)"
              />
            </Form.Group>
          </Form>
         </>
        }
        submitButtonText="Create Stage"
        cancelButtonText="Cancel"
        onSubmit={() => {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          handleSubmit(mockEvent);
        }}
        onCancel={() => setShowCreateModal(false)}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

      {/* Update Stage Modal */}
      <FormModal
        show={showUpdateModal}
        onHide={handleCloseUpdateModal}
        title="Update Stage"
        desc="Please update the details below for this stage."
        formHtml={
         <>
         <Form onSubmit={handleUpdateStage}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stage Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter stage name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sequence *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.sequence}
                    onChange={(e) => handleInputChange("sequence", parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value as 'lead' | 'opportunity')}
                    required
                  >
                    <option value="lead">Lead</option>
                    <option value="opportunity">Opportunity</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>


            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter stage description (optional)"
              />
            </Form.Group>
          </Form>
         </>
        }
        submitButtonText="Update Stage"
        cancelButtonText="Cancel"
        onSubmit={() => {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          handleUpdateStage(mockEvent);
        }}
        onCancel={handleCloseUpdateModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title="Delete Stage"
        description="Are you sure you want to delete this stage?"
        targetName={stageToDelete?.name || ""}
        onConfirm={handleDeleteStage}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        requireTextConfirmation={true}
        requiredConfirmationText="delete"
      />


	
<SuccessfulModal
          show={showSuccessfulModal}
          onHide={() => setShowSuccessfulModal(false)}
          title={successModalTitle}
          description={successModalDescription}
        />
		


    </React.Fragment>
  );
};

StagesManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default StagesManagement;
