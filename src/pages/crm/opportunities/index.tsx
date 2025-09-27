import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import CrmFilters from "@components/filters/CrmFilters";
import { getOpportunities, deleteOpportunity, markLeadLost, getLostReasons } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Col, Badge, Dropdown, Form } from "react-bootstrap";
import { toast } from "react-toastify";


import {
  FiTarget,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiXCircle,
} from "react-icons/fi";
import Link from "next/link";

const CrmOpportunities = () => {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<string>("");
  
  // Mark as Lost Modal State
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [opportunityToMarkLost, setOpportunityToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");
  const [lostReasons, setLostReasons] = useState<{ id: number; name: string }[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);
  
  // Fetch lost reasons on component mount
  useEffect(() => {
    fetchLostReasons();
    fetchExtensions();
  }, []);

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



  // Mark Opportunity Lost Handlers
  const handleMarkLost = useCallback((opportunity: any) => {
    setOpportunityToMarkLost(opportunity);
    setShowMarkLostModal(true);
  }, []);

  const handleMarkLostSubmit = useCallback(async () => {
    if (!opportunityToMarkLost || !lostReasonId) return;

    try {
      await markLeadLost(opportunityToMarkLost.id, {
        lost_reason_id: lostReasonId,
        lost_feedback: lostFeedback,
      });
      setShowMarkLostModal(false);
      setOpportunityToMarkLost(null);
      setLostReasonId(null);
      setLostFeedback("");
      toast.success("Opportunity marked as lost!");
      // Refresh the list
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to mark opportunity as lost:", error);
    }
  }, [opportunityToMarkLost, lostReasonId, lostFeedback]);
  
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
        name: "Extension & Type",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div>Extension: {extensions.find(
              (extension: any) =>
                extension.id.toString() === props.user_extension?.toString()
            )?.display_name || props.user_extension || "No Extension"}</div>
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
              
              <Dropdown.Item href={`/crm/leads/${props.id}/edit`}>
                <FiEdit className="me-2" />
                Edit
              </Dropdown.Item>
              {!props.is_lost && (
                <Dropdown.Item onClick={() => handleMarkLost(props)}>
                  <FiXCircle className="me-2" />
                  Mark as Lost
                </Dropdown.Item>
              )}
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() => handleDeleteOpportunity(props)}
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

  const fetchOpportunities = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const params: any = {
        page,
        perPage,
        search,
      };

      // Add filter parameters at top level
      if (memoizedFilters.stage_id) {
        params.stage_id = memoizedFilters.stage_id;
      }
      if (memoizedFilters.is_lost !== undefined) {
        params.is_lost = memoizedFilters.is_lost;
      }

      return await getOpportunities(params);
    },
    [memoizedFilters]
  );



  const handleDeleteOpportunity = useCallback((opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setShowDeleteModal(true);
  }, []);

  const handleSubmitDelete = useCallback(async () => {
    const confirmDeleteValue = confirmDelete.trim().toLowerCase();
    if (confirmDeleteValue === "delete") {
      try {
        await deleteOpportunity(selectedOpportunity.id);
        setShowDeleteModal(false);
        setSelectedOpportunity(null);
        setConfirmDelete("");
        setRefreshKey((oldKey) => oldKey + 1);
        toast.success("Opportunity deleted successfully!");
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to delete opportunity");
      }
    } else {
      toast.error('Please type the word "delete" to confirm');
    }
  }, [confirmDelete, selectedOpportunity]);

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Opportunities"
      />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              <FiTarget className="me-2" />
              Opportunities Management
            </h2>
            <p className="text-muted mb-0">
              Track your sales opportunities and manage your pipeline
            </p>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={12}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button
                variant="success"
                href="/crm/leads/create?type=opportunity"
                className="d-flex align-items-center"
              >
                <FiPlus className="me-2" />
                New Opportunity
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* CRM Filters */}
      <div className="row mb-3">
        <div className="col-12">
          <CrmFilters onFiltersChange={setCurrentFilters} />
        </div>
      </div>

      <GenericListPage
        columns={columns}
        fetchData={fetchOpportunities}
        title="Opportunities"
        searchPlaceholder="Search opportunities..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Opportunity?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the opportunity{" "}
            <b className="text-danger">{selectedOpportunity?.name}</b>?
          </p>
          <p>
            Type the word <b className="text-danger">delete</b> to confirm
          </p>
          <input
            type="text"
            className="form-control"
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            placeholder="Type the word delete to confirm"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmitDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Mark Opportunity Lost Modal */}
      <Modal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Mark Opportunity as Lost</Modal.Title>
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
              placeholder="Please provide additional feedback about why this opportunity was lost..."
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

CrmOpportunities.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmOpportunities;
