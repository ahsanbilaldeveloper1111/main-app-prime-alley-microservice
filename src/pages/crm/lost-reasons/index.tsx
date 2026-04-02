import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import CrmColorCell from "@pages/crm/crmColorCell";
import {
  getLostReasons,
  createLostReason,
  updateLostReason,
  deleteLostReason,
} from "@utils/crm";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Col, Badge, Form, Alert } from "react-bootstrap";
import { FiEdit, FiTrash2, FiPlus, FiSave, FiEdit2 } from "react-icons/fi";
import { toast } from "react-toastify";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { useSession } from "next-auth/react";

interface LostReason {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  ticket_count?: number;
}

const LostReasonsManagement = () => {
  const { data: session } = useSession();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reasonToUpdate, setReasonToUpdate] = useState<LostReason | null>(null);
  const [reasonToDelete, setReasonToDelete] = useState<LostReason | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({ search: "" });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#dc3545",
  });


  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  const fetchLostReasonsForTable = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const reasonsData = await getLostReasons();
        const searchTerm = currentFilters.search || search;
        const filteredReasons = reasonsData.filter((reason) => {
          if (!searchTerm) return true;
          return (
            !!reason.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            !!reason.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        });

        return {
          dataList: filteredReasons,
          meta: {
            total: filteredReasons.length,
            current_page: page,
            per_page: perPage,
            last_page: Math.ceil(filteredReasons.length / perPage),
          },
        };
      } catch (error) {
        console.error("Failed to fetch lost reasons:", error);
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

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createLostReason(formData);
      toast.success("Lost reason created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        description: "",
        color: "#dc3545",
      });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lost Reason Created");
      setSuccessModalDescription("Lost reason created successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to create lost reason");
      console.error("Create lost reason error:", error);
    }
  };

  const handleUpdateReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonToUpdate) return;

    try {
      await updateLostReason(reasonToUpdate.id, formData);
      toast.success("Lost reason updated successfully!");
      setShowUpdateModal(false);
      setReasonToUpdate(null);
      setFormData({
        name: "",
        description: "",
        color: "#dc3545",
      });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lost Reason Updated");
      setSuccessModalDescription("Lost reason updated successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to update lost reason");
      console.error("Update lost reason error:", error);
    }
  };

  const handleDeleteReason = async () => {
    if (!reasonToDelete) return;

    try {
      await deleteLostReason(reasonToDelete.id);
      toast.success("Lost reason deleted successfully!");
      setShowDeleteModal(false);
      setReasonToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lost Reason Deleted");
      setSuccessModalDescription("Lost reason deleted successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to delete lost reason");
      console.error("Delete lost reason error:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  // Memoized columns for the table
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Reason",
        selector: (row: LostReason) => row.name,
        sortable: true
      },
      {
        key: "color",
        name: "Color",
        selector: (row: LostReason) => row.color,
        sortable: false,
        cell: (props: LostReason) => <CrmColorCell color={props.color} />,
      },
      {
        key: "description",
        name: "Description",
        selector: (row: LostReason) => row.description || "",
        sortable: true,
        cell: (props: LostReason) => (
          <p>
            {props.description || "No description"}
          </p>
        ),
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: LostReason) => row.created_at,
        sortable: true,
        cell: (props: LostReason) => (
          <p>
            {new Date(props.created_at).toLocaleDateString()}
          </p>
        ),
      },

      ...(session?.user?.permissions?.includes('edit-crm-lost-reasons') || session?.user?.permissions?.includes('delete-crm-lost-reasons') ? [
      {
        key: "actions",
        name: "Actions",
        selector: (row: LostReason) => row.id,
        sortable: false,
        cell: (props: LostReason) => (
          <div className="d-flex gap-1">
            <DatatableActionButton
              actions={[
               ...(session?.user?.permissions?.includes('edit-crm-lost-reasons') ? [
                {
                  label: 'Edit',
                  className: 'text-primary',
                  icon: <FiEdit2 />,
                  onClick: () => {
                    setReasonToUpdate(props);
                    setFormData({
                      name: props.name,
                      description: props.description || "",
                      color: props.color,
                    });
                    setShowUpdateModal(true);
                  },
                },
               ] : []),
               ...(session?.user?.permissions?.includes('delete-crm-lost-reasons') ? [
                {
                  label: 'Delete',
                  className: 'text-danger',
                  icon: <FiTrash2 />,
                  onClick: () => {
                    setReasonToDelete(props);
                    setShowDeleteModal(true);
                  },
                },
               ] : []),
               
                
              ]}
            
            />
          </div>
        ),
      },
      ] : []),

    ],
    []
  );

  const filters = useMemo(() => ({}), []);

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Lost Reasons"
      />

        <PageHeader
          title="Lost Reasons"
          showSearch={session?.user?.permissions?.includes('list-crm-lost-reasons')}
          searchValue={currentFilters.search || ""}
          onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
        searchPlaceholder="Search lost reasons..."
        buttons={
          <>
          {session?.user?.permissions?.includes('add-crm-lost-reasons') && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus className="me-2" />
            New Lost Reason
          </Button>
          )}
          </>
        }
      />
   

      <div className="container-fluid">
        {/* Header */}
        {/* <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">Lost Reasons Management</h1>
                <p className="text-muted">
                  Manage reasons why leads are marked as lost
                </p>
              </div>
              <div>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FiPlus className="me-2" />
                  New Lost Reason
                </Button>
              </div>
            </div>
          </div>
        </div> */}

        {/* Lost Reasons List */}
        <div className="row">
          <div className="col-12">
            <GenericListPage
              columns={columns}
              fetchData={fetchLostReasonsForTable}
              title="Lost Reasons"
              searchPlaceholder="Search lost reasons..."
              defaultPageSize={15}
              refreshKey={refreshKey}
              filters={filters}
              search={false}
              pagination={false}
              tableStyle="table-style-2"
            />
          </div>
        </div>
      </div>

      <FormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        title="Create New Lost Reason"
        desc="Please fill in the details below to create a new lost reason."
        submitButtonText="Create Lost Reason"
        cancelButtonText="Cancel"
        size="lg"
        onSubmit={() => { 
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          handleCreateSubmit(mockEvent); 
        }}
        onCancel={() => setShowCreateModal(false)}
        formHtml={
          <>
          <Form onSubmit={handleCreateSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Reason Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter reason name"
                    required
                  />
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
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter reason description (optional)"
              />
            </Form.Group>
          </Form>
          </>
        }
      />

      {/* Update Lost Reason Modal */}
      <FormModal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        title="Update Lost Reason"
        desc="Please update the details below for this lost reason."
        submitButtonText="Update Lost Reason"
        cancelButtonText="Cancel"
        size="lg"
        onSubmit={() => { 
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          handleUpdateReason(mockEvent); 
        }}
        onCancel={() => setShowUpdateModal(false)}
        formHtml={
          <>
          <Form onSubmit={handleUpdateReason}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Reason Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter reason name"
                    required
                  />
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
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter reason description (optional)"
              />
            </Form.Group>
          </Form>
          </>
        }
      />

<SuccessfulModal
          show={showSuccessfulModal}
          onHide={() => setShowSuccessfulModal(false)}
          title={successModalTitle}
          description={successModalDescription}
        />



      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title="Delete Lost Reason"
        description={`Are you sure you want to delete ${reasonToDelete?.name} lost reason?`}
        onConfirm={handleDeleteReason}
        targetName={reasonToDelete?.name || ""}
        confirmButtonText="Delete Lost Reason"
        cancelButtonText="Cancel"
        confirmButtonVariant="danger"
        cancelButtonVariant="secondary"
        onCancel={() => setShowDeleteModal(false)}
      />







    </React.Fragment>
  );
};

LostReasonsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LostReasonsManagement;
