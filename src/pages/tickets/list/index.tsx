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
import {
  ListTickets,
  CreateTicket,
  UpdateTicketDetails,
  DeleteTicket,
  GetComments,
  GetAssigneeComments,
  AddComment,
  AddAssigneeComment,
  loadImage,
  GetTicket,
  DashboardData,
} from "@utils/tickets";
import { GetHierarchyData } from "@utils/users";
import { GetAllStatuses } from "@utils/ticket-statuses";
import { GetAllTypes } from "@utils/ticket-types";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Col, Card, InputGroup, Form,Alert, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import {
  GetAllModules,
  GetAllSubmodules,
  GetAllSubmoduleChildren,
} from "@utils/ticket-module";

import CreatableSelect from "react-select/creatable";
import TicketsFilters from "@components/filters/TicketFilters";
import { ModuleSlug } from "@utils/Helper";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { User,Edit,Trash2,Eye,Plus, Filter, Search,Info, AlertCircle, CheckCircle, X, Paperclip, FileText, Tag, Calendar, Clock, Download, MessageCircle, Send, CircleCheckBig, BarChart3, Ticket } from "lucide-react";

import ThemeSelect from "@components/ThemeSelect";
import Select from "react-select";
import { useRouter } from "next/router";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface SelectOption {
  value: number;
  label: string;
}

const ticketCategories = { //ticket_category
  INTERNAL: 'internal',
  USER: 'user',
};
const TICKET_APPROVED_STATUS = {
  APPROVED:true,
  NOT_APPROVED: false,
};

const getPriorityBadgeColor = (priority: string | number) => {
  if (!priority && priority !== 0) return 'secondary';
  switch (Number(priority)) {
    case 3: return 'danger';
    case 2: return 'warning';
    case 1: return 'info';
    case 0: return 'success';
    default: return 'secondary';
  }
};

const getStatusBadgeColor = (status: string) => {
  if (!status) return 'secondary';
  switch (String(status).toLowerCase()) {
    case 'resolved': return 'success';
    case 'closed': return 'secondary';
    case 'in progress': return 'warning';
    case 'open': return 'primary';
    default: return 'info';
  }
};

const priorityLabels = ["Low", "Medium", "High", "Critical"];

