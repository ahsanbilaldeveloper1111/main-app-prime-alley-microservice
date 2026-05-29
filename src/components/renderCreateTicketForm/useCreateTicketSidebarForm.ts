import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  buildCreateModeDefaultFormPatch,
  fetchCreateTicketPicklists,
  getSubmoduleLabelForPipeline,
  hydrateTicketFormForEdit,
  persistTicketForm,
  resolveRequiredPicklistIds,
  type TicketPicklistBundle,
} from "@components/renderCreateTicketForm/createTicketSidebarDomain";
import {
  filterSubmodulesForModule,
  findPicklistOptionId,
  type TicketPicklistOption,
} from "@components/crm/tickets/crmTicketFormDomain";
import type { TicketFormData } from "@components/renderCreateTicketForm/createTicketFormTypes";

const initialTicketForm: TicketFormData = {
  ticketName: "",
  pipeline: "",
  submodule: "",
  ticketType: "",
  ticketStatus: "",
  ticketDescription: "",
  source: "",
  ticketOwner: "",
  priority: "Medium",
  createDate: "",
  contactAssociateRecord: "",
  contactAssociationLabel: "No label",
  addTimelineContact: false,
  companyAssociateRecord: "",
  companyAssociationLabel: "Primary",
  addTimelineCompany: false,
};

function applyPicklistBundle(
  picklists: TicketPicklistBundle,
  setters: {
    setModuleOptions: (options: TicketPicklistOption[]) => void;
    setSubmoduleOptions: (options: TicketPicklistOption[]) => void;
    setStatusOptions: (options: TicketPicklistOption[]) => void;
    setTypeOptions: (options: TicketPicklistOption[]) => void;
    setOwnerOptions: (options: TicketPicklistOption[]) => void;
  },
): void {
  setters.setModuleOptions(picklists.modules);
  setters.setSubmoduleOptions(picklists.submodules);
  setters.setStatusOptions(picklists.statuses);
  setters.setTypeOptions(picklists.types);
  setters.setOwnerOptions(picklists.owners);
}

