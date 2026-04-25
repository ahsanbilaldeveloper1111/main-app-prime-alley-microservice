import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import CrmFilters from "@components/filters/CrmFilters";
import { getOpportunities, deleteOpportunity, markLeadLost, getLostReasons } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Col, Badge, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";



import {
  FiTarget,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiXCircle,
  FiEye,
} from "react-icons/fi";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ModuleSlug, formatDateForTable } from "@utils/Helper";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

const CrmOpportunities = () => {

  const { data: session } = useSession();
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
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_OPPORTUNITIES);
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
            <div className="fw-medium text-capitalize">{props.name || "Unnamed Lead"}</div>
            <small 
              className="text-muted" 
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '300px'
              }}
            >
              {props.description || "No Description"}
            </small>
          </div>
        ),
      },
      {
        key: "company_name",
        name: "Company",
        selector: (row: any) => row.company_name,
        sortable: true,
        cell: (props: any) => (
          <span className={`status-badge primary ${props.company_name ? "primary" : "info"}`}>{props.company_name || "No Company"}</span>
        ),
      },
      {
        key: "stage_name",
        name: "Stage",
        selector: (row: any) => row.stage?.name || "New",
        sortable: true,
        cell: (props: any) => (
          <><span className="status-badge primary">{props.stage?.name || "New"}</span>
          <br />
          <small className="text-muted">{props?.lost_reason?.name}</small>
          </>
        ),
      },
      {
        key: "status",
        name: "Status",
        selector: (row: any) => {
          const stageName = (row.stage?.name || "New").toLowerCase();
          if (stageName.includes("new")) return "New";
          if (stageName.includes("lost") || stageName.includes("won")) return "Closed";
          return "In Progress";
        },
        sortable: true,
        cell: (props: any) => {
          const stageName = (props.stage?.name || "New").toLowerCase();
          let status = "In Progress";
          let statusClass = "info";

          if (stageName.includes("new")) {
            status = "New";
            statusClass = "primary";
          } else if (stageName.includes("lost") || stageName.includes("won")) {
            status = "Closed";
            statusClass = "danger";
          }

          if(props?.is_lost) {
            status = "Lost";
            statusClass = "danger";
          }
          return (
            <span className={`status-badge text-capitalize ${statusClass}`}>
              {status}
            </span>
          );
        },
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => {
          const user = extensions.find((extension: any) => extension?.id == props?.created_by);
          const name = user?.display_name || user?.name || props?.created_by;
          return <span>
          {props?.created_by ? name : ""}
          {props?.created_by && <br />}
          {props.created_at
            ? formatDateForTable(props.created_at)
            : "Unknown"}
        </span>
        },
      },
      {
        key: "user_extension",
        name: "User Extension",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => {
          const user = extensions.find((extension: any) => extension?.id == props?.user_extension);
          const name = user?.display_name || user?.name || props?.user_extension;
          return <span>
          {props?.user_extension ? name : ""}
        </span>
        }
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (

          <>
          {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_OPPORTUNITIES) || session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_OPPORTUNITIES) || session?.user?.permissions?.includes(PERMISSIONS.MARK_AS_LOST_CRM_OPPORTUNITIES) || session?.user?.permissions?.includes(PERMISSIONS.DELETE_CRM_OPPORTUNITIES) ? (
          <DatatableActionButton
            actions={[
              {
                label: 'View',
                icon: <FiEye className="me-2" />,
                onClick: () => window.location.href = `/crm/leads/${props.id}`,
              },
              ...(session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_OPPORTUNITIES) ? [{
                label: 'Edit',
                icon: <FiEdit className="me-2" />,
                onClick: () => window.location.href = `/crm/leads/${props.id}/edit`,
              }] : []),
              
              ...(session?.user?.permissions?.includes(PERMISSIONS.MARK_AS_LOST_CRM_OPPORTUNITIES) ? [{
                label: 'Mark Lost Reason',
                icon: <FiXCircle className="me-2" />,
                onClick: () => handleMarkLost(props),
              }] : []),

              ...(session?.user?.permissions?.includes(PERMISSIONS.DELETE_CRM_OPPORTUNITIES) ? [{
                label: 'Delete',
                icon: <FiTrash2 className="me-2" />,
                onClick: () => handleDeleteOpportunity(props),
                className: 'text-danger',
              }] : []),
            ]}
          />
          ) : (
            <></>
            )}
          </>
        ),
      },
    ],
    [extensions, session?.user?.permissions] 
  );

  const fetchOpportunities = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const params: any = {
        page,
        perPage,
        ...(memoizedFilters || {}),
        
      };

      // Use search from filters if available, otherwise use the search parameter
      const searchTerm = memoizedFilters.search || search;
      if (searchTerm) {
        params.search = searchTerm;
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

       <PageHeader
         title="Opportunities"
         filters={
          session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_OPPORTUNITIES) ? (
            <CrmFilters onFiltersChange={setCurrentFilters} type="opportunity" />
          ) : (
            <></>
          )
         }
         showSearch={session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_OPPORTUNITIES)}
         searchPlaceholder="Search opportunities..."
         searchValue={currentFilters?.search || ""}
         onSearchChange={(value) => setCurrentFilters({...currentFilters, search: value})}
         buttons={
          <>
          {session?.user?.permissions?.includes(PERMISSIONS.CREATE_CRM_OPPORTUNITIES) ? (
           <Link href="/crm/leads/create?type=opportunity" className="btn btn-primary">
             <FiPlus className="me-2" />
             New Opportunity
           </Link>
           ) : (
            <></>
           )}
           </>
         }
         leftGrid={3}
         rightGrid={9}
       />

         {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_OPPORTUNITIES) ? (
      <GenericListPage
        columns={columns}
        fetchData={fetchOpportunities}
        title="Opportunities"
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={false}
        tableStyle="table-style-2"
      />
      ) : (
        <></>
      )}

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
            Mark Lost Reason
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