// KPI Card Component
interface KPICardData {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const KPICard: React.FC<KPICardData> = ({
  title,
  value,
  icon,
  color,
}) => {
  return (
    <Card
      className="h-100"
      style={{
        cursor: "default",
        transition: "all 0.2s ease",
        border: "1px solid #e9ecef",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
            <div className={`text-${color}`}>{icon}</div>
          </div>
        </div>
        <h3 className="mb-1">{value}</h3>
        <p className="text-muted mb-0 small">{title}</p>
      </Card.Body>
    </Card>
  );
};

const TicketList = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'public' | 'internal' | 'activity'>('public');

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<{ search: string; module_id: string; status_id: string; priority: string; type_id: string; ticket_category: string; is_approved: boolean | null }>({ search: "", module_id: "", status_id: "", priority: "", type_id: "", ticket_category: "", is_approved: null });

  const [statuses, setStatuses] = useState<any>([]);
  const [modules, setModules] = useState<any>([]);
  const [types, setTypes] = useState<any>([]);

  const [hierarchyData, setHierarchyData] = useState<any>([]);
  const [extensions, setExtensions] = useState<any>([]);

  // Analytics state
  const [showTicketsAnalytics, setShowTicketsAnalytics] = useState(false);
  const [statusSummary, setStatusSummary] = useState<any[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);

  // Comment-related states
  const [comments, setComments] = useState<any[]>([]);
  const [assigneeComments, setAssigneeComments] = useState<any[]>([]);
  const [commentAttachmentImages, setCommentAttachmentImages] = useState<{
    [key: number]: string;
  }>({});
  const [assigneeCommentAttachmentImages, setAssigneeCommentAttachmentImages] =
    useState<{ [key: number]: string }>({});
  const [newComment, setNewComment] = useState<string>("");
  const [newAssigneeComment, setNewAssigneeComment] = useState<string>("");
  const [newCommentAttachment, setNewCommentAttachment] = useState<File | null>(
    null
  );
  const [newAssigneeCommentAttachment, setNewAssigneeCommentAttachment] =
    useState<File | null>(null);
  const [showComments, setShowComments] = useState<boolean>(true);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);

  const columns: Column[] = useMemo(
    () => [
      {
        key: "title",
        name: "Ticket ID & Title",
        selector: (row: any) => row.title,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-bold text-primary">#{props.id}</div>
            <div
              style={{
                textTransform: "capitalize",
              }}
            >
              {props.title}
            </div>
          </div>
        ),
      },

      ...(session?.user?.permissions?.includes('view-internal-tickets-tickets') && session?.user?.permissions?.includes('view-ticket-tickets') ? [
        {
          key: "ticket_category",
          name: "Ticket Category",
          selector: (row: any) => row.ticket_category,
          sortable: true,
          cell: (props: any) => {
            return <span className="text-capitalize">
              {props.ticket_category}
              </span>
          },
        }
      ] : []),

      ...(session?.user?.permissions?.includes('view-unapproved-tickets-tickets') && session?.user?.permissions?.includes('view-ticket-tickets') ? [
        {
          key: "is_approved",
          name: "Is Approved",
          selector: (row: any) => row.is_approved,
          sortable: true,
          cell: (props: any) => {
            return <span className="text-capitalize">
              {props.is_approved ? "Approved" : "Not Approved"}
            </span>
          },
        }
        ] : []),


      {
        key: "type",
        name: "Type",
        selector: (row: any) => row.type.name,
        sortable: true,
        cell: (props: any) => {
          const typeName = props?.type?.name;

          return (
            <span className="fw-normal badge text-dark bg-light">
              {typeName}
            </span>
          );
        },
      },
      {
        key: "description",
        name: "Description",
        selector: (row: any) => row.description,
        sortable: true,
        cell: (props: any) => {
          const description = props.description || "";
          const truncatedDescription =
            description.length > 50
              ? description.substring(0, 50) + "..."
              : description;

          return <small className="text-muted" style={{ maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={description}>{truncatedDescription}</small>;
        },
      },
      {
        key: "user_extension",
        name: "User Extension",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => {
          const userExtensions = Array.isArray(props.user_extension)
            ? props.user_extension
            : props.user_extension
            ? [props.user_extension]
            : [];
          
          if (userExtensions.length === 0) {
            return <span className="fw-normal badge text-dark bg-light">Not assigned</span>;
          }
          
          return (
            <div className="d-flex flex-wrap gap-1">
              {userExtensions.map((extId: any, index: number) => {
                const ext = extensions.find(
                  (extension: any) => extension.id.toString() === extId.toString()
                );
                return (
                  <span key={index} className="fw-normal badge text-dark bg-light">
                    {ext?.display_name || extId}
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        key: "created_by",
        name: "Created By",
        selector: (row: any) => row.created_by,
        sortable: true,
        cell: (props: any) => (
          <div className="d-flex align-items-center gap-2"> 
            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            <User size={16} className="text-primary" />
            </div>
            <small>
            {extensions.find(
                (extension: any) => extension.id == props.created_by
              )?.display_name || props.created_by}
          </small>
        </div>
     
        ),
      },
      {
        key: "status",
        name: "Status & Module",
        selector: (row: any) => row.status,
        sortable: true,
        cell: (props: any) => (
          
          <div className="d-block">
            <span className="bg-opacity-10 text-dark mb-1 d-inine-block badge bg-info">
              {props.status?.name}
            </span>
            <small className="text-muted d-block">
              {props.module?.name}
            </small>
          </div>
        ),
      },
      {
        key: "priority",
        name: "Priority",
        selector: (row: any) => row.priority,
        sortable: true,
        cell: (props: any) => {
          const priorityLabels = ["Low", "Medium", "High", "Critical"];
          const priorityColors = [
            "bg-success",
            "bg-warning",
            "bg-danger",
            "bg-danger",
          ];
          return (
            <span
              className={`bg-opacity-10 text-dark badge bg-warning ${
                priorityColors[props.priority] || "secondary"
              } text-capitalize`}
            >
              {priorityLabels[props.priority] || "Unknown"}
            </span>
          );
        },
      },
      {
        key: "due_date",
        name: "Due Date",
        selector: (row: any) => row.due_date,
        sortable: true,
        cell: (props: any) => (
          <small className="text-muted">
            {props.due_date
              ? moment(props.due_date).format("DD/MM/YYYY")
              : "No due date"}
          </small>
        ),
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <small className="text-muted">
            {moment(props.created_at).format("DD/MM/YYYY")}
          </small>
        ),
      },
      {
        key: "Action",
        name: "Actions",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
         

          <div className="d-flex justify-content-center gap-2">
            {session?.user?.permissions?.includes('view-ticket-tickets') && (
              <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-secondary" title="View">
                <Eye size={16}  onClick={() => handleViewTicket(props.id)} />
              </Button>
            )}

{session?.user?.permissions?.includes('approve-internal-tickets-tickets') && props?.ticket_category==='internal' && props?.is_approved===false && (
              <Button variant="light"  className="btn-action-style-2 p-1 text-primary" title="Make Approved">
                <CircleCheckBig size={16}  onClick={() => handleApproveTicket(props)} />
              </Button>
            )}

           
           
            {session?.user?.permissions?.includes('edit-ticket-tickets') && (
              <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-primary" title="Edit">
                <Edit size={16}  onClick={() => handleEditTicket(props)} />
              </Button>
            )}

            
            {session?.user?.permissions?.includes('delete-ticket-tickets') && (Array.isArray(props.user_extension) ? props.user_extension.length > 0 : props.user_extension) ? (
            
                <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-danger gap-2"title="Delete (Assigned)">
                  <Trash2 size={16}  onClick={() => handleDeleteTicket(props)} />
                </Button>
              ) : (
                <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-danger gap-2"title="Delete">
                  <Trash2 size={16}  onClick={() => handleDeleteTicket(props)} />
                </Button>
              )}
              
        
            
          </div>
        ),
      },
    ],
    [session?.user?.permissions, extensions, types]
  );

  useEffect(() => {
    const fetchStatuses = async () => {
      const statuses = await GetAllStatuses();
      setStatuses(statuses);
      console.log("Statuses:", statuses);
    };
    fetchStatuses();
  }, []);

  useEffect(() => {
    const fetchModules = async () => {
      const modules = await GetAllModules();
      setModules(modules);
      console.log("Modules:", modules);
    };
    fetchModules();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      const types = await GetAllTypes();
      setTypes(types);
      console.log("Types:", types);
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchHierarchyData = async () => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.TICKET);
      setHierarchyData(hierarchyData);
      console.log("Hierarchy Data:", hierarchyData);
      setExtensions(hierarchyData?.extensions);
      console.log("Extensions:", extensions);
    };
    fetchHierarchyData();
  }, []);

  // Fetch dashboard data for analytics
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await DashboardData(currentFilters);
        
        if (data && data.total_tickets !== undefined) {
          setTotalTickets(data.total_tickets || 0);
        }
        if (data && data.statuses !== undefined) {
          setStatusSummary(data.statuses);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    if (showTicketsAnalytics) {
      fetchDashboardData();
    }
  }, [showTicketsAnalytics, currentFilters]);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchTickets = useCallback(
    async (page = 1, perPage = 15) => {
      return await ListTickets({
        page,
        perPage,
        search: currentFilters.search,
        filters: memoizedFilters,
        moduleSlug: ModuleSlug.TICKET,
      });
    },
    [memoizedFilters, currentFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    //console.log('Filters changed:', filters);
    setCurrentFilters(filters);
  }, []);

  const [showViewTicketModal, setShowViewTicketModal] =
    useState<boolean>(false);
  const [viewTicketData, setViewTicketData] = useState<any>([]);
  const [viewTicketImages, setViewTicketImages] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  function loadImgs(imgPaths: string[] | string) {
    const paths = Array.isArray(imgPaths)
      ? imgPaths
      : [imgPaths].filter(Boolean);
    if (paths.length === 0) {
      setViewTicketImages([]);
      return;
    }

    Promise.all(paths.map((path) => loadImage(path)))
      .then((results: any[]) => {
        setViewTicketImages(results.filter(Boolean));
      })
      .catch((error) => {
        console.error("Error loading images:", error);
        setViewTicketImages([]);
      });
  }

  useEffect(() => {
    console.log("ZE RAN");
    if (viewTicketData?.image) {
      // Handle both array and single image
      const images = Array.isArray(viewTicketData.image)
        ? viewTicketData.image
        : [viewTicketData.image].filter(Boolean);
      if (images.length > 0) {
        loadImgs(images);
      } else {
        setViewTicketImages([]);
      }
    } else {
      setViewTicketImages([]);
    }
  }, [viewTicketData, viewTicketData?.image]);

  const closeViewTicketModal = useCallback(() => {
    setShowViewTicketModal(false);
    // Reset comment states when closing
    setComments([]);
    setAssigneeComments([]);
    setCommentAttachmentImages({});
    setAssigneeCommentAttachmentImages({});
    setNewComment("");
    setNewAssigneeComment("");
    setNewCommentAttachment(null);
    setNewAssigneeCommentAttachment(null);
    setShowComments(false);
  }, []);

  // Comment handling functions
  const fetchComments = useCallback(async (ticketId: string) => {
    try {
      setIsLoadingComments(true);
      const [commentsData, assigneeCommentsData] = await Promise.all([
        GetComments(ticketId),
        GetAssigneeComments(ticketId),
      ]);

      console.log("Raw comments data:", commentsData);
      console.log("Raw assignee comments data:", assigneeCommentsData);

      let processedComments: any[] = [];
      let processedAssigneeComments: any[] = [];

      // Extract comments from the nested response structure
      if (commentsData?.data?.data) {
        console.log(
          "Setting comments from data.data.data:",
          commentsData.data.data
        );
        processedComments = commentsData.data.data;
      } else if (commentsData?.data) {
        console.log("Setting comments from data.data:", commentsData.data);
        processedComments = commentsData.data;
      } else {
        console.log("No comments data found, setting empty array");
        processedComments = [];
      }

      if (assigneeCommentsData?.data?.data) {
        console.log(
          "Setting assignee comments from data.data.data:",
          assigneeCommentsData.data.data
        );
        processedAssigneeComments = assigneeCommentsData.data.data;
      } else if (assigneeCommentsData?.data) {
        console.log(
          "Setting assignee comments from data.data:",
          assigneeCommentsData.data
        );
        processedAssigneeComments = assigneeCommentsData.data;
      } else {
        console.log("No assignee comments data found, setting empty array");
        processedAssigneeComments = [];
      }

      setComments(processedComments);
      setAssigneeComments(processedAssigneeComments);

      // Load comment attachment images
      const commentImagePromises = processedComments
        .filter((comment: any) => comment.attachment)
        .map(async (comment: any) => {
          try {
            const imageUrl = await loadImage(comment.attachment);
            return { commentId: comment.id, imageUrl };
          } catch (error) {
            console.error(
              `Error loading image for comment ${comment.id}:`,
              error
            );
            return { commentId: comment.id, imageUrl: null };
          }
        });

      const assigneeImagePromises = processedAssigneeComments
        .filter((comment: any) => comment.attachment)
        .map(async (comment: any) => {
          try {
            const imageUrl = await loadImage(comment.attachment);
            return { commentId: comment.id, imageUrl };
          } catch (error) {
            console.error(
              `Error loading image for assignee comment ${comment.id}:`,
              error
            );
            return { commentId: comment.id, imageUrl: null };
          }
        });

      const [commentImageResults, assigneeImageResults] = await Promise.all([
        Promise.all(commentImagePromises),
        Promise.all(assigneeImagePromises),
      ]);

      // Create maps of comment ID to image URL
      const commentImageMap: { [key: number]: string } = {};
      commentImageResults.forEach(({ commentId, imageUrl }) => {
        if (imageUrl) {
          commentImageMap[commentId] = imageUrl;
        }
      });

      const assigneeImageMap: { [key: number]: string } = {};
      assigneeImageResults.forEach(({ commentId, imageUrl }) => {
        if (imageUrl) {
          assigneeImageMap[commentId] = imageUrl;
        }
      });

      setCommentAttachmentImages(commentImageMap);
      setAssigneeCommentAttachmentImages(assigneeImageMap);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to fetch comments");
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const handleViewTicket = useCallback(async (ticketId: string) => {
    router.push(`/tickets/list/${ticketId}`);
  }, []);

  // const handleViewTicket = useCallback(async (props: any) => {
  //   setViewTicketData(props);

  //   const ticketData = await GetTicket(props.id);
  //   if(ticketData && ticketData.success==true){
  //     //setViewTicketData(ticketData.data);
  //     console.log("Ticket data xxxxx:", ticketData.data);
  //   }

    


  //   console.log("View ticket:", props);
  //   setShowViewTicketModal(true);

  //   // Fetch comments when opening the modal
  //   fetchComments(props.id);

  //   // Fetch submodule and submodule child data if module_id exists
  //   if (props.module_id) {
  //     try {
  //       const submoduleData = await GetAllSubmodules();
  //       const filteredSubmodules =
  //         submoduleData?.filter(
  //           (sub: any) => sub.module_id == props.module_id
  //         ) || [];

  //       if (props.submodule_id) {
  //         const submoduleChildData = await GetAllSubmoduleChildren();
  //         const filteredChildren =
  //           submoduleChildData?.filter(
  //             (child: any) => child.submodule_id == props.submodule_id
  //           ) || [];

  //         // Update viewTicketData with the fetched submodule information
  //         setViewTicketData({
  //           ...props,
  //           submodule: filteredSubmodules.find(
  //             (sub: any) => sub.id == props.submodule_id
  //           ),
  //           submodule_child: filteredChildren.find(
  //             (child: any) => child.id == props.submodule_child_id
  //           ),
  //         });
  //       } else {
  //         setViewTicketData({
  //           ...props,
  //           submodule: null,
  //           submodule_child: null,
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Error fetching submodule data:", error);
  //     }
  //   }
  // }, []);

  const handleAddComment = useCallback(
    async (ticketId: string) => {
      if (!newComment.trim()) {
        toast.error("Please enter a comment");
        return;
      }

      // Validate attachment if provided
      if (newCommentAttachment) {
        if (!newCommentAttachment.type?.includes("image/")) {
          toast.error("Attachment must be an image (jpeg, png, jpg, gif)");
          return;
        }
        const maxSize = 5 * 1024 * 1024; // 5 MB in bytes
        if (newCommentAttachment.size > maxSize) {
          toast.error("Attachment size must be less than 5MB");
          return;
        }
      }

      try {
        setCreatingTicket(true);
        // Get first user extension for comment (backward compatibility)
        const userExtension = Array.isArray(viewTicketData.user_extension)
          ? viewTicketData.user_extension[0] || ""
          : viewTicketData.user_extension || "";
        const response = await AddComment(
          ticketId,
          newComment.trim(),
          userExtension,
          newCommentAttachment || undefined
        );
        if (response) {
          setNewComment("");
          setNewCommentAttachment(null);
          // Reset file input
          const fileInput = document.getElementById(
            "newCommentAttachment"
          ) as HTMLInputElement;
          if (fileInput) {
            fileInput.value = "";
          }
          // Refresh comments
          fetchComments(ticketId);
        }
      } catch (error) {
        console.error("Error adding comment:", error);
      } finally {
        setCreatingTicket(false);
      }
    },
    [newComment, newCommentAttachment, viewTicketData, fetchComments]
  );

  const handleAddAssigneeComment = useCallback(
    async (ticketId: string) => {
      // Check permission before allowing comment
      if (!viewTicketData || !session?.user) {
        toast.error("Unable to add comment");
        return;
      }
      
      const isSuperAdmin = session.user.is_admin === '1' || String(session.user.is_admin) === '1';
      const userPhone = session.user.phone;
      
      if (!isSuperAdmin && userPhone) {
        const userExtensions = Array.isArray(viewTicketData.user_extension)
          ? viewTicketData.user_extension
          : viewTicketData.user_extension
          ? [viewTicketData.user_extension]
          : [];
        
        const isAssigned = userExtensions.some((ext: any) => {
          const extString = String(ext);
          const phoneString = String(userPhone);
          return extString === phoneString;
        });
        
        if (!isAssigned) {
          toast.error("Only assigned users can add assignee comments");
          return;
        }
      } else if (!isSuperAdmin && !userPhone) {
        toast.error("Unable to verify assignment");
        return;
      }

      if (!newAssigneeComment.trim()) {
        toast.error("Please enter an assignee comment");
        return;
      }

      // Validate attachment if provided
      if (newAssigneeCommentAttachment) {
        if (!newAssigneeCommentAttachment.type?.includes("image/")) {
          toast.error("Attachment must be an image (jpeg, png, jpg, gif)");
          return;
        }
        const maxSize = 5 * 1024 * 1024; // 5 MB in bytes
        if (newAssigneeCommentAttachment.size > maxSize) {
          toast.error("Attachment size must be less than 5MB");
          return;
        }
      }

      try {
        setCreatingTicket(true);
        // Get first user extension for comment (backward compatibility)
        const userExtension = Array.isArray(viewTicketData.user_extension)
          ? viewTicketData.user_extension[0] || ""
          : viewTicketData.user_extension || "";
        const response = await AddAssigneeComment(
          ticketId,
          newAssigneeComment.trim(),
          userExtension,
          newAssigneeCommentAttachment || undefined
        );
        if (response) {
          setNewAssigneeComment("");
          setNewAssigneeCommentAttachment(null);
          // Reset file input
          const fileInput = document.getElementById(
            "newAssigneeCommentAttachment"
          ) as HTMLInputElement;
          if (fileInput) {
            fileInput.value = "";
          }
          // Refresh comments
          fetchComments(ticketId);
        }
      } catch (error) {
        console.error("Error adding assignee comment:", error);
      } finally {
        setCreatingTicket(false);
      }
    },
    [
      newAssigneeComment,
      newAssigneeCommentAttachment,
      viewTicketData,
      fetchComments,
      session?.user,
    ]
  );

  // Check if user can add assignee comments (must be assigned to ticket or super admin)
  const canAddAssigneeComment = useMemo(() => {
    // return false;
    if (!viewTicketData || !session?.user) return false;
    
    // Super admin can always add assignee comments
    if (session.user.is_admin === '1' || String(session.user.is_admin) === '1') {
      return true;
    }
    
    // Check if user's phone/extension is in the ticket's user_extension
    const userPhone = session.user.phone;
    if (!userPhone) return false;
    
    const userExtensions = Array.isArray(viewTicketData.user_extension)
      ? viewTicketData.user_extension
      : viewTicketData.user_extension
      ? [viewTicketData.user_extension]
      : [];
    
    // Check if user's phone matches any assigned extension
    return userExtensions.some((ext: any) => {
      const extString = String(ext);
      const phoneString = String(userPhone);
      return extString === phoneString;
    });
  }, [viewTicketData, session?.user]);

  const toggleComments = useCallback(() => {
    setShowComments(!showComments);
  }, [showComments]);

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedTicketTitle, setSelectedTicketTitle] = useState<any>(null);
  const [selectedTicketDescription, setSelectedTicketDescription] =
    useState<any>(null);
  const [selectedTicketNewImages, setSelectedTicketNewImages] = useState<
    File[]
  >([]);
  const [selectedTicketExistingImages, setSelectedTicketExistingImages] = useState<string[]>([]);
  const [selectedTicketTags, setSelectedTicketTags] = useState<string[]>([]);
  const [showEditTicketModal, setShowEditTicketModal] =
    useState<boolean>(false);
  const [showDeleteTicketModal, setShowDeleteTicketModal] =
    useState<boolean>(false);
  const [showApproveTicketModal, setShowApproveTicketModal] =
    useState<boolean>(false);
  const [selectedTicketForApprove, setSelectedTicketForApprove] =
    useState<any>(null);

  const handleSubmitEditTicket = useCallback(async () => {
    //console.log('Submit edit group:', selectedGroup, selectedGroupName);
    if (
      !selectedTicketTitle?.trim() ||
      selectedTicketTitle?.trim()?.length < 5
    ) {
      toast.error("Please enter a ticket title (Min: 5 chars)");
      return;
    }
    if (!selectedTicket.ticket_type_id) {
      toast.error("Please select a ticket type");
      return;
    }
    if (!selectedTicket.ticket_status_id) {
      toast.error("Please select a ticket status");
      return;
    }
    if (!selectedTicket.module_id) {
      toast.error("Please select a ticket module");
      return;
    }
    if (!selectedTicket.submodule_id) {
      toast.error("Please select a ticket primary issue");
      return;
    }
    if (!selectedTicket.priority && selectedTicket.priority != 0) {
      toast.error("Please select a ticket priority");
      return;
    }

    // Validate new images if provided
    if (selectedTicketNewImages && selectedTicketNewImages.length > 0) {
      const maxSize = 5 * 1024 * 1024; // 5 MB in bytes
      for (let i = 0; i < selectedTicketNewImages.length; i++) {
        const image = selectedTicketNewImages[i];
        if (!image.type?.includes("image/")) {
          toast.error(
            `Attachment ${i + 1} must be an image (jpeg, png, jpg, gif)`
          );
          return;
        }
        if (image.size > maxSize) {
          toast.error(`Attachment ${i + 1} size must be less than 5MB`);
          return;
        }
      }
    }

    // Check total image count (max 3)
    const totalImages = selectedTicketExistingImages.length + selectedTicketNewImages.length;
    if (totalImages > 3) {
      toast.error(`Maximum 3 images allowed. You have ${totalImages} images (${selectedTicketExistingImages.length} existing + ${selectedTicketNewImages.length} new). Please remove some images.`);
      return;
    }

    // Combine existing images (strings) with new images (Files)
    const allImages: (string | File)[] = [
      ...selectedTicketExistingImages, // Existing images as strings
      ...selectedTicketNewImages, // New images as Files
    ];

    setCreatingTicket(true);
    let response = null;
    try {
      // Only include user_extension if user has assign-user permission
      let userExtensionArray = undefined;
      if (session?.user?.permissions?.includes("assign-user-tickets")) {
        userExtensionArray = Array.isArray(selectedTicket.user_extension)
          ? selectedTicket.user_extension
          : selectedTicket.user_extension
          ? [selectedTicket.user_extension]
          : [];
        userExtensionArray = userExtensionArray.length > 0 ? userExtensionArray : undefined;
      }
      
      response = await UpdateTicketDetails(
        selectedTicket.id,
        selectedTicketTitle,
        selectedTicketDescription,
        selectedTicket.ticket_type_id || selectedTicket.type,
        selectedTicket.ticket_status_id,
        selectedTicket.module_id,
        selectedTicket.submodule_id,
        selectedTicket.submodule_child_id,
        userExtensionArray,
        selectedTicket.priority,
        selectedTicket.due_date,
        allImages.length > 0 ? allImages : undefined,
        selectedTicketTags.length > 0 ? selectedTicketTags : undefined
      );
    } catch (error) {
      console.error("Error updating ticket details:", error);
      return;
    } finally {
      setCreatingTicket(false);
    }
    if (response) {
      setSelectedTicket(null);
      setSelectedTicketTitle(null);
      setSelectedTicketDescription(null);
      setSelectedTicketNewImages([]);
      setSelectedTicketExistingImages([]);
      setSelectedTicketTags([]);
      setShowEditTicketModal(false);
      setRefreshKey((prev) => prev + 1); // Trigger refresh
    }
  }, [
    selectedTicket,
    selectedTicketTitle,
    selectedTicketDescription,
    selectedTicketNewImages,
    selectedTicketExistingImages,
    selectedTicketTags,
    session?.user?.permissions,
  ]);

  const handleDeleteTicket = useCallback((props: any) => {
    setSelectedTicket(props.id);
    setSelectedTicketTitle(props.title);
    setShowDeleteTicketModal(true);
  }, []);

  const handleSubmitDeleteTicket = useCallback(async () => {
    const response = await DeleteTicket(selectedTicket);
    if (response) {
      setSelectedTicket(null);
      setSelectedTicketTitle(null);
      setShowDeleteTicketModal(false);
      setRefreshKey((prev) => prev + 1); // Trigger refresh
    }
  }, [selectedTicket]);

  const handleApproveTicket = useCallback((props: any) => {
    setSelectedTicketForApprove(props);
    setShowApproveTicketModal(true);
  }, []);

  const closeApproveTicketModal = useCallback(() => {
    setShowApproveTicketModal(false);
    setSelectedTicketForApprove(null);
  }, []);

  const handleSubmitApproveTicket = useCallback(async (confirmationText?: string) => {
    if (!selectedTicketForApprove) return;

    // Toggle approval status: if false, make it true; if true, make it false
    const newApprovalStatus = !selectedTicketForApprove.is_approved;

    setCreatingTicket(true);
    let response = null;
    try {
      // Only include user_extension if user has assign-user permission
      let userExtensionArray = undefined;
      if (session?.user?.permissions?.includes("assign-user-tickets")) {
        userExtensionArray = Array.isArray(selectedTicketForApprove.user_extension)
          ? selectedTicketForApprove.user_extension
          : selectedTicketForApprove.user_extension
          ? [selectedTicketForApprove.user_extension]
          : [];
        userExtensionArray = userExtensionArray.length > 0 ? userExtensionArray : undefined;
      }
      
      response = await UpdateTicketDetails(
        selectedTicketForApprove.id,
        selectedTicketForApprove.title || selectedTicketForApprove.name,
        selectedTicketForApprove.description || "",
        selectedTicketForApprove.ticket_type_id || selectedTicketForApprove.type,
        selectedTicketForApprove.ticket_status_id,
        selectedTicketForApprove.module_id,
        selectedTicketForApprove.submodule_id,
        selectedTicketForApprove.submodule_child_id,
        userExtensionArray,
        selectedTicketForApprove.priority,
        selectedTicketForApprove.due_date,
        undefined,
        undefined,
        newApprovalStatus
      );
    } catch (error) {
      console.error("Error updating ticket approval status:", error);
      toast.error("Failed to update approval status");
      setCreatingTicket(false);
      return;
    } finally {
      setCreatingTicket(false);
    }
    if (response) {
      toast.success('Ticket approval status updated successfully');
      setShowApproveTicketModal(false);
      setSelectedTicketForApprove(null);
      setRefreshKey((prev) => prev + 1); // Trigger refresh
    }
  }, [selectedTicketForApprove, session?.user?.permissions]);

  const [showCreateTicketModal, setShowCreateTicketModal] =
    useState<boolean>(false);
  const [newTicketTitle, setNewTicketTitle] = useState<string>("");
  const [newTicketDescription, setNewTicketDescription] = useState<string>("");
  const [newTicketType, setNewTicketType] = useState<string>("");
  const [newTicketStatus, setNewTicketStatus] = useState<string>("");
  const [newTicketModule, setNewTicketModule] = useState<string>("");

  const [newTicketPriority, setNewTicketPriority] = useState<string>("");
  const [newTicketDueDate, setNewTicketDueDate] = useState<string>("");
  const [newTicketUserExtension, setNewTicketUserExtension] = useState<string[]>([]);

  const [newTicketImages, setNewTicketImages] = useState<File[]>([]);
  const [newTicketTags, setNewTicketTags] = useState<string[]>([]);

  // Add state for submodules and submodule children
  const [newTicketSubmodule, setNewTicketSubmodule] = useState<string>("");
  const [newTicketSubmoduleChild, setNewTicketSubmoduleChild] =
    useState<string>("");
  const [submodules, setSubmodules] = useState<any[]>([]);
  const [submoduleChildren, setSubmoduleChildren] = useState<any[]>([]);
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);

  // Default tags suggestions
  const defaultTags = [
    "urgent",
    "bug",
    "feature",
    "enhancement",
    "documentation"
  ];
  
  const handleSubmitCreateTicket = useCallback(async () => {
    console.log("=== COMPONENT DEBUG ===");
    console.log("newTicketImages count:", newTicketImages.length);
    if (!newTicketTitle?.trim() || newTicketTitle?.trim()?.length < 5) {
      toast.error("Please enter a ticket title (Min: 5 chars)");
      return;
    }
    if (!newTicketType) {
      toast.error("Please select a ticket type");
      return;
    }
    if (newTicketDescription.length < 50 ) {
      toast.error("Ticket description must be at least 50 characters");
      return;
    }
    if (!newTicketStatus) {
      toast.error("Please select a ticket status");
      return;
    }
    if (!newTicketModule) {
      toast.error("Please select a ticket module");
      return;
    }
    if (!newTicketSubmodule) {
      toast.error("Please select a ticket primary issue");
      return;
    }
    if (!newTicketPriority) {
      toast.error("Please select a ticket priority");
      return;
    }

    const formData = new FormData();
    formData.append("title", newTicketTitle);
    formData.append("description", newTicketDescription);
    formData.append("ticket_type_id", newTicketType);
    formData.append("ticket_status_id", newTicketStatus);
    formData.append("module_id", newTicketModule);
    if (newTicketSubmodule) {
      formData.append("submodule_id", newTicketSubmodule);
    }
    if (newTicketSubmoduleChild) {
      formData.append("submodule_child_id", newTicketSubmoduleChild);
    }
    formData.append("priority", newTicketPriority || "0");

    formData.append("created_by", session?.user?.phone || "");
    if (newTicketDueDate) {
      formData.append("due_date", newTicketDueDate);
    }
    if (session?.user?.permissions?.includes("assign-user-tickets") && newTicketUserExtension && newTicketUserExtension.length > 0) {
      newTicketUserExtension.forEach((ext) => {
        formData.append("user_extension[]", ext);
      });
    }
    if (newTicketTags && newTicketTags.length > 0) {
      newTicketTags.forEach((tag) => {
        formData.append("tags[]", tag);
      });
    }
    if (newTicketImages && newTicketImages.length > 0) {
      const maxSize = 5 * 1024 * 1024; // 5 MB in bytes

      // Validate all images
      for (let i = 0; i < newTicketImages.length; i++) {
        const image = newTicketImages[i];
        if (!image.type?.includes("image/")) {
          toast.error(
            `Attachment ${i + 1} must be an image (jpeg, png, jpg, gif)`
          );
          return;
        }
        if (image.size > maxSize) {
          toast.error(`Attachment ${i + 1} size must be less than 5MB`);
          return;
        }
      }

      // Append all images
      newTicketImages.forEach((image) => {
        formData.append("image[]", image);
      });
    }

    // Debug FormData contents
    console.log("FormData created successfully");
    console.log(
      "FormData has images:",
      newTicketImages.length > 0 ? `Yes (${newTicketImages.length})` : "No"
    );
    if (newTicketImages.length > 0) {
      newTicketImages.forEach((image, index) => {
        console.log(`Image ${index + 1} name:`, image.name);
        console.log(`Image ${index + 1} type:`, image.type);
        console.log(`Image ${index + 1} size:`, image.size);
      });
    }
    setCreatingTicket(true);
    console.log(
      "FormData created type:",
      typeof formData,
      formData instanceof FormData
    );
    console.log("FormData constructor:", formData?.constructor?.name);
    console.log("=== END COMPONENT DEBUG ===");
    let response = null;
    try {
      response = await CreateTicket(formData);
    } catch (error) {
      toast.error("Failed to create ticket");
      console.error("Create ticket error:", error);
    } finally {
      setCreatingTicket(false);
    }
    if (response) {
      setNewTicketTitle("");
      setNewTicketDescription("");
      setNewTicketType("");
      setNewTicketStatus("");
      setNewTicketModule("");
      setNewTicketSubmodule("");
      setNewTicketSubmoduleChild("");
      setNewTicketPriority("");
      setNewTicketDueDate("");
      setNewTicketUserExtension([]);
      setNewTicketTags([]);
      setNewTicketImages([]);
      setSubmodules([]);
      setSubmoduleChildren([]);
      setShowCreateTicketModal(false);
      setRefreshKey((prev) => prev + 1); // Trigger refresh
    }
  }, [
    newTicketTitle,
    newTicketDescription,
    newTicketType,
    newTicketStatus,
    newTicketModule,
    newTicketSubmodule,
    newTicketSubmoduleChild,
    newTicketPriority,
    newTicketDueDate,
    newTicketUserExtension,
    newTicketTags,
    newTicketImages,
    session?.user?.email,
  ]);

  const openCreateTicketModal = useCallback(
    () => setShowCreateTicketModal(true),
    []
  );
  const closeCreateTicketModal = useCallback(() => {
    setShowCreateTicketModal(false);
    // Reset all form fields including the file input
    setNewTicketTitle("");
    setNewTicketDescription("");
    setNewTicketType("");
    setNewTicketStatus("");
    setNewTicketModule("");
    setNewTicketSubmodule("");
    setNewTicketSubmoduleChild("");
    setNewTicketPriority("");
    setNewTicketDueDate("");
    setNewTicketUserExtension([]);
    setNewTicketTags([]);
    setNewTicketImages([]);
    setSubmodules([]);
    setSubmoduleChildren([]);

    // Reset the file input element
    const fileInput = document.getElementById(
      "newTicketImages"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }, []);
  const openEditTicketModal = useCallback(
    () => setShowEditTicketModal(true),
    []
  );
  const closeEditTicketModal = useCallback(() => {
    setShowEditTicketModal(false);
    setSelectedTicketNewImages([]);
    setSelectedTicketExistingImages([]);
    // Reset file input
    const fileInput = document.getElementById(
      "editTicketImages"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }, []);
  const openDeleteTicketModal = useCallback(
    () => setShowDeleteTicketModal(true),
    []
  );
  const closeDeleteTicketModal = useCallback(
    () => setShowDeleteTicketModal(false),
    []
  );

  const handleNewTicketTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setNewTicketTitle(e.target.value),
    []
  );
  const handleNewTicketDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setNewTicketDescription(e.target.value),
    []
  );
  const handleEditTicketTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setSelectedTicketTitle(e.target.value),
    []
  );
  const handleEditTicketDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setSelectedTicketDescription(e.target.value),
    []
  );

  const handleImageClick = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  }, []);

