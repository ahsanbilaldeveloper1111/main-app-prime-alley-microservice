import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import CrmDataFilters from "@components/filters/CrmDataFilters";
import {
  Button,
  Card,
  Row,
  Col,
  Form,
  Alert,
  Spinner,
  Modal,
  Badge,
  Dropdown,
} from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import {
  FiUpload,
  FiDatabase,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEye,
  FiUser,
  FiCheck,
  FiUsers,
  FiPhone,
  FiMessageCircle,
  FiPlay,
  FiClock,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
} from "react-icons/fi";
import { Column } from "@components/CustomDataTable";
import {
  getCrmData,
  uploadCrmDataCsv,
  deleteCrmData,
  assignCrmDataToExtension,
  markCrmDataAsViewed,
  CrmDataItem,
  CrmDataPagination,
  CrmDataResponse,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";

const CrmDataManagement = () => {
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDataItem, setSelectedDataItem] = useState<CrmDataItem | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CrmDataItem | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDataAssignmentModal, setShowDataAssignmentModal] = useState(false);
  const [showAfterCallModal, setShowAfterCallModal] = useState(false);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [selectedAssignExtensions, setSelectedAssignExtensions] = useState<
    readonly any[]
  >([]);
  const [assignMode, setAssignMode] = useState<"auto" | "custom">("auto");
  const [customData, setCustomData] = useState<Record<string, number>>({});
  const [selectedCampaigns, setSelectedCampaigns] = useState<readonly any[]>([]);
  const [fieldTags, setFieldTags] = useState<readonly any[]>([]);
  const [assignToCampaignUsers, setAssignToCampaignUsers] = useState(false);
  
  // Data assignment modal states
  const [assignmentFilters, setAssignmentFilters] = useState({
    selectedTags: [] as readonly any[],
    selectedCampaigns: [] as readonly any[],
  });
  const [assignmentCampaign, setAssignmentCampaign] = useState<readonly any[]>([]);
  const [assignmentDistribution, setAssignmentDistribution] = useState<"equal" | "custom">("equal");
  const [totalRecordsToAssign, setTotalRecordsToAssign] = useState(0);
  const [customDistribution, setCustomDistribution] = useState<Record<string, number>>({});

  // After Call modal states
  const [afterCallData, setAfterCallData] = useState({
    disposition: "",
    callStatus: "",
    comment: "",
    nextCallDate: "",
    nextCallTime: "",
    generateLead: "no", // "yes" or "no"
  });

  // Scheduled calls state
  const [scheduledCalls, setScheduledCalls] = useState<Record<number, boolean>>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRecordForSchedule, setSelectedRecordForSchedule] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    notes: "",
  });

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Static campaign data
  const campaigns = [
    { value: "campaign-1", label: "Summer Sale 2024" },
    { value: "campaign-2", label: "Holiday Promotion" },
    { value: "campaign-3", label: "New Product Launch" },
    { value: "campaign-4", label: "Customer Retention" },
    { value: "campaign-5", label: "Lead Generation" },
    { value: "campaign-6", label: "Referral Program" },
    { value: "campaign-7", label: "Email Marketing" },
    { value: "campaign-8", label: "Social Media Campaign" },
  ];

  // Static tags data
  const staticTags = [
    { value: "hot-lead", label: "Hot Lead" },
    { value: "cold-lead", label: "Cold Lead" },
    { value: "follow-up", label: "Follow Up" },
    { value: "interested", label: "Interested" },
    { value: "not-interested", label: "Not Interested" },
    { value: "callback", label: "Callback" },
    { value: "qualified", label: "Qualified" },
    { value: "unqualified", label: "Unqualified" },
  ];

  // Static call end reasons
  const callEndReasons = [
    { value: "call_later", label: "Call Later", color: "warning" },
    { value: "dont_call", label: "Don't Call", color: "danger" },
    { value: "not_reachable", label: "Number Not Reachable", color: "secondary" },
    { value: "dncr_blocklisted", label: "DNCR Blocklisted", color: "dark" },
    { value: "answered", label: "Answered", color: "success" },
    { value: "busy", label: "Busy", color: "info" },
    { value: "no_answer", label: "No Answer", color: "light" },
  ];

  // Static call history data with varied information
  const getCallHistory = (recordId: number) => {
    const histories = [
      {
        id: 1,
        duration: "2:34",
        endReason: "answered",
        disposition: "interested",
        calledAt: "2024-01-15T10:30:00Z",
        recordingUrl: "https://example.com/recording1.mp3",
        comment: "Client showed interest in our premium package. Asked for pricing details and wants to schedule a demo next week.",
      },
      {
        id: 2,
        duration: "0:45",
        endReason: "busy",
        disposition: "callback_requested",
        calledAt: "2024-01-14T14:20:00Z",
        recordingUrl: "https://example.com/recording2.mp3",
        comment: "Line was busy. Left voicemail with callback request for tomorrow morning.",
      },
      {
        id: 3,
        duration: "1:12",
        endReason: "no_answer",
        disposition: "no_answer",
        calledAt: "2024-01-13T09:15:00Z",
        recordingUrl: "https://example.com/recording3.mp3",
        comment: "No answer after multiple rings. Will try again later in the day.",
      },
      {
        id: 4,
        duration: "3:45",
        endReason: "answered",
        disposition: "not_interested",
        calledAt: "2024-01-12T16:20:00Z",
        recordingUrl: "https://example.com/recording4.mp3",
        comment: "Client politely declined. Not interested in our services at this time. Asked to be removed from calling list.",
      },
      {
        id: 5,
        duration: "4:12",
        endReason: "answered",
        disposition: "follow_up",
        calledAt: "2024-01-11T11:30:00Z",
        recordingUrl: "https://example.com/recording5.mp3",
        comment: "Client needs to discuss with their team. Will follow up in 2 weeks with additional information about our enterprise solutions.",
      },
    ];
    
    // Return different histories based on recordId for variety
    return histories.slice(0, (recordId % 3) + 2);
  };

  // Static scheduled calls data
  const getScheduledCalls = () => [
    {
      id: 1,
      phone: "+1234567890",
      scheduledAt: moment().add(30, 'minutes').toISOString(),
      status: "scheduled",
    },
    {
      id: 2,
      phone: "+1234567891",
      scheduledAt: moment().add(2, 'hours').toISOString(),
      status: "scheduled",
    },
    {
      id: 3,
      phone: "+1234567892",
      scheduledAt: moment().add(1, 'day').toISOString(),
      status: "scheduled",
    },
    {
      id: 4,
      phone: "+1234567893",
      scheduledAt: moment().subtract(2, 'hours').toISOString(),
      status: "overdue",
    },
    {
      id: 5,
      phone: "+1234567894",
      scheduledAt: moment().subtract(1, 'day').toISOString(),
      status: "overdue",
    },
  ];

  // Static history data
  const getHistoryData = () => [
    {
      id: 1,
      type: "upload",
      user: "John Smith",
      action: "uploaded a CSV",
      details: "10,000 records with tags 'hot-lead', 'follow-up' for campaigns 'Summer Sale 2024', 'Holiday Promotion'",
      timestamp: moment().subtract(2, 'hours').format("MMM DD, YYYY HH:mm"),
      icon: "upload",
      color: "primary"
    },
    {
      id: 2,
      type: "assignment",
      user: "Sarah Johnson",
      action: "assigned records to campaign team",
      details: "5,000 records to 'Summer Sale 2024' team",
      timestamp: moment().subtract(3, 'hours').format("MMM DD, YYYY HH:mm"),
      icon: "users",
      color: "success"
    },
    {
      id: 3,
      type: "assignment",
      user: "Mike Wilson",
      action: "assigned records to users",
      details: "1,000 records to 'John Doe' via 'Summer Sale 2024'",
      timestamp: moment().subtract(4, 'hours').format("MMM DD, YYYY HH:mm"),
      icon: "user",
      color: "info"
    },
    {
      id: 4,
      type: "assignment",
      user: "Mike Wilson",
      action: "assigned records to users",
      details: "1,000 records to 'Jane Smith' via 'Summer Sale 2024'",
      timestamp: moment().subtract(4, 'hours').format("MMM DD, YYYY HH:mm"),
      icon: "user",
      color: "info"
    },
    {
      id: 5,
      type: "assignment",
      user: "Mike Wilson",
      action: "assigned records to users",
      details: "1,000 records to 'Bob Johnson' via 'Summer Sale 2024'",
      timestamp: moment().subtract(4, 'hours').format("MMM DD, YYYY HH:mm"),
      icon: "user",
      color: "info"
    },
    {
      id: 6,
      type: "assignment",
      user: "Mike Wilson",
      action: "assigned records to users",
      details: "1,000 records to 'Alice Brown' via 'Summer Sale 2024'",
      timestamp: moment().subtract(4, 'hours').format("MMM DD, YYYY HH:mm"),
      icon: "user",
      color: "info"
    },
    {
      id: 7,
      type: "assignment",
      user: "Mike Wilson",
      action: "assigned records to users",
      details: "1,000 records to 'Charlie Davis' via 'Summer Sale 2024'",
      timestamp: moment().subtract(4, 'hours').format("MMM DD, YYYY HH:mm"),
      icon: "user",
      color: "info"
    },
    {
      id: 8,
      type: "upload",
      user: "Emily Chen",
      action: "uploaded a CSV",
      details: "5,000 records with tags 'cold-lead', 'callback' for campaigns 'Holiday Promotion'",
      timestamp: moment().subtract(1, 'day').format("MMM DD, YYYY HH:mm"),
      icon: "upload",
      color: "primary"
    },
    {
      id: 9,
      type: "assignment",
      user: "David Lee",
      action: "assigned records to campaign team",
      details: "3,000 records to 'Holiday Promotion' team",
      timestamp: moment().subtract(1, 'day').format("MMM DD, YYYY HH:mm"),
      icon: "users",
      color: "success"
    },
    {
      id: 10,
      type: "assignment",
      user: "David Lee",
      action: "assigned records to users",
      details: "2,000 records to 'Emma Wilson' via 'Holiday Promotion'",
      timestamp: moment().subtract(1, 'day').format("MMM DD, YYYY HH:mm"),
      icon: "user",
      color: "info"
    },
    {
      id: 11,
      type: "upload",
      user: "Alex Rodriguez",
      action: "uploaded a CSV",
      details: "8,000 records with tags 'qualified', 'interested' for campaigns 'Summer Sale 2024'",
      timestamp: moment().subtract(2, 'days').format("MMM DD, YYYY HH:mm"),
      icon: "upload",
      color: "primary"
    },
    {
      id: 12,
      type: "assignment",
      user: "Lisa Wang",
      action: "assigned records to campaign team",
      details: "4,000 records to 'Summer Sale 2024' team",
      timestamp: moment().subtract(2, 'days').format("MMM DD, YYYY HH:mm"),
      icon: "users",
      color: "success"
    },
    {
      id: 13,
      type: "assignment",
      user: "Lisa Wang",
      action: "assigned records to users",
      details: "4,000 records to 'Tom Anderson' via 'Summer Sale 2024'",
      timestamp: moment().subtract(2, 'days').format("MMM DD, YYYY HH:mm"),
      icon: "user",
      color: "info"
    }
  ];

  // Calculate dashboard statistics
  const calculateDashboardStats = useCallback(() => {
    const scheduledCalls = getScheduledCalls();
    const now = moment();
    const nextHour = moment().add(1, 'hour');
    const next24Hours = moment().add(24, 'hours');

    const callsInNextHour = scheduledCalls.filter(call => 
      moment(call.scheduledAt).isAfter(now) && 
      moment(call.scheduledAt).isBefore(nextHour)
    ).length;

    const callsInNext24Hours = scheduledCalls.filter(call => 
      moment(call.scheduledAt).isAfter(now) && 
      moment(call.scheduledAt).isBefore(next24Hours)
    ).length;

    const overdueCalls = scheduledCalls.filter(call => 
      moment(call.scheduledAt).isBefore(now) && call.status === "overdue"
    ).length;

    // Static data for assigned/unassigned
    const totalRecords = 5000;
    const assignedRecords = 2000;
    const unassignedRecords = totalRecords - assignedRecords;

    return {
      callsInNextHour,
      callsInNext24Hours,
      overdueCalls,
      assignedRecords,
      unassignedRecords,
    };
  }, []);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  // Fetch extensions data
  useEffect(() => {
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
    fetchExtensions();
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Fetch CRM data for GenericListPage
  const fetchCrmData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const params: any = {
        page,
        per_page: perPage,
      };

      if (search) {
        params.search = search;
      }

      // Add filter parameters
      if (memoizedFilters.phone) {
        params.phone = memoizedFilters.phone;
      }

      // Add new filter parameters for CRM data
      if (memoizedFilters.campaign_id && memoizedFilters.campaign_id.length > 0) {
        params.campaign_id = memoizedFilters.campaign_id;
      }

      if (memoizedFilters.tags && memoizedFilters.tags.length > 0) {
        params.tags = memoizedFilters.tags;
      }

      if (memoizedFilters.assignment_status) {
        if (memoizedFilters.assignment_status === 'assigned') {
          params.user_extension = 'not_null';
        } else if (memoizedFilters.assignment_status === 'unassigned') {
          params.user_extension = 'null';
        }
      }

      if (memoizedFilters.user_extension && memoizedFilters.user_extension.length > 0) {
        params.user_extension = memoizedFilters.user_extension;
      }

      if (memoizedFilters.is_viewed !== undefined && memoizedFilters.is_viewed !== '') {
        params.is_viewed = memoizedFilters.is_viewed;
      }

      if (memoizedFilters.start_date) {
        params.start_date = memoizedFilters.start_date;
      }

      if (memoizedFilters.end_date) {
        params.end_date = memoizedFilters.end_date;
      }

      const response = await getCrmData(params);
      console.log("CRM Data Response:", response);

      // Transform to GenericListPage expected format
      return {
        dataList: response.data || [],
        meta: {
          total: response.pagination.total || 0,
          current_page: response.pagination.current_page || page,
          per_page: response.pagination.per_page || perPage,
          last_page: response.pagination.last_page || 1,
        },
      };
    },
    [memoizedFilters]
  );

  // CSV validation function
  const validateCsvFile = (
    file: File
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check file type
    if (
      !file.type.includes("csv") &&
      !file.name.toLowerCase().endsWith(".csv")
    ) {
      errors.push("File must be a CSV file");
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      errors.push("File size must be less than 10MB");
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push("File cannot be empty");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validation = validateCsvFile(file);

    if (validation.isValid) {
      setSelectedFile(file);
    } else {
      validation.errors.forEach((error) => toast.error(error));
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Upload CSV file
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Extract campaign IDs from selected options
      const campaignIds = Array.from(selectedCampaigns).map(
        (campaign) => campaign.value
      );

      // Extract tag values from selected options
      const tagValues = Array.from(fieldTags).map(
        (tag) => tag.value
      );

      const response = await uploadCrmDataCsv(selectedFile, campaignIds, tagValues, assignToCampaignUsers);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSelectedFile(null);
      setSelectedCampaigns([]);
      setFieldTags([]);
      setAssignToCampaignUsers(false);
      setShowUploadModal(false);
      setUploadProgress(0);

      // Refresh data
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  // Handle view data item
  const handleViewData = useCallback((item: CrmDataItem) => {
    setSelectedDataItem(item);
    setShowViewModal(true);
  }, []);

  // Handle delete data item
  const handleDeleteData = useCallback((item: CrmDataItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await deleteCrmData(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Delete error:", error);
    }
  }, [itemToDelete]);

  // Calculate filtered record counts (static data for now)
  const calculateRecordCounts = useCallback(() => {
    // Static data simulation
    const totalRecords = 5000;
    const assignedRecords = 2000;
    const unassignedRecords = 3000;
    
    return {
      total: totalRecords,
      assigned: assignedRecords,
      unassigned: unassignedRecords,
    };
  }, []);

  // Handle data assignment
  const handleDataAssignment = useCallback(() => {
    const counts = calculateRecordCounts();
    setTotalRecordsToAssign(counts.unassigned);
    setShowDataAssignmentModal(true);
  }, [calculateRecordCounts]);

  // Handle assign to extension
  const handleAssignToExtension = useCallback(async () => {
    if (selectedAssignExtensions.length === 0) {
      toast.error("Please select at least one user extension");
      return;
    }

    // Validate custom mode data
    if (assignMode === "custom") {
      const totalCustomAllocation = Object.values(customData).reduce(
        (sum, count) => sum + count,
        0
      );
      if (totalCustomAllocation !== totalRecordsToAssign) {
        toast.error(
          `Custom allocation must equal total records to assign (${totalRecordsToAssign}). Current total: ${totalCustomAllocation}`
        );
        return;
      }
    }

    try {
      const userExtensions = Array.from(selectedAssignExtensions).map(
        (ext) => ext.value
      );

      // This would be the actual API call for assignment
      console.log("Assigning records:", {
        userExtensions,
        totalRecords: totalRecordsToAssign,
        assignMode,
        customData: assignMode === "custom" ? customData : undefined,
        filters: assignmentFilters,
      });

      setShowAssignModal(false);
      setSelectedAssignExtensions([]);
      setCustomData({});
      setAssignMode("auto");
      setShowDataAssignmentModal(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Assign error:", error);
    }
  }, [selectedAssignExtensions, assignMode, customData, totalRecordsToAssign, assignmentFilters]);

  // Handle mark as viewed
  const handleMarkAsViewed = useCallback(async (item: CrmDataItem) => {
    try {
      await markCrmDataAsViewed(item.id);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Mark as viewed error:", error);
    }
  }, []);

  // Handle call actions
  const handleCallAction = useCallback((action: string, item: CrmDataItem) => {
    const phone = item.phone;
    if (!phone) {
      toast.error("No phone number available for this record");
      return;
    }

    switch (action) {
      case "whatsapp":
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
        break;
      case "phone":
        window.open(`tel:${phone}`, '_self');
        break;
      case "sms":
        window.open(`sms:${phone}`, '_self');
        break;
      case "facebook":
        toast.info("Facebook calling feature coming soon");
        break;
      case "telegram":
        toast.info("Telegram calling feature coming soon");
        break;
      case "skype":
        toast.info("Skype calling feature coming soon");
        break;
      default:
        toast.error("Unknown action");
    }
  }, []);

  // Handle call button click
  const handleCallClick = useCallback((item: CrmDataItem) => {
    const phone = item.phone;
    if (!phone) {
      toast.error("No phone number available for this record");
      return;
    }
    window.open(`tel:${phone}`, '_self');
  }, []);

  // Handle recording playback
  const handlePlayRecording = useCallback((recordingUrl: string) => {
    // In a real app, this would open the recording player
    toast.info(`Playing recording: ${recordingUrl}`);
    console.log("Playing recording:", recordingUrl);
  }, []);

  // Handle assign modal close
  const handleAssignModalClose = useCallback(() => {
    setShowAssignModal(false);
    setSelectedAssignExtensions([]);
    setCustomData({});
    setAssignMode("auto");
  }, []);

  // Handle data assignment modal close
  const handleDataAssignmentModalClose = useCallback(() => {
    setShowDataAssignmentModal(false);
    setAssignmentFilters({
      selectedTags: [],
      selectedCampaigns: [],
    });
    setAssignmentCampaign([]);
    setAssignmentDistribution("equal");
    setTotalRecordsToAssign(0);
    setCustomDistribution({});
  }, []);

  // After Call modal handlers
  const handleAfterCallModalClose = useCallback(() => {
    setShowAfterCallModal(false);
    setAfterCallData({
      disposition: "",
      callStatus: "",
      comment: "",
      nextCallDate: "",
      nextCallTime: "",
      generateLead: "no",
    });
  }, []);

  const handleAfterCallSubmit = useCallback(() => {
    if (!afterCallData.disposition) {
      toast.error("Please select a disposition");
      return;
    }
    if (!afterCallData.callStatus) {
      toast.error("Please select a call status");
      return;
    }
    if (!afterCallData.comment.trim()) {
      toast.error("Please add a comment");
      return;
    }
    if (!afterCallData.generateLead) {
      toast.error("Please select whether to generate a lead");
      return;
    }

    // Here you would typically save the after call data
    console.log("After call data:", afterCallData);
    
    // Show different success messages based on lead generation choice
    if (afterCallData.generateLead === "yes") {
      toast.success("After call data saved successfully! Lead will be generated in the CRM system.");
    } else {
      toast.success("After call data saved successfully! No lead generated.");
    }
    
    handleAfterCallModalClose();
  }, [afterCallData, handleAfterCallModalClose]);

  // Schedule/Unschedule call handlers
  const handleScheduleCall = useCallback((record: any) => {
    setSelectedRecordForSchedule(record);
    setScheduleData({
      date: "",
      time: "",
      notes: "",
    });
    setShowScheduleModal(true);
  }, []);

  const handleUnscheduleCall = useCallback((record: any) => {
    setScheduledCalls(prev => ({
      ...prev,
      [record.id]: false
    }));
    toast.success(`Call unscheduled for ${record.name || record.phone}`);
  }, []);

  // Schedule modal handlers
  const handleScheduleModalClose = useCallback(() => {
    setShowScheduleModal(false);
    setSelectedRecordForSchedule(null);
    setScheduleData({
      date: "",
      time: "",
      notes: "",
    });
  }, []);

  const handleScheduleSubmit = useCallback(() => {
    if (!scheduleData.date) {
      toast.error("Please select a date");
      return;
    }
    if (!scheduleData.time) {
      toast.error("Please select a time");
      return;
    }

    // Schedule the call
    setScheduledCalls(prev => ({
      ...prev,
      [selectedRecordForSchedule.id]: true
    }));

    const scheduledDateTime = moment(`${scheduleData.date} ${scheduleData.time}`).format("MMM DD, YYYY HH:mm");
    toast.success(`Call scheduled for ${selectedRecordForSchedule.name || selectedRecordForSchedule.phone} on ${scheduledDateTime}`);
    
    handleScheduleModalClose();
  }, [scheduleData, selectedRecordForSchedule, handleScheduleModalClose]);

  // Handle custom data change
  const handleCustomDataChange = useCallback(
    (extensionId: string, count: number) => {
      setCustomData((prev) => ({
        ...prev,
        [extensionId]: count,
      }));
    },
    []
  );

  // Reset custom data when extensions change
  const handleAssignExtensionsChange = useCallback(
    (selected: readonly any[]) => {
      setSelectedAssignExtensions(selected);
      // Reset custom data when extensions change
      setCustomData({});
    },
    []
  );

  // Define columns for GenericListPage
  const columns: Column[] = useMemo(
    () => [
      {
        key: "phone",
        name: "Phone",
        selector: (row: any) => row.phone,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.phone ? (
              <Badge bg="info">{props.phone}</Badge>
            ) : (
              <span className="text-muted">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "user_extension",
        name: "Assigned To",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.user_extension ? (
              <Badge bg="success">
                {extensions.find(
                  (extension: any) =>
                    extension.id.toString() === props.user_extension?.toString()
                )?.display_name || props.user_extension}
              </Badge>
            ) : (
              <span className="text-muted">Unassigned</span>
            )}
          </div>
        ),
      },
      {
        key: "is_viewed",
        name: "Status",
        selector: (row: any) => row.is_viewed,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.is_viewed ? (
              <Badge bg="primary">Viewed</Badge>
            ) : (
              <Badge bg="warning">New</Badge>
            )}
          </div>
        ),
      },
      {
        key: "campaign",
        name: "Campaign",
        selector: (row: any) => row.campaign_id,
        sortable: true,
        cell: (props: any) => {
          const campaign = campaigns.find(
            (c) => c.value === props.campaign_id
          );
          return (
            <div>
              {campaign ? (
                <Badge bg="info">{campaign.label}</Badge>
              ) : (
                <span className="text-muted">No Campaign</span>
              )}
            </div>
          );
        },
      },
      {
        key: "tags",
        name: "Tags",
        selector: (row: any) => row.tags,
        sortable: false,
        cell: (props: any) => {
          // Show hardcoded tags for now
          const hardcodedTags = ["Hot Lead", "Follow Up"];
          return (
            <div className="d-flex flex-wrap gap-1">
              {hardcodedTags.map((tag, index) => (
                <Badge key={index} bg="secondary" className="small">
                  {tag}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        key: "last_call_end_reason",
        name: "Last Call Status",
        selector: (row: any) => row.last_call_end_reason,
        sortable: true,
        cell: (props: any) => {
          // Static data for now
          const endReason = callEndReasons.find(r => r.value === "answered") || callEndReasons[0];
          return (
            <Badge bg={endReason.color as any} className="small">
              {endReason.label}
            </Badge>
          );
        },
      },
      {
        key: "disposition",
        name: "Disposition",
        selector: (row: any) => row.disposition,
        sortable: true,
        cell: (props: any) => {
          // Static disposition data for now
          const dispositions = [
            { value: "interested", label: "Interested", color: "success" },
            { value: "not_interested", label: "Not Interested", color: "danger" },
            { value: "callback_requested", label: "Callback Requested", color: "warning" },
            { value: "no_answer", label: "No Answer", color: "secondary" },
            { value: "busy", label: "Busy", color: "info" },
            { value: "do_not_call", label: "Do Not Call", color: "dark" },
            { value: "wrong_number", label: "Wrong Number", color: "light" },
            { value: "follow_up", label: "Follow Up", color: "primary" },
          ];
          
          // Randomly select a disposition for demo purposes
          const randomDisposition = dispositions[Math.floor(Math.random() * dispositions.length)];
          
          return (
            <Badge bg={randomDisposition.color as any} className="small">
              {randomDisposition.label}
            </Badge>
          );
        },
      },
      {
        key: "last_called_at",
        name: "Last Called",
        selector: (row: any) => row.last_called_at,
        sortable: true,
        cell: (props: any) => {
          // Static data for now
          const lastCalled = "2024-01-15T10:30:00Z";
          return (
            <div className="d-flex align-items-center">
              <FiClock className="me-1" size={12} />
              <span className="small">
                {moment(lastCalled).format("MMM DD, HH:mm")}
              </span>
            </div>
          );
        },
      },
      {
        key: "next_call_scheduled_at",
        name: "Next Call Scheduled",
        selector: (row: any) => row.next_call_scheduled_at,
        sortable: true,
        cell: (props: any) => {
          // Static data for now - some records have scheduled calls, some don't
          const hasScheduledCall = Math.random() > 0.5;
          const scheduledTime = "2024-01-16T14:30:00Z";
          
          if (!hasScheduledCall) {
            return <span className="text-muted small">Not scheduled</span>;
          }
          
          const isOverdue = moment(scheduledTime).isBefore(moment());
          const isNextHour = moment(scheduledTime).isBefore(moment().add(1, 'hour'));
          
          return (
            <div className="d-flex align-items-center">
              <FiClock className={`me-1 ${isOverdue ? 'text-danger' : isNextHour ? 'text-warning' : 'text-success'}`} size={12} />
              <span className={`small ${isOverdue ? 'text-danger' : isNextHour ? 'text-warning' : ''}`}>
                {moment(scheduledTime).format("MMM DD, HH:mm")}
                {isOverdue && <span className="ms-1 fw-bold">(Overdue)</span>}
                {isNextHour && !isOverdue && <span className="ms-1 fw-bold">(Soon)</span>}
              </span>
            </div>
          );
        },
      },
      {
        key: "recording",
        name: "Recording",
        selector: (row: any) => row.recording,
        sortable: false,
        cell: (props: any) => {
          // Static data for now
          const hasRecording = true;
          const recordingUrl = "https://example.com/recording1.mp3";
          
          return (
            <div>
              {hasRecording ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handlePlayRecording(recordingUrl)}
                  title="Play Recording"
                >
                  <FiPlay size={12} />
                </Button>
              ) : (
                <span className="text-muted small">No recording</span>
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex gap-1">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleViewData(props)}
              title="View Details"
            >
              <FiEye size={14} />
            </Button>
              <>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => handleCallClick(props)}
                  title="Call Now"
                >
                  <FiPhone size={14} />
                </Button>
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-info"
                    size="sm"
                    id="call-dropdown"
                  >
                    <FiMessageCircle size={14} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={() => handleCallAction("whatsapp", props)}
                    >
                      <FiMessageCircle className="me-2" />
                      WhatsApp
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => handleCallAction("phone", props)}
                    >
                      <FiPhone className="me-2" />
                      Phone Call
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => handleCallAction("sms", props)}
                    >
                      <FiMessageCircle className="me-2" />
                      SMS
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      onClick={() => handleCallAction("facebook", props)}
                    >
                      <FiMessageCircle className="me-2" />
                      Facebook
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => handleCallAction("telegram", props)}
                    >
                      <FiMessageCircle className="me-2" />
                      Telegram
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => handleCallAction("skype", props)}
                    >
                      <FiPhone className="me-2" />
                      Skype
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            {!props.is_viewed && (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => handleMarkAsViewed(props)}
                title="Mark as Viewed"
              >
                <FiCheck size={14} />
              </Button>
            )}
            {scheduledCalls[props.id] ? (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => handleUnscheduleCall(props)}
                title="Unschedule Call"
              >
                <FiX size={14} />
              </Button>
            ) : (
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => handleScheduleCall(props)}
                title="Schedule Call"
              >
                <FiCalendar size={14} />
              </Button>
            )}
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleDeleteData(props)}
              title="Delete Record"
            >
              <FiTrash2 size={14} />
            </Button>
          </div>
        ),
      },
    ],
    [handleViewData, handleMarkAsViewed, handleDeleteData, handleCallAction, handleCallClick, handlePlayRecording, extensions, campaigns, callEndReasons, scheduledCalls, handleScheduleCall, handleUnscheduleCall]
  );

  return (
    <React.Fragment>
      <style jsx>{`
        .timeline-line {
          position: relative;
          height: 2px;
          background: #e9ecef;
          margin-top: 10px;
        }
        .timeline-line::after {
          content: '';
          position: absolute;
          top: -8px;
          left: 0;
          width: 2px;
          height: 18px;
          background: #e9ecef;
        }
        .timeline-item:last-child .timeline-line {
          display: none;
        }
      `}</style>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Data Management"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0 d-flex align-items-center">
                  <FiDatabase className="me-2" />
                  CRM Data Management
                </h1>
                <p className="text-muted">
                  Upload and manage your CRM data from CSV files
                </p>
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="success"
                  onClick={handleDataAssignment}
                >
                  <FiUsers className="me-2" />
                  Data Assignment
                </Button>
                <Button
                  variant="info"
                  onClick={() => setShowAfterCallModal(true)}
                >
                  <FiPhone className="me-2" />
                  After Call
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowHistoryModal(true)}
                >
                  <FiClock className="me-2" />
                  View History
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowUploadModal(true)}
                >
                  <FiUpload className="me-2" />
                  Upload CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="row mb-4">
          <div className="col-md-2">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FiClock className="text-warning me-2" size={24} />
                  <h4 className="mb-0 text-warning">{calculateDashboardStats().callsInNextHour}</h4>
                </div>
                <p className="mb-0 small text-muted">Calls in Next Hour</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-2">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FiClock className="text-info me-2" size={24} />
                  <h4 className="mb-0 text-info">{calculateDashboardStats().callsInNext24Hours}</h4>
                </div>
                <p className="mb-0 small text-muted">Calls in Next 24h</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-2">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FiX className="text-danger me-2" size={24} />
                  <h4 className="mb-0 text-danger">{calculateDashboardStats().overdueCalls}</h4>
                </div>
                <p className="mb-0 small text-muted">Overdue Calls</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FiUser className="text-success me-2" size={24} />
                  <h4 className="mb-0 text-success">{calculateDashboardStats().assignedRecords.toLocaleString()}</h4>
                </div>
                <p className="mb-0 small text-muted">Assigned Records</p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FiAlertCircle className="text-warning me-2" size={24} />
                  <h4 className="mb-0 text-warning">{calculateDashboardStats().unassignedRecords.toLocaleString()}</h4>
                </div>
                <p className="mb-0 small text-muted">Unassigned Records</p>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* CRM Data Filters */}
        <div className="row mb-3">
          <div className="col-12">
            <CrmDataFilters onFiltersChange={handleFiltersChange} />
          </div>
        </div>

        {/* CRM Data List */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <GenericListPage
                  columns={columns}
                  fetchData={fetchCrmData}
                  title="CRM Data"
                  searchPlaceholder="Search CRM data..."
                  defaultPageSize={15}
                  filters={memoizedFilters}
                  refreshKey={refreshKey}
                  rowSelection={false}
                />
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiUpload className="me-2" />
            Upload CSV File
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            className={`border-2 border-dashed rounded p-4 text-center ${
              dragActive ? "border-primary bg-light" : "border-secondary"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div>
                <FiDatabase
                  className="text-success"
                  style={{ fontSize: "3rem" }}
                />
                <p className="mt-2 mb-0">
                  <strong>{selectedFile.name}</strong>
                </p>
                <p className="text-muted small">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div>
                <FiUpload className="text-muted" style={{ fontSize: "3rem" }} />
                <p className="mt-2 mb-0">Drag and drop your CSV file here</p>
                <p className="text-muted small">or</p>
                <Button
                  variant="outline-primary"
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  Browse Files
                </Button>
                <input
                  id="fileInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <Form.Group className="mt-3">
            <Form.Label>Select Campaigns (Optional)</Form.Label>
            <CreatableSelect
              isMulti
              value={selectedCampaigns}
              onChange={(selected) => setSelectedCampaigns(selected || [])}
              options={campaigns}
              placeholder="Select campaigns to assign data to..."
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#ced4da",
                  boxShadow: "none",
                  fontSize: "14px",
                }),
              }}
            />
            <Form.Text className="text-muted">
              Select campaigns to assign the uploaded data to. Data will be distributed equally among selected campaigns.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mt-3">
            <Form.Label>Campaign Assignment</Form.Label>
            <div>
              <Form.Check
                type="radio"
                id="assign-campaign-users"
                name="assignToCampaignUsers"
                label="Assign to campaign users"
                value="true"
                checked={assignToCampaignUsers === true}
                onChange={() => setAssignToCampaignUsers(true)}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="no-assign-campaign-users"
                name="assignToCampaignUsers"
                label="Do not assign to campaign users"
                value="false"
                checked={assignToCampaignUsers === false}
                onChange={() => setAssignToCampaignUsers(false)}
              />
            </div>
            <Form.Text className="text-muted">
              Choose whether to assign the uploaded data to users associated with the selected campaigns.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mt-3">
            <Form.Label>Field Tags (Optional)</Form.Label>
            <CreatableSelect
              isMulti
              value={fieldTags}
              onChange={(selected) => setFieldTags(selected || [])}
              options={staticTags}
              placeholder="Select or create tags for this data..."
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#ced4da",
                  boxShadow: "none",
                  fontSize: "14px",
                }),
              }}
            />
            <Form.Text className="text-muted">
              Add custom field tags to categorize this data upload.
            </Form.Text>
          </Form.Group>

          <Alert variant="info" className="mt-3">
            <strong>CSV Format Requirements:</strong>
            <ul className="mb-0 mt-2">
              <li>First row should contain column headers</li>
              <li>
                Phone numbers should be in a column named "phone" (case
                insensitive)
              </li>
              <li>Maximum file size: 10MB</li>
              <li>Supported formats: CSV, TXT</li>
            </ul>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUploadModal(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              "Upload File"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Data Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiEye className="me-2" />
            View CRM Data - #{selectedDataItem?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDataItem && (
            <div>
              <Row>
                <Col className="mb-3" md={6}>
                  <strong>Phone:</strong> {selectedDataItem.phone || "N/A"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Assigned To:</strong>{" "}
                  {selectedDataItem.user_extension
                    ? extensions.find(
                        (extension: any) =>
                          extension.id.toString() ===
                          selectedDataItem.user_extension?.toString()
                      )?.display_name || selectedDataItem.user_extension
                    : "Unassigned"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Status:</strong>{" "}
                  {selectedDataItem.is_viewed ? "Viewed" : "New"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Campaign:</strong>{" "}
                  {campaigns.find(c => c.value === "campaign-1")?.label || "No Campaign"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Last Call Status:</strong>{" "}
                  <Badge bg="success" className="small">Answered</Badge>
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Disposition:</strong>{" "}
                  <Badge bg="primary" className="small">
                    {getCallHistory(selectedDataItem.id)[0]?.disposition?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Interested"}
                  </Badge>
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Last Called:</strong>{" "}
                  {getCallHistory(selectedDataItem.id)[0]?.calledAt ? 
                    moment(getCallHistory(selectedDataItem.id)[0].calledAt).format("MMM DD, YYYY HH:mm") :
                    moment("2024-01-15T10:30:00Z").format("MMM DD, YYYY HH:mm")
                  }
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Next Call Scheduled:</strong>{" "}
                  <span className="text-success">
                    {moment().add(Math.floor(Math.random() * 7) + 1, 'days').format("MMM DD, YYYY HH:mm")}
                  </span>
                </Col>
              </Row>

              {/* Call History Section */}
              <div className="mt-4">
                <h6 className="mb-3">Call History</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Duration</th>
                        <th>End Reason</th>
                        <th>Disposition</th>
                        <th>Recording</th>
                        <th>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCallHistory(selectedDataItem.id).map((call) => {
                        const endReason = callEndReasons.find(r => r.value === call.endReason);
                        const dispositionColors = {
                          interested: "success",
                          not_interested: "danger",
                          callback_requested: "warning",
                          no_answer: "secondary",
                          busy: "info",
                          do_not_call: "dark",
                          wrong_number: "light",
                          follow_up: "primary",
                        };
                        return (
                          <tr key={call.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <FiClock className="me-1" size={12} />
                                <span className="small">
                                  {moment(call.calledAt).format("MMM DD, HH:mm")}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="small">{call.duration}</span>
                            </td>
                            <td>
                              <Badge 
                                bg={endReason?.color as any || "secondary"} 
                                className="small"
                              >
                                {endReason?.label || call.endReason}
                              </Badge>
                            </td>
                            <td>
                              <Badge 
                                bg={dispositionColors[call.disposition as keyof typeof dispositionColors] as any || "primary"} 
                                className="small"
                              >
                                {call.disposition?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handlePlayRecording(call.recordingUrl)}
                                title="Play Recording"
                              >
                                <FiPlay size={12} />
                              </Button>
                            </td>
                            <td>
                              <div className="small text-muted" style={{ maxWidth: "200px", whiteSpace: "wrap"}}>
                                {call.comment}
                              </div>
                            </td>
                        
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiTrash2 className="me-2" />
            Delete CRM Data
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this CRM data record?</p>
          {itemToDelete && (
            <div className="alert alert-warning">
              <strong>Record ID:</strong> #{itemToDelete.id}
              <br />
              <strong>Phone:</strong> {itemToDelete.phone || "N/A"}
              <br />
              <strong>Assigned To:</strong>{" "}
              {itemToDelete.user_extension
                ? extensions.find(
                    (extension: any) =>
                      extension.id.toString() ===
                      itemToDelete.user_extension?.toString()
                  )?.display_name || itemToDelete.user_extension
                : "Unassigned"}
              <br />
              <strong>Created:</strong>{" "}
              {moment(itemToDelete.created_at).format("MMM DD, YYYY HH:mm")}
            </div>
          )}
          <p className="text-danger">
            <strong>This action cannot be undone.</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Record
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign to Extension Modal */}
      <Modal show={showAssignModal} onHide={handleAssignModalClose}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiUsers className="me-2" />
            Assign to User Extensions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Assign <strong>{totalRecordsToAssign}</strong> records to user
            extensions.
          </p>

          <Form.Group className="mb-3">
            <Form.Label>Assign to Users</Form.Label>
            <CreatableSelect
              isMulti
              value={selectedAssignExtensions}
              onChange={handleAssignExtensionsChange}
              options={extensions.map((extension: any) => ({
                value: extension.id.toString(),
                label: extension.display_name || extension.name || extension.id,
              }))}
              placeholder="Select user extensions..."
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#ced4da",
                  boxShadow: "none",
                  fontSize: "14px",
                }),
              }}
            />
            <Form.Text className="text-muted">
              Select the user extensions you want to assign these items to.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Assignment Mode</Form.Label>
            <div>
              <Form.Check
                type="radio"
                id="auto-mode"
                name="assignMode"
                label="Auto (Equal distribution)"
                value="auto"
                checked={assignMode === "auto"}
                onChange={(e) =>
                  setAssignMode(e.target.value as "auto" | "custom")
                }
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="custom-mode"
                name="assignMode"
                label="Custom (Specify count per extension)"
                value="custom"
                checked={assignMode === "custom"}
                onChange={(e) =>
                  setAssignMode(e.target.value as "auto" | "custom")
                }
              />
            </div>
            <Form.Text className="text-muted">
              {assignMode === "auto"
                ? "Items will be distributed equally among selected extensions."
                : "Specify how many items each extension should receive."}
            </Form.Text>
          </Form.Group>

          {assignMode === "custom" && selectedAssignExtensions.length > 0 && (
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">Custom Allocation</Form.Label>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    const equalDistribution = Math.floor(
                      totalRecordsToAssign / selectedAssignExtensions.length
                    );
                    const remainder =
                      totalRecordsToAssign % selectedAssignExtensions.length;
                    const newCustomData: Record<string, number> = {};

                    Array.from(selectedAssignExtensions).forEach(
                      (extension: any, index: number) => {
                        newCustomData[extension.value] =
                          equalDistribution + (index < remainder ? 1 : 0);
                      }
                    );

                    setCustomData(newCustomData);
                  }}
                >
                  Auto-fill Equal
                </Button>
              </div>
              <div className="border rounded p-3 bg-light">
                  <p className="small text-muted mb-3">
                    Total items: <strong>{totalRecordsToAssign}</strong> |
                    Allocated:{" "}
                    <strong>
                      {Object.values(customData).reduce(
                        (sum, count) => sum + count,
                        0
                      )}
                    </strong>{" "}
                    | Remaining:{" "}
                    <strong>
                      {totalRecordsToAssign -
                        Object.values(customData).reduce(
                          (sum, count) => sum + count,
                          0
                        )}
                    </strong>
                  </p>
                {Array.from(selectedAssignExtensions).map((extension: any) => (
                  <div key={extension.value} className="mb-2">
                    <Row>
                      <Col md={6}>
                        <Form.Label className="small mb-0">
                          {extension.label}
                        </Form.Label>
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          type="number"
                          min="0"
                          max={totalRecordsToAssign}
                          value={customData[extension.value] || 0}
                          onChange={(e) =>
                            handleCustomDataChange(
                              extension.value,
                              parseInt(e.target.value) || 0
                            )
                          }
                          size="sm"
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </Form.Group>
          )}

          <div className="alert alert-info">
            <strong>Assignment Summary:</strong>
            <ul className="mb-0 mt-2">
              <li>Total records to assign: <strong>{totalRecordsToAssign}</strong></li>
              <li>Distribution method: <strong>{assignMode === "auto" ? "Equal" : "Custom"}</strong></li>
              <li>Selected campaigns: <strong>{assignmentFilters.selectedCampaigns.length}</strong></li>
              <li>Selected tags: <strong>{assignmentFilters.selectedTags.length}</strong></li>
            </ul>
          </div> 
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleAssignModalClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            disabled={
              selectedAssignExtensions.length === 0 ||
              (assignMode === "custom" &&
                totalRecordsToAssign -
                  Object.values(customData).reduce(
                    (sum, count) => sum + count,
                    0
                  ) !==
                  0)
            }
            onClick={handleAssignToExtension}
          >
            Assign Items
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Data Assignment Modal */}
      <Modal show={showDataAssignmentModal} onHide={handleDataAssignmentModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiUsers className="me-2" />
            Data Assignment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h6>Filter Records</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Tags</Form.Label>
                  <CreatableSelect
                    isMulti
                    value={assignmentFilters.selectedTags}
                    onChange={(selected) =>
                      setAssignmentFilters(prev => ({
                        ...prev,
                        selectedTags: selected || []
                      }))
                    }
                    options={staticTags}
                    placeholder="Select tags to filter..."
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#ced4da",
                        boxShadow: "none",
                        fontSize: "14px",
                      }),
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Campaigns</Form.Label>
                  <CreatableSelect
                    isMulti
                    value={assignmentFilters.selectedCampaigns}
                    onChange={(selected) =>
                      setAssignmentFilters(prev => ({
                        ...prev,
                        selectedCampaigns: selected || []
                      }))
                    }
                    options={campaigns}
                    placeholder="Select campaigns to filter..."
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#ced4da",
                        boxShadow: "none",
                        fontSize: "14px",
                      }),
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h6>Record Counts</h6>
            <div className="row">
              <div className="col-md-4">
                <div className="card bg-light">
                  <div className="card-body text-center">
                    <h4 className="text-primary">{calculateRecordCounts().total}</h4>
                    <p className="mb-0">Total Records</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h4>{calculateRecordCounts().assigned}</h4>
                    <p className="mb-0">Already Assigned</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-warning text-white">
                  <div className="card-body text-center">
                    <h4>{calculateRecordCounts().unassigned}</h4>
                    <p className="mb-0">Unassigned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h6>Assignment Details</h6>
            <p className="text-muted">
              Out of the <strong>{calculateRecordCounts().total}</strong> records with these tags and campaigns, 
              <strong> {calculateRecordCounts().unassigned}</strong> are unassigned.
            </p>
            
            <Form.Group className="mb-3">
              <Form.Label>Assign to Campaign *</Form.Label>
              <CreatableSelect
                isMulti
                value={assignmentCampaign}
                onChange={(selected) => setAssignmentCampaign(selected || [])}
                options={campaigns}
                placeholder="Select campaigns to assign records to..."
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#ced4da",
                    boxShadow: "none",
                    fontSize: "14px",
                  }),
                }}
              />
              <Form.Text className="text-muted">
                Select the campaign(s) where the records will be assigned.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>How many records should be assigned?</Form.Label>
              <Form.Control
                type="number"
                min="0"
                max={calculateRecordCounts().unassigned}
                value={totalRecordsToAssign}
                onChange={(e) => setTotalRecordsToAssign(parseInt(e.target.value) || 0)}
                placeholder="Enter number of records to assign"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Distribution Method</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  id="equal-distribution"
                  name="assignmentDistribution"
                  label="Split equally among assignment campaigns"
                  value="equal"
                  checked={assignmentDistribution === "equal"}
                  onChange={() => setAssignmentDistribution("equal")}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="custom-distribution"
                  name="assignmentDistribution"
                  label="Assign fixed numbers to each assignment campaign"
                  value="custom"
                  checked={assignmentDistribution === "custom"}
                  onChange={() => setAssignmentDistribution("custom")}
                />
              </div>
            </Form.Group>

            {assignmentDistribution === "custom" && assignmentCampaign.length > 0 && (
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="mb-0">Custom Distribution</Form.Label>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const equalDistribution = Math.floor(
                        totalRecordsToAssign / assignmentCampaign.length
                      );
                      const remainder = totalRecordsToAssign % assignmentCampaign.length;
                      const newCustomDistribution: Record<string, number> = {};

                      Array.from(assignmentCampaign).forEach(
                        (campaign: any, index: number) => {
                          newCustomDistribution[campaign.value] =
                            equalDistribution + (index < remainder ? 1 : 0);
                        }
                      );

                      setCustomDistribution(newCustomDistribution);
                    }}
                  >
                    Auto-fill Equal
                  </Button>
                </div>
                <div className="border rounded p-3 bg-light">
                  <p className="small text-muted mb-3">
                    Total to assign: <strong>{totalRecordsToAssign}</strong> |
                    Allocated:{" "}
                    <strong>
                      {Object.values(customDistribution).reduce(
                        (sum, count) => sum + count,
                        0
                      )}
                    </strong>{" "}
                    | Remaining:{" "}
                    <strong>
                      {totalRecordsToAssign -
                        Object.values(customDistribution).reduce(
                          (sum, count) => sum + count,
                          0
                        )}
                    </strong>
                  </p>
                  {Array.from(assignmentCampaign).map((campaign: any) => (
                    <div key={campaign.value} className="mb-2">
                      <Row>
                        <Col md={6}>
                          <Form.Label className="small mb-0">
                            {campaign.label}
                          </Form.Label>
                        </Col>
                        <Col md={6}>
                          <Form.Control
                            type="number"
                            min="0"
                            max={totalRecordsToAssign}
                            value={customDistribution[campaign.value] || 0}
                            onChange={(e) =>
                              setCustomDistribution(prev => ({
                                ...prev,
                                [campaign.value]: parseInt(e.target.value) || 0
                              }))
                            }
                            size="sm"
                          />
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              </Form.Group>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDataAssignmentModalClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            disabled={
              totalRecordsToAssign === 0 ||
              assignmentCampaign.length === 0 ||
              (assignmentDistribution === "custom" &&
                totalRecordsToAssign -
                  Object.values(customDistribution).reduce(
                    (sum, count) => sum + count,
                    0
                  ) !==
                  0)
            }
            onClick={() => setShowAssignModal(true)}
          >
            Proceed to User Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* After Call Modal */}
      <Modal show={showAfterCallModal} onHide={handleAfterCallModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiPhone className="me-2" />
            After Call Dialog
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Disposition *</Form.Label>
                <Form.Select
                  value={afterCallData.disposition}
                  onChange={(e) => setAfterCallData({...afterCallData, disposition: e.target.value})}
                >
                  <option value="">Select Disposition</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="callback_requested">Callback Requested</option>
                  <option value="no_answer">No Answer</option>
                  <option value="busy">Busy</option>
                  <option value="do_not_call">Do Not Call</option>
                  <option value="wrong_number">Wrong Number</option>
                  <option value="follow_up">Follow Up</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Call Status *</Form.Label>
                <Form.Select
                  value={afterCallData.callStatus}
                  onChange={(e) => setAfterCallData({...afterCallData, callStatus: e.target.value})}
                >
                  <option value="">Select Call Status</option>
                  <option value="answered">Answered</option>
                  <option value="no_answer">No Answer</option>
                  <option value="busy">Busy</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="wrong_number">Wrong Number</option>
                  <option value="disconnected">Disconnected</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Call Comment *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={afterCallData.comment}
              onChange={(e) => setAfterCallData({...afterCallData, comment: e.target.value})}
              placeholder="Enter call details, client response, and any important notes..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Generate Lead *</Form.Label>
            <div className="d-flex gap-4">
              <Form.Check
                type="radio"
                id="generate-lead-yes"
                name="generateLead"
                value="yes"
                checked={afterCallData.generateLead === "yes"}
                onChange={(e) => setAfterCallData({...afterCallData, generateLead: e.target.value})}
                label="Yes, generate lead"
              />
              <Form.Check
                type="radio"
                id="generate-lead-no"
                name="generateLead"
                value="no"
                checked={afterCallData.generateLead === "no"}
                onChange={(e) => setAfterCallData({...afterCallData, generateLead: e.target.value})}
                label="No, do not generate lead"
              />
            </div>
            <Form.Text className="text-muted">
              Select "Yes" if this call resulted in a qualified lead that should be created in the CRM system.
            </Form.Text>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Schedule Next Call (Optional)</Form.Label>
                <Form.Control
                  type="date"
                  value={afterCallData.nextCallDate}
                  onChange={(e) => setAfterCallData({...afterCallData, nextCallDate: e.target.value})}
                  min={moment().format("YYYY-MM-DD")}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Time (Optional)</Form.Label>
                <Form.Control
                  type="time"
                  value={afterCallData.nextCallTime}
                  onChange={(e) => setAfterCallData({...afterCallData, nextCallTime: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Alert variant="info">
            <strong>Note:</strong> This dialog will be used to record call outcomes and schedule follow-up actions. 
            All fields marked with * are required.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleAfterCallModalClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAfterCallSubmit}>
            Save Call Data
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Schedule Call Modal */}
      <Modal show={showScheduleModal} onHide={handleScheduleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiCalendar className="me-2" />
            Schedule Call
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecordForSchedule && (
            <div className="mb-3">
              <h6>Schedule Call For:</h6>
              <div className="bg-light p-3 rounded">
                <div><strong>Name:</strong> {selectedRecordForSchedule.name || "N/A"}</div>
                <div><strong>Phone:</strong> {selectedRecordForSchedule.phone || "N/A"}</div>
                <div><strong>Email:</strong> {selectedRecordForSchedule.email || "N/A"}</div>
              </div>
            </div>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                  min={moment().format("YYYY-MM-DD")}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Time *</Form.Label>
                <Form.Control
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={scheduleData.notes}
              onChange={(e) => setScheduleData({...scheduleData, notes: e.target.value})}
              placeholder="Add any notes or reminders for this call..."
            />
          </Form.Group>

          <Alert variant="info">
            <strong>Note:</strong> The call will be scheduled and you'll receive a reminder at the selected time.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleScheduleModalClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleScheduleSubmit}>
            Schedule Call
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiClock className="me-2" />
            Activity History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <p className="text-muted">
              Track all user activities including CSV uploads, data assignments, and campaign management.
            </p>
          </div>
          
          <div className="timeline">
            {getHistoryData().map((activity, index) => (
              <div key={activity.id} className="timeline-item mb-4">
                <div className="d-flex">
                  <div className="timeline-marker me-3">
                    <div className={`bg-${activity.color} rounded-circle d-flex align-items-center justify-content-center`} 
                         style={{ width: '40px', height: '40px' }}>
                      {activity.icon === 'upload' && <FiUpload size={20} className="text-white" />}
                      {activity.icon === 'users' && <FiUsers size={20} className="text-white" />}
                      {activity.icon === 'user' && <FiUser size={20} className="text-white" />}
                    </div>
                  </div>
                  <div className="timeline-content flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">
                          <strong>{activity.user}</strong> {activity.action}
                        </h6>
                        <p className="text-muted mb-0 small">{activity.details}</p>
                      </div>
                      <small className="text-muted">{activity.timestamp}</small>
                    </div>
                    <div className="timeline-line"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CrmDataManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDataManagement;
