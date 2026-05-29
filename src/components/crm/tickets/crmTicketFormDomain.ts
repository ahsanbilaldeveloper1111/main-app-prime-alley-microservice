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
    if (row?.id == null) {
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
      label = String(row.id);
    }

    options.push({
      id: String(row.id),
      label,
      moduleId: row.module_id != null ? String(row.module_id) : undefined,
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
      if (row?.id == null) {
        return null;
      }
      const label =
        (typeof row.display_name === "string" && row.display_name) ||
        (typeof row.name === "string" && row.name) ||
        String(row.id);
      return { id: String(row.id), label };
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
  if (id == null || id === "") {
    return "";
  }
  return (
    options.find((option) => option.id === String(id))?.label ?? String(id)
  );
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
  const values = Array.isArray(raw)
    ? raw
    : raw != null && raw !== ""
      ? [raw]
      : [];
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
  const text = String(value).trim();
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

  const tags = Array.isArray(record.tags)
    ? record.tags
    : record.tags != null && record.tags !== ""
      ? [record.tags]
      : [];
  const source =
    tags.length > 0
      ? String(tags[0])
      : String(record.ticket_category ?? record.source ?? "");

  return {
    ticketName: String(record.title ?? ""),
    pipeline: String(
      module?.name ?? findPicklistOptionLabel(picklists.modules, record.module_id),
    ),
    submodule: String(
      submodule?.name ??
        findPicklistOptionLabel(picklists.submodules, record.submodule_id),
    ),
    ticketType: String(
      type?.name ?? findPicklistOptionLabel(picklists.types, record.ticket_type_id),
    ),
    ticketStatus: String(
      status?.name ??
        findPicklistOptionLabel(picklists.statuses, record.ticket_status_id),
    ),
    ticketDescription: String(record.description ?? ""),
    source,
    ticketOwner: findPicklistOptionLabel(picklists.owners, ownerId),
    priority,
    createDate: toDateInputValue(record.due_date ?? record.dueDate),
  };
}
