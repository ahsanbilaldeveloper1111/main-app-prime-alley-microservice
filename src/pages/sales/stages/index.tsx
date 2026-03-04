import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Column } from "@components/CustomDataTable";
import {
  Card,
  CardBody,
  Col,
  Row,
  Badge,
  Button,
  Modal,
  Form,
  Alert,
  Dropdown,
} from "react-bootstrap";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiMoreVertical,
} from "react-icons/fi";
import Link from "next/link";
import {
  listOrderStages,
  createOrderStage,
  deleteOrderStage,
  OrderStageData,
  updateOrderStage,
} from "../../../utils/sales";
import { toast } from "react-toastify";

const OrderStages = () => {
  const [stages, setStages] = useState<OrderStageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStage, setEditingStage] = useState<OrderStageData | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#007bff",
    is_default: false,
    is_completed: false,
    is_cancelled: false,
  });

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      setLoading(true);
      const stagesData = await listOrderStages();
      setStages(stagesData);
    } catch (error) {
      console.error("Failed to load stages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStage) {
        await updateOrderStage(editingStage.id, formData);
        toast.success("Stage updated successfully");
      } else {
        await createOrderStage(formData);
        toast.success("Stage created successfully");
      }
      setShowModal(false);
      setEditingStage(null);
      setFormData({
        name: "",
        description: "",
        color: "#007bff",
        is_default: false,
        is_completed: false,
        is_cancelled: false,
      });
      // Reload stages data from API and then refresh the table
      await loadStages();
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save stage");
    }
  };

  const handleEdit = (stage: OrderStageData) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      description: stage.description || "",
      color: stage.color,
      is_default: stage.is_default,
      is_completed: stage.type === "completed",
      is_cancelled: stage.type === "cancelled",
    });
    setShowModal(true);
  };

  const handleDelete = async (stage: OrderStageData) => {
    if (window.confirm(`Are you sure you want to delete stage "${stage.name}"?`)) {
      try {
        await deleteOrderStage(stage.id);
        toast.success("Stage deleted successfully");
        // Reload stages data from API and then refresh the table
        setRefreshKey(prev => prev + 1);
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete stage");
      }
    }
  };

  const fetchStages = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        // Use the existing stages data from state instead of calling API again
        let filteredData = await listOrderStages();
        
        if (search) {
          filteredData = filteredData.filter(stage =>
            stage.name.toLowerCase().includes(search.toLowerCase()) ||
            (stage.description && stage.description.toLowerCase().includes(search.toLowerCase())));
        }

        // Simulate pagination
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return {
          dataList: paginatedData,
          meta: {
            total: filteredData.length,
            current_page: page,
            per_page: perPage,
            last_page: Math.ceil(filteredData.length / perPage)
          }
        };
      } catch (error) {
        console.error("Failed to fetch stages:", error);
        return {
          dataList: [],
          meta: {
            total: 0,
            current_page: 1,
            per_page: perPage,
            last_page: 1
          }
        };
      }
    },
    [] // Add stages as dependency
  );

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Stage Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-medium">{props.name}</div>
            {props.description && (
              <small className="text-muted">{props.description}</small>
            )}
          </div>
        ),
      },
      {
        key: "type",
        name: "Type",
        selector: (row: any) => row.type,
        sortable: true,
        cell: (props: any) => {
          const type = props.type || "default";
          const typeColors: Record<string, string> = {
            new: "primary",
            processing: "info",
            completed: "success",
            cancelled: "danger",
            default: "secondary",
          };

          return (
            <Badge bg={typeColors[type] || "secondary"}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          );
        },
      },
      {
        key: "color",
        name: "Color",
        selector: (row: any) => row.color,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex align-items-center">
            <div
              className="me-2"
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: props.color,
                borderRadius: "4px",
                border: "1px solid #dee2e6",
              }}
            />
            <span className="text-muted">{props.color}</span>
          </div>
        ),
      },
      {
        key: "is_default",
        name: "Default",
        selector: (row: any) => row.is_default,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.is_default ? (
              <Badge bg="success">
                <FiCheckCircle className="me-1" size={12} />
                Default
              </Badge>
            ) : (
              <span className="text-muted">-</span>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {new Date(props.created_at).toLocaleDateString()}
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
            <Button 
              variant="outline-danger"
              size="sm"
              disabled={props?.ticket_count > 0}
              onClick={() => handleDelete(props)}
            >
              <FiTrash2 className="me-2" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  );
  const memoizedFilters = useMemo(() => ({}), []);

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Sales"
        mainLink="/sales"
        subTitle="Order Stages"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Order Stages
              <Link href="/sales/stages/manage">
                  <Button variant="outline-success" size="sm">
                    <FiEdit className="me-2" />
                    Manage Stages
                  </Button>
                </Link>
            </h2>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchStages}
        title="Order Stages"
        searchPlaceholder="Search stages..."
        refreshKey={refreshKey}
        search={true}
        filters={memoizedFilters}
      />

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingStage ? "Edit Stage" : "Create New Stage"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
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
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter stage description"
                  />
                </Form.Group>
                <Row>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Set as Default"
                      checked={formData.is_default}
                      onChange={(e) => handleInputChange("is_default", e.target.checked)}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Completion Stage"
                      checked={formData.is_completed}
                      onChange={(e) => handleInputChange("is_completed", e.target.checked)}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Cancellation Stage"
                      checked={formData.is_cancelled}
                      onChange={(e) => handleInputChange("is_cancelled", e.target.checked)}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingStage ? "Update Stage" : "Create Stage"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

OrderStages.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OrderStages;