  const closeImageModal = useCallback(() => setShowImageModal(false), []);

  const fetchSubmodules = useCallback(async (moduleId: string) => {
    if (moduleId) {
      try {
        const submoduleData = await GetAllSubmodules();
        // Filter submodules by module_id
        const filteredSubmodules =
          submoduleData?.filter((sub: any) => sub.module_id == moduleId) || [];
        setSubmodules(filteredSubmodules);
        setNewTicketSubmodule("");
        setNewTicketSubmoduleChild("");
        setSubmoduleChildren([]);
      } catch (error) {
        console.error("Error fetching submodules:", error);
      }
    } else {
      setSubmodules([]);
      setNewTicketSubmodule("");
      setNewTicketSubmoduleChild("");
      setSubmoduleChildren([]);
    }
  }, []);

  const fetchSubmoduleChildren = useCallback(async (submoduleId: string) => {
    if (submoduleId) {
      try {
        const childrenData = await GetAllSubmoduleChildren();
        // Filter children by submodule_id
        const filteredChildren =
          childrenData?.filter(
            (child: any) => child.submodule_id == submoduleId
          ) || [];
        setSubmoduleChildren(filteredChildren);
        setNewTicketSubmoduleChild("");
      } catch (error) {
        console.error("Error fetching submodule children:", error);
      }
    } else {
      setSubmoduleChildren([]);
      setNewTicketSubmoduleChild("");
    }
  }, []);

