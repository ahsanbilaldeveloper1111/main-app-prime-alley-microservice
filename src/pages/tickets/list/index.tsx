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
} from "@utils/tickets";
import { GetHierarchyData } from "@utils/users";
import { GetAllStatuses } from "@utils/ticket-statuses";
import { GetAllTypes } from "@utils/ticket-types";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";
import { CreateStatus } from "@utils/ticket-statuses";
import {
  GetAllModules,
  GetAllSubmodules,
  GetAllSubmoduleChildren,
} from "@utils/ticket-module";
import Select from "react-select";
import TicketsFilters from "@components/filters/TicketFilters";
import { Tooltip } from "react-tooltip";
import { ModuleSlug } from '@utils/Helper';

interface SelectOption {
  value: number;
  label: string;
}

const TicketList = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const [statuses, setStatuses] = useState<any>([]);
  const [modules, setModules] = useState<any>([]);
  const [types, setTypes] = useState<any>([]);

  const [hierarchyData, setHierarchyData] = useState<any>([]);
  const [extensions, setExtensions] = useState<any>([]);

  // Comment-related states
  const [comments, setComments] = useState<any[]>([]);
  const [assigneeComments, setAssigneeComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [newAssigneeComment, setNewAssigneeComment] = useState<string>("");
  const [showComments, setShowComments] = useState<boolean>(false);
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
      {
        key: "type",
        name: "Type",
        selector: (row: any) => row.type.name,
        sortable: true,
        cell: (props: any) => {
          const typeName = props?.type?.name;

          return (
            <span className="badge bg-primary text-uppercase">{typeName}</span>
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

          return <div title={description}>{truncatedDescription}</div>;
        },
      },
      {
        key: "user_extension",
        name: "User Extension",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => (
          <span className="badge bg-info">
            {extensions.find(
              (extension: any) => extension.id == props.user_extension
            )?.display_name || props.user_extension}
          </span>
        ),
      },
      {
        key: "created_by",
        name: "Created By",
        selector: (row: any) => row.created_by,
        sortable: true,
        cell: (props: any) => (
          <span className="badge bg-info">
            {extensions.find(
              (extension: any) => extension.id == props.created_by
            )?.display_name || props.created_by}
          </span>
        ),
      },
      {
        key: "status",
        name: "Status & Module",
        selector: (row: any) => row.status,
        sortable: true,
        cell: (props: any) => (
          <div className="d-flex flex-column gap-1">
            <span
              className="badge"
              style={{
                backgroundColor: `${props.status?.color}30`,
                color: props.status?.color,
                fontWeight: "bold",
              }}
            >
              {props.status?.name}
            </span>
            <span
              className="badge"
              style={{
                backgroundColor: `${props.module?.color}30`,
                color: props.module?.color,
                fontWeight: "bold",
              }}
            >
              {props.module?.name}
            </span>
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
              className={`badge ${
                priorityColors[props.priority] || "bg-secondary"
              } text-uppercase`}
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
          <span className="text-muted">
            {props.due_date
              ? moment(props.due_date).format("DD/MM/YYYY")
              : "No due date"}
          </span>
        ),
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span className="text-muted">
            {moment(props.created_at).format("DD/MM/YYYY")}
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
            {session?.user?.permissions?.includes("view-ticket-tickets") && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleViewTicket(props)}
              >
                View
              </button>
            )}
            {session?.user?.permissions?.includes("edit-ticket-tickets") && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleEditTicket(props)}
              >
                Edit
              </button>
            )}

            <Tooltip id="delete-ticket-tooltip" />
            {session?.user?.permissions?.includes("delete-ticket-tickets") && (
              <div
                data-tooltip-id="delete-ticket-tooltip"
                data-tooltip-content={
                  props.user_extension ? "Assigned to User" : "Delete"
                }
              >
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteTicket(props)}
                  disabled={props.user_extension}
                >
                  Delete
                </button>
              </div>
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
      const hierarchyData = await GetHierarchyData(ModuleSlug.TICKETS);
      setHierarchyData(hierarchyData);
      console.log("Hierarchy Data:", hierarchyData);
      setExtensions(hierarchyData?.extensions);
      console.log("Extensions:", extensions);
    };
    fetchHierarchyData();
  }, []);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchTickets = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListTickets({
        page,
        perPage,
        search,
        filters: memoizedFilters,
        moduleSlug: ModuleSlug.TICKET
      });
    },
    [memoizedFilters]
  );

  const handleFiltersChange = useCallback((filters: any) => {
    //console.log('Filters changed:', filters);
    setCurrentFilters(filters);
  }, []);

  const [showViewTicketModal, setShowViewTicketModal] =
    useState<boolean>(false);
  const [viewTicketData, setViewTicketData] = useState<any>([]);
  const [viewTicketImage, setViewTicketImage] = useState<string>("");
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  function loadImg(imgPath: string) {
    if (viewTicketImage) {
      // URL.revokeObjectURL(viewTicketImage);
    }
    loadImage(imgPath).then((res: any) => {
      console.log("ze ran", res);
      // const url = URL.createObjectURL(res);
      setViewTicketImage(res);
    });
  }

  useEffect(() => {
    console.log("ZE RAN");
    if (viewTicketData?.image) {
      loadImg(viewTicketData.image);
    } else {
      setViewTicketImage("");
    }
  }, [viewTicketData, viewTicketData?.image]);

  const closeViewTicketModal = useCallback(() => {
    setShowViewTicketModal(false);
    // Reset comment states when closing
    setComments([]);
    setAssigneeComments([]);
    setNewComment("");
    setNewAssigneeComment("");
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

      // Extract comments from the nested response structure
      if (commentsData?.data?.data) {
        console.log(
          "Setting comments from data.data.data:",
          commentsData.data.data
        );
        setComments(commentsData.data.data);
      } else if (commentsData?.data) {
        console.log("Setting comments from data.data:", commentsData.data);
        setComments(commentsData.data);
      } else {
        console.log("No comments data found, setting empty array");
        setComments([]);
      }

      if (assigneeCommentsData?.data?.data) {
        console.log(
          "Setting assignee comments from data.data.data:",
          assigneeCommentsData.data.data
        );
        setAssigneeComments(assigneeCommentsData.data.data);
      } else if (assigneeCommentsData?.data) {
        console.log(
          "Setting assignee comments from data.data:",
          assigneeCommentsData.data
        );
        setAssigneeComments(assigneeCommentsData.data);
      } else {
        console.log("No assignee comments data found, setting empty array");
        setAssigneeComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to fetch comments");
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const handleViewTicket = useCallback(async (props: any) => {
    setViewTicketData(props);
    console.log("View ticket:", props);
    setShowViewTicketModal(true);

    // Fetch comments when opening the modal
    fetchComments(props.id);

    // Fetch submodule and submodule child data if module_id exists
    if (props.module_id) {
      try {
        const submoduleData = await GetAllSubmodules();
        const filteredSubmodules =
          submoduleData?.filter(
            (sub: any) => sub.module_id == props.module_id
          ) || [];

        if (props.submodule_id) {
          const submoduleChildData = await GetAllSubmoduleChildren();
          const filteredChildren =
            submoduleChildData?.filter(
              (child: any) => child.submodule_id == props.submodule_id
            ) || [];

          // Update viewTicketData with the fetched submodule information
          setViewTicketData({
            ...props,
            submodule: filteredSubmodules.find(
              (sub: any) => sub.id == props.submodule_id
            ),
            submodule_child: filteredChildren.find(
              (child: any) => child.id == props.submodule_child_id
            ),
          });
        } else {
          setViewTicketData({
            ...props,
            submodule: null,
            submodule_child: null,
          });
        }
      } catch (error) {
        console.error("Error fetching submodule data:", error);
      }
    }
  }, []);

  const handleAddComment = useCallback(
    async (ticketId: string) => {
      if (!newComment.trim()) {
        toast.error("Please enter a comment");
        return;
      }

      try {
        setCreatingTicket(true);
        const response = await AddComment(
          ticketId,
          newComment.trim(),
          viewTicketData.user_extension || ""
        );
        if (response) {
          setNewComment("");
          // Refresh comments
          fetchComments(ticketId);
        }
      } catch (error) {
        console.error("Error adding comment:", error);
      } finally {
        setCreatingTicket(false);
      }
    },
    [newComment, viewTicketData]
  );

  const handleAddAssigneeComment = useCallback(
    async (ticketId: string) => {
      if (!newAssigneeComment.trim()) {
        toast.error("Please enter an assignee comment");
        return;
      }

      try {
        setCreatingTicket(true);
        const response = await AddAssigneeComment(
          ticketId,
          newAssigneeComment.trim(),
          viewTicketData.user_extension || ""
        );
        if (response) {
          setNewAssigneeComment("");
          // Refresh comments
          fetchComments(ticketId);
        }
      } catch (error) {
        console.error("Error adding assignee comment:", error);
      } finally {
        setCreatingTicket(false);
      }
    },
    [newAssigneeComment, viewTicketData]
  );

  const toggleComments = useCallback(() => {
    setShowComments(!showComments);
  }, [showComments]);

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedTicketTitle, setSelectedTicketTitle] = useState<any>(null);
  const [selectedTicketDescription, setSelectedTicketDescription] =
    useState<any>(null);
  const [showEditTicketModal, setShowEditTicketModal] =
    useState<boolean>(false);
  const [showDeleteTicketModal, setShowDeleteTicketModal] =
    useState<boolean>(false);

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

    setCreatingTicket(true);
    let response = null;
    try {
      response = await UpdateTicketDetails(
        selectedTicket.id,
        selectedTicketTitle,
        selectedTicketDescription,
        selectedTicket.ticket_type_id || selectedTicket.type,
        selectedTicket.ticket_status_id,
        selectedTicket.module_id,
        selectedTicket.submodule_id,
        selectedTicket.submodule_child_id,
        selectedTicket.user_extension,
        selectedTicket.priority,
        selectedTicket.due_date
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
      setShowEditTicketModal(false);
      setRefreshKey((prev) => prev + 1); // Trigger refresh
    }
  }, [selectedTicket, selectedTicketTitle, selectedTicketDescription]);

  const [confirmDelete, setConfirmDelete] = useState<string>("");

  const handleDeleteTicket = useCallback((props: any) => {
    setSelectedTicket(props.id);
    setSelectedTicketTitle(props.title);
    setShowDeleteTicketModal(true);
  }, []);

  const handleSubmitDeleteTicket = useCallback(async () => {
    const confirmDeleteValue = confirmDelete.trim();
    if (confirmDeleteValue === "DELETE") {
      const response = await DeleteTicket(selectedTicket);
      if (response) {
        setSelectedTicket(null);
        setSelectedTicketTitle(null);
        setShowDeleteTicketModal(false);
        setConfirmDelete("");
        setRefreshKey((prev) => prev + 1); // Trigger refresh
      }
    } else {
      toast.error("Please type the word DELETE to confirm");
    }
  }, [confirmDelete, selectedTicket]);

  const [showCreateTicketModal, setShowCreateTicketModal] =
    useState<boolean>(false);
  const [newTicketTitle, setNewTicketTitle] = useState<string>("");
  const [newTicketDescription, setNewTicketDescription] = useState<string>("");
  const [newTicketType, setNewTicketType] = useState<string>("");
  const [newTicketStatus, setNewTicketStatus] = useState<string>("");
  const [newTicketModule, setNewTicketModule] = useState<string>("");

  const [newTicketPriority, setNewTicketPriority] = useState<string>("");
  const [newTicketDueDate, setNewTicketDueDate] = useState<string>("");

  const [newTicketImage, setNewTicketImage] = useState<File | null>(null);

  // Add state for submodules and submodule children
  const [newTicketSubmodule, setNewTicketSubmodule] = useState<string>("");
  const [newTicketSubmoduleChild, setNewTicketSubmoduleChild] =
    useState<string>("");
  const [submodules, setSubmodules] = useState<any[]>([]);
  const [submoduleChildren, setSubmoduleChildren] = useState<any[]>([]);
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);
  console.log("ZE UES IS ", session);
  const handleSubmitCreateTicket = useCallback(async () => {
    console.log("=== COMPONENT DEBUG ===");
    console.log(
      "newTicketImage type:",
      typeof newTicketImage,
      newTicketImage instanceof File
    );
    console.log("newTicketImage MIME type:", newTicketImage?.type);
    console.log("newTicketImage size:", newTicketImage?.size);
    if (!newTicketTitle?.trim() || newTicketTitle?.trim()?.length < 5) {
      toast.error("Please enter a ticket title (Min: 5 chars)");
      return;
    }
    if (!newTicketType) {
      toast.error("Please select a ticket type");
      return;
    }
    if (newTicketDescription.length < 50 || newTicketDescription.length > 500) {
      toast.error("Ticket description must be between 50 and 500 characters");
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

    formData.append("created_by", "321");
    if (newTicketDueDate) {
      formData.append("due_date", newTicketDueDate);
    }
    if (newTicketImage) {
      // sometimes|image|mimes:jpeg,png,jpg,gif|max:5120
      console.log("newTicketImage type:", newTicketImage);
      if (!newTicketImage?.type?.includes("image/")) {
        toast.error("Attachment must be an image (jpeg, png, jpg, gif)");
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5 MB in bytes
      console.log(
        "newTicketImage type IMAGE SIZE IN MB :",
        newTicketImage?.size / (1024 * 1024)
      );
      if (newTicketImage?.size > maxSize) {
        toast.error("Attachment size must be less than 5MB");
        return;
      }
      formData.append("image", newTicketImage);
    }

    // Debug FormData contents
    console.log("FormData created successfully");
    console.log("FormData has image:", newTicketImage ? "Yes" : "No");
    if (newTicketImage) {
      console.log("Image name:", newTicketImage.name);
      console.log("Image type:", newTicketImage.type);
      console.log("Image size:", newTicketImage.size);
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
      setNewTicketImage(null);
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
    newTicketImage,
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
    setNewTicketImage(null);
    setSubmodules([]);
    setSubmoduleChildren([]);

    // Reset the file input element
    const fileInput = document.getElementById(
      "newTicketImage"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }, []);
  const openEditTicketModal = useCallback(
    () => setShowEditTicketModal(true),
    []
  );
  const closeEditTicketModal = useCallback(
    () => setShowEditTicketModal(false),
    []
  );
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
  const handleConfirmDeleteChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setConfirmDelete(e.target.value),
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

  useEffect(() => {
    const interval = setInterval(() => {
      setRerenderTrigger(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Tickets"
        mainLink="/tickets/list"
        subTitle="Tickets"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Tickets
              {session?.user?.permissions?.includes(
                "create-ticket-tickets"
              ) && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="ms-3"
                  onClick={openCreateTicketModal}
                >
                  New Ticket
                </Button>
              )}
              <TicketsFilters onFiltersChange={handleFiltersChange} moduleSlug={ModuleSlug.TICKET} />
            </h2>
          </div>
        </Col>
      </Row>

      {session?.user?.permissions?.includes("tickets-tickets") && (
        <GenericListPage
          columns={columns}
          fetchData={fetchTickets}
          title="Tickets"
          searchPlaceholder="Search tickets..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={session?.user?.permissions?.includes(
            "search-ticket-tickets"
          )}
        />
      )}

      {showEditTicketModal && (
        <Modal
          show={showEditTicketModal}
          onHide={closeEditTicketModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Ticket #{selectedTicket?.id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
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

            <div className="form-group mb-3">
              <label htmlFor="editTicketUserExtension">User Extension</label>
              <Select
                //   className="form-control"
                id="editTicketUserExtension"
                value={
                  selectedTicket?.user_extension
                    ? {
                        value: selectedTicket.user_extension,
                        label:
                          extensions.find(
                            (ext: any) =>
                              ext.id.toString() ===
                              selectedTicket.user_extension.toString()
                          )?.display_name || "",
                      }
                    : null
                }
                onChange={(selectedOption: any) => {
                  setSelectedTicket({
                    ...selectedTicket,
                    user_extension: selectedOption?.value || "",
                  });
                }}
                options={extensions.map((extension: any) => ({
                  value: extension.id,
                  label: extension.display_name,
                }))}
                placeholder="Select User Extension"
                isClearable
                isSearchable
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEditTicketModal}>
              Close
            </Button>
            <Button variant="primary" onClick={() => handleSubmitEditTicket()}>
              Save changes
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showDeleteTicketModal && (
        <Modal show={showDeleteTicketModal} onHide={closeDeleteTicketModal}>
          <Modal.Header closeButton>
            <Modal.Title>Delete Ticket?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete this{" "}
              <b className="text-danger">{selectedTicketTitle}</b> ticket?
            </p>
            <p>
              Type the word <b className="text-danger">DELETE</b> to confirm
            </p>
            <input
              type="text"
              className="form-control"
              id="confirmDelete"
              value={confirmDelete}
              onChange={handleConfirmDeleteChange}
              placeholder="Type the word DELETE to confirm"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeDeleteTicketModal}>
              Close
            </Button>
            <Button variant="danger" onClick={() => handleSubmitDeleteTicket()}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showCreateTicketModal && (
        <Modal
          show={showCreateTicketModal}
          onHide={closeCreateTicketModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>New Ticket</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketTitle">Ticket Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newTicketTitle"
                    value={newTicketTitle}
                    onChange={handleNewTicketTitleChange}
                    placeholder="Ticket Title"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketType">Ticket Type</label>
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
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="newTicketDescription">Ticket Description</label>
              <textarea
                className="form-control"
                id="newTicketDescription"
                value={newTicketDescription}
                onChange={handleNewTicketDescriptionChange}
                placeholder="Ticket Description (Min: 50 chars, Max: 500 chars)"
                rows={4}
                maxLength={500}
              ></textarea>
              <div className="d-flex justify-content-between mt-1">
                <small
                  className={`text-muted ${
                    newTicketDescription.length < 50 ? "text-danger" : ""
                  }`}
                >
                  Min: 50 characters
                </small>
                <small
                  className={`text-muted ${
                    newTicketDescription.length > 500 ? "text-danger" : ""
                  }`}
                >
                  {newTicketDescription.length}/500 characters
                </small>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketStatus">Status</label>
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
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketModule">Module</label>
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
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketSubmodule">
                    Primary Issue (Required)
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
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="newTicketSubmoduleChild">
                    Specific Problem (Optional)
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
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="newTicketPriority">Priority</label>
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
            </div>

            <div className="form-group mb-3">
              <label htmlFor="newTicketDueDate">Due Date</label>
              <input
                type="date"
                className="form-control"
                id="newTicketDueDate"
                value={newTicketDueDate || ""}
                onChange={(e) => setNewTicketDueDate(e.target.value)}
                min={moment().format("YYYY-MM-DD")}
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="newTicketImage">Ticket Image</label>
              <input
                type="file"
                className="form-control"
                id="newTicketImage"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  console.log("File input onChange triggered");
                  console.log("Selected file:", file);
                  console.log("File type:", file?.type);
                  console.log("File size:", file?.size);
                  setNewTicketImage(file || null);
                  console.log("newTicketImage state updated to:", file || null);
                }}
              />
              <small className="text-muted">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </small>
              {newTicketImage && (
                <div className="mt-2">
                  <small className="text-success">
                    Selected: {newTicketImage.name} (
                    {(newTicketImage.size / 1024 / 1024).toFixed(2)} MB)
                  </small>
                </div>
              )}
              <div className="mt-2">
                <small className="text-info">
                  Current image state:{" "}
                  {newTicketImage
                    ? `File: ${newTicketImage.name}`
                    : "No image selected"}
                </small>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeCreateTicketModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmitCreateTicket()}
              disabled={creatingTicket}
            >
              {creatingTicket ? "Creating..." : "Create"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showViewTicketModal && (
        <Modal
          show={showViewTicketModal}
          onHide={closeViewTicketModal}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Ticket #{viewTicketData?.id} Information</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <table
              className="table table-bordered"
              style={{
                tableLayout: "fixed",
              }}
            >
              <tbody>
                <tr>
                  <td>
                    <strong>Ticket ID</strong>
                  </td>
                  <td>
                    <span className="badge bg-primary">
                      #{viewTicketData?.id}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Ticket Title</strong>
                  </td>
                  <td
                    style={{
                      textTransform: "capitalize",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {viewTicketData?.title}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Ticket Description</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {viewTicketData?.description}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Ticket Type</strong>
                  </td>
                  <td>
                    <span className="badge bg-primary text-uppercase">
                      {types.find(
                        (type: any) => type.id == viewTicketData?.ticket_type_id
                      )?.name ||
                        viewTicketData?.type?.name ||
                        "Unknown"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Ticket Status</strong>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${viewTicketData?.status?.color}30`,
                        color: viewTicketData?.status?.color,
                        fontWeight: "bold",
                      }}
                    >
                      {viewTicketData?.status?.name}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Module</strong>
                  </td>
                  <td>
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
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Primary Issue</strong>
                  </td>
                  <td>
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
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Specific Problem</strong>
                  </td>
                  <td>
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
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>User Extension</strong>
                  </td>
                  <td>
                    <span className="badge bg-info">
                      {/* {viewTicketData?.user_extension} */}
                      {extensions.find(
                        (extension: any) =>
                          extension.id == viewTicketData?.user_extension
                      )?.display_name || viewTicketData?.user_extension}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Priority</strong>
                  </td>
                  <td>
                    {(() => {
                      const priorityLabels = ["Low", "Medium", "High"];
                      const priorityColors = [
                        "bg-success",
                        "bg-warning",
                        "bg-danger",
                      ];
                      return (
                        <span
                          className={`badge ${
                            priorityColors[viewTicketData?.priority] ||
                            "bg-secondary"
                          } text-uppercase`}
                        >
                          {priorityLabels[viewTicketData?.priority] ||
                            "Unknown"}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Due Date</strong>
                  </td>
                  <td>
                    {viewTicketData?.due_date
                      ? moment(viewTicketData.due_date).format("DD/MM/YYYY")
                      : "No due date"}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Ticket Image</strong>
                  </td>
                  <td>
                    {viewTicketImage ? (
                      <img
                        src={viewTicketImage}
                        alt="Ticket Image"
                        className="img-fluid"
                        style={{
                          maxWidth: "200px",
                          maxHeight: "200px",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          handleImageClick(`/api/${viewTicketData.image}`)
                        }
                      />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Created At</strong>
                  </td>
                  <td>
                    {moment(viewTicketData?.created_at).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Updated At</strong>
                  </td>
                  <td>
                    {moment(viewTicketData?.updated_at).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Comments Section */}
            <div
              className="mt-4"
              style={{ borderTop: "1px solid #dee2e6", paddingTop: "20px" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6
                    className="mb-0"
                    style={{ color: "#495057", fontWeight: "600" }}
                  >
                    Comments
                    <span className="badge bg-secondary ms-2">
                      {comments.length + assigneeComments.length} total
                    </span>
                  </h6>
                  <small className="text-muted">
                    {comments.length} user comments • {assigneeComments.length}{" "}
                    assignee comments
                  </small>
                </div>
                <div>
                  {(session?.user?.permissions?.includes(
                    "view-ticket-comments-tickets"
                  ) ||
                    session?.user?.permissions?.includes(
                      "view-ticket-assignee-comments-tickets"
                    )) && (
                    <>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={toggleComments}
                        className="me-2"
                      >
                        {showComments ? "Hide Comments" : "Show Comments"}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => fetchComments(viewTicketData?.id)}
                        disabled={isLoadingComments}
                      >
                        {isLoadingComments ? "Loading..." : "Refresh"}
                      </Button>
                    </>
                  )}
                </div>
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
                    <div className="row">
                      {/* User Comments Column */}
                      <div className="col-md-6">
                        <div
                          className="card"
                          style={{
                            border: "1px solid #e9ecef",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div
                            className="card-header"
                            style={{
                              backgroundColor: "#f8f9fa",
                              borderBottom: "1px solid #dee2e6",
                            }}
                          >
                            <h6
                              className="mb-0"
                              style={{ color: "#495057", fontWeight: "600" }}
                            >
                              User Comments
                            </h6>
                          </div>
                          <div className="card-body">
                            {session?.user?.permissions?.includes(
                              "update-ticket-comments-tickets"
                            ) && (
                              <div className="mb-3">
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  placeholder="Add a new comment..."
                                  value={newComment}
                                  onChange={(e) =>
                                    setNewComment(e.target.value)
                                  }
                                />
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() =>
                                    handleAddComment(viewTicketData?.id)
                                  }
                                  disabled={
                                    !newComment.trim() || creatingTicket
                                  }
                                >
                                  Add Comment
                                </Button>
                              </div>
                            )}

                            <div
                              className="comments-list"
                              style={{ maxHeight: "300px", overflowY: "auto" }}
                            >
                              {comments.length > 0 ? (
                                comments.map((comment: any, index: number) => (
                                  <div
                                    key={index}
                                    className="comment-item border-bottom pb-2 mb-2"
                                    style={{
                                      padding: "10px",
                                      backgroundColor: "#f8f9fa",
                                      borderRadius: "5px",
                                      marginBottom: "10px",
                                    }}
                                  >
                                    <div className="d-flex justify-content-between">
                                      <small
                                        className="text-muted"
                                        style={{
                                          fontWeight: "600",
                                          color: "#6c757d",
                                        }}
                                      >
                                        {extensions.find(
                                          (extension: any) =>
                                            extension.id ==
                                            comment.user_extension
                                        )?.display_name ||
                                          comment.user_extension ||
                                          "Unknown User"}
                                      </small>
                                      <div className="text-end">
                                        <small className="text-muted d-block">
                                          {moment(comment.created_at).fromNow()}
                                        </small>
                                        <small className="text-muted">
                                          {moment(comment.created_at).format(
                                            "DD/MM/YYYY HH:mm"
                                          )}
                                        </small>
                                      </div>
                                    </div>
                                    <div
                                      className="mt-1"
                                      style={{
                                        color: "#495057",
                                        lineHeight: "1.4",
                                      }}
                                    >
                                      {comment.content}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted text-center">
                                  No user comments yet
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Assignee Comments Column */}
                      <div className="col-md-6">
                        <div
                          className="card"
                          style={{
                            border: "1px solid #e9ecef",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div
                            className="card-header"
                            style={{
                              backgroundColor: "#f8f9fa",
                              borderBottom: "1px solid #dee2e6",
                            }}
                          >
                            <h6
                              className="mb-0"
                              style={{ color: "#495057", fontWeight: "600" }}
                            >
                              Assignee Comments
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="mb-3">
                              <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Add a new assignee comment..."
                                value={newAssigneeComment}
                                onChange={(e) =>
                                  setNewAssigneeComment(e.target.value)
                                }
                              />
                              <Button
                                variant="success"
                                size="sm"
                                className="mt-2"
                                onClick={() =>
                                  handleAddAssigneeComment(viewTicketData?.id)
                                }
                                disabled={
                                  !newAssigneeComment.trim() || creatingTicket
                                }
                              >
                                Add Assignee Comment
                              </Button>
                            </div>

                            <div
                              className="comments-list"
                              style={{ maxHeight: "300px", overflowY: "auto" }}
                            >
                              {assigneeComments.length > 0 ? (
                                assigneeComments.map(
                                  (comment: any, index: number) => (
                                    <div
                                      key={index}
                                      className="comment-item border-bottom pb-2 mb-2"
                                      style={{
                                        padding: "10px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "5px",
                                        marginBottom: "10px",
                                      }}
                                    >
                                      <div className="d-flex justify-content-between">
                                        <small
                                          className="text-muted"
                                          style={{
                                            fontWeight: "600",
                                            color: "#6c757d",
                                          }}
                                        >
                                          {extensions.find(
                                            (extension: any) =>
                                              extension.id ==
                                              comment.user_extension
                                          )?.display_name ||
                                            comment.user_extension ||
                                            "Unknown User"}
                                        </small>
                                        <div className="text-end">
                                          <small className="text-muted d-block">
                                            {moment(
                                              comment.created_at
                                            ).fromNow()}
                                          </small>
                                          <small className="text-muted">
                                            {moment(comment.created_at).format(
                                              "DD/MM/YYYY HH:mm"
                                            )}
                                          </small>
                                        </div>
                                      </div>
                                      <div
                                        className="mt-1"
                                        style={{
                                          color: "#495057",
                                          lineHeight: "1.4",
                                        }}
                                      >
                                        {comment.content}
                                      </div>
                                    </div>
                                  )
                                )
                              ) : (
                                <p className="text-muted text-center">
                                  No assignee comments yet
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeViewTicketModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

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
              src={viewTicketImage}
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
    </React.Fragment>
  );
};

TicketList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TicketList;
