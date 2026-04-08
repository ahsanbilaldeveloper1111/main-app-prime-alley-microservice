import type { KanbanColumnDef, KanbanCardData } from "@components/KanbanBoard";
import { CRM_BASE_FILTER_RULES } from "@crm/shared/crmListFilterHelpers";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";

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
] as const;

export const LEADS_EXPORT_TRUTHY_KEYS = [
  "date_from",
  "date_to",
  "stage_id",
  "lead_potential",
  "search",
  "campaign_id",
  "source",
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
