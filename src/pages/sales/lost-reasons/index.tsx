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
  FiXCircle,
  FiEye,
  FiMoreVertical,
} from "react-icons/fi";
import Link from "next/link";
import {
  listOrderLostReasons,
  createOrderLostReason,
  updateOrderLostReason,
  deleteOrderLostReason,
  OrderLostReasonData,
} from "@utils/sales";
import { toast } from "react-toastify";

const LostReasons = () => {
  const [reasons, setReasons] = useState<OrderLostReasonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReason, setEditingReason] =
    useState<OrderLostReasonData | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#dc3545",
    sequence: 0,
    active: true,
  });

  
  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReason) {
        await updateOrderLostReason(editingReason.id, formData);
        toast.success("Lost reason updated successfully");
      } else {
        await createOrderLostReason(formData);
        toast.success("Lost reason created successfully");
      }
      setShowModal(false);
      setEditingReason(null);
      setFormData({
        name: "",
        description: "",
        color: "#dc3545",
        sequence: 0,
        active: true,
      });
      // Reload reasons data from API and then refresh the table
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save lost reason");
    }
  };

  const handleEdit = (reason: OrderLostReasonData) => {
    setEditingReason(reason);
    setFormData({
      name: reason.name,
      description: reason.description || "",
      color: reason.color,
      sequence: reason.sequence,
      active: reason.active,
    });
    setShowModal(true);
  };

  const handleDelete = async (reason: OrderLostReasonData) => {
    if (
      window.confirm(
        `Are you sure you want to delete lost reason "${reason.name}"?`
      )
    ) {
      try {
        await deleteOrderLostReason(reason.id);
        toast.success("Lost reason deleted successfully");
        // Reload reasons data from API and then refresh the table
        setRefreshKey((prev) => prev + 1);
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete lost reason");
      }
    }
  };

  const fetchLostReasons = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      try {
        // Use the existing reasons data from state instead of calling API again
        let filteredData = await listOrderLostReasons();

        if (search) {
          filteredData = filteredData.filter(
            (reason) =>
              reason.name.toLowerCase().includes(search.toLowerCase()) ||
              (reason.description &&
                reason.description.toLowerCase().includes(search.toLowerCase()))
          );
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
            last_page: Math.ceil(filteredData.length / perPage),
          },
        };
      } catch (error) {
        console.error("Failed to fetch lost reasons:", error);
        return {
          dataList: [],
          meta: {
            total: 0,
            current_page: 1,
            per_page: perPage,
            last_page: 1,
          },
        };
      }
    },
    [reasons] // Add reasons as dependency
  );

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Reason Name",
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
        key: "sequence",
        name: "Sequence",
        selector: (row: any) => row.sequence,
        sortable: true,
        cell: (props: any) => <Badge bg="info">{props.sequence}</Badge>,
      },
      {
        key: "active",
        name: "Status",
        selector: (row: any) => row.active,
        sortable: true,
        cell: (props: any) => (
          <Badge bg={props.active ? "success" : "danger"}>
            {props.active ? "Active" : "Inactive"}
          </Badge>
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
        subTitle="Lost Reasons"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Lost Reasons
              <Button
                variant="outline-primary"
                size="sm"
                className="ms-3"
                onClick={() => setShowModal(true)}
              >
                <FiPlus className="me-2" />
                New Lost Reason
              </Button>
            </h2>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchLostReasons}
        title="Lost Reasons"
        searchPlaceholder="Search lost reasons..."
        defaultPageSize={15}
        refreshKey={refreshKey}
        search={true}
        filters={memoizedFilters}
      />

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingReason ? "Edit Lost Reason" : "Create New Lost Reason"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Reason Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter lost reason name"
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sequence</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.sequence}
                    onChange={(e) =>
                      handleInputChange("sequence", parseInt(e.target.value))
                    }
                    placeholder="Enter sequence number"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <div className="mt-2">
                    <Form.Check
                      type="switch"
                      id="active-switch"
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
                placeholder="Enter description (optional)"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingReason ? "Update Lost Reason" : "Create Lost Reason"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

LostReasons.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LostReasons;
