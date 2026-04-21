import { useRef, useState } from "react";
import { createEmptyCrmListContactFormState } from "@utils/crmContactFormFromCrmItem";

/**
 * Shared assignment / modals / sidebar / contact-form state for CRM list pages
 * (quotes, contacts, prospects, billing quotes). Single implementation for CPD/Sonar.
 */
export function useCrmListAssignmentContactSidebarState() {
  const [assignmentFilters, setAssignmentFilters] = useState({
    selectedTags: [] as readonly any[],
    selectedCampaigns: [] as readonly any[],
  });
  const [assignmentCampaign, setAssignmentCampaign] = useState<readonly any[]>(
    [],
  );
  const [assignmentDistribution, setAssignmentDistribution] = useState<
    "equal" | "custom"
  >("equal");
  const [totalEntriesToAssign, setTotalEntriesToAssign] = useState(0);
  const [customDistribution, setCustomDistribution] = useState<
    Record<string, number>
  >({});
  const [assignmentCounts, setAssignmentCounts] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
  });
  const [availableTags, setAvailableTags] = useState<
    Array<{ value: string; label: string; id: number }>
  >([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<
    Array<{ value: string; label: string; id: number }>
  >([]);
  const [campaignsById, setCampaignsById] = useState<Record<number, string>>(
    {},
  );
  const [campaignStatusById, setCampaignStatusById] = useState<
    Record<number, string>
  >({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const assignmentEntries = {
    assignmentFilters, setAssignmentFilters, assignmentCampaign, setAssignmentCampaign,
    assignmentDistribution, setAssignmentDistribution, totalEntriesToAssign, setTotalEntriesToAssign,
    customDistribution, setCustomDistribution, assignmentCounts, setAssignmentCounts,
    availableTags, setAvailableTags, availableCampaigns, setAvailableCampaigns,
    campaignsById, setCampaignsById,
    campaignStatusById, setCampaignStatusById,
    selectedItems, setSelectedItems,
  };

  const [afterCallData, setAfterCallData] = useState({
    disposition: "",
    callStatus: "",
    comment: "",
    nextCallDate: "",
    nextCallTime: "",
    generateLead: "no",
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEntryForSchedule, setSelectedEntryForSchedule] =
    useState<any>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    notes: "",
  });
  const [showUnscheduleModal, setShowUnscheduleModal] = useState(false);
  const [entryToUnschedule, setEntryToUnschedule] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const callScheduleEntries = {
    afterCallData, setAfterCallData, showScheduleModal, setShowScheduleModal,
    selectedEntryForSchedule, setSelectedEntryForSchedule,
    isEditingSchedule, setIsEditingSchedule, scheduleData, setScheduleData,
    showUnscheduleModal, setShowUnscheduleModal,
    entryToUnschedule, setEntryToUnschedule, showHistoryModal, setShowHistoryModal,
  };

  const [showProspectSidebar, setShowProspectSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const sidebarProspectFetchTokenRef = useRef(0);
  const [showFilterBar, setShowFilterBar] = useState(false);

  const [showAddContactsDropdown, setShowAddContactsDropdown] =
    useState(false);
  const [showCreateContactSidebar, setShowCreateContactSidebar] =
    useState(false);
  const addContactsRef = useRef<HTMLDivElement>(null);
  const [contactForm, setContactForm] = useState(() =>
    createEmptyCrmListContactFormState("source_file"),
  );
  const [createContactLoading, setCreateContactLoading] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [contactFormLoadError, setContactFormLoadError] = useState<
    string | null
  >(null);
  const [contactFormLoading, setContactFormLoading] = useState(false);

  const sidebarContactEntries = {
    showProspectSidebar, setShowProspectSidebar,
    showFiltersSidebar, setShowFiltersSidebar,
    selectedProspect, setSelectedProspect, sidebarProspectFetchTokenRef,
    showFilterBar, setShowFilterBar,
    showAddContactsDropdown, setShowAddContactsDropdown,
    showCreateContactSidebar, setShowCreateContactSidebar, addContactsRef,
    contactForm, setContactForm, createContactLoading, setCreateContactLoading,
    editingContactId, setEditingContactId,
    contactFormLoadError, setContactFormLoadError,
    contactFormLoading, setContactFormLoading,
  };

  return { ...assignmentEntries, ...callScheduleEntries, ...sidebarContactEntries };
}