export function useCreateTicketSidebarForm(options: {
  editTicketId: number | null;
  initialTicket?: unknown;
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const isEditMode = options.editTicketId != null;
  const editFormHydratedRef = useRef(false);
  const [ticketForm, setTicketForm] = useState<TicketFormData>(initialTicketForm);
  const [loading, setLoading] = useState(false);
  const [picklistsLoading, setPicklistsLoading] = useState(true);
  const [moduleOptions, setModuleOptions] = useState<TicketPicklistOption[]>([]);
  const [submoduleOptions, setSubmoduleOptions] = useState<TicketPicklistOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<TicketPicklistOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<TicketPicklistOption[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<TicketPicklistOption[]>([]);
  const [isContactsExpanded, setIsContactsExpanded] = useState(true);
  const [isCompaniesExpanded, setIsCompaniesExpanded] = useState(true);

  const pipelineLabels = useMemo(
    () => moduleOptions.map((option) => option.label),
    [moduleOptions],
  );
  const submoduleLabels = useMemo(() => {
    const moduleId = findPicklistOptionId(moduleOptions, ticketForm.pipeline);
    return filterSubmodulesForModule(submoduleOptions, moduleId ?? "").map(
      (option) => option.label,
    );
  }, [submoduleOptions, moduleOptions, ticketForm.pipeline]);
  const statusLabels = useMemo(
    () => statusOptions.map((option) => option.label),
    [statusOptions],
  );
  const typeLabels = useMemo(
    () => typeOptions.map((option) => option.label),
    [typeOptions],
  );
  const ownerLabels = useMemo(
    () => ownerOptions.map((option) => option.label),
    [ownerOptions],
  );

  const isFormValid =
    ticketForm.ticketName.trim().length >= 5 &&
    ticketForm.pipeline !== "" &&
    ticketForm.submodule !== "" &&
    ticketForm.ticketType !== "" &&
    ticketForm.ticketStatus !== "";

  const todayDate = useMemo(() => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    editFormHydratedRef.current = false;
  }, [options.editTicketId]);

  useEffect(() => {
    let cancelled = false;

    const loadPicklists = async () => {
      setPicklistsLoading(true);
      editFormHydratedRef.current = false;
      try {
        const picklists = await fetchCreateTicketPicklists();
        if (cancelled) {
          return;
        }

        applyPicklistBundle(picklists, {
          setModuleOptions,
          setSubmoduleOptions,
          setStatusOptions,
          setTypeOptions,
          setOwnerOptions,
        });

        if (isEditMode && options.editTicketId != null) {
          const hydrated = await hydrateTicketFormForEdit(
            options.editTicketId,
            options.initialTicket,
            picklists,
          );
          if (cancelled) {
            return;
          }
          if (!hydrated) {
            toast.error("Failed to load ticket details");
            return;
          }
          setTicketForm((prev) => ({ ...prev, ...hydrated }));
          editFormHydratedRef.current = true;
          return;
        }

        setTicketForm((prev) => ({
          ...prev,
          ...buildCreateModeDefaultFormPatch(prev, picklists),
        }));
      } catch (error) {
        console.error("Failed to load create ticket dropdown options:", error);
        toast.error("Failed to load ticket form options");
      } finally {
        if (!cancelled) {
          setPicklistsLoading(false);
        }
      }
    };

    loadPicklists().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [options.editTicketId, options.initialTicket, isEditMode]);

  useEffect(() => {
    if (picklistsLoading) {
      return;
    }
    if (isEditMode && !editFormHydratedRef.current) {
      return;
    }
    const nextSubmodule = getSubmoduleLabelForPipeline(
      ticketForm.pipeline,
      ticketForm.submodule,
      moduleOptions,
      submoduleOptions,
    );
    if (nextSubmodule === null) {
      return;
    }
    setTicketForm((prev) => ({ ...prev, submodule: nextSubmodule }));
  }, [
    picklistsLoading,
    isEditMode,
    ticketForm.pipeline,
    moduleOptions,
    submoduleOptions,
    ticketForm.submodule,
  ]);

  const handleCreateDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = e.target.value;
      const safeDate =
        selectedDate && selectedDate > todayDate ? todayDate : selectedDate;
      setTicketForm((prev) => ({ ...prev, createDate: safeDate }));
    },
    [todayDate],
  );

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || picklistsLoading) {
      return;
    }

    const ids = resolveRequiredPicklistIds(
      ticketForm,
      moduleOptions,
      submoduleOptions,
      statusOptions,
      typeOptions,
      ownerOptions,
    );
    if (!ids) {
      toast.error("Please complete all required ticket fields");
      return;
    }

    setLoading(true);
    try {
      const saved = await persistTicketForm({
        isEditMode,
        editTicketId: options.editTicketId,
        ticketForm,
        ids,
        createdBy: session?.user?.phone || session?.user?.email || "system",
      });
      if (saved) {
        options.onSuccess?.();
        options.onClose();
      }
    } catch (error) {
      console.error("Failed to save ticket:", error);
    } finally {
      setLoading(false);
    }
  }, [
    isFormValid,
    picklistsLoading,
    ticketForm,
    moduleOptions,
    submoduleOptions,
    statusOptions,
    typeOptions,
    ownerOptions,
    isEditMode,
    options,
    session?.user?.email,
    session?.user?.phone,
  ]);

  const setField =
    <K extends keyof TicketFormData>(key: K) =>
    (val: TicketFormData[K]) =>
      setTicketForm((prev) => ({ ...prev, [key]: val }));

  const setFieldFromEvent =
    (key: keyof TicketFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setTicketForm((prev) => ({ ...prev, [key]: e.target.value }));

  return {
    ticketForm,
    loading,
    picklistsLoading,
    isEditMode,
    isFormValid,
    pipelineLabels,
    submoduleLabels,
    statusLabels,
    typeLabels,
    ownerLabels,
    isContactsExpanded,
    setIsContactsExpanded,
    isCompaniesExpanded,
    setIsCompaniesExpanded,
    handleCreateDateChange,
    handleSubmit,
    setField,
    setFieldFromEvent,
    setTicketForm,
    todayDate,
  };
}
