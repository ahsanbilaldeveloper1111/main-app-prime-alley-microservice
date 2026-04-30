import type { KanbanColumnDef, KanbanCardData } from "@components/KanbanBoard";
import { CRM_BASE_FILTER_RULES } from "@crm/shared/crmListFilterHelpers";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { isValidEmail } from "@utils/Helper";

export interface LeadData {
  id: any;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  stage: string;
  stageColor: string;
  leadPotential: string;
  lead_score: number;
  assignedUser: string;
  created: string;
  lastActivity: string;
  followUps: any[];
  meetings: any[];
  source: string;
  campaign: string;
  isLost: boolean;
  lostReasonName?: string;
  rawData: any;
  [key: string]: any;
}

export const ignoredKeys = ["stage_id", "contact_persons"];
export const DEFAULT_FOLLOWUP_FORM = {
  leadId: null as number | null,
  leadName: "",
  followUpDate: "",
  followUpStatus: "Pending",
  communicationChannel: "Phone Call",
  communicationChannelOther: "",
  notes: "",
  userExtension: "",
};
export const DEFAULT_MEETING_FORM = {
  leadId: null as number | null,
  leadName: "",
  meetingName: "",
  meetingType: "Online",
  meetingDate: "",
  meetingTime: "",
  meetingOutcome: "",
  extensions: [] as string[],
};

export const LEADS_FILTER_RULES = [
  ...CRM_BASE_FILTER_RULES,
  { key: "business_type_id", kind: "string" },
  { key: "source", kind: "truthy" },
  { key: "lead_potential", kind: "truthy" },
  { key: "campaign_id", kind: "string" },
  { key: "lost_reason_id", kind: "string" },
  { key: "lead_score_min", kind: "string" },
  { key: "lead_score_max", kind: "string" },
  { key: "date_from", kind: "truthy" },
  { key: "date_to", kind: "truthy" },
  // Widget / quick-filter keys (GET /crm/leads supports these for tile drill-downs)
  { key: "follow_up_date_from", kind: "truthy" },
  { key: "follow_up_date_to", kind: "truthy" },
  { key: "meeting_date_from", kind: "truthy" },
  { key: "meeting_date_to", kind: "truthy" },
  { key: "overdue", kind: "truthy", trueValue: true },
  { key: "high_priority", kind: "truthy", trueValue: true },
  { key: "include_converted", kind: "truthy", trueValue: true },
] as const;

export const LEADS_EXPORT_TRUTHY_KEYS = [
  "date_from",
  "date_to",
  "stage_id",
  "lead_potential",
  "search",
  "campaign_id",
  "source",
  "follow_up_date_from",
  "follow_up_date_to",
  "meeting_date_from",
  "meeting_date_to",
  "overdue",
  "high_priority",
  "include_converted",
] as const;

export const LEADS_EXPORT_DEFINED_KEYS = ["include_lost", "include_archived"] as const;

export const LEADS_EXPORT_PRESENT_KEYS = ["lead_score_min", "lead_score_max"] as const;

export function addTruthyExportFilters(
  params: Record<string, any>,
  filters: Record<string, any>,
  keys: readonly string[],
) {
  keys.forEach((key) => {
    if (filters[key]) {
      params[key] = filters[key];
    }
  });
}

export function addDefinedExportFilters(
  params: Record<string, any>,
  filters: Record<string, any>,
  keys: readonly string[],
) {
  keys.forEach((key) => {
    if (filters[key] !== undefined) {
      params[key] = filters[key];
    }
  });
}

export function addPresentExportFilters(
  params: Record<string, any>,
  filters: Record<string, any>,
  keys: readonly string[],
) {
  keys.forEach((key) => {
    if (filters[key] != null) {
      params[key] = filters[key];
    }
  });
}

const LEADS_EXPORT_OMIT_TOP_LEVEL_KEYS = new Set([
  "campaign",
  "stage",
  "contact_persons",
]);

function serializeLeadsExportCsvCell(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "object") return "";
  if (typeof val === "function") return "";
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean" ||
    typeof val === "bigint" ||
    typeof val === "symbol"
  ) {
    const s = String(val).replaceAll('"', '""');
    return s.includes(",") || s.includes('"') ? `"${s}"` : s;
  }
  return "";
}

/** Flat row CSV text for leads list API rows (primitive columns only). */
export function buildLeadsListExportCsvText(allData: unknown[]): string {
  const headers = Array.from(
    new Set(
      allData.flatMap((row) =>
        typeof row === "object" && row !== null
          ? Object.keys(row).filter(
              (k) =>
                !LEADS_EXPORT_OMIT_TOP_LEVEL_KEYS.has(k) &&
                typeof (row as Record<string, unknown>)[k] !== "object",
            )
          : [],
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const headerRow = headers.join(",");
  const dataRows = allData.map((row) =>
    headers
      .map((h) =>
        serializeLeadsExportCsvCell(
          typeof row === "object" && row !== null
            ? (row as Record<string, unknown>)[h]
            : undefined,
        ),
      )
      .join(","),
  );
  return [headerRow, ...dataRows].join("\n");
}

export type ContactPersonFieldsForValidation = {
  title?: string;
  name?: string;
  phone?: string;
  email?: string;
};

/** First validation error message, or null if all contacts are valid. */
export function getContactPersonsValidationError(
  persons: ReadonlyArray<ContactPersonFieldsForValidation>,
): string | null {
  for (let i = 0; i < persons.length; i++) {
    const person = persons[i];
    if (!person?.title?.trim()) {
      return `Contact person ${i + 1}: Title is required`;
    }
    if (!person?.name?.trim()) {
      return `Contact person ${i + 1}: Name is required`;
    }
    if (!person?.phone?.trim()) {
      return `Contact person ${i + 1}: Phone is required`;
    }
    if (!person?.email?.trim()) {
      return `Contact person ${i + 1}: Email is required`;
    }
    if (!isValidEmail(person.email)) {
      return `Contact person ${i + 1}: Invalid email format`;
    }
  }
  return null;
}

export function leadsToKanbanColumns(
  leads: LeadData[],
  stages: Array<{ id: number | string; name: string }>,
): KanbanColumnDef[] {
  const buckets: Record<string, KanbanCardData[]> = {};

  stages.forEach((stage) => {
    buckets[String(stage.id)] = [];
  });

  for (const lead of leads) {
    const stageId = String(lead.rawData?.stage_id ?? lead.stage ?? "");
    const bucketKey = buckets[stageId] ? stageId : String(stages[0]?.id ?? "");

    buckets[bucketKey].push({
      id: lead.rawData?.id ?? lead.id,
      name: lead.name || "--",
      email: lead.email,
      avatarInitials: lead.email ? getInitials(lead.name || "") : undefined,
      avatarColor: lead.email ? getRandomColor(lead.name || "") : undefined,
      metaLines: [
        lead.company || "",
        lead.leadPotential ? `Potential: ${lead.leadPotential}` : "",
        lead.assignedUser ? `Owner: ${lead.assignedUser}` : "",
      ].filter(Boolean),
      raw: lead,
    });
  }

  return stages.map((stage) => ({
    id: String(stage.id),
    title: stage.name,
    cards: buckets[String(stage.id)] ?? [],
  }));
}