  const handleEditTicket = useCallback(
    async (props: any) => {
      console.log("Edit ticket props:", props);
      console.log("User extension from props:", props.user_extension);
      console.log("Available extensions:", extensions);

      setSelectedTicket(props);
      setSelectedTicketTitle(props.title);
      setSelectedTicketDescription(props.description);
      // Set tags from props
      const tagsArray = Array.isArray(props.tags)
        ? props.tags
        : props.tags
        ? [props.tags]
        : [];
      setSelectedTicketTags(tagsArray);
      
      // Initialize existing images
      const existingImages = props.image
        ? Array.isArray(props.image)
          ? props.image.filter(Boolean)
          : [props.image].filter(Boolean)
        : [];
      setSelectedTicketExistingImages(existingImages);
      setSelectedTicketNewImages([]);
      
      setShowEditTicketModal(true);

      // Load submodules and submodule children for the selected module
      if (props.module_id) {
        await fetchSubmodules(props.module_id);
        if (props.submodule_id) {
          await fetchSubmoduleChildren(props.submodule_id);
        }
      }
    },
    [extensions, fetchSubmodules, fetchSubmoduleChildren]
  );

  const [rerenderTrigger, setRerenderTrigger] = useState<number>(0);
  const [allSubmodules, setAllSubmodules] = useState<any[]>([]);
  const [allSubmoduleChildren, setAllSubmoduleChildren] = useState<any[]>([]);

  // Fetch all submodules and submodule children for activity log resolution
  useEffect(() => {
    const fetchAllSubmodules = async () => {
      try {
        const submoduleData = await GetAllSubmodules();
        setAllSubmodules(submoduleData || []);
      } catch (error) {
        console.error("Error fetching all submodules:", error);
      }
    };
    const fetchAllSubmoduleChildren = async () => {
      try {
        const childrenData = await GetAllSubmoduleChildren();
        setAllSubmoduleChildren(childrenData || []);
      } catch (error) {
        console.error("Error fetching all submodule children:", error);
      }
    };
    fetchAllSubmodules();
    fetchAllSubmoduleChildren();
  }, []);

