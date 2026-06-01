import {
  coerceDisplayText,
  coerceOptionalPicklistId,
  coercePicklistId,
  normalizeUnknownToArray,
  readNestedEntityName,
  readTrimmedString,
} from "@components/crm/tickets/crmTicketCoercion";
import { resolveTicketExtensionLabel } from "@components/crm/tickets/crmTicketExtensionLabel";

export type TicketPicklistOption = {
  id: string;
  label: string;
  moduleId?: string;
};

const PRIORITY_LABEL_TO_API: Record<string, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Urgent: 3,
};

const PRIORITY_API_TO_LABEL: Record<number, string> = {
  0: "Low",
  1: "Medium",
  2: "High",
  3: "Urgent",
};

function readRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export function mapApiRecordsToPicklistOptions(
  records: unknown[],
  labelKeys: string[] = ["name"],
): TicketPicklistOption[] {
  const options: TicketPicklistOption[] = [];

  for (const record of records) {
    const row = readRecord(record);
    if (!row) {
      continue;
    }
    const id = coercePicklistId(row.id);
    if (!id) {
      continue;
    }

    let label = "";
    for (const key of labelKeys) {
      const value = row[key];
      if (typeof value === "string" && value.trim()) {
        label = value.trim();
        break;
      }
    }
    if (!label) {
      label = id;
    }

    options.push({
      id,
      label,
      moduleId: coerceOptionalPicklistId(row.module_id),
    });
  }

  return options;
}

export function mapExtensionsToOwnerOptions(
  extensions: unknown[],
): TicketPicklistOption[] {
  return extensions
    .map((extension) => {
      const row = readRecord(extension);
      if (!row) {
        return null;
      }
      const id = coercePicklistId(row.id);
      if (!id) {
        return null;
      }
      const label = resolveTicketExtensionLabel(row);
      return { id, label };
    })
    .filter((option): option is TicketPicklistOption => option != null);
}

export function findPicklistOptionId(
  options: TicketPicklistOption[],
  label: string,
): string | undefined {
  return options.find((option) => option.label === label)?.id;
}

export function findPicklistOptionLabel(
  options: TicketPicklistOption[],
  id: unknown,
): string {
  const idText = coercePicklistId(id);
  if (!idText) {
    return "";
  }
  return options.find((option) => option.id === idText)?.label ?? idText;
}

export function filterSubmodulesForModule(
  submodules: TicketPicklistOption[],
  moduleId: string,
): TicketPicklistOption[] {
  if (!moduleId) {
    return submodules;
  }
  return submodules.filter(
    (submodule) => submodule.moduleId == null || submodule.moduleId === moduleId,
  );
}

export type CrmTicketFormValues = {
  ticketName: string;
  pipeline: string;
  submodule: string;
  ticketType: string;
  ticketStatus: string;
  ticketDescription: string;
  source: string;
  ticketOwner: string;
  priority: string;
  createDate: string;
};

export function buildTicketFormData(params: {
  values: CrmTicketFormValues;
  moduleId: string;
  submoduleId: string;
  typeId: string;
  statusId: string;
  ownerExtensionId?: string;
  createdBy: string;
}): FormData {
  const formData = new FormData();
  const description =
    params.values.ticketDescription.trim() ||
    params.values.ticketName.trim() ||
    "Ticket created from CRM";

  formData.append("title", params.values.ticketName.trim());
  formData.append("description", description);
  formData.append("ticket_type_id", params.typeId);
  formData.append("ticket_status_id", params.statusId);
  formData.append("module_id", params.moduleId);
  formData.append("submodule_id", params.submoduleId);
  formData.append(
    "priority",
    String(PRIORITY_LABEL_TO_API[params.values.priority] ?? 0),
  );
  formData.append("created_by", params.createdBy);

  if (params.ownerExtensionId) {
    formData.append("user_extension[]", params.ownerExtensionId);
  }
  if (params.values.createDate) {
    formData.append("due_date", params.values.createDate);
  }
  if (params.values.source.trim()) {
    formData.append("tags[]", params.values.source.trim());
  }

  return formData;
}

function readFirstUserExtensionId(raw: unknown): unknown {
  const values = normalizeUnknownToArray(raw);
  const first = values[0];
  if (first != null && typeof first === "object") {
    return readRecord(first)?.id ?? first;
  }
  return first;
}

function toDateInputValue(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }
  const text = coerceDisplayText(value).trim();
  const datePart = text.split("T")[0].split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) {
    return "";
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function resolveTicketSource(
  tags: unknown[],
  record: Record<string, unknown>,
): string {
  if (tags.length > 0) {
    return coerceDisplayText(tags[0]);
  }
  const category = coerceDisplayText(record.ticket_category);
  if (category) {
    return category;
  }
  return coerceDisplayText(record.source);
}

export function mapApiTicketToFormValues(
  ticket: unknown,
  picklists: {
    modules: TicketPicklistOption[];
    submodules: TicketPicklistOption[];
    types: TicketPicklistOption[];
    statuses: TicketPicklistOption[];
    owners: TicketPicklistOption[];
  },
): CrmTicketFormValues {
  const record = readRecord(ticket) ?? {};
  const status = readRecord(record.status);
  const module = readRecord(record.module);
  const submodule = readRecord(record.submodule);
  const type = readRecord(record.type);

  const ownerId = readFirstUserExtensionId(record.user_extension);

  const priorityNum = Number(record.priority);
  const priority =
    PRIORITY_API_TO_LABEL[priorityNum] ??
    (priorityNum >= 2 ? "High" : "Low");

  const tags = normalizeUnknownToArray(record.tags);
  const source = resolveTicketSource(tags, record);

  return {
    ticketName: readTrimmedString(record.title),
    pipeline:
      readNestedEntityName(module) ||
      findPicklistOptionLabel(picklists.modules, record.module_id),
    submodule:
      readNestedEntityName(submodule) ||
      findPicklistOptionLabel(picklists.submodules, record.submodule_id),
    ticketType:
      readNestedEntityName(type) ||
      findPicklistOptionLabel(picklists.types, record.ticket_type_id),
    ticketStatus:
      readNestedEntityName(status) ||
      findPicklistOptionLabel(picklists.statuses, record.ticket_status_id),
    ticketDescription: readTrimmedString(record.description),
    source,
    ticketOwner: findPicklistOptionLabel(picklists.owners, ownerId),
    priority,
    createDate: toDateInputValue(record.due_date ?? record.dueDate),
  };
}
