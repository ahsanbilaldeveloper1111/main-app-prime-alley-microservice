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
import {
  GetTicket,
  GetComments,
  GetAssigneeComments,
  AddComment,
  AddAssigneeComment,
  loadImage,
  UpdateTicketDetails,
} from "@utils/tickets";
import { GetHierarchyData } from "@utils/users";
import { GetAllStatuses } from "@utils/ticket-statuses";
import { GetAllTypes } from "@utils/ticket-types";
import {
  Button,
  Row,
  Col,
  Card,
  InputGroup,
  Form,
  Alert,
  Badge,
  Modal,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import moment from "moment";
import {
  GetAllModules,
  GetAllSubmodules,
  GetAllSubmoduleChildren,
} from "@utils/ticket-module";
import { ModuleSlug } from "@utils/Helper";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { GlobalDateFormat } from "@utils/Helper";
import {
  User,
  Info,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Paperclip,
  FileText,
  Tag,
  Calendar,
  Clock,
  Download,
  MessageCircle,
  Send,
} from "lucide-react";

const getPriorityBadgeColor = (priority: string | number) => {
  if (!priority && priority !== 0) return "secondary";
  switch (Number(priority)) {
    case 3:
      return "danger";
    case 2:
      return "warning";
    case 1:
      return "info";
    case 0:
      return "success";
    default:
      return "secondary";
  }
};

const priorityLabels = ["Low", "Medium", "High", "Critical"];

const TicketDetail = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState<"public" | "internal" | "activity">(
    "public"
  );

  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statuses, setStatuses] = useState<any>([]);
  const [modules, setModules] = useState<any>([]);
  const [types, setTypes] = useState<any>([]);
  const [extensions, setExtensions] = useState<any>([]);
  const [hierarchyData, setHierarchyData] = useState<any>([]);

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
  const [showComments] = useState<boolean>(true);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);

  // Image related states
  const [viewTicketImages, setViewTicketImages] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [statusesData, modulesData, typesData, hierarchyDataResult] =
          await Promise.all([
            GetAllStatuses(),
            GetAllModules(),
            GetAllTypes(),
            GetHierarchyData(ModuleSlug.TICKET),
          ]);

        setStatuses(statusesData || []);
        setModules(modulesData || []);
        setTypes(typesData || []);
        setHierarchyData(hierarchyDataResult);
        setExtensions(hierarchyDataResult?.extensions || []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch ticket data when ID is available
  useEffect(() => {
    if (id) {
      fetchTicketData();
    }
  }, [id]);

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

  // Comment handling functions
  const fetchComments = useCallback(async (ticketId: string) => {
    try {
      setIsLoadingComments(true);
      const [commentsData, assigneeCommentsData] = await Promise.all([
        GetComments(ticketId),
        GetAssigneeComments(ticketId),
      ]);

      let processedComments: any[] = [];
      let processedAssigneeComments: any[] = [];

      // Extract comments from the nested response structure
      if (commentsData?.data?.data) {
        processedComments = commentsData.data.data;
      } else if (commentsData?.data) {
        processedComments = commentsData.data;
      } else {
        processedComments = [];
      }

      if (assigneeCommentsData?.data?.data) {
        processedAssigneeComments = assigneeCommentsData.data.data;
      } else if (assigneeCommentsData?.data) {
        processedAssigneeComments = assigneeCommentsData.data;
      } else {
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

  const fetchTicketData = useCallback(async () => {
    if (!id) return;

    const ticketId = String(id);

    const handleTicketLoadFailure = (message: string) => {
      toast.error(message);
      router.push("/tickets/list");
    };

    const applyTicketImages = (ticket: any) => {
      if (!ticket?.image) {
        setViewTicketImages([]);
        return;
      }

      const images = Array.isArray(ticket.image)
        ? ticket.image
        : [ticket.image].filter(Boolean);

      if (images.length > 0) {
        loadImgs(images);
        return;
      }

      setViewTicketImages([]);
    };

    const fetchAndAttachSubmoduleData = async (ticket: any) => {
      if (!ticket?.module_id) return;

      try {
        const submoduleData = await GetAllSubmodules();
        const filteredSubmodules = (Array.isArray(submoduleData)
          ? submoduleData
          : []
        ).filter((sub: any) => sub.module_id == ticket.module_id);

        if (!ticket?.submodule_id) {
          setTicketData({ ...ticket, submodule: null, submodule_child: null });
          return;
        }

        const submoduleChildData = await GetAllSubmoduleChildren();
        const filteredChildren = (Array.isArray(submoduleChildData)
          ? submoduleChildData
          : []
        ).filter((child: any) => child.submodule_id == ticket.submodule_id);

        setTicketData({
          ...ticket,
          submodule: filteredSubmodules.find(
            (sub: any) => sub.id == ticket.submodule_id,
          ),
          submodule_child: filteredChildren.find(
            (child: any) => child.id == ticket.submodule_child_id,
          ),
        });
      } catch (error) {
        console.error("Error fetching submodule data:", error);
      }
    };

    try {
      setLoading(true);
      const ticket = await GetTicket(ticketId);

      if (!ticket) {
        handleTicketLoadFailure("Failed to fetch ticket");
        return;
      }

      setTicketData(ticket);

      // Fire-and-forget; comment loader has its own error handling.
      fetchComments(ticketId);

      await fetchAndAttachSubmoduleData(ticket);
      applyTicketImages(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      handleTicketLoadFailure("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }, [id, router, fetchComments]);

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
        const userExtension = Array.isArray(ticketData?.user_extension)
          ? ticketData.user_extension[0] || ""
          : ticketData?.user_extension || "";
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
    [newComment, newCommentAttachment, ticketData, fetchComments]
  );

  const handleAddAssigneeComment = useCallback(
    async (ticketId: string) => {
      // Check permission before allowing comment
      if (!ticketData || !session?.user) {
        toast.error("Unable to add comment");
        return;
      }

      const isSuperAdmin =
        session.user.is_admin === "1" || String(session.user.is_admin) === "1";
      const userPhone = session.user.phone;

      if (!isSuperAdmin && userPhone) {
        const userExtensions = Array.isArray(ticketData.user_extension)
          ? ticketData.user_extension
          : ticketData.user_extension
          ? [ticketData.user_extension]
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
        const userExtension = Array.isArray(ticketData?.user_extension)
          ? ticketData.user_extension[0] || ""
          : ticketData?.user_extension || "";
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
      ticketData,
      fetchComments,
      session?.user,
    ]
  );

  // Check if user can add assignee comments (must be assigned to ticket or super admin)
  const canAddAssigneeComment = useMemo(() => {
    if (!ticketData || !session?.user) return false;

    // Super admin can always add assignee comments
    if (
      session.user.is_admin === "1" ||
      String(session.user.is_admin) === "1"
    ) {
      return true;
    }

    // Check if user's phone/extension is in the ticket's user_extension
    const userPhone = session.user.phone;
    if (!userPhone) return false;

    const userExtensions = Array.isArray(ticketData.user_extension)
      ? ticketData.user_extension
      : ticketData.user_extension
      ? [ticketData.user_extension]
      : [];

    return userExtensions.some((ext: any) => {
      const extString = String(ext);
      const phoneString = String(userPhone);
      return extString === phoneString;
    });
  }, [ticketData, session?.user]);

  const handleImageClick = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  }, []);

  const closeImageModal = useCallback(() => setShowImageModal(false), []);

  // Component to display change images with proper loading
  const ChangeImageDisplay = ({ 
    imagePath, 
    isOld, 
    fallbackText,
    onClick 
  }: { 
    imagePath: string; 
    isOld: boolean;
    fallbackText: string;
    onClick?: () => void;
  }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      if (imagePath) {
        setLoading(true);
        setError(false);
        loadImage(imagePath)
          .then((url) => {
            setImageUrl(url);
            setLoading(false);
          })
          .catch((err) => {
            console.error("Error loading change image:", err);
            setError(true);
            setLoading(false);
          });
      } else {
        setError(true);
        setLoading(false);
      }
    }, [imagePath]);

    if (loading) {
      return (
        <small className="text-muted" style={{ fontSize: "0.75rem" }}>
          Loading...
        </small>
      );
    }

    if (error || !imageUrl) {
      return (
        <small 
          className={isOld ? "text-muted fw-medium" : "text-dark fw-bold"} 
          style={{ 
            fontSize: "0.813rem", 
            textDecoration: isOld ? "line-through" : "none",
            color: isOld ? undefined : "#28a745"
          }}
        >
          {fallbackText}
        </small>
      );
    }

    const imageElement = (
      <img
        src={imageUrl}
        alt={isOld ? "Previous value" : "Updated value"}
        className="img-fluid rounded"
        style={{
          maxWidth: "60px",
          maxHeight: "60px",
          objectFit: "cover",
          border: `1px solid ${isOld ? "#dc3545" : "#28a745"}`,
        }}
      />
    );

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className="border-0 bg-transparent p-0"
          style={{ cursor: "pointer" }}
          aria-label="View image"
        >
          {imageElement}
        </button>
      );
    }

    return imageElement;
  };

  const formatChangeValue = (value: any, fieldName?: string): string => {
    if (value === null || value === undefined) return "None";
    
    // Handle priority field - map numeric values to labels
    if (fieldName === "priority" || fieldName === "Priority") {
      const priorityNum = Number(value);
      if (!Number.isNaN(priorityNum) && priorityNum >= 0 && priorityNum < priorityLabels.length) {
        return priorityLabels[priorityNum];
      }
    }
    
    // Handle is_approved field - convert boolean/string to "Approved"/"Not Approved"
    if (fieldName === "is_approved" || fieldName === "Is Approved") {
      if (value === true || value === "true" || value === "True") {
        return "Approved";
      }
      if (value === false || value === "false" || value === "False") {
        return "Not Approved";
      }
    }
    
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const renderChanges = (changes: any, userExtension: any) => {
    if (!changes || typeof changes !== "object") return null;

    const updatedBy = extensions.find(
      (e: any) => e?.id?.toString() === userExtension?.toString()
    )?.display_name || userExtension;

    const changeEntries = Object.entries(changes).filter(([_, change]: [string, any]) => 
      change && typeof change === "object"
    );

    return (
      <div
        role="alert"
        className="fade mb-0 alert alert-white show"
        style={{ 
          borderRadius: "8px",
          border: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: 0,
          overflow: "hidden"
        }}
      >
        {/* Header Section */}
        <div 
          className="d-flex align-items-center gap-2 px-3 py-2"
          style={{ 
            backgroundColor: "rgba(255, 193, 7, 0.15)",
            borderBottom: "1px solid rgba(0,0,0,0.08)"
          }}
        >
          <CheckCircle size={18} className="text-warning" style={{ color: "#ff9800" }} />
          <small className="fw-semibold" style={{ fontSize: "0.875rem", color: "#856404" }}>
            Ticket updated by {updatedBy}
          </small>
        </div>

        {/* Changes Section */}
        <div className="px-3 py-3">
          <small className="fw-bold d-block mb-3" style={{ fontSize: "0.813rem", color: "#856404", letterSpacing: "0.3px" }}>
            Changes made:
          </small>
          <div className="d-flex flex-column gap-2">
            {changeEntries.map(([field, change]: [string, any], index: number) => {
              // Format field name (convert snake_case to Title Case)
              const fieldName = field
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
              
              const oldValue = formatChangeValue(change.old, field);
              const newValue = formatChangeValue(change.new, field);
              
              // Check if this is an image field
              const isImageField = field === "image" || field === "Image";
              const oldImageValue = isImageField ? (Array.isArray(change.old) ? change.old[0] : change.old) : null;
              const newImageValue = isImageField ? (Array.isArray(change.new) ? change.new[0] : change.new) : null;

              return (
                <div key={field}>
                  <div 
                    className="d-flex flex-column gap-2 p-2 rounded"
                    style={{ 
                      backgroundColor: index % 2 === 0 ? "rgba(255, 255, 255, 0.5)" : "transparent",
                      transition: "background-color 0.2s"
                    }}
                  >
                    <div className="flex-shrink-0">
                      <small className="fw-bold text-dark" style={{ fontSize: "0.813rem" }}>
                        {fieldName}:
                      </small>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {/* Old Value */}
                      <div className="d-flex align-items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: "rgba(220, 53, 69, 0.1)" }}>
                        <ArrowLeft size={16} style={{ color: "#dc3545" }} />
                        {isImageField && oldImageValue && oldImageValue !== "None" && oldImageValue !== null ? (
                          <ChangeImageDisplay
                            imagePath={oldImageValue}
                            isOld={true}
                            fallbackText={oldValue}
                          />
                        ) : (
                          <small 
                            className="text-muted fw-medium" 
                            style={{ fontSize: "0.813rem", textDecoration: "line-through" }}
                          >
                            {oldValue}
                          </small>
                        )}
                      </div>
                      
                      <ArrowRight size={18} style={{ color: "#28a745", fontWeight: "bold" }} />
                      
                      {/* New Value */}
                      <div className="d-flex align-items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: "rgba(40, 167, 69, 0.1)" }}>
                        {isImageField && newImageValue && newImageValue !== "None" && newImageValue !== null ? (
                          <ChangeImageDisplay
                            imagePath={newImageValue}
                            isOld={false}
                            fallbackText={newValue}
                            onClick={async () => {
                              try {
                                const fullUrl = await loadImage(newImageValue);
                                handleImageClick(fullUrl);
                              } catch (error) {
                                console.error("Error loading image for modal:", error);
                                handleImageClick(newImageValue);
                              }
                            }}
                          />
                        ) : (
                          <small 
                            className="text-dark fw-bold" 
                            style={{ fontSize: "0.813rem", color: "#28a745" }}
                          >
                            {newValue}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < changeEntries.length - 1 && (
                    <div className="my-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderCommentThread = (comments: any[], tabType: string) => {
    // Get the appropriate image map based on tab type
    const imageMap = tabType === "internal" 
      ? assigneeCommentAttachmentImages 
      : commentAttachmentImages;

    return (
    <div className="position-relative" style={{ paddingLeft: "30px" }}>
        {comments.map((item, index) => {
          const commentImageUrl = imageMap[item?.id];
          
          return (
        <div key={item?.id || index} className="mb-4 position-relative">
          {/* Timeline line */}
          {index !== comments.length - 1 && (
            <div
              className="position-absolute bg-light"
              style={{
                left: "-19px",
                top: "40px",
                width: "2px",
                height: "calc(100% + 16px)",
              }}
            />
          )}

          {/* Timeline dot */}
          <div
            className={`position-absolute rounded-circle d-flex align-items-center justify-content-center ${
              item?.type === "status_change"
                ? "bg-warning"
                : item?.type === "assignment"
                ? "bg-info"
                : item?.isInternal
                ? "bg-danger"
                : "bg-primary"
            }`}
            style={{
              left: "-24px",
              top: "8px",
              width: "12px",
              height: "12px",
            }}
          />

          <Card className="border">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                  >
                    {tabType === "activity" ? (
                      <CheckCircle size={16} className="text-warning" />
                    ) : tabType === "internal" ? (
                      <User size={16} className="text-info" />
                    ) : (
                      <MessageCircle size={16} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      {extensions.find(
                        (e: any) =>
                              e?.id?.toString() === item?.user_extension?.toString()
                      )?.display_name || item?.user_extension}
                    </div>
                    {tabType === "activity" && (
                      <small className="text-muted">System</small>
                    )}

                    {tabType === "internal" && (
                      <small className="text-muted">Admin</small>
                    )}

                    {tabType === "public" && (
                      <small className="text-muted">Reporter</small>
                    )}
                  </div>
                </div>
                <small className="text-muted">
                  <Clock size={12} className="me-1" />
                  {moment(item?.created_at).format("DD-MMM-YYYY HH:mm:ss")}
                </small>
              </div>

              <p className="mb-2 text-muted" style={{ fontSize: "0.9rem" }}>
                {item?.content}
                  </p>

                  {/* Display comment attachment image */}
                  {commentImageUrl && (
                    <div className="mb-2 mt-2">
                      <button
                        type="button"
                        onClick={() => handleImageClick(commentImageUrl)}
                        className="border-0 bg-transparent p-0"
                        style={{ cursor: "pointer" }}
                        aria-label="View comment attachment"
                      >
                        <img
                          src={commentImageUrl}
                          alt="Comment attachment"
                          className="img-fluid rounded"
                          style={{
                            maxWidth: "100px",
                            maxHeight: "100px",
                            objectFit: "cover",
                            border: "2px solid #dee2e6",
                          }}
                        />
                      </button>
                    </div>
                  )}

                {tabType === "activity" && (
                  <>
                    <p className="">
                      {item?.action === "created" && (
                        <div
                          role="alert"
                          className="fade mb-0 py-2 px-3 alert alert-warning show d-flex align-items-center gap-2"
                        >
                          <CheckCircle size={16} className="" />
                          <small className="fw-semibold">
                            Ticket created by{" "}
                            {extensions.find(
                              (e: any) =>
                                  e?.id?.toString() ===
                                  item?.user_extension?.toString()
                            )?.display_name || item?.user_extension}
                          </small>
                        </div>
                      )}
                    </p>

                    <p className="">
                        {item?.action === "updated" && item?.changes && renderChanges(item.changes, item?.user_extension)}
                    </p>
                  </>
                )}
            </Card.Body>
          </Card>
        </div>
          );
        })}
    </div>
  );
  };

  if (loading) {
    return (
      <React.Fragment>
        <BreadcrumbItem
          mainTitle="Tickets"
          mainLink="/tickets/list"
          subTitle="Ticket Details"
        />
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading ticket details...</p>
        </div>
      </React.Fragment>
    );
  }

  if (!ticketData) {
    return (
      <React.Fragment>
        <BreadcrumbItem
          mainTitle="Tickets"
          mainLink="/tickets/list"
          subTitle="Ticket Details"
        />
        <Alert variant="danger">
          <AlertCircle size={16} className="me-2" />
          Ticket not found
        </Alert>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Tickets"
        mainLink="/tickets/list"
        subTitle="Ticket Details"
      />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={6}>
                <h2 className="mb-0">
                  <span className="badge bg-primary fs-6 me-2">
                    #{ticketData?.id}
                  </span>
                  <span className="text-capitalize">{ticketData?.title}</span>
                </h2>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  onClick={() => router.push("/tickets/list")}
                >
                  <X size={16} className="me-2" />
                  Back to List
                </Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={3} className="border-end">
          <h5 className="fw-bold mb-4">Ticket Information</h5>

          <Row className="mb-3">
            <Col xs={12}>
              <small
                className="text-muted d-block mb-2 fw-semibold"
                style={{ fontSize: "0.813rem" }}
              >
                Module
              </small>
              <Badge bg="primary" className="bg-opacity-10 text-dark px-2 py-2">
                <FileText size={14} className="me-2" />
                <span style={{ fontSize: "0.875rem" }}>
                  {ticketData?.module?.name}
                </span>
              </Badge>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={6}>
              <small
                className="text-muted d-block mb-2 fw-semibold"
                style={{ fontSize: "0.813rem" }}
              >
                Type
              </small>
              <Badge bg="secondary" className="bg-opacity-10 text-dark px-2 py-2">
                <Tag size={14} className="me-2" />
                <span style={{ fontSize: "0.875rem" }}>
                  {ticketData?.type?.name}
                </span>
              </Badge>
            </Col>
            <Col xs={6}>
              <small
                className="text-muted d-block mb-2 fw-semibold"
                style={{ fontSize: "0.813rem" }}
              >
                Priority
              </small>
              <Badge
                bg={getPriorityBadgeColor(ticketData.priority)}
                className="bg-opacity-10 text-dark px-2 py-2"
              >
                <span style={{ fontSize: "0.875rem" }}>
                  {priorityLabels[ticketData?.priority] || "Unknown"}
                </span>
              </Badge>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={6}>
              <small
                className="text-muted d-block mb-2 fw-semibold"
                style={{ fontSize: "0.813rem" }}
              >
                Created At
              </small>
              <div className="d-flex align-items-center gap-2">
                <Clock size={14} className="text-muted" />
                <span style={{ fontSize: "0.875rem" }}>
                  {moment(ticketData?.created_at).format(GlobalDateFormat)}
                </span>
              </div>
            </Col>
            <Col xs={6}>
              <small
                className="text-muted d-block mb-2 fw-semibold"
                style={{ fontSize: "0.813rem" }}
              >
                Due Date
              </small>
              <div className="d-flex align-items-center gap-2">
                <Calendar size={14} className="text-muted" />
                <span
                  className={
                    ticketData.dueDate === "No due date"
                      ? "text-muted"
                      : "fw-semibold"
                  }
                  style={{ fontSize: "0.875rem" }}
                >
                  {ticketData?.due_date ? moment(ticketData?.due_date).format(GlobalDateFormat) : "N/A"}
                </span>
              </div>
            </Col>
          </Row>

          <div className="mb-3">
            <small
              className="text-muted d-block mb-2 fw-semibold"
              style={{ fontSize: "0.813rem" }}
            >
              Created By
            </small>
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
              >
                <User size={16} className="text-primary" />
              </div>
              <span className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                {extensions.find(
                  (extension: any) =>
                    extension.id == ticketData?.created_by
                )?.display_name || ticketData?.created_by}
              </span>
            </div>
          </div>

          <hr className="my-4" />

          <div className="mb-3">
            <small
              className="text-muted d-block mb-2 fw-semibold"
              style={{ fontSize: "0.813rem" }}
            >
              Status
            </small>
            <InputGroup>
              <Form.Select
                value={ticketData?.ticket_status_id}
                className="form-control"
                //disabled={true}
                style={{ fontSize: "0.875rem" }}
                onChange={async (e) => {
                  const newStatusId = e.target.value;
                  if (!ticketData || !newStatusId) return;
                  
                  try {
                    const result = await UpdateTicketDetails(
                      String(ticketData.id),
                      ticketData.title || '',
                      ticketData.description || '',
                      String(ticketData.ticket_type_id || ticketData.type?.id || ''),
                      newStatusId,
                      String(ticketData.module_id || ticketData.module?.id || ''),
                      String(ticketData.submodule_id || ticketData.submodule?.id || ''),
                      ticketData.submodule_child_id ? String(ticketData.submodule_child_id) : undefined,
                      ticketData.user_extension,
                      ticketData.priority,
                      ticketData.due_date,
                      undefined, // images
                      ticketData.tags,
                      ticketData.is_approved
                    );
                    
                    if (result) {
                      // Update local state
                      setTicketData({
                        ...ticketData,
                        ticket_status_id: newStatusId
                      });
                      // Refresh ticket data to get latest changes
                      fetchTicketData();
                    }
                    // Note: UpdateTicketDetails already shows toast messages internally
                  } catch (error) {
                    console.error('Error updating ticket status:', error);
                    toast.error('Failed to update ticket status');
                  }
                }}
              >
                {statuses.map((status: any) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </Form.Select>
            </InputGroup>
          </div>

          <div className="mb-3">
            <small
              className="text-muted d-block mb-2 fw-semibold"
              style={{ fontSize: "0.813rem" }}
            >
              Assigned To
            </small>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {(() => {
                const userExtensions = Array.isArray(ticketData?.user_extension)
                  ? ticketData.user_extension
                  : ticketData?.user_extension
                  ? [ticketData.user_extension]
                  : [];
                
                if (userExtensions.length === 0) {
                  return (
                    <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                      Not assigned
                    </span>
                  );
                }
                
                return userExtensions.map((extId: any) => {
                  const extension = extensions.find(
                    (e: any) => e?.id?.toString() === extId?.toString()
                  );
                  return (
                    <Badge
                      key={extId?.toString() || `ext-${extId}`}
                      bg="info"
                      className="d-flex align-items-center gap-1"
                      style={{ fontSize: "0.875rem", padding: "0.375rem 0.75rem" }}
                    >
                      <User size={14} />
                      {extension?.display_name || extId}
                    </Badge>
                  );
                });
              })()}
            </div>
          </div>

          <hr className="my-4" />

          <div className="mb-4">
            <h6 className="fw-bold mb-3">Description</h6>
            <p
              className="text-muted mb-0"
              style={{ fontSize: "0.938rem", lineHeight: "1.6",wordBreak: "break-word" }}
            >
              {ticketData?.description}
            </p>
          </div>

          {/* Initial Attachments */}
          {viewTicketImages.length > 0 && (
            <div className="mb-3">
              <h6 className="fw-bold mb-3">Initial Attachments</h6>
              <div className="d-flex flex-column gap-2">
                {viewTicketImages.map((imageUrl, idx) => (
                  <div
                    key={`ticket-image-${imageUrl}-${idx}`}
                    className="p-2 bg-light rounded d-flex align-items-center justify-content-between"
                    style={{ border: "1px solid #e0e0e0" }}
                  >
                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                      <Paperclip size={14} className="text-primary" />
                      <div className="d-flex flex-column">
                        <button
                          type="button"
                          onClick={() => handleImageClick(imageUrl)}
                          className="border-0 bg-transparent p-0"
                          style={{ cursor: "pointer" }}
                          aria-label={`View ticket attachment ${idx + 1}`}
                        >
                          <img
                            src={imageUrl}
                            alt={`Ticket attachment ${idx + 1}`}
                            className="img-fluid rounded"
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                              border: "2px solid #dee2e6",
                            }}
                          />
                        </button>
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        ></small>
                      </div>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-1 text-primary"
                      title="Download"
                      style={{ minWidth: "auto" }}
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
                variant={activeTab === "public" ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setActiveTab("public")}
                className="d-flex align-items-center gap-2"
              >
                <MessageCircle size={16} />
                Public Conversation
              </Button>
              {canAddAssigneeComment && (
                <Button
                  variant={
                    activeTab === "internal" ? "danger" : "outline-danger"
                  }
                  size="sm"
                  onClick={() => setActiveTab("internal")}
                  className="d-flex align-items-center gap-2"
                >
                  <AlertCircle size={16} />
                  Internal Notes
                </Button>
              )}

              <Button
                variant={
                  activeTab === "activity" ? "warning" : "outline-warning"
                }
                size="sm"
                onClick={() => setActiveTab("activity")}
                className="d-flex align-items-center gap-2"
              >
                <Clock size={16} />
                Activity Logs
                <Badge
                  bg={activeTab === "activity" ? "light" : "warning"}
                  text={activeTab === "activity" ? "dark" : "white"}
                >
                  {ticketData?.activity_logs?.length || 0}
                </Badge>
              </Button>
            </div>
          </div>

          <div>
            {activeTab === "public" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">
                    <MessageCircle size={18} className="me-2" />
                    Public Conversation
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
                        <Col md={12}>
                          <div className="comments-list">
                            {comments.length > 0 ? (
                              renderCommentThread(comments, "public")
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
                                      Supported formats: JPG, PNG, GIF. Max
                                      size: 5MB
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
                                      <label
                                        htmlFor="newCommentAttachment"
                                        className="btn btn-outline-secondary btn-sm"
                                      >
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
                                          setNewCommentAttachment(
                                            file || null
                                          );
                                        }}
                                      />
                                    </div>

                                    <Button
                                      variant="primary"
                                      onClick={() =>
                                        handleAddComment(ticketData?.id)
                                      }
                                      disabled={
                                        !newComment.trim() || creatingTicket
                                      }
                                    >
                                      <Send size={14} className="me-1" /> Add
                                      Comment
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

            {activeTab === "internal" && canAddAssigneeComment && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 text-danger">
                    <AlertCircle size={18} className="me-2" />
                    Internal Notes
                  </h6>
                </div>
                <Alert variant="danger" className="mb-3">
                  <AlertCircle size={16} className="me-2" />
                  <strong>Private:</strong> These notes are only visible to
                  internal team members and will not be shown to customers.
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
                        <div className="comments-list col-12">
                          {assigneeComments.length > 0 ? (
                            renderCommentThread(assigneeComments, "internal")
                          ) : (
                            <p className="text-muted text-center">
                              No assignee comments yet
                            </p>
                          )}
                        </div>
                        <Col md={12}>
                          <Card
                            className={`border-${
                              activeTab === "internal" ? "danger" : "primary"
                            } mt-4`}
                          >
                            <Card.Body className="p-3">
                              {canAddAssigneeComment ? (
                                <div className="mb-3">
                                  <h6 className="fw-bold mb-3">
                                    {activeTab === "internal"
                                      ? "Add Internal Note"
                                      : "Add Comment"}
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
                                      Supported formats: JPG, PNG, GIF. Max
                                      size: 5MB
                                    </small>
                                    {newAssigneeCommentAttachment && (
                                      <div className="mt-0 mb-2">
                                        <small className="text-warning">
                                          Selected:{" "}
                                          {newAssigneeCommentAttachment.name} (
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
                                      <label
                                        htmlFor="newAssigneeCommentAttachment"
                                        className="btn btn-outline-secondary btn-sm"
                                      >
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
                                      variant="danger"
                                      onClick={() =>
                                        handleAddAssigneeComment(ticketData?.id)
                                      }
                                      disabled={
                                        !newAssigneeComment.trim() ||
                                        creatingTicket
                                      }
                                    >
                                      <Send size={14} className="me-1" /> Add
                                      Internal Note
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-3">
                                  <p className="text-muted small mb-0">
                                    Only assigned users can add assignee
                                    comments.
                                  </p>
                                </div>
                              )}

                              <Alert variant="danger" className="py-2 mb-3">
                                <AlertCircle size={14} className="me-2" />
                                <small>
                                  This note will only be visible to internal team
                                  members
                                </small>
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

            {activeTab === "activity" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 text-warning">
                    <Clock size={18} className="me-2" />
                    Activity Logs (
                    {ticketData?.activity_logs?.length || 0})
                  </h6>
                </div>
                {ticketData?.activity_logs?.length > 0 ? (
                  <div className="activity-logs-list">
                    {renderCommentThread(
                      ticketData.activity_logs,
                      "activity"
                    )}
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

      <div className="modal-parent-custom">
        {showImageModal && (
          <Modal
            show={showImageModal}
            onHide={closeImageModal}
            size="xl"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Ticket Image</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
              <img
                src={selectedImage}
                alt="Ticket attachment full size"
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

TicketDetail.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TicketDetail;

