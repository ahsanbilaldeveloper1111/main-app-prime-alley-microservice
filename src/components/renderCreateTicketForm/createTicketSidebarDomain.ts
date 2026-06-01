import { ModuleSlug } from "@utils/Helper";
import { GetHierarchyData } from "@utils/users";
import { GetAllModules, GetAllSubmodules } from "@utils/ticket-module";
import { GetAllStatuses } from "@utils/ticket-statuses";
import { GetAllTypes } from "@utils/ticket-types";
import { CreateTicket, GetTicket, UpdateTicketFromFormData } from "@utils/tickets";
import {
  buildTicketFormData,
  filterSubmodulesForModule,
  findPicklistOptionId,
  mapApiRecordsToPicklistOptions,
  mapApiTicketToFormValues,
  mapExtensionsToOwnerOptions,
  type TicketPicklistOption,
} from "@components/crm/tickets/crmTicketFormDomain";
import type { TicketFormData } from "@components/renderCreateTicketForm/createTicketFormTypes";

export type TicketPicklistBundle = {
  modules: TicketPicklistOption[];
  submodules: TicketPicklistOption[];
  statuses: TicketPicklistOption[];
  types: TicketPicklistOption[];
  owners: TicketPicklistOption[];
};

export type ResolvedTicketPicklistIds = {
  moduleId: string;
  submoduleId: string;
  statusId: string;
  typeId: string;
  ownerExtensionId?: string;
};

export async function fetchCreateTicketPicklists(): Promise<TicketPicklistBundle> {
  const [modules, submodules, statuses, types, hierarchyData] = await Promise.all([
    GetAllModules(),
    GetAllSubmodules(),
    GetAllStatuses(),
    GetAllTypes(),
    GetHierarchyData(ModuleSlug.TICKET),
  ]);

  return {
    modules: mapApiRecordsToPicklistOptions(Array.isArray(modules) ? modules : []),
    submodules: mapApiRecordsToPicklistOptions(
      Array.isArray(submodules) ? submodules : [],
    ),
    statuses: mapApiRecordsToPicklistOptions(Array.isArray(statuses) ? statuses : []),
    types: mapApiRecordsToPicklistOptions(Array.isArray(types) ? types : []),
    owners: mapExtensionsToOwnerOptions(
      Array.isArray(hierarchyData?.extensions) ? hierarchyData.extensions : [],
    ),
  };
}

export async function hydrateTicketFormForEdit(
  editTicketId: number,
  initialTicket: unknown,
  picklists: TicketPicklistBundle,
): Promise<Partial<TicketFormData> | null> {
  const fetchedTicket = await GetTicket(String(editTicketId));
  const ticket = fetchedTicket ?? initialTicket;
  if (!ticket) {
    return null;
  }
  return mapApiTicketToFormValues(ticket, {
    modules: picklists.modules,
    submodules: picklists.submodules,
    types: picklists.types,
    statuses: picklists.statuses,
    owners: picklists.owners,
  });
}

export function buildCreateModeDefaultFormPatch(
  prev: TicketFormData,
  picklists: TicketPicklistBundle,
): Partial<TicketFormData> {
  const firstModuleId = picklists.modules[0]?.id ?? "";
  return {
    pipeline: picklists.modules[0]?.label ?? "",
    submodule:
      filterSubmodulesForModule(picklists.submodules, firstModuleId)[0]?.label ?? "",
    ticketType: picklists.types[0]?.label ?? "",
    ticketStatus: picklists.statuses[0]?.label ?? "",
    ticketOwner: picklists.owners[0]?.label ?? "",
    priority: prev.priority || "Medium",
  };
}

export function getSubmoduleLabelForPipeline(
  pipeline: string,
  currentSubmodule: string,
  moduleOptions: TicketPicklistOption[],
  submoduleOptions: TicketPicklistOption[],
): string | null {
  const moduleId = findPicklistOptionId(moduleOptions, pipeline);
  const availableSubmodules = filterSubmodulesForModule(
    submoduleOptions,
    moduleId ?? "",
  );
  const keepsCurrentSubmodule =
    currentSubmodule.length > 0 &&
    availableSubmodules.some((option) => option.label === currentSubmodule);
  if (keepsCurrentSubmodule) {
    return null;
  }
  return availableSubmodules[0]?.label ?? "";
}

export function resolveRequiredPicklistIds(
  ticketForm: TicketFormData,
  moduleOptions: TicketPicklistOption[],
  submoduleOptions: TicketPicklistOption[],
  statusOptions: TicketPicklistOption[],
  typeOptions: TicketPicklistOption[],
  ownerOptions: TicketPicklistOption[],
): ResolvedTicketPicklistIds | null {
  const moduleId = findPicklistOptionId(moduleOptions, ticketForm.pipeline);
  const submoduleId = findPicklistOptionId(submoduleOptions, ticketForm.submodule);
  const statusId = findPicklistOptionId(statusOptions, ticketForm.ticketStatus);
  const typeId = findPicklistOptionId(typeOptions, ticketForm.ticketType);
  const ownerExtensionId = findPicklistOptionId(ownerOptions, ticketForm.ticketOwner);

  if (!moduleId || !submoduleId || !statusId || !typeId) {
    return null;
  }

  return { moduleId, submoduleId, statusId, typeId, ownerExtensionId };
}

export async function persistTicketForm(params: {
  isEditMode: boolean;
  editTicketId: number | null;
  ticketForm: TicketFormData;
  ids: ResolvedTicketPicklistIds;
  createdBy: string;
}): Promise<boolean> {
  const formData = buildTicketFormData({
    values: params.ticketForm,
    moduleId: params.ids.moduleId,
    submoduleId: params.ids.submoduleId,
    statusId: params.ids.statusId,
    typeId: params.ids.typeId,
    ownerExtensionId: params.ids.ownerExtensionId,
    createdBy: params.createdBy,
  });

  if (params.isEditMode && params.editTicketId != null) {
    formData.append("id", String(params.editTicketId));
    return Boolean(await UpdateTicketFromFormData(formData));
  }

  return Boolean(await CreateTicket(formData));
}

export function resolveSubmitButtonLabel(loading: boolean, isEditMode: boolean): string {
  if (loading && isEditMode) {
    return "Saving...";
  }
  if (loading) {
    return "Creating...";
  }
  if (isEditMode) {
    return "Save changes";
  }
  return "Create";
}

export function isPrimarySubmitEnabled(
  isFormValid: boolean,
  loading: boolean,
  picklistsLoading: boolean,
): boolean {
  return isFormValid && !loading && !picklistsLoading;
}

export function isSecondaryCreateActionEnabled(
  isFormValid: boolean,
  loading: boolean,
  picklistsLoading: boolean,
): boolean {
  return isFormValid && !loading && !picklistsLoading;
}
