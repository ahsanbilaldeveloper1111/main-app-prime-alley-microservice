import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  getLostReasons,
  createLostReason,
  updateLostReason,
  deleteLostReason,
} from "@utils/crm";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Col, Badge, Form, Alert } from "react-bootstrap";
import { FiEdit, FiTrash2, FiPlus, FiSave } from "react-icons/fi";
import { toast } from "react-toastify";

interface LostReason {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  color: string;
  sequence: number;
  created_at: string;
  updated_at: string;
  ticket_count?: number;
}

const LostReasonsManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingReason, setEditingReason] = useState<LostReason | null>(null);
  const [reasonToDelete, setReasonToDelete] = useState<LostReason | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
    color: "#dc3545",
    sequence: 1,
  });

  const fetchLostReasonsForTable = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        const reasonsData = await getLostReasons();
        const filteredReasons = reasonsData.filter((reason) => {
          if (!search) return true;
          return (
            !!reason.name.toLowerCase().includes(search.toLowerCase()) ||
            !!reason.description?.toLowerCase().includes(search.toLowerCase())
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
    []
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createLostReason(formData);
      toast.success("Lost reason created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        description: "",
        active: true,
        color: "#dc3545",
        sequence: 1,
      });
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to create lost reason");
      console.error("Create lost reason error:", error);
    }
  };

  const handleDeleteReason = async () => {
    if (!reasonToDelete) return;

    try {
      await deleteLostReason(reasonToDelete.id);
      toast.success("Lost reason deleted successfully!");
      setShowDeleteModal(false);
      setReasonToDelete(null);
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

  const getStatusBadge = (reason: LostReason) => {
    if (reason.active) {
      return <Badge bg="success">Active</Badge>;
    }
    return <Badge bg="secondary">Inactive</Badge>;
  };

  // Memoized columns for the table
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Reason",
        selector: (row: LostReason) => row.name,
        sortable: true,
        cell: (props: LostReason) => (
          <div className="d-flex align-items-center">
            <div
              className="me-2"
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: props.color,
                borderRadius: "50%",
              }}
            />
            <strong>{props.name}</strong>
          </div>
        ),
      },
      {
        key: "sequence",
        name: "Sequence",
        selector: (row: LostReason) => row.sequence,
        sortable: true,
        cell: (props: LostReason) => (
          <Badge bg="secondary">{props.sequence}</Badge>
        ),
      },
      {
        key: "color",
        name: "Color",
        selector: (row: LostReason) => row.color,
        sortable: false,
        cell: (props: LostReason) => (
          <div className="d-flex align-items-center">
            <div
              className="me-2"
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: props.color,
                borderRadius: "4px",
              }}
            />
            <small className="text-muted">{props.color}</small>
          </div>
        ),
      },
      {
        key: "status",
        name: "Status",
        selector: (row: LostReason) => (row.active ? "active" : "inactive"),
        sortable: true,
        cell: (props: LostReason) => getStatusBadge(props),
      },
      {
        key: "description",
        name: "Description",
        selector: (row: LostReason) => row.description || "",
        sortable: true,
        cell: (props: LostReason) => (
          <small className="text-muted">
            {props.description || "No description"}
          </small>
        ),
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: LostReason) => row.created_at,
        sortable: true,
        cell: (props: LostReason) => (
          <small className="text-muted">
            {new Date(props.created_at).toLocaleDateString()}
          </small>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: LostReason) => row.id,
        sortable: false,
        cell: (props: LostReason) => (
          <div className="d-flex gap-1">
            <Button
              variant="outline-danger"
              disabled={props?.ticket_count !== undefined && props?.ticket_count > 0}
              size="sm"
              onClick={() => {
                setReasonToDelete(props);
                setShowDeleteModal(true);
              }}
            >
              <FiTrash2 />
            </Button>
          </div>
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
        subTitle="Lost Reasons"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
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
        </div>

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
              pagination={false}
            />
          </div>
        </div>
      </div>

      {/* Create Lost Reason Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Lost Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                  <Form.Label>Sequence *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.sequence}
                    onChange={(e) =>
                      handleInputChange("sequence", parseInt(e.target.value))
                    }
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      label="Active"
                      checked={formData.active}
                      onChange={(e) =>
                        handleInputChange("active", e.target.checked)
                      }
                    />
                  </div>
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" onClick={handleCreateSubmit}>
            <FiSave className="me-2" />
            Create Lost Reason
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Lost Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Warning!</strong> Deleting this lost reason will affect all
            leads currently marked as lost with this reason.
          </Alert>
          <p>
            Are you sure you want to delete the lost reason{" "}
            <strong>{reasonToDelete?.name}</strong>?
          </p>
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteReason}>
            <FiTrash2 className="me-2" />
            Delete Lost Reason
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

LostReasonsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LostReasonsManagement;
