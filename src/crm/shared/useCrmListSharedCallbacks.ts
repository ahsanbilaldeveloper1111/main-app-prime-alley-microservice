import { useCallback, useEffect, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import {
  assignCrmDataAdvanced,
  bulkDeleteCrmData,
  createCrmAuditLog,
  getAllCrmDataById,
  scheduleCall,
  unscheduleCall,
  type CrmDataItem,
} from "@utils/crm";
import { downloadCallRecordingWithProgress } from "./crmListDownloadRecordingUtils";

export type CrmListSharedCallbacksDeps = {
  session: any;
  setRefreshKey: Dispatch<SetStateAction<number>>;
  selectedDataItem: CrmDataItem | null;
  setSelectedDataItem: Dispatch<SetStateAction<CrmDataItem | null>>;
  setShowDataAssignmentModal: Dispatch<SetStateAction<boolean>>;
  setShowAfterCallModal: Dispatch<SetStateAction<boolean>>;
  setShowDeleteModal: Dispatch<SetStateAction<boolean>>;
  setItemToDelete: Dispatch<SetStateAction<CrmDataItem | null>>;
  dialNumber: (...args: any[]) => any;
  isInitialized: boolean;

  assignmentFilters: { selectedTags: readonly any[]; selectedCampaigns: readonly any[] };
  setAssignmentFilters: Dispatch<SetStateAction<{ selectedTags: readonly any[]; selectedCampaigns: readonly any[] }>>;
  assignmentCampaign: readonly any[];
  setAssignmentCampaign: Dispatch<SetStateAction<readonly any[]>>;
  assignmentDistribution: "equal" | "custom";
  setAssignmentDistribution: Dispatch<SetStateAction<"equal" | "custom">>;
  totalEntriesToAssign: number;
  setTotalEntriesToAssign: Dispatch<SetStateAction<number>>;
  customDistribution: Record<string, number>;
  setCustomDistribution: Dispatch<SetStateAction<Record<string, number>>>;
  setAssignmentCounts: Dispatch<SetStateAction<{ total: number; assigned: number; unassigned: number }>>;
  afterCallData: { disposition: string; callStatus: string; comment: string; nextCallDate: string; nextCallTime: string; generateLead: string };
  setAfterCallData: Dispatch<SetStateAction<{ disposition: string; callStatus: string; comment: string; nextCallDate: string; nextCallTime: string; generateLead: string }>>;
  setShowScheduleModal: Dispatch<SetStateAction<boolean>>;
  setSelectedEntryForSchedule: Dispatch<SetStateAction<any>>;
  isEditingSchedule: boolean;
  setIsEditingSchedule: Dispatch<SetStateAction<boolean>>;
  scheduleData: { date: string; time: string; notes: string };
  setScheduleData: Dispatch<SetStateAction<{ date: string; time: string; notes: string }>>;
  selectedEntryForSchedule: any;
  setShowUnscheduleModal: Dispatch<SetStateAction<boolean>>;
  entryToUnschedule: any;
  setEntryToUnschedule: Dispatch<SetStateAction<any>>;
  selectedItems: number[];
  setSelectedItems: Dispatch<SetStateAction<number[]>>;
  clearSelectedRows: boolean;
  setClearSelectedRows: Dispatch<SetStateAction<boolean>>;
  setDeleteModalMode: Dispatch<SetStateAction<"single" | "bulk" | null>>;

  sidebarFetchTokenRef: MutableRefObject<number>;
  setSelectedRecord: Dispatch<SetStateAction<any>>;
  setShowSidebar: Dispatch<SetStateAction<boolean>>;

  setSelectedRecording?: Dispatch<SetStateAction<any>>;
  setShowRecordingPlayerModal?: Dispatch<SetStateAction<boolean>>;
  setDownloadingRecordings?: Dispatch<SetStateAction<Set<string>>>;
  setDownloadProgress?: Dispatch<SetStateAction<Record<string, number>>>;
  calculateEntryCounts: () => Promise<{ total: number; assigned: number; unassigned: number }>;
  /** Optional: run after bulk delete succeeds (ids are the deleted record ids). */
  onAfterBulkDelete?: (deletedIds: readonly number[]) => void;
};

const EMPTY_AFTER_CALL = { disposition: "", callStatus: "", comment: "", nextCallDate: "", nextCallTime: "", generateLead: "no" };
const EMPTY_SCHEDULE = { date: "", time: "", notes: "" };
const EMPTY_ASSIGNMENT_FILTERS = { selectedTags: [] as readonly any[], selectedCampaigns: [] as readonly any[] };

/**
 * Shared callback handlers for CRM list pages (quotes, contacts, prospects).
 * Eliminates ~480 lines of duplication per page.
 */
export function useCrmListSharedCallbacks(deps: CrmListSharedCallbacksDeps) {
  const {
    session, setRefreshKey, selectedDataItem, setSelectedDataItem,
    setShowDataAssignmentModal, setShowAfterCallModal, setShowDeleteModal, setItemToDelete,
    dialNumber, isInitialized,
    assignmentFilters, setAssignmentFilters, assignmentCampaign, setAssignmentCampaign,
    assignmentDistribution, setAssignmentDistribution, totalEntriesToAssign, setTotalEntriesToAssign,
    customDistribution, setCustomDistribution, setAssignmentCounts,
    afterCallData, setAfterCallData,
    setShowScheduleModal, setSelectedEntryForSchedule, isEditingSchedule, setIsEditingSchedule,
    scheduleData, setScheduleData, selectedEntryForSchedule,
    setShowUnscheduleModal, entryToUnschedule, setEntryToUnschedule,
    selectedItems, setSelectedItems, clearSelectedRows, setClearSelectedRows, setDeleteModalMode,
    sidebarFetchTokenRef, setSelectedRecord, setShowSidebar,
    setSelectedRecording, setShowRecordingPlayerModal, setDownloadingRecordings, setDownloadProgress,
    calculateEntryCounts,
    onAfterBulkDelete,
  } = deps;

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  const showSuccess = useCallback((title: string, description: string) => {
    setShowSuccessfulModal(true);
    setSuccessModalTitle(title);
    setSuccessModalDescription(description);
  }, []);

  const resetAssignmentState = useCallback(() => {
    setAssignmentFilters(EMPTY_ASSIGNMENT_FILTERS);
    setAssignmentCampaign([]);
    setAssignmentDistribution("equal");
    setTotalEntriesToAssign(0);
    setCustomDistribution({});
  }, [setAssignmentFilters, setAssignmentCampaign, setAssignmentDistribution, setTotalEntriesToAssign, setCustomDistribution]);

  useEffect(() => {
    const refetchCounts = async () => {
      if (
        assignmentFilters.selectedCampaigns.length > 0 ||
        assignmentFilters.selectedTags.length > 0
      ) {
        try {
          const counts = await calculateEntryCounts();
          setAssignmentCounts(counts);
          setTotalEntriesToAssign(counts.unassigned);
        } catch (error) {
          console.error("Failed to refetch counts:", error);
        }
      }
    };
    refetchCounts();
  }, [assignmentFilters.selectedCampaigns, assignmentFilters.selectedTags, calculateEntryCounts, setAssignmentCounts, setTotalEntriesToAssign]);

  const handleDataAssignment = useCallback(async () => {
    try {
      const counts = await calculateEntryCounts();
      setAssignmentCounts(counts);
      setTotalEntriesToAssign(counts.unassigned);
      setShowDataAssignmentModal(true);
    } catch (error) {
      console.error("Failed to get entry counts:", error);
      setAssignmentCounts({ total: 5000, assigned: 2000, unassigned: 3000 });
      setTotalEntriesToAssign(3000);
      setShowDataAssignmentModal(true);
    }
  }, [calculateEntryCounts, setAssignmentCounts, setTotalEntriesToAssign, setShowDataAssignmentModal]);

  const handleDataAssignmentSubmit = useCallback(async () => {
    if (assignmentCampaign.length === 0) {
      toast.error("Please select at least one campaign to assign entries to");
      return;
    }
    if (totalEntriesToAssign === 0) {
      toast.error("Please specify how many entries to assign");
      return;
    }
    if (assignmentDistribution === "custom") {
      const totalCustomAllocation = Object.values(customDistribution).reduce(
        (sum, count) => sum + count, 0,
      );
      if (totalCustomAllocation !== totalEntriesToAssign) {
        toast.error(
          `Custom allocation must equal total entries to assign (${totalEntriesToAssign}). Current total: ${totalCustomAllocation}`,
        );
        return;
      }
    }

    try {
      const campaignFilterIds = Array.from(assignmentFilters.selectedCampaigns).map(
        (campaign) => Number.parseInt(campaign.value),
      );
      const tagIds = Array.from(assignmentFilters.selectedTags).map((tag) =>
        Number.parseInt(tag.id),
      );
      const campaignIds = Array.from(assignmentCampaign).map((campaign) =>
        Number.parseInt(campaign.value),
      );

      if (assignmentDistribution === "equal") {
        await assignCrmDataAdvanced(campaignIds, totalEntriesToAssign, campaignFilterIds, tagIds, "equal");
      } else {
        const campaignDistribution: Record<number, number> = {};
        Array.from(assignmentCampaign).forEach((campaign: any) => {
          const campaignId = Number.parseInt(campaign.value);
          const countForThisCampaign = customDistribution[campaign.value] || 0;
          if (countForThisCampaign > 0) {
            campaignDistribution[campaignId] = countForThisCampaign;
          }
        });
        await assignCrmDataAdvanced(campaignIds, totalEntriesToAssign, campaignFilterIds, tagIds, "custom", campaignDistribution);
      }

      setShowDataAssignmentModal(false);
      resetAssignmentState();
      showSuccess("Data Assignment Successful!", "The data has been successfully assigned.");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Assign error:", error);
    }
  }, [assignmentCampaign, totalEntriesToAssign, assignmentFilters, assignmentDistribution, customDistribution, setShowDataAssignmentModal, resetAssignmentState, showSuccess, setRefreshKey]);

  const handleDataAssignmentModalClose = useCallback(() => {
    setShowDataAssignmentModal(false);
    resetAssignmentState();
  }, [setShowDataAssignmentModal, resetAssignmentState]);

  const handleAfterCallModalClose = useCallback(() => {
    setShowAfterCallModal(false);
    setAfterCallData(EMPTY_AFTER_CALL);
  }, [setShowAfterCallModal, setAfterCallData]);

  const handleAfterCallSubmit = useCallback(() => {
    if (!afterCallData.disposition) { toast.error("Please select a disposition"); return; }
    if (!afterCallData.callStatus) { toast.error("Please select a call status"); return; }
    if (!afterCallData.comment.trim()) { toast.error("Please add a comment"); return; }
    if (!afterCallData.generateLead) { toast.error("Please select whether to generate a lead"); return; }

    handleAfterCallModalClose();

    if (afterCallData.generateLead === "yes" && selectedDataItem) {
      toast.success("Redirecting to create lead page with pre-filled data...");
      globalThis.location.href = `/crm/leads/create?crm_data_id=${selectedDataItem.id}`;
    } else {
      toast.success("After call data saved successfully! No lead generated.");
      showSuccess("After Call Successful!", "The after call data has been successfully saved.");
    }
  }, [afterCallData, selectedDataItem, handleAfterCallModalClose, showSuccess]);

  const handleScheduleCall = useCallback((entry: any) => {
    setSelectedEntryForSchedule(entry);
    if (entry.scheduled_call_at) {
      setIsEditingSchedule(true);
      const scheduledDate = moment(entry.scheduled_call_at);
      setScheduleData({
        date: scheduledDate.format("YYYY-MM-DD"),
        time: scheduledDate.format("HH:mm"),
        notes: entry.note || "",
      });
    } else {
      setIsEditingSchedule(false);
      setScheduleData(EMPTY_SCHEDULE);
    }
    setShowScheduleModal(true);
  }, [setSelectedEntryForSchedule, setIsEditingSchedule, setScheduleData, setShowScheduleModal]);

  const handleUnscheduleCallClick = useCallback((entry: any) => {
    setEntryToUnschedule(entry);
    setShowUnscheduleModal(true);
  }, [setEntryToUnschedule, setShowUnscheduleModal]);

  const confirmUnscheduleCall = useCallback(async () => {
    if (!entryToUnschedule) return;
    try {
      const userExtension = session?.user?.extension ?? "default";
      await unscheduleCall(entryToUnschedule.id, userExtension);
      const prevWhen = entryToUnschedule.scheduled_call_at
        ? moment(entryToUnschedule.scheduled_call_at).format("MMM DD, YYYY HH:mm")
        : "previously scheduled time";
      void createCrmAuditLog({
        record_type: "prospect",
        record_id: Number(entryToUnschedule.id),
        event: "scheduled_call_unscheduled",
        action: "unscheduled",
        description: `Scheduled call (${prevWhen}) was unscheduled by ${userExtension}.`,
      });
      setRefreshKey((prev) => prev + 1);
      setShowUnscheduleModal(false);
      setEntryToUnschedule(null);
      toast.success("Call unscheduled successfully");
    } catch (error) {
      console.error("Failed to unschedule call:", error);
    }
  }, [entryToUnschedule, session, setRefreshKey, setShowUnscheduleModal, setEntryToUnschedule]);

  const handleScheduleModalClose = useCallback(() => {
    setShowScheduleModal(false);
    setSelectedEntryForSchedule(null);
    setIsEditingSchedule(false);
    setScheduleData(EMPTY_SCHEDULE);
  }, [setShowScheduleModal, setSelectedEntryForSchedule, setIsEditingSchedule, setScheduleData]);

  const handleScheduleSubmit = useCallback(async () => {
    if (!scheduleData.date) { toast.error("Please select a date"); return; }
    if (!scheduleData.time) { toast.error("Please select a time"); return; }

    try {
      const userExtension = session?.user?.extension ?? "default";
      const scheduledDateTime = moment(`${scheduleData.date} ${scheduleData.time}`).toISOString();
      await scheduleCall(selectedEntryForSchedule.id, scheduledDateTime, userExtension, scheduleData.notes);
      const localWhen = moment(`${scheduleData.date} ${scheduleData.time}`).format(
        "MMM DD, YYYY HH:mm",
      );
      const noteSuffix = scheduleData.notes ? ` — Note: ${scheduleData.notes.slice(0, 200)}` : "";
      void createCrmAuditLog({
        record_type: "prospect",
        record_id: Number(selectedEntryForSchedule.id),
        event: isEditingSchedule ? "scheduled_call_updated" : "scheduled_call_created",
        action: isEditingSchedule ? "updated" : "scheduled",
        description: isEditingSchedule
          ? `Scheduled call updated to ${localWhen} by ${userExtension}.${noteSuffix}`
          : `Call scheduled for ${localWhen} by ${userExtension}.${noteSuffix}`,
      });
      setRefreshKey((prev) => prev + 1);
      handleScheduleModalClose();
      showSuccess(
        isEditingSchedule ? "Call Schedule Updated!" : "Schedule Call Successful!",
        isEditingSchedule ? "The call schedule has been successfully updated." : "The call has been successfully scheduled.",
      );
    } catch (error) {
      console.error(isEditingSchedule ? "Failed to update scheduled call:" : "Failed to schedule call:", error);
    }
  }, [scheduleData, selectedEntryForSchedule, handleScheduleModalClose, session, isEditingSchedule, setRefreshKey, showSuccess]);

  /**
   * Marks a previously-scheduled call with an outcome (e.g. completed, missed,
   * no-answer, rescheduled). This:
   *  1. Writes a `scheduled_call_status_changed` entry to the prospect's audit
   *     log so the outcome is visible in the record's history.
   *  2. Unschedules the call so it no longer appears in upcoming/overdue
   *     buckets (terminal outcomes only — `keepScheduled` skips this).
   */
  const handleScheduledCallStatusChange = useCallback(
    async (
      entry: any,
      status: string,
      options: { keepScheduled?: boolean; note?: string } = {},
    ) => {
      if (!entry?.id) return;
      const userExtension = session?.user?.extension ?? "default";
      const prevWhen = entry?.scheduled_call_at
        ? moment(entry.scheduled_call_at).format("MMM DD, YYYY HH:mm")
        : "scheduled time";
      const noteSuffix = options.note ? ` — Note: ${options.note.slice(0, 200)}` : "";
      try {
        await createCrmAuditLog({
          record_type: "prospect",
          record_id: Number(entry.id),
          event: "scheduled_call_status_changed",
          action: status,
          description: `Scheduled call (${prevWhen}) marked as "${status}" by ${userExtension}.${noteSuffix}`,
        });
        if (!options.keepScheduled && entry?.scheduled_call_at) {
          try {
            await unscheduleCall(entry.id, userExtension);
          } catch (err) {
            console.error("Failed to unschedule after status change:", err);
          }
        }
        setRefreshKey((prev) => prev + 1);
        toast.success(`Scheduled call marked as ${status}`);
      } catch (error) {
        console.error("Failed to update scheduled call status:", error);
        toast.error("Failed to update scheduled call status");
      }
    },
    [session, setRefreshKey],
  );

  const handleCallClick = useCallback(async (item: CrmDataItem) => {
    const phone = item.phone;
    if (!phone) { toast.error("No phone number available for this entry"); return; }
    if (!isInitialized) { toast.error("CTI not initialized. Please wait..."); return; }
    try {
      const result = await dialNumber(phone);
      if (result.success) {
        toast.success(`Calling ${item.name || phone}...`);
      } else {
        toast.error(result.error || "Failed to make call");
      }
    } catch (error) {
      console.error("Call error:", error);
      toast.error("Failed to make call");
    }
  }, [dialNumber, isInitialized]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) { toast.error("Please select items to delete"); return; }
    const idsToDelete = [...selectedItems];
    try {
      await bulkDeleteCrmData(idsToDelete);
      setShowDeleteModal(false);
      setDeleteModalMode(null);
      onAfterBulkDelete?.(idsToDelete);
      setRefreshKey((prev) => prev + 1);
      setSelectedItems([]);
      setClearSelectedRows(!clearSelectedRows);
    } catch (error: any) {
      console.error("Bulk delete error:", error);
    }
  }, [selectedItems, setShowDeleteModal, setDeleteModalMode, setRefreshKey, setSelectedItems, clearSelectedRows, setClearSelectedRows, onAfterBulkDelete]);

  const handleDeleteData = useCallback((item: CrmDataItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }, [setItemToDelete, setShowDeleteModal]);

  const openSidebar = useCallback((item: CrmDataItem) => {
    setSelectedDataItem(item);
    setSelectedRecord(item);
    setShowSidebar(true);

    const id = Number(item?.id);
    if (!Number.isFinite(id) || id <= 0) return;

    const token = ++sidebarFetchTokenRef.current;
    getAllCrmDataById(id)
      .then((full: any) => {
        if (sidebarFetchTokenRef.current !== token) return;
        const record = full?.data ?? null;
        if (!record) return;
        const hydrated = {
          ...record,
          audit_trail: full?.audit_trail ?? full?.audit_trails ?? undefined,
          leads: full?.leads ?? undefined,
          deals: full?.deals ?? undefined,
        };
        setSelectedRecord((prev: any) => {
          const prevId = Number(prev?.id);
          if (!Number.isFinite(prevId) || prevId !== id) return prev;
          return { ...prev, ...hydrated };
        });
      })
      .catch(() => {});
  }, [setSelectedDataItem, setSelectedRecord, setShowSidebar, sidebarFetchTokenRef]);

  const handleViewData = useCallback(
    (item: CrmDataItem) => openSidebar(item),
    [openSidebar],
  );

  const handlePlayCallRecording = useCallback((recording: any) => {
    setSelectedRecording?.(recording);
    setShowRecordingPlayerModal?.(true);
  }, [setSelectedRecording, setShowRecordingPlayerModal]);

  const handleDownloadCallRecording = useCallback(async (recording: any) => {
    if (!setDownloadingRecordings || !setDownloadProgress) return;
    await downloadCallRecordingWithProgress(recording, {
      setDownloadingRecordings,
      setDownloadProgress,
    });
  }, [setDownloadingRecordings, setDownloadProgress]);

  const handleItemSelection = useCallback((selected: CrmDataItem[]) => {
    setSelectedItems(selected.map((item) => item.id));
  }, [setSelectedItems]);

  return {
    showSuccessfulModal, setShowSuccessfulModal,
    successModalTitle, setSuccessModalTitle,
    successModalDescription, setSuccessModalDescription,
    handleDataAssignment,
    handleDataAssignmentSubmit,
    handleDataAssignmentModalClose,
    handleAfterCallModalClose,
    handleAfterCallSubmit,
    handleScheduleCall,
    handleUnscheduleCallClick,
    confirmUnscheduleCall,
    handleScheduleModalClose,
    handleScheduleSubmit,
    handleScheduledCallStatusChange,
    handleCallClick,
    handleBulkDelete,
    handleDeleteData,
    openSidebar,
    handleViewData,
    handlePlayCallRecording,
    handleDownloadCallRecording,
    handleItemSelection,
  };
}