  // Helper function to resolve ID fields to their names
  const resolveFieldName = useCallback((fieldName: string, fieldId: string | number): string => {
    if (!fieldId && fieldId !== 0) return String(fieldId);
    
    switch (fieldName) {
      case 'ticket_status_id':
        const status = statuses.find((s: any) => s.id.toString() === fieldId.toString());
        return status?.name || fieldId.toString();
      case 'ticket_type_id':
        const type = types.find((t: any) => t.id.toString() === fieldId.toString());
        return type?.name || fieldId.toString();
      case 'module_id':
        const moduleItem = modules.find((m: any) => m.id.toString() === fieldId.toString());
        return moduleItem?.name || fieldId.toString();
      case 'submodule_id':
        const submodule = allSubmodules.find((s: any) => s.id.toString() === fieldId.toString()) ||
          viewTicketData?.submodule || null;
        return submodule?.name || fieldId.toString();
      case 'submodule_child_id':
        const child = allSubmoduleChildren.find((c: any) => c.id.toString() === fieldId.toString()) ||
          viewTicketData?.submodule_child || null;
        return child?.name || fieldId.toString();
      case 'priority':
        const priorityLabels = ["Low", "Medium", "High", "Critical"];
        return priorityLabels[Number(fieldId)] || fieldId.toString();
      case 'user_extension':
        const ext = extensions.find((e: any) => e.id.toString() === fieldId.toString());
        return ext?.display_name || fieldId.toString();
      default:
        return String(fieldId);
    }
  }, [statuses, types, modules, allSubmodules, allSubmoduleChildren, extensions, viewTicketData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRerenderTrigger((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);



  const renderCommentThread = (comments: any[], tabType: string) => (
    console.log(comments, tabType),
    <div className="position-relative" style={{ paddingLeft: '30px' }}>
      {comments.map((item, index) => (
        <div key={item?.id || index} className="mb-4 position-relative">
          {/* Timeline line */}
          {index !== comments.length - 1 && (
            <div 
              className="position-absolute bg-light" 
              style={{ 
                left: '-19px', 
                top: '40px', 
                width: '2px', 
                height: 'calc(100% + 16px)' 
              }}
            />
          )}

          {/* Timeline dot */}
          <div 
            className={`position-absolute rounded-circle d-flex align-items-center justify-content-center ${
              item?.type === 'status_change' ? 'bg-warning' :
              item?.type === 'assignment' ? 'bg-info' :
              item?.isInternal ? 'bg-danger' :
              'bg-primary'
            }`}
            style={{ 
              left: '-24px', 
              top: '8px', 
              width: '12px', 
              height: '12px'
            }}
          />

          <Card className="border">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    {tabType === 'activity' ? (
                      <CheckCircle size={16} className="text-warning" />
                    ) : tabType === 'internal' ? (
                      <User size={16} className="text-info" />
                    ) : tabType === 'activity' ? (
                      <AlertCircle size={16} className="text-danger" />
                    ) : (
                      <MessageCircle size={16} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      {extensions.find((e: any) => e.id.toString() === item?.user_extension.toString())?.display_name || item?.user_extension}
                    
                    </div>
                    {/* <small className="text-muted">{item?.userRole || 'System'}</small> */}
                    {tabType === 'activity' && (
                      <small className="text-muted">
                        System
                      </small>
                    )}

{tabType === 'internal' && (
                      <small className="text-muted">
                        Admin
                      </small>
                    )}

                    {tabType === 'public' && (
                      <small className="text-muted">
                        Reporter
                      </small>
                    )}


                  </div>
                </div>
                <small className="text-muted">
                  <Clock size={12} className="me-1" />
                  {moment(item?.created_at).format("DD-MMM-YYYY HH:mm:ss")}
                </small>
              </div>


              <p className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                    {item?.content}

                    {tabType === 'activity' && (
                       <>
                        <p className="">
                          {item?.action==='created' && (
                            
                            <div role="alert" className="fade mb-0 py-2 px-3 alert alert-warning show d-flex align-items-center gap-2">
                              <CheckCircle size={16} className="" />
                              <small className="fw-semibold">Ticket created by {extensions.find((e: any) => e.id.toString() === item?.user_extension.toString())?.display_name || item?.user_extension}</small>
                              </div>
                          )}
                          </p>


                          <p className="">
                          {item?.action==='updated' && (
                            
                            <div role="alert" className="fade mb-0 py-2 px-3 alert alert-warning show d-flex align-items-center gap-2">
                              <CheckCircle size={16} className="" />
                              <small className="fw-semibold">Ticket created by {extensions.find((e: any) => e.id.toString() === item?.user_extension.toString())?.display_name || item?.user_extension}</small>
                              </div>
                          )}
                          </p>
                       </>
                    )}

                    {tabType !== 'activity' && (
                      <small className="text-muted">
                        {item?.content}
                      </small>
                    )}
                  </p>
                  
                  {/* Show attachments if any */}
                  {/* {item.attachments && item.attachments.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted fw-semibold d-block mb-2">Attachments:</small>
                      <div className="d-flex flex-wrap gap-2">
                        {item.attachments.map((file) => (
                          <Badge key={file.id} bg="light" text="dark" className="p-2 d-flex align-items-center gap-2">
                            <Paperclip size={12} />
                            <span>{file.name}</span>
                            <small className="text-muted">({file.size})</small>
                            <Button variant="link" size="sm" className="p-0 text-primary" title="Download">
                              <Download size={12} />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )} */}

              {/* {item?.type === 'status_change' ? (
                <Alert variant="warning" className="mb-0 py-2 px-3">
                  <CheckCircle size={14} className="me-2" />
                  <small className="fw-semibold">
                    {item?.content} 
                  </small>
                </Alert>
              ) : item.type === 'assignment' ? (
                <Alert variant="info" className="mb-0 py-2 px-3">
                  <User size={14} className="me-2" />
                  <small className="fw-semibold">
                    {item?.content}
                  </small>
                </Alert>
              ) : (
                <>
                  
                </>
              )} */}
            </Card.Body>
          </Card>
        </div>
      ))}
    </div>
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Tickets"
        mainLink="/tickets/list"
        subTitle="Tickets"
      />

      <PageHeader
        title="All Tickets"
        description="Manage and track all support tickets"
        // filters={
        //   <TicketsFilters
        //     onFiltersChange={handleFiltersChange}
        //     moduleSlug={ModuleSlug.TICKET}
        //   />
        // }
        buttons={
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant={showTicketsAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowTicketsAnalytics(!showTicketsAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showTicketsAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
            {session?.user?.permissions?.includes("create-ticket-tickets") && (
              <Button variant="primary" onClick={openCreateTicketModal}>
                <Plus size={18} className="me-2" />
                Add Ticket
              </Button>
            )}
          </div>
        }
        leftGrid={3}
        rightGrid={9}
      />

      {/* Analytics Section - Collapsible */}
      {showTicketsAnalytics && (
        <>
          {/* Summary Stats using KPICard */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <KPICard
                title="Total Tickets"
                value={totalTickets.toString()}
                icon={<Ticket size={24} />}
                color="primary"
              />
            </Col>
            {statusSummary.map((status: any, index: number) => (
              <Col lg={3} md={6} className="mb-3" key={index}>
                <KPICard
                  title={status.name}
                  value={status.count?.toString() || "0"}
                  icon={<Ticket size={24} />}
                  color={
                    status.name?.toLowerCase() === "resolved" || status.name?.toLowerCase() === "closed"
                      ? "success"
                      : status.name?.toLowerCase() === "in progress"
                      ? "warning"
                      : status.name?.toLowerCase() === "open"
                      ? "primary"
                      : "info"
                  }
                />
              </Col>
            ))}
          </Row>

          {/* Analytics Charts */}
          {/* {statusSummary.length > 0 && (
            <Row className="mb-4">
              <Col md={12} className="mb-3">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h6 className="fw-bold mb-3">Ticket Status Distribution</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={statusSummary.map((status: any) => ({
                          status: status.name,
                          count: status.count || 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0d6efd" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )} */}
        </>
      )}

      

      {session?.user?.permissions?.includes("view-ticket-tickets") && (

      <>
      {session?.user?.permissions?.includes('search-ticket-tickets') && (
        <Row className="mb-0">
          <Col md={12}>
            <Card>
              <Card.Body>
              <Row className="g-3">
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search tickets..."
                    className="border-start-0"
                    value={currentFilters.search}
                    onChange={(e: any) => handleFiltersChange({...currentFilters, search: e.target.value})}
                  />
                </InputGroup>
              </Col>



              <Col md={3}>
                <ThemeSelect
                  placeholder="Select Module"
                  value={(() => {
                    const selectedModule = modules.find((m: any) => m.id === currentFilters.module_id);
                    return selectedModule ? {value: selectedModule.id, label: selectedModule.name} : null;
                  })()}
                  onChange={(option: any) => handleFiltersChange({...currentFilters, module_id: option?.value})}
                  options={modules.map((m: any) => ({value: m.id, label: m.name}))}
                />
                </Col>

{session?.user?.permissions?.includes('view-internal-tickets-tickets') && session?.user?.permissions?.includes('view-ticket-tickets') && (
              <Col md={3}>
                <ThemeSelect
                  placeholder="Select Category"
                  value={(() => {
                    if (!currentFilters.ticket_category) return null;
                    const categoryKey = Object.keys(ticketCategories).find(
                      (key) => ticketCategories[key as keyof typeof ticketCategories] === currentFilters.ticket_category
                    );
                    return categoryKey ? {
                      value: ticketCategories[categoryKey as keyof typeof ticketCategories],
                      label: categoryKey.charAt(0) + categoryKey.slice(1).toLowerCase()
                    } : null;
                  })()}
                  onChange={(option: any) => handleFiltersChange({...currentFilters, ticket_category: option?.value})}
                  options={Object.keys(ticketCategories).map((key) => ({
                    value: ticketCategories[key as keyof typeof ticketCategories],
                    label: key.charAt(0) + key.slice(1).toLowerCase()
                  }))}
                />
              </Col>
              )}

{session?.user?.permissions?.includes('view-unapproved-tickets-tickets') && session?.user?.permissions?.includes('view-ticket-tickets') && (
              <Col md={3}>
                <ThemeSelect
                  placeholder="Select Approval Status"
                  value={(() => {
                    if (currentFilters.is_approved === null || currentFilters.is_approved === undefined) return null;
                    const isApproved = currentFilters.is_approved === true;
                    return {
                      value: isApproved,
                      label: isApproved ? "Approved" : "Not Approved"
                    };
                  })()}
                  onChange={(option: any) => handleFiltersChange({...currentFilters, is_approved: option?.value})}
                  options={[
                    {value: TICKET_APPROVED_STATUS.APPROVED, label: "Approved"},
                    {value: TICKET_APPROVED_STATUS.NOT_APPROVED, label: "Not Approved"}
                  ]}
                />
              </Col>
              )}
             



              <Col md={3}>
                <ThemeSelect
                  placeholder="Select Status"
                  value={(() => {
                    const statusIds = Array.isArray(currentFilters.status_id) ? currentFilters.status_id : (currentFilters.status_id ? [currentFilters.status_id] : []);
                    return statuses.filter((s: any) => statusIds.includes(s.id)).map((s: any) => ({value: s.id, label: s.name}));
                  })()}
                  isMulti
                  onChange={(options: any) => handleFiltersChange({...currentFilters, status_id: options?.map((opt: any) => opt.value) || []})}
                  options={statuses.map((s: any) => ({value: s.id, label: s.name}))}
                />
              </Col>
              <Col md={3}>
                <ThemeSelect
                  placeholder="Select Priority"
                  value={(() => {
                    const priorityOptions = [{value: "", label: "All"}, {value: "critical", label: "Critical"}, {value: "high", label: "High"}, {value: "medium", label: "Medium"}, {value: "low", label: "Low"}];
                    return priorityOptions.find((opt: any) => opt.value === currentFilters.priority) || null;
                  })()}
                  onChange={(option: any) => handleFiltersChange({...currentFilters, priority: option?.value})}
                  options={[{value: "", label: "All"}, {value: "critical", label: "Critical"}, {value: "high", label: "High"}, {value: "medium", label: "Medium"}, {value: "low", label: "Low"}]}
                />
              </Col>
              <Col md={3}>
                <ThemeSelect
                placeholder="Select Type"
                  value={(() => {
                    const typeIds = Array.isArray(currentFilters.type_id) ? currentFilters.type_id : (currentFilters.type_id ? [currentFilters.type_id] : []);
                    return types.filter((t: any) => typeIds.includes(t.id)).map((t: any) => ({value: t.id, label: t.name}));
                  })()}
                  isMulti
                  onChange={(options: any) => handleFiltersChange({...currentFilters, type_id: options?.map((opt: any) => opt.value) || []})}
                  options={types.map((t: any) => ({value: t.id, label: t.name}))}
                />
              </Col>
            
              <Col md={1}>
                <Button variant="outline-primary" className="w-100" onClick={() => handleFiltersChange({...currentFilters, search: currentFilters.search})}>
                  <Filter size={16} />
                </Button>
              </Col>
            </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        )}

  
          <GenericListPage
            columns={columns}
            fetchData={fetchTickets}
            title="Tickets"
            searchPlaceholder="Search tickets..."
            defaultPageSize={15}
            filters={memoizedFilters}
            refreshKey={refreshKey}
            search={false}
            tableStyle="table-style-2"
          />
      
      </>
      )}

      <FormModal
      size="lg"
        show={showEditTicketModal}
        onHide={closeEditTicketModal}
        title={`Edit Ticket #${selectedTicket?.id}`}
        desc="Update the ticket details below"
        formHtml={
          <>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editTicketTitle">Ticket Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="editTicketTitle"
                    value={selectedTicketTitle}
                    onChange={handleEditTicketTitleChange}
                    placeholder="Ticket Title"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editTicketType">Ticket Type</label>
                  <select
                    className="form-control"
                    id="editTicketType"
                    value={
                      selectedTicket?.ticket_type_id ||
                      selectedTicket?.type ||
                      ""
                    }
                    onChange={(e) =>
                      setSelectedTicket({
                        ...selectedTicket,
                        ticket_type_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Type</option>
                    {types.map((type: any) => (
                      <option
                        key={type.id}
                        value={type.id}
                        selected={selectedTicket?.ticket_type_id == type.id}
                      >
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="editTicketDescription">Ticket Description</label>
              <textarea
                className="form-control"
                id="editTicketDescription"
                value={selectedTicketDescription || ""}
                onChange={handleEditTicketDescriptionChange}
                placeholder="Ticket Description (Min: 50 chars)"
                rows={4}
               
              ></textarea>
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">
                  {selectedTicketDescription?.length || 0} characters
                </small>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editTicketStatus">Status</label>
                  <select
                    className="form-control"
                    id="editTicketStatus"
                    value={selectedTicket?.ticket_status_id || ""}
                    onChange={(e) =>
                      setSelectedTicket({
                        ...selectedTicket,
                        ticket_status_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Status</option>
                    {statuses.map((status: any) => (
                      <option
                        value={status.id}
                        selected={selectedTicket?.ticket_status_id == status.id}
                      >
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editTicketModule">Module</label>
                  <select
                    className="form-control"
                    id="editTicketModule"
                    value={selectedTicket?.module_id || ""}
                    onChange={(e) => {
                      setSelectedTicket({
                        ...selectedTicket,
                        module_id: e.target.value,
                      });
                      fetchSubmodules(e.target.value);
                    }}
                  >
                    <option value="">Select Module</option>
                    {modules.length > 0 &&
                      modules.map((module: any) => (
                        <option
                          value={module.id}
                          selected={selectedTicket?.module_id == module.id}
                        >
                          {module.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editTicketSubmodule">
                    Primary Issue (Required)
                  </label>
                  <select
                    className="form-control"
                    id="editTicketSubmodule"
                    value={selectedTicket?.submodule_id || ""}
                    onChange={(e) => {
                      setSelectedTicket({
                        ...selectedTicket,
                        submodule_id: e.target.value,
                      });
                      fetchSubmoduleChildren(e.target.value);
                    }}
                    disabled={
                      !selectedTicket?.module_id || submodules.length == 0
                    }
                  >
                    <option value="">Select Primary Issue</option>
                    {submodules.map((submodule: any) => (
                      <option key={submodule.id} value={submodule.id}>
                        {submodule.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="editTicketSubmoduleChild">
                    Specific Problem (Optional)
                  </label>
                  <select
                    className="form-control"
                    id="editTicketSubmoduleChild"
                    value={selectedTicket?.submodule_child_id || ""}
                    onChange={(e) =>
                      setSelectedTicket({
                        ...selectedTicket,
                        submodule_child_id: e.target.value,
                      })
                    }
                    disabled={
                      !selectedTicket?.submodule_id ||
                      submoduleChildren.length == 0
                    }
                  >
                    <option value="">Select Specific Problem</option>
                    {submoduleChildren.map((child: any) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="editTicketPriority">Priority</label>

              <select
                className="form-control"
                id="editTicketPriority"
                value={selectedTicket?.priority?.toString() || ""}
                onChange={(e) =>
                  setSelectedTicket({
                    ...selectedTicket,
                    priority: e.target.value,
                  })
                }
              >
                <option value="">Select Priority</option>
                <option value="0">Low</option>
                <option value="1">Medium</option>
                <option value="2">High</option>
                <option value="3">Critical</option>
              </select>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="editTicketDueDate">Due Date</label>
              <input
                type="date"
                className="form-control"
                id="editTicketDueDate"
                value={
                  selectedTicket?.due_date
                    ? moment(selectedTicket.due_date).format("YYYY-MM-DD")
                    : ""
                }
                min={moment().format("YYYY-MM-DD")}
                onChange={(e) =>
                  setSelectedTicket({
                    ...selectedTicket,
                    due_date: e.target.value,
                  })
                }
              />
            </div>

            {session?.user?.permissions?.includes("assign-user-tickets") && (
              <div className="form-group mb-3">
                <label htmlFor="editTicketUserExtension">User Extension</label>
                <Select
                  //   className="form-control"
                  id="editTicketUserExtension"
                  isMulti
                  value={
                    selectedTicket?.user_extension
                      ? (Array.isArray(selectedTicket.user_extension)
                          ? selectedTicket.user_extension
                          : [selectedTicket.user_extension]
                        ).map((extId: any) => {
                          const ext = extensions.find(
                            (ext: any) => ext.id.toString() === extId.toString()
                          );
                          return ext
                            ? {
                                value: ext.id,
                                label: ext.display_name,
                              }
                            : null;
                        }).filter(Boolean)
                      : []
                  }
                  onChange={(selectedOptions: any) => {
                    const values = selectedOptions
                      ? selectedOptions.map((opt: any) => opt.value)
                      : [];
                    setSelectedTicket({
                      ...selectedTicket,
                      user_extension: values,
                    });
                  }}
                  options={extensions.map((extension: any) => ({
                    value: extension.id,
                    label: extension.display_name,
                  }))}
                  placeholder="Select User Extension(s)"
                  isClearable
                  isSearchable
                />
              </div>
            )}

            <div className="form-group mb-3">
              <label htmlFor="editTicketTags">Tags</label>
              <CreatableSelect
                id="editTicketTags"
                isMulti
                value={selectedTicketTags.map((tag) => ({
                  value: tag,
                  label: tag,
                }))}
                onChange={(selectedOptions: any) => {
                  const values = selectedOptions
                    ? selectedOptions.map((opt: any) => opt.value)
                    : [];
                  setSelectedTicketTags(values);
                }}
                options={defaultTags.map((tag) => ({
                  value: tag,
                  label: tag,
                }))}
                placeholder="Select or create tags"
                isClearable
                isSearchable
                formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
              />
              <small className="text-muted">
                Select from existing tags or create new ones
              </small>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="editTicketImages">Ticket Images</label>
              <small className="text-muted d-block mb-2">
                Maximum 3 images total (existing + new)
              </small>

              {/* Display existing images with remove option */}
              {selectedTicketExistingImages.length > 0 && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-2 fw-bold">
                    Existing images ({selectedTicketExistingImages.length}):
                  </small>
                  <div className="d-flex flex-column gap-2 mb-2">
                    {selectedTicketExistingImages.map((imgPath: string, index: number) => (
                      <div
                        key={index}
                        className="d-flex align-items-center justify-content-between border rounded p-2"
                      >
                        <small className="text-muted">
                          {imgPath}
                        </small>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            setSelectedTicketExistingImages(
                              selectedTicketExistingImages.filter((_, i) => i !== index)
                            );
                          }}
                          title="Remove image"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input for new images */}
              <label htmlFor="editTicketImages" className="form-label small">
                Add new images (Optional)
              </label>
              <input
                type="file"
                className="form-control"
                id="editTicketImages"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const remainingSlots = 3 - selectedTicketExistingImages.length;
                  
                  if (files.length > remainingSlots) {
                    toast.error(`You can only add ${remainingSlots} more image(s) to reach the maximum of 3 images.`);
                    const limitedFiles = files.slice(0, remainingSlots);
                    setSelectedTicketNewImages(limitedFiles);
                    // Reset file input to reflect the limited selection
                    const fileInput = e.target;
                    const dataTransfer = new DataTransfer();
                    limitedFiles.forEach(file => dataTransfer.items.add(file));
                    fileInput.files = dataTransfer.files;
                  } else {
                    setSelectedTicketNewImages(files);
                  }
                }}
                disabled={selectedTicketExistingImages.length >= 3}
              />
              <small className="text-muted">
                Supported formats: JPG, PNG, GIF. Max size: 5MB per image. You
                can select multiple images. Maximum 3 images total.
              </small>
              {selectedTicketExistingImages.length >= 3 && (
                <small className="text-danger d-block mt-1">
                  Maximum images reached. Remove an existing image to add new ones.
                </small>
              )}
              {selectedTicketNewImages.length > 0 && (
                <div className="mt-2">
                  <small className="text-muted d-block mb-2 fw-bold">
                    New images ({selectedTicketNewImages.length}):
                  </small>
                  <div className="d-flex flex-column gap-2 mb-2">
                    {selectedTicketNewImages.map((image, index) => (
                      <div
                        key={index}
                        className="d-flex align-items-center justify-content-between border rounded p-2"
                      >
                        <small className="text-muted">
                          {image.name}
                        </small>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            setSelectedTicketNewImages(
                              selectedTicketNewImages.filter((_, i) => i !== index)
                            );
                            // Reset file input
                            const fileInput = document.getElementById(
                              "editTicketImages"
                            ) as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = "";
                            }
                          }}
                          title="Remove image"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-2">
                <small className="text-info">
                  Total images: {selectedTicketExistingImages.length + selectedTicketNewImages.length} / 3
                </small>
              </div>
            </div>
          </>
        }
        submitButtonText="Save changes"
        cancelButtonText="Cancel"
        onSubmit={handleSubmitEditTicket}
        onCancel={closeEditTicketModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

      <ConfirmModal
        show={showDeleteTicketModal}
        onHide={closeDeleteTicketModal}
        title="Delete Ticket?"
        description="Are you sure you want to delete ticket {targetName}? This action cannot be undone."
        targetName={selectedTicketTitle || ""}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleSubmitDeleteTicket}
        onCancel={closeDeleteTicketModal}
      />

      <ConfirmModal
        show={showApproveTicketModal}
        onHide={closeApproveTicketModal}
        title={selectedTicketForApprove?.is_approved ? "Unapprove Ticket?" : "Approve Ticket?"}
        description={`Are you sure you want to ${selectedTicketForApprove?.is_approved ? 'unapprove' : 'approve'} ticket #{targetName}?`}
        targetName={selectedTicketForApprove?.id?.toString() || selectedTicketForApprove?.title || ""}
        confirmButtonText={selectedTicketForApprove?.is_approved ? "Unapprove" : "Approve"}
        cancelButtonText="Cancel"
        onConfirm={handleSubmitApproveTicket}
        onCancel={closeApproveTicketModal}
        requireTextConfirmation={true}
        requiredConfirmationText={selectedTicketForApprove?.is_approved ? "UNAPPROVE" : "APPROVE"}
        confirmationPlaceholder={`Type ${selectedTicketForApprove?.is_approved ? "UNAPPROVE" : "APPROVE"}`}
      />


      <FormModal
        show={showCreateTicketModal}
        size="xl"
        showGuidelines={true}
        guidelines={
          <>
        <Alert variant="info" className="mb-4 border-0 shadow-sm">
        <div className="d-flex align-items-start gap-3">
                <div className="bg-info bg-opacity-10 rounded-circle p-2" style={{ minWidth: '40px', height: '40px' }}>
                  <Info size={20} className="text-info" />
                </div>
                <div>
                  <h6 className="fw-bold mb-2 text-info">Quick Guidelines for Creating Tickets</h6>
                  <ul className="mb-0 ps-3" style={{ fontSize: '0.875rem', lineHeight: '1.8' }}>
                    <li>Provide a <strong>clear and descriptive title</strong> that summarizes the issue</li>
                    <li>Choose the appropriate <strong>ticket type</strong> based on the nature of your request</li>
                    <li>Write a <strong>detailed description</strong> (minimum 50 characters) explaining the issue</li>
                    <li>Select the correct <strong>module and category</strong> for faster routing</li>
                    <li>Set the right <strong>priority level</strong> based on business impact</li>
                    <li>Attach relevant <strong>screenshots or documents</strong> to help us understand better</li>
                  </ul>
                </div>
              </div>
        </Alert>
          </>
        }
        onHide={closeCreateTicketModal}
        title="Create New Ticket"
        desc="Fill in the details below to create a new ticket"
        formHtml={
          <>
            <div className="row">
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketTitle" className="fw-semibold d-flex align-items-center gap-2 form-label">Ticket Title <span className="text-danger">*</span>
                  <span className="text-muted" title="Enter a clear and descriptive title that summarizes the issue">
                    <Info size={14} />
                  </span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="newTicketTitle"
                    value={newTicketTitle}
                    onChange={handleNewTicketTitleChange}
                    placeholder="e.g., Unable to login to dashboard after password reset"
                  />
                  <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                    <Info size={12} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Be specific and concise. A good title helps us route your ticket to the right team quickly.
                    </span>
                  </Form.Text>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketType" className="fw-semibold d-flex align-items-center gap-2 form-label">Ticket Type <span className="text-danger">*</span>
                  <span className="text-muted" title="Select the appropriate ticket type based on the nature of your request">
                    <Info size={14} />
                  </span>
                  </label>
                  <select
                    className="form-control"
                    id="newTicketType"
                    value={newTicketType || ""}
                    onChange={(e) => setNewTicketType(e.target.value)}
                  >
                    <option value="">Select Type</option>
                    {types.map((type: any) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <Form.Text className="text-muted d-flex align-items-start gap-1 mt-2">
                    <Info size={14} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Select the type that best matches the nature of your request. This helps us categorize and route your ticket appropriately.
                    </span>
                  </Form.Text>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketPriority" className="fw-semibold d-flex align-items-center gap-2 form-label">Priority <span className="text-danger">*</span>
                  <span className="text-muted" title="Select the appropriate priority level based on the business impact">
                    <Info size={14} />
                  </span>
                  </label>
                  <select
                    className="form-control"
                    id="newTicketPriority"
                    value={newTicketPriority || ""}
                    onChange={(e) => setNewTicketPriority(e.target.value)}
                  >
                    <option value="">Select Priority</option>
                    <option value="0">Low</option>
                    <option value="1">Medium</option>
                    <option value="2">High</option>
                    <option value="3">Critical</option>
                  </select>
                  <Form.Text className="text-muted d-flex align-items-start gap-1 mt-2">
                    <Info size={14} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Choose the urgency level based on business impact. Higher priorities are addressed first by our support team.
                    </span>
                  </Form.Text>
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="newTicketDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">Ticket Description <span className="text-danger">*</span>
              <span className="text-muted" title="Enter a detailed description of the issue">
                <Info size={14} />
              </span>
              </label>
              <textarea
                className="form-control"
                id="newTicketDescription"
                value={newTicketDescription}
                onChange={handleNewTicketDescriptionChange}
                placeholder="Ticket Description (Min: 50 chars)"
                rows={4}
               
              ></textarea>
              <div className="d-flex justify-content-between mt-1">
                <div
                  className={`text-muted ${
                    newTicketDescription.length < 50 ? "text-danger" : ""
                  }`}
                >
                  <Form.Text className={newTicketDescription.length < 50 ? 'text-warning fw-semibold' : 'text-success fw-semibold'}>
                        {newTicketDescription.length < 50 ? (
                          <>
                            <AlertCircle size={14} className="me-1" />
                            Minimum 50 characters required ({50 - newTicketDescription.length} more needed)
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} className="me-1" />
                            Great! Detailed description provided
                          </>
                        )}
                      </Form.Text>
                </div>
                
                
              </div>
              <Form.Text className="text-muted d-block" style={{ fontSize: '0.813rem' }}>
                        <Info size={12} className="me-1" />
                        More details help us resolve your issue faster
                      </Form.Text>
            </div>

            <div className="row">

            <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketModule" className="fw-semibold d-flex align-items-center gap-2 form-label">Module <span className="text-danger">*</span>
                  <span className="text-muted" title="Select the system module related to this issue">
                    <Info size={14} />
                  </span>
                  </label>
                  <select
                    className="form-control"
                    id="newTicketModule"
                    value={newTicketModule || ""}
                    onChange={(e) => {
                      setNewTicketModule(e.target.value);
                      fetchSubmodules(e.target.value);
                    }}
                  >
                    <option value="">Select Module</option>
                    {modules.length > 0 &&
                      modules.map((module: any) => (
                        <option key={module.id} value={module.id}>
                          {module.name}
                        </option>
                      ))}
                  </select>
                  <Form.Text className="text-muted d-flex align-items-start gap-1 mt-2">
                    <Info size={14} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Select the system module related to this issue. This helps us route your ticket to the right team quickly.
                    </span>
                  </Form.Text>
                </div>
              </div>






              
              
            
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketSubmodule" className="fw-semibold d-flex align-items-center gap-2 form-label">
                    Primary Issue <span className="text-danger">*</span>
                    <span className="text-muted" title="Select the primary issue related to this issue">
                      <Info size={14} />
                    </span>
                  </label>
                  <select
                    className="form-control"
                    id="newTicketSubmodule"
                    value={newTicketSubmodule || ""}
                    onChange={(e) => {
                      setNewTicketSubmodule(e.target.value);
                      fetchSubmoduleChildren(e.target.value);
                    }}
                    disabled={!newTicketModule || submodules.length == 0}
                    required
                  >
                    <option value="">Select Primary Issue</option>
                    {submodules.map((submodule: any) => (
                      <option key={submodule.id} value={submodule.id}>
                        {submodule.name}
                      </option>
                    ))}
                  </select>
                  <Form.Text className="text-muted d-flex align-items-start gap-1 mt-2">
                    <Info size={14} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Select the primary issue related to this issue. This helps us route your ticket to the right team quickly.
                    </span>
                  </Form.Text>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketSubmoduleChild" className="fw-semibold d-flex align-items-center gap-2 form-label">
                    Specific Problem (Optional)
                    <span className="text-muted" title="Select the specific problem related to this issue"></span>
                  </label>
                  <select
                    className="form-control"
                    id="newTicketSubmoduleChild"
                    value={newTicketSubmoduleChild || ""}
                    onChange={(e) => setNewTicketSubmoduleChild(e.target.value)}
                    disabled={!newTicketModule || submoduleChildren.length == 0}
                  >
                    <option value="">Select Specific Problem</option>
                    {submoduleChildren.map((child: any) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                  <Form.Text className="text-muted d-flex align-items-start gap-1 mt-2">
                    <Info size={14} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Select the specific problem related to this issue. This helps us route your ticket to the right team quickly.
                    </span>
                  </Form.Text>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketStatus" className="fw-semibold d-flex align-items-center gap-2 form-label">Initial Status <span className="text-danger">*</span>
                  <span className="text-muted" title="Select the initial status of the ticket">
                    <Info size={14} />
                  </span>
                  </label>
                  <select
                    className="form-control"
                    id="newTicketStatus"
                    value={newTicketStatus || ""}
                    onChange={(e) => setNewTicketStatus(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    {statuses.map((status: any) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                  <Form.Text className="text-muted d-flex align-items-start gap-1 mt-2">
                    <Info size={14} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Select the initial status of the ticket. This helps us track the progress of your ticket.
                    </span>
                  </Form.Text>
                </div>
              </div>


              <div className="col-md-6">
              <div className="form-group mb-3">
              <label htmlFor="newTicketDueDate" className="fw-semibold d-flex align-items-center gap-2 form-label">Due Date
              <span className="text-muted" title="Select the due date of the ticket">
                <Info size={14} />
              </span>
              </label>
              <input
                type="date"
                className="form-control"
                id="newTicketDueDate"
                value={newTicketDueDate || ""}
                onChange={(e) => setNewTicketDueDate(e.target.value)}
                min={moment().format("YYYY-MM-DD")}
              />
              <Form.Text className="text-muted d-flex align-items-start gap-1 mt-2">
                <Info size={14} />
                <span style={{ fontSize: '0.813rem' }}>
                  Select the due date of the ticket. This helps us track the progress of your ticket.
                </span>
              </Form.Text>
            </div>
              </div>

            </div>


            <div className="row">
              <div className="col-md-6">
              {session?.user?.permissions?.includes("assign-user-tickets") && (
              <div className="form-group mb-3">
                <label htmlFor="newTicketUserExtension" className="fw-semibold d-flex align-items-center gap-2 form-label">User Extension 
                <span className="text-muted" title="Select the user extension related to this issue">
                  <Info size={14} />
                </span>
                </label>
                <Select
                  id="newTicketUserExtension"
                  isMulti
                  value={newTicketUserExtension.map((extId) => {
                    const ext = extensions.find(
                      (ext: any) => ext.id.toString() === extId.toString()
                    );
                    return ext
                      ? {
                          value: ext.id,
                          label: ext.display_name,
                        }
                      : null;
                  }).filter(Boolean)}
                  onChange={(selectedOptions: any) => {
                    const values = selectedOptions
                      ? selectedOptions.map((opt: any) => opt.value)
                      : [];
                    setNewTicketUserExtension(values);
                  }}
                  options={extensions.map((extension: any) => ({
                    value: extension.id,
                    label: extension.display_name,
                  }))}
                  placeholder="Select User Extension(s)"
                  isClearable
                  isSearchable
                />
                <Form.Text className="text-muted d-flex align-items-start gap-1 mt-2">
                  <Info size={14} />
                  <span style={{ fontSize: '0.813rem' }}>
                    Select the user extension related to this issue. This helps us route your ticket to the right team quickly.
                  </span>
                </Form.Text>
              </div>
            )}
              </div>
              <div className="col-md-6">

              <div className="form-group mb-3">
              <label htmlFor="newTicketTags" className="fw-semibold d-flex align-items-center gap-2 form-label">Tags
              <span className="text-muted" title="Select the tags related to this issue">
                <Info size={14} />
              </span>
              </label>
              <CreatableSelect
                id="newTicketTags"
                isMulti
                value={newTicketTags.map((tag) => ({
                  value: tag,
                  label: tag,
                }))}
                onChange={(selectedOptions: any) => {
                  const values = selectedOptions
                    ? selectedOptions.map((opt: any) => opt.value)
                    : [];
                  setNewTicketTags(values);
                }}
                options={defaultTags.map((tag) => ({
                  value: tag,
                  label: tag,
                }))}
                placeholder="Select or create tags"
                isClearable
                isSearchable
                formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
              />
              <Form.Text className="text-muted d-flex align-items-start gap-1 mt-2">
                <Info size={14} />
                <span style={{ fontSize: '0.813rem' }}>
                  Select the tags related to this issue. This helps us categorize and route your ticket appropriately.
                </span>
              </Form.Text>
            </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="newTicketImages">Ticket Images</label>
              <input
                type="file"
                className="form-control"
                id="newTicketImages"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  console.log("File input onChange triggered");
                  console.log("Selected files:", files);
                  setNewTicketImages(files);
                  console.log(
                    "newTicketImages state updated to:",
                    files.length,
                    "files"
                  );
                }}
              />
              <Alert variant="info" className="py-2 px-3  mt-2 mb-0 border-0 bg-info bg-opacity-10">
                        <div className="d-flex gap-2">
                          <Info size={16} className="text-info mt-1" style={{ minWidth: '16px' }} />
                          <div style={{ fontSize: '0.813rem' }}>
                            <strong>Supported formats:</strong> Images (PNG, JPG, GIF), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX), Text files (TXT, LOG)
                            <br />
                            <strong>Maximum:</strong> 5 files, 5MB per file
                            <br />
                            <strong>Tip:</strong> Screenshots of error messages greatly help our team diagnose issues faster!
                          </div>
                        </div>
                      </Alert>
              {/* {newTicketImages.length > 0 && (
                <div className="mt-2">
                  <small className="text-success d-block mb-1">
                    Selected {newTicketImages.length} image(s):
                  </small>
                  {newTicketImages.map((image, index) => (
                    <small key={index} className="text-success d-block">
                      • {image.name} ({(image.size / 1024 / 1024).toFixed(2)}{" "}
                      MB)
                    </small>
                  ))}
                </div>
              )} */}

{newTicketImages.length > 0 && (
                        <div className="mt-3">
                          <small className="text-muted fw-semibold d-block mb-2">Selected Files ({newTicketImages.length}):</small>
                          <div className="d-flex flex-wrap gap-2">
                            {newTicketImages.map((file, index) => (
                              <Badge key={index} bg="light" text="dark" className="p-2 d-flex align-items-center gap-2">
                                <Paperclip size={14} className="text-primary" />
                                <span style={{ fontSize: '0.875rem' }}>{file.name}</span>
                                <small className="text-muted">({(file.size / 1024).toFixed(1)} KB)</small>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 ms-1 text-danger"
                                  onClick={() => {
                                    const newAttachments =newTicketImages.filter((_, i) => i !== index);
                                    setNewTicketImages(newAttachments);
                                    // Update the file input to reflect the remaining files
                                    const fileInput = document.getElementById("newTicketImages") as HTMLInputElement;
                                    if (fileInput) {
                                      const dataTransfer = new DataTransfer();
                                      newAttachments.forEach(file => dataTransfer.items.add(file));
                                      fileInput.files = dataTransfer.files;
                                    }
                                  }}
                                  title="Remove file"
                                >
                                  <X size={14} />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
            </div>
          </>
        }
        submitButtonText={creatingTicket ? "Creating..." : "Create"}
        cancelButtonText="Cancel"
        onSubmit={handleSubmitCreateTicket}
        onCancel={closeCreateTicketModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

<Modal
        show={showViewTicketModal}
        onHide={closeViewTicketModal}
        size="xl"
        centered
        className="ticket-view-modal"
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="d-flex align-items-center gap-2">
            <span className="badge bg-primary fs-6">#{viewTicketData?.id}</span>
            <span className="text-capitalize">{viewTicketData?.title}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "80vh", overflowY: "auto" }}>


        <Row>
          <Col md={3} className="border-end">
            <h5 className="fw-bold mb-4">Ticket Information</h5>
            
            <Row className="mb-3">
              <Col xs={12}>
                <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Module</small>
                <Badge bg="primary" className="bg-opacity-10 text-dark px-2 py-2">
                  <FileText size={14} className="me-2" />
                  <span style={{ fontSize: '0.875rem' }}>{viewTicketData?.module?.name}</span>
                </Badge>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col xs={6}>
                <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Type</small>
                <Badge bg="secondary" className="bg-opacity-10 text-dark px-2 py-2">
                  <Tag size={14} className="me-2" />
                  <span style={{ fontSize: '0.875rem' }}>{viewTicketData?.type?.name}</span>
                </Badge>
              </Col>
              <Col xs={6}>
                <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Priority</small>
                <Badge bg={getPriorityBadgeColor(viewTicketData.priority)} className="bg-opacity-10 text-dark px-2 py-2">
                  <span style={{ fontSize: '0.875rem' }}>{priorityLabels[viewTicketData?.priority] || "Unknown"}</span>
                </Badge>
              </Col>
            </Row>


            <Row className="mb-3">
              <Col xs={6}>
                <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Created At</small>
                <div className="d-flex align-items-center gap-2">
                  <Clock size={14} className="text-muted" />
                  <span style={{ fontSize: '0.875rem' }}>{moment(viewTicketData?.created_at).format("DD-MMM-YYYY")}</span>
                </div>
              </Col>
              <Col xs={6}>
                <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Due Date</small>
                <div className="d-flex align-items-center gap-2">
                  <Calendar size={14} className="text-muted" />
                  <span 
                    className={viewTicketData.dueDate === 'No due date' ? 'text-muted' : 'fw-semibold'} 
                    style={{ fontSize: '0.875rem' }}
                  >
                    {moment(viewTicketData?.due_date).format("DD-MMM-YYYY")}
                  </span>
                </div>
              </Col>
            </Row>

            <div className="mb-3">
              <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Created By</small>
              <div className="d-flex align-items-center gap-2">
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <User size={16} className="text-primary" />
                </div>
                <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>{extensions.find(
                  (extension: any) => extension.id == viewTicketData?.created_by
                )?.display_name || viewTicketData?.created_by}</span>
              </div>
            </div>

            <hr className="my-4" />

            {/* update will be here */}
            {/* Status Update Section */}
            <div className="mb-3">
              <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Status</small>
              <InputGroup>
                <Form.Select
                  value={viewTicketData?.ticket_status_id}
                  onChange={(e) => setViewTicketData({...viewTicketData, ticket_status_id: e.target.value})}
                  className="form-control"
                  disabled={true}
                  style={{ fontSize: '0.875rem' }}
                >
                  {statuses.map((status: any) => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </Form.Select>
                {/* <Button 
                  variant="primary" 
                  onClick={handleStatusUpdate}
                  disabled={ticketStatus === selectedTicket.status}
                  style={{ fontSize: '0.875rem' }}
                >
                  Update
                </Button> */}
              </InputGroup>
            </div>

            {/* Assign User Section */}
            <div className="mb-3">
              <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Assigned To</small>
              <InputGroup>
                <Form.Select
                  value={viewTicketData?.user_extension}
                  onChange={(e) => setViewTicketData({...viewTicketData, user_extension: e.target.value})}
                  className="form-control"
                  disabled={true}
                  style={{ fontSize: '0.875rem' }}
                >
                  {extensions.map((extension: any, index: number) => (
                    <option key={index} value={extension.id}>{extension.display_name}</option>
                  ))}
                </Form.Select>
                {/* <Button 
                  variant="success" 
                  onClick={handleAssignUser}
                  disabled={assignedUser === selectedTicket.assignedTo}
                  style={{ fontSize: '0.875rem' }}
                >
                  Assign
                </Button> */}
              </InputGroup>
            </div>

            <hr className="my-4" />

          <div className="mb-4">
            <h6 className="fw-bold mb-3">Description</h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.938rem', lineHeight: '1.6' }}>
              {viewTicketData?.description}
            </p>
          </div>


          {/* Initial Attachments */}
          {viewTicketImages.length > 0 && (
            <div className="mb-3">
              <h6 className="fw-bold mb-3">Initial Attachments</h6>
              <div className="d-flex flex-column gap-2">
                {viewTicketImages.map((imageUrl, index) => (
                  <div 
                    key={index} 
                    className="p-2 bg-light rounded d-flex align-items-center justify-content-between"
                    style={{ border: '1px solid #e0e0e0' }}
                  >
                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                      <Paperclip size={14} className="text-primary" />
                      <div className="d-flex flex-column">
                            {/* onClick={() => handleImageClick(imageUrl)} */}
                            {/* <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                              
                              </span> */}
                              <img
                              onClick={() => handleImageClick(imageUrl)}
                              src={imageUrl}
                              alt={`Ticket Image ${index + 1}`}
                              className="img-fluid rounded"
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                border: "2px solid #dee2e6",
                              }}
                            />
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}></small>
                      </div>
                    </div>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-1 text-primary" 
                      title="Download"
                      style={{ minWidth: 'auto' }}
                      onClick={() => handleImageClick(imageUrl)}
                    >
                      <Download size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          </Col>

          <Col md={9}>

          {/* Tab Navigation */}
          <div className="mb-4">
                <div className="d-flex gap-2 border-bottom pb-2">
                  <Button
                    variant={activeTab === 'public' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setActiveTab('public')}
                    className="d-flex align-items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Public Conversation
                    <Badge bg={activeTab === 'public' ? 'light' : 'primary'} text={activeTab === 'public' ? 'dark' : 'white'}>
                      {/* {publicComments.length} */}
                    </Badge>
                  </Button>
                  {canAddAssigneeComment && (
                  <Button
                    variant={activeTab === 'internal' ? 'danger' : 'outline-danger'}
                    size="sm"
                    onClick={() => setActiveTab('internal')}
                    className="d-flex align-items-center gap-2"
                  >
                    <AlertCircle size={16} />
                    Internal Notes
                    <Badge bg={activeTab === 'internal' ? 'light' : 'danger'} text={activeTab === 'internal' ? 'dark' : 'white'}>
                      {/* {internalNotes.length} */}
                    </Badge>
                  </Button>
                  )}

                  <Button
                    variant={activeTab === 'activity' ? 'warning' : 'outline-warning'}
                    size="sm"
                    onClick={() => setActiveTab('activity')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Clock size={16} />
                    Activity Logs
                    <Badge bg={activeTab === 'activity' ? 'light' : 'warning'} text={activeTab === 'activity' ? 'dark' : 'white'}>
                      {/* {activityLogs.length} */}
                    </Badge>
                  </Button>
                </div>
              </div>

              <div>
                {activeTab === 'public' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">
                        <MessageCircle size={18} className="me-2" />
                        Public Conversation 
                        {/* ({publicComments.length}) */}
                      </h6>
                    </div>

                    {showComments && (
                <div>
                  {isLoadingComments ? (
                    <div className="text-center py-4">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading comments...</p>
                    </div>
                  ) : (
                    <Row className="g-3">
                      {/* User Comments Column */}
                      <Col md={12}>


                      <div
                              className="comments-list"
                              // style={{ maxHeight: "300px", overflowY: "auto" }}
                            >
                              {comments.length > 0 ? (
                                
                                renderCommentThread(comments,'public')
                              ) : (
                                <p className="text-muted text-center">
                                  No public comments yet
                                </p>
                              )}
                            </div>
                        


                        <Card className="border-primary mt-4">
                      <Card.Body className="p-3">
                          
                      {session?.user?.permissions?.includes(
                              "update-ticket-comments-tickets"
                            ) && (
                              <div className="mb-3">
                                <h6 className="fw-bold mb-3">Add Comment</h6>
                                <textarea
                                  className="form-control mb-3"
                                  rows={3}
                                  placeholder="Add a new comment..."
                                  value={newComment}
                                  onChange={(e) =>
                                    setNewComment(e.target.value)
                                  }
                                />

<div className="mt-1">
                                  
                                  <small className="text-muted">
                                    Supported formats: JPG, PNG, GIF. Max size:
                                    5MB
                                  </small>
                                  {newCommentAttachment && (
                                    <div className="mt-0 mb-2">
                                      <small className="text-warning">
                                        Selected: {newCommentAttachment.name} (
                                        {(
                                          newCommentAttachment.size /
                                          1024 /
                                          1024
                                        ).toFixed(2)}{" "}
                                        MB)
                                      </small>
                                    </div>
                                  )}
                                </div>
                               
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <label htmlFor="newCommentAttachment" className="btn btn-outline-secondary btn-sm">
                                      <Paperclip size={14} className="me-1" />
                                      Attach File
                                    </label>
                                    <input
                                    type="file"
                                    className="form-control form-control-sm d-none"
                                    id="newCommentAttachment"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      setNewCommentAttachment(file || null);
                                    }}
                                  />
                                  </div>
                                  
                                  <Button 
                                    variant='primary'
                                    onClick={() =>
                                      handleAddComment(viewTicketData?.id)
                                    }
                                    disabled={
                                      !newComment.trim() || creatingTicket
                                    }
                                  >
                                    <Send size={14} className="me-1" /> Add Comment
                                  </Button>
                                </div>



                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}
                </div>
              )}
                   
                  </>
                )}


{activeTab === 'internal' && canAddAssigneeComment && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-danger">
                        <AlertCircle size={18} className="me-2" />
                        Internal Notes 
                        
                      </h6>
                    </div>
                    <Alert variant="danger" className="mb-3">
                      <AlertCircle size={16} className="me-2" />
                      <strong>Private:</strong> These notes are only visible to internal team members and will not be shown to customers.
                    </Alert>

                    

                    {showComments && (
                <div>
                  {isLoadingComments ? (
                    <div className="text-center py-4">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading comments...</p>
                    </div>
                  ) : (
                    <Row className="g-3">
                      
                      <div 
                              className="comments-list col-12"
                              // style={{ maxHeight: "300px", overflowY: "auto" }}
                            >
                              {assigneeComments.length > 0 ? (
                                renderCommentThread(assigneeComments,'internal')
                              ) : (
                                <p className="text-muted text-center">
                                  No assignee comments yet
                                </p>
                              )}
                            </div>
                      {/* Assignee Comments Column */}
                      <Col md={12}>
                      <Card className={`border-${activeTab === 'internal' ? 'danger' : 'primary'} mt-4`}>
                      <Card.Body className="p-3">
                          
                            {canAddAssigneeComment ? (
                              <div className="mb-3">
                                <h6 className="fw-bold mb-3">
                        {activeTab === 'internal' ? 'Add Internal Note' : 'Add Comment'}
                      </h6>
                                <textarea
                                  className="form-control mb-3"
                                  rows={3}
                                  placeholder="Add a new assignee comment..."
                                  value={newAssigneeComment}
                                  onChange={(e) =>
                                    setNewAssigneeComment(e.target.value)
                                  }
                                />
                               
                               
<div className="mt-1">
                                  
                                  <small className="text-muted">
                                    Supported formats: JPG, PNG, GIF. Max size:
                                    5MB
                                  </small>
                                  {newAssigneeCommentAttachment && (
                                    <div className="mt-0 mb-2">
                                      <small className="text-warning">
                                        Selected: {newAssigneeCommentAttachment.name} (
                                        {(
                                          newAssigneeCommentAttachment.size /
                                          1024 /
                                          1024
                                        ).toFixed(2)}{" "}
                                        MB)
                                      </small>
                                    </div>
                                  )}
                                </div>

                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <label htmlFor="newAssigneeCommentAttachment" className="btn btn-outline-secondary btn-sm">
                                      <Paperclip size={14} className="me-1" />
                                      Attach File
                                    </label>
                                    <input
                                    type="file"
                                    className="form-control form-control-sm d-none"
                                    id="newAssigneeCommentAttachment"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      setNewAssigneeCommentAttachment(
                                        file || null
                                      );
                                    }}
                                  />
                                  </div>
                                  <Button 
                                    variant='danger'
                                    onClick={() =>
                                      handleAddAssigneeComment(viewTicketData?.id)
                                    }
                                    disabled={
                                      !newAssigneeComment.trim() || creatingTicket
                                    }
                                  >
                                    <Send size={14} className="me-1" /> Add Internal Note
                                  </Button>
                                </div>



                              </div>

                            ) : (
                              <div className="mb-3">
                                <p className="text-muted small mb-0">
                                  Only assigned users can add assignee comments.
                                </p>
                              </div>
                            )}

<Alert variant="danger" className="py-2 mb-3">
                        <AlertCircle size={14} className="me-2" />
                        <small>This note will only be visible to internal team members</small>
                      </Alert>

                          </Card.Body>
                        </Card>



                      </Col>
                    </Row>
                  )}
                </div>
              )}
                   
                  </>
                )}


{activeTab === 'activity' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-warning">
                        <Clock size={18} className="me-2" />
                        Activity Logs ({viewTicketData.activity_logs.length})
                      </h6>
                    </div>
                    {viewTicketData.activity_logs.length > 0 ? (
                      <div
                      className="activity-logs-list"
                      // style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      {/* {viewTicketData.activity_logs
                        .slice()
                        .reverse()
                        .map((log: any, index: number) => (
                          <div
                            key={log.id || index}
                            className="activity-log-item border-bottom pb-3 mb-3"
                            style={{
                              padding: "15px",
                              backgroundColor: "#f8f9fa",
                              borderRadius: "5px",
                              marginBottom: "10px",
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor:
                                      log.action === "created"
                                        ? "#10B981"
                                        : log.action === "updated"
                                        ? "#3B82F6"
                                        : "#6B7280",
                                    color: "white",
                                    fontWeight: "600",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {log.action}
                                </span>
                                {log.user_extension && (
                                  <span className="ms-2 text-muted">
                                    by{" "}
                                    {extensions.find(
                                      (ext: any) =>
                                        ext.id.toString() === log.user_extension.toString()
                                    )?.display_name || log.user_extension}
                                  </span>
                                )}
                              </div>
                              <div className="text-end">
                                <small className="text-muted d-block">
                                  {moment(log.created_at).fromNow()}
                                </small>
                                <small className="text-muted">
                                  {moment(log.created_at).format("DD/MM/YYYY HH:mm:ss")}
                                </small>
                              </div>
                            </div>
    
                            {log.changes && Object.keys(log.changes).length > 0 && (
                              <div className="mt-2">
                                <strong className="text-muted small">Changes:</strong>
                                <ul className="list-unstyled mt-1 mb-0" style={{ fontSize: "0.9rem" }}>
                                  {Object.entries(log.changes).map(([fieldName, change]: [string, any]) => (
                                    <li key={fieldName} className="mb-1">
                                      <span className="text-capitalize">
                                        {fieldName.replace(/_/g, " ")}:
                                      </span>{" "}
                                      <span className="text-decoration-line-through text-danger">
                                        {fieldName === "title" || fieldName === "description"
                                          ? change.old
                                          : resolveFieldName(fieldName, change.old)}
                                      </span>{" "}
                                      →{" "}
                                      <span className="text-success fw-bold">
                                        {fieldName === "title" || fieldName === "description"
                                          ? change.new
                                          : resolveFieldName(fieldName, change.new)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))} */}

                        {renderCommentThread(viewTicketData.activity_logs,'activity')}
                    </div>
                    ) : (
                      <Alert variant="secondary">
                        <Info size={16} className="me-2" />
                        No activity logs yet.
                      </Alert>
                    )}
                  </>
                )}



                </div>
          
          
          </Col>
        </Row>

{/* old here */}



          {/* Header Section */}
          {/* <div className="mb-4">
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
              <span
                className="badge"
                style={{
                  backgroundColor: `${viewTicketData?.status?.color}30`,
                  color: viewTicketData?.status?.color,
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                  padding: "0.5rem 0.75rem",
                }}
              >
                {viewTicketData?.status?.name}
              </span>
              <span className="badge bg-primary text-uppercase">
                {types.find(
                  (type: any) => type.id == viewTicketData?.ticket_type_id
                )?.name ||
                  viewTicketData?.type?.name ||
                  "Unknown"}
              </span>
              {(() => {
                
                const priorityColors = [
                  "bg-success",
                  "bg-warning",
                  "bg-danger",
                  "bg-danger",
                ];
                return (
                  <span
                    className={`badge ${
                      priorityColors[viewTicketData?.priority] ||
                      "bg-secondary"
                    } text-uppercase`}
                  >
                    {priorityLabels[viewTicketData?.priority] || "Unknown"}
                  </span>
                );
              })()}
              <span
                className="badge"
                style={{
                  backgroundColor: `${viewTicketData?.module?.color}30`,
                  color: viewTicketData?.module?.color,
                  fontWeight: "bold",
                }}
              >
                {viewTicketData?.module?.name}
              </span>
            </div>
            <p
              className="text-muted mb-0"
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                lineHeight: "1.6",
                fontSize: "0.95rem",
              }}
            >
              {viewTicketData?.description}
            </p>
          </div> */}

          {/* Main Content Grid */}
          
            {/* Left Column */}
            {/* <Col md={6}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="card-title mb-3 text-primary border-bottom pb-2">
                    Ticket Information
                  </h6>
                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Primary Issue</small>
                    {viewTicketData?.submodule ? (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${viewTicketData?.submodule?.color}30`,
                          color: viewTicketData?.submodule?.color,
                          fontWeight: "bold",
                        }}
                      >
                        {viewTicketData?.submodule?.name}
                      </span>
                    ) : (
                      <span className="text-muted">Not assigned</span>
                    )}
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Specific Problem</small>
                    {viewTicketData?.submodule_child ? (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${viewTicketData?.submodule_child?.color}30`,
                          color: viewTicketData?.submodule_child?.color,
                          fontWeight: "bold",
                        }}
                      >
                        {viewTicketData?.submodule_child?.name}
                      </span>
                    ) : (
                      <span className="text-muted">Not assigned</span>
                    )}
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Assigned To</small>
                    {(() => {
                      const userExtensions = Array.isArray(viewTicketData?.user_extension)
                        ? viewTicketData.user_extension
                        : viewTicketData?.user_extension
                        ? [viewTicketData.user_extension]
                        : [];
                      
                      if (userExtensions.length === 0) {
                        return <span className="badge bg-secondary">Not assigned</span>;
                      }
                      
                      return (
                        <div className="d-flex flex-wrap gap-1">
                          {userExtensions.map((extId: any, index: number) => {
                            const ext = extensions.find(
                              (extension: any) =>
                                extension.id.toString() === extId.toString()
                            );
                            return (
                              <span key={index} className="badge bg-info">
                                {ext?.display_name || extId}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Due Date</small>
                    <span className="text-dark">
                      {viewTicketData?.due_date
                        ? moment(viewTicketData.due_date).format("DD/MM/YYYY")
                        : "No due date"}
                    </span>
                  </div>
                  <div>
                    <small className="text-muted d-block mb-1">Tags</small>
                    {(() => {
                      const tagsArray = Array.isArray(viewTicketData?.tags)
                        ? viewTicketData.tags
                        : viewTicketData?.tags
                        ? [viewTicketData.tags]
                        : [];
                      
                      if (tagsArray.length === 0) {
                        return <span className="text-muted">No tags</span>;
                      }
                      
                      return (
                        <div className="d-flex flex-wrap gap-1">
                          {tagsArray.map((tag: string, index: number) => (
                            <span key={index} className="badge bg-secondary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </Col> */}

         

          {/* Metadata */}
          {/* <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="card-title mb-3 text-primary border-bottom pb-2">
                Metadata
              </h6>
              <Row className="g-3">
                <Col md={6}>
                  <div>
                    <small className="text-muted d-block mb-1">Created By</small>
                    <span className="text-dark">
                      {extensions.find(
                        (ext: any) => ext.id.toString() === viewTicketData?.created_by?.toString()
                      )?.display_name || viewTicketData?.created_by || "Unknown"}
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  <div>
                    <small className="text-muted d-block mb-1">Created At</small>
                    <span className="text-dark">
                      {moment(viewTicketData?.created_at).format("DD/MM/YYYY HH:mm:ss")}
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  <div>
                    <small className="text-muted d-block mb-1">Last Updated</small>
                    <span className="text-dark">
                      {moment(viewTicketData?.updated_at).format("DD/MM/YYYY HH:mm:ss")}
                    </span>
                  </div>
                </Col>
              </Row>
            </div>
          </div> */}

         

          
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={closeViewTicketModal}>
            Close
          </Button>
        </Modal.Footer>
        
      </Modal>


      <div className="modal-parent-custom">
        {showImageModal && (
          <Modal
            show={showImageModal}
            onHide={closeImageModal}
            size="xl"
            centered
            className=""
          >
            <Modal.Header closeButton>
              <Modal.Title>Ticket Image</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
              <img
                src={selectedImage}
                alt="Ticket Image Full Size"
                className="img-fluid"
                style={{ maxHeight: "70vh" }}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeImageModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </React.Fragment>
  );
};

TicketList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TicketList;
