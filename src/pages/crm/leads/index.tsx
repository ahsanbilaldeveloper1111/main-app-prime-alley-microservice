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
import CrmFilters from "@components/filters/CrmFilters";
import {
  getLeads,
  deleteLead,
  convertLead,
  markLeadLost,
  getStages,
  getLostReasons,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { Column } from "@components/CustomDataTable";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Dropdown,
  Form,
  Alert,
  Card,
} from "react-bootstrap";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiTarget,
  FiXCircle,
  FiPlus,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";

const CrmLeads = () => {
  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<
    { id: number; name: string }[]
  >([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

  // Fetch stages and lost reasons on component mount
  useEffect(() => {
    fetchStages();
    fetchLostReasons();
    fetchExtensions();
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages();
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchLostReasons = async () => {
    try {
      const reasonsData = await getLostReasons();
      setLostReasons(reasonsData || []);
    } catch (error) {
      console.error("Failed to fetch lost reasons:", error);
    }
  };

  const fetchExtensions = async () => {
    try {
      const hierarchyData = await GetHierarchyData();
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
    } catch (error) {
      console.error("Failed to fetch extensions:", error);
    }
  };

  const fetchLeads = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const params: any = {
        page,
        per_page: perPage,
      };

      if (search) {
        params.search = search;
      }

      // Add filter parameters at top level
      if (currentFilters.stage_id) {
        params.stage_id = currentFilters.stage_id;
      }
      if (currentFilters.is_lost !== undefined) {
        params.is_lost = currentFilters.is_lost;
      }

      const response = await getLeads(params);
      console.log("Raw response from getLeads:", response);

      // Transform PaginationWrapper to GenericListPage expected format
      if (response?.data && response?.total !== undefined) {
        const transformedData = {
          dataList: response.data || [],
          meta: {
            total: response.total || 0,
            current_page: response.current_page || page,
            per_page: response.per_page || perPage,
            last_page: response.last_page || 1,
          },
        };
        console.log("Transformed data:", transformedData);
        return transformedData;
      }

      // Fallback for other response structures
      const fallbackData = {
        dataList: response?.data || [],
        meta: {
          total: response?.total || 0,
          current_page: response?.current_page || page,
          per_page: response?.per_page || perPage,
          last_page: response?.last_page || 1,
        },
      };
      console.log("Fallback data:", fallbackData);
      return fallbackData;
    },
    [currentFilters] // Add currentFilters as dependency
  );

  // Delete Lead Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);

  const handleDeleteLead = useCallback((leadId: number) => {
    setLeadToDelete({ id: leadId });
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteLead = useCallback(async () => {
    if (!leadToDelete) return;

    try {
      await deleteLead(leadToDelete.id);
      setShowDeleteModal(false);
      setLeadToDelete(null);
      // Refresh the list
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  }, [leadToDelete]);

  // Convert Lead Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<any>(null);
  const [convertFormData, setConvertFormData] = useState({
    opportunity_name: "",
    value: "",
    probability: "",
    expected_close_date: "",
    description: "",
  });

  const handleConvertLead = useCallback((lead: any) => {
    setLeadToConvert(lead);
    setConvertFormData({
      opportunity_name: lead.name || "",
      value: lead.value?.toString() || "",
      probability: "50",
      expected_close_date: lead.expected_close_date || "",
      description: lead.description || "",
    });
    setShowConvertModal(true);
  }, []);

  const handleConvertSubmit = useCallback(async () => {
    if (!leadToConvert) return;

    try {
      await convertLead(leadToConvert.id);
      setShowConvertModal(false);
      setLeadToConvert(null);
      setConvertFormData({
        opportunity_name: "",
        value: "",
        probability: "",
        expected_close_date: "",
        description: "",
      });
      toast.success("Lead converted successfully!");
      // Refresh the list
      window.location.reload();
    } catch (error) {
      console.error("Failed to convert lead:", error);
    }
  }, [leadToConvert, convertFormData]);

  // Mark Lead Lost Modal
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [leadToMarkLost, setLeadToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");

  const handleMarkLost = useCallback((lead: any) => {
    setLeadToMarkLost(lead);
    setShowMarkLostModal(true);
  }, []);

  const handleMarkLostSubmit = useCallback(async () => {
    if (!leadToMarkLost || !lostReasonId) return;

    try {
      await markLeadLost(leadToMarkLost.id, {
        lost_reason_id: lostReasonId,
        lost_feedback: lostFeedback,
      });
      setShowMarkLostModal(false);
      setLeadToMarkLost(null);
      setLostReasonId(null);
      setLostFeedback("");
      toast.success("Lead marked as lost!");
      // Refresh the list
      window.location.reload();
    } catch (error) {
      console.error("Failed to mark lead as lost:", error);
    }
  }, [leadToMarkLost, lostReasonId, lostFeedback]);

  // Define columns after all handler functions
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-medium">{props.name || "Unnamed Lead"}</div>
            <small className="text-muted">
              {props.description || "No Description"}
            </small>
          </div>
        ),
      },
      {
        key: "contact",
        name: "Contact",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div>
              Extension:{" "}
              {extensions.find(
                (extension: any) =>
                  extension.id.toString() === props.user_extension?.toString()
              )?.display_name ||
                props.user_extension ||
                "No Extension"}
            </div>
            <small className="text-muted">Type: {props.type || "lead"}</small>
          </div>
        ),
      },
      {
        key: "stage_name",
        name: "Stage",
        selector: (row: any) => row.stage?.name || "New",
        sortable: true,
        cell: (props: any) => (
          <Badge bg="secondary">{props.stage?.name || "New"}</Badge>
        ),
      },
      {
        key: "status",
        name: "Status",
        selector: (row: any) => row.status,
        sortable: true,
        cell: (props: any) => {
          const status = props.status || "new";
          const isLost = props.is_lost || false;

          if (isLost) {
            return (
              <div>
                <Badge bg="danger">Lost</Badge>
                {props.lost_reason && (
                  <div className="mt-1">
                    <small className="text-muted">
                      Reason: {props.lost_reason.name}
                    </small>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Badge bg={status === "new" ? "primary" : "info"}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span>
            {props.created_at
              ? new Date(props.created_at).toLocaleDateString()
              : "Unknown"}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              Actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item href={`/crm/leads/${props.id}`}>
                <FiEye className="me-2" />
                View
              </Dropdown.Item>
              <Dropdown.Item href={`/crm/leads/${props.id}/edit`}>
                <FiEdit className="me-2" />
                Edit
              </Dropdown.Item>
              {!props.is_lost && !props.is_opportunity && (
                <Dropdown.Item onClick={() => handleConvertLead(props)}>
                  <FiTarget className="me-2" />
                  Convert to Opportunity
                </Dropdown.Item>
              )}
              {!props.is_lost && (
                <Dropdown.Item onClick={() => handleMarkLost(props)}>
                  <FiXCircle className="me-2" />
                  Mark as Lost
                </Dropdown.Item>
              )}
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() => handleDeleteLead(props.id)}
                className="text-danger"
              >
                <FiTrash2 className="me-2" />
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        ),
      },
    ],
    [extensions]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Leads"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">Leads Management</h1>
                <p className="text-muted">Manage and track your sales leads</p>
              </div>
              <div>
                <Link href="/crm/leads/create" className="btn btn-primary">
                  <FiPlus className="me-2" />
                  New Lead
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CRM Filters */}
        <div className="row mb-3">
          <CrmFilters onFiltersChange={handleFiltersChange} />
        </div>

        {/* Leads List */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <GenericListPage
                  columns={columns}
                  fetchData={fetchLeads}
                  title="Leads"
                  searchPlaceholder="Search leads..."
                  defaultPageSize={15}
                  filters={currentFilters}
                  refreshKey={refreshKey}
                />
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Lead</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this lead? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteLead}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Convert Lead Modal */}
      <Modal
        show={showConvertModal}
        onHide={() => setShowConvertModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Convert Lead to Opportunity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Opportunity Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={convertFormData.opportunity_name}
                    onChange={(e) =>
                      setConvertFormData({
                        ...convertFormData,
                        opportunity_name: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Value</Form.Label>
                  <Form.Control
                    type="number"
                    value={convertFormData.value}
                    onChange={(e) =>
                      setConvertFormData({
                        ...convertFormData,
                        value: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Probability (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={convertFormData.probability}
                    onChange={(e) =>
                      setConvertFormData({
                        ...convertFormData,
                        probability: e.target.value,
                      })
                    }
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expected Close Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={convertFormData.expected_close_date}
                    onChange={(e) =>
                      setConvertFormData({
                        ...convertFormData,
                        expected_close_date: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={convertFormData.description}
                onChange={(e) =>
                  setConvertFormData({
                    ...convertFormData,
                    description: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConvertModal(false)}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={handleConvertSubmit}>
            Convert to Opportunity
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Mark Lead Lost Modal */}
      <Modal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Mark Lead as Lost</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Lost Reason *</Form.Label>
            <Form.Select
              value={lostReasonId || ""}
              onChange={(e) =>
                setLostReasonId(e.target.value ? Number(e.target.value) : null)
              }
              required
            >
              <option value="">Select a reason</option>
              {lostReasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Additional Feedback</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={lostFeedback}
              onChange={(e) => setLostFeedback(e.target.value)}
              placeholder="Please provide additional feedback about why this lead was lost..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMarkLostModal(false)}
          >
            Cancel
          </Button>
          <Button variant="warning" onClick={handleMarkLostSubmit}>
            Mark as Lost
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CrmLeads.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmLeads;
