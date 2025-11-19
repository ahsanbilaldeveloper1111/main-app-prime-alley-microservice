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
import { ModuleSlug } from "@utils/Helper";
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

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { useSession } from "next-auth/react";


const CrmLeads = () => {
  const { data: session } = useSession();

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
    fetchExtensions(ModuleSlug.CRM_LEADS);
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages('lead');
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

  const fetchExtensions = async (moduleSlug: string = ModuleSlug.CRM_LEADS) => {
    try {
      const hierarchyData = await GetHierarchyData(moduleSlug);
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
        ...(currentFilters || {}),
      };

      // Use search from filters if available, otherwise use the search parameter
      const searchTerm = currentFilters.search || search;
      if (searchTerm) {
        params.search = searchTerm;
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
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lead Deleted");
      setSuccessModalDescription("Lead has been deleted successfully");
      //window.location.reload();
      setRefreshKey((oldKey) => oldKey + 1);
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


  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalDescription, setSuccessModalDescription] = useState('');

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
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lead Marked as Lost");
      setSuccessModalDescription("Lead has been marked as lost successfully");
      // Refresh the list
      //window.location.reload();
      setRefreshKey((oldKey) => oldKey + 1);
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
          <div>
              <div>{props.company_name || "No Company"}</div>
          </div>
        ),
      },
      {
        key: "stage_name",
        name: "Stage",
        selector: (row: any) => row.stage?.name || "New",
        sortable: true,
        cell: (props: any) => (
          <>
          <span className="status-badge text-capitalize primary">{props.stage?.name || "New"}</span>
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
            ? new Date(props.created_at).toLocaleDateString()
            : "Unknown"}
        </span>
        }
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
          <DatatableActionButton
            actions={[
              ...(session?.user?.permissions?.includes('view-crm-leads') ? [{
                label: 'View',
                icon: <FiEye className="me-2" />,
                onClick: () => window.location.href = `/crm/leads/${props.id}`,
              }] : []),
              ...(session?.user?.permissions?.includes('edit-crm-leads') ? [{
                label: 'Edit',
                icon: <FiEdit className="me-2" />,
                onClick: () => window.location.href = `/crm/leads/${props.id}/edit`,
              }] : []),
              ...(session?.user?.permissions?.includes('convert-to-opportunity-crm-leads') ? [{
                label: 'Convert to Opportunity',
                icon: <FiTarget className="me-2" />,
                onClick: () => handleConvertLead(props),
              }] : []),
              ...(session?.user?.permissions?.includes('mark-as-lost-crm-leads') ? [{
                label: 'Mark Lost Reason',
                icon: <FiXCircle className="me-2" />,
                onClick: () => handleMarkLost(props),
              }] : []),
              ...(session?.user?.permissions?.includes('delete-crm-leads') ? [{
                label: 'Delete',
                icon: <FiTrash2 className="me-2" />,
                onClick: () => handleDeleteLead(props.id),
                className: 'text-danger',
              }] : []),
            ]}
          />
        ),
      },
    ],
    [extensions, session?.user?.permissions]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Leads"
      />

      <PageHeader
        title="Leads"
        filters={
          session?.user?.permissions?.includes('list-crm-leads') ? (
          <CrmFilters onFiltersChange={handleFiltersChange} type="lead" />
        ) : (
          <></>
        )}
        showSearch={session?.user?.permissions?.includes('list-crm-leads')}
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
        searchPlaceholder="Search leads..."
        buttons={
          <>
          {session?.user?.permissions?.includes('add-crm-leads') ? (
          <Link href="/crm/leads/create" className="btn btn-primary">
                  <FiPlus className="me-2" />
                  New Lead
                </Link>
                ) : (
                  <></>
                )}
                </>
        }
        leftGrid={3}
        rightGrid={9}
      />

{session?.user?.permissions?.includes('list-crm-leads') ? (
<GenericListPage
                  columns={columns}
                  fetchData={fetchLeads}
                  title="Leads"
                  searchPlaceholder="Search leads..."
                  defaultPageSize={15}
                  filters={currentFilters}
                  refreshKey={refreshKey}
                  search={false}
                  tableStyle="table-style-2"
                />
                ) : (
                  <></>
                )}

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title="Delete Lead"
        description="Are you sure you want to delete this lead?"
        onConfirm={() => confirmDeleteLead()}
        targetName=""
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        cancelButtonVariant="secondary"
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Convert Lead Modal */}
      <FormModal
        show={showConvertModal}
        onHide={() => setShowConvertModal(false)}
        title="Convert lead to opportunity"
        desc="Please fill in the details below to convert the lead to an opportunity."
        formHtml={
          <>
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
          </>
        }
        onSubmit={handleConvertSubmit}
        onCancel={() => setShowConvertModal(false)}
        submitButtonText="Convert to Opportunity"
        cancelButtonText="Cancel"
      />





      <FormModal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
        title="Mark lead as lost"
        desc="Please fill in the details below to mark the lead as lost."
        formHtml={
          <>
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
          </>
        }
        onSubmit={handleMarkLostSubmit}
        onCancel={() => setShowMarkLostModal(false)}
        submitButtonText="Mark Lost Reason"
        cancelButtonText="Cancel"
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

CrmLeads.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmLeads;
