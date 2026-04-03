import { getCampaigns } from "@utils/crm";
import { ModuleSlug } from "@utils/Helper";

/** Tab filter slugs for CRM / billing quotes list pages (URL `tab` query). */
export const crmQuotesListValidTabFilterIds = [
  "all",
  "expiring_soon",
  "pending_acceptance",
  "pending_approval",
] as const;

/** Default visible columns for the quotes generic table. */
export const crmQuotesListDefaultTableColumnIds = [
  "title",
  "status",
  "amount",
  "view_count",
  "signing_status",
  "user_extension",
  "created_at",
] as const;

const crmCampaignFetchBatchSize = 50;

export type HistoryActivityWithOptionalCampaignIds = {
  details?: { campaign_ids?: number[] };
};

/** True when history row metadata includes at least one campaign id. */
export function historyActivityIncludesCampaignIds(
  activity: HistoryActivityWithOptionalCampaignIds,
): boolean {
  const ids = activity.details?.campaign_ids;
  return Array.isArray(ids) && ids.length > 0;
}

/** Collects unique campaign ids referenced across CRM history activities. */
export function collectUniqueCampaignIdsFromHistoryActivities(
  activities: readonly HistoryActivityWithOptionalCampaignIds[],
): number[] {
  const ids: number[] = [];
  for (const activity of activities) {
    if (!historyActivityIncludesCampaignIds(activity)) continue;
    ids.push(...(activity.details?.campaign_ids ?? []));
  }
  return Array.from(new Set(ids));
}

export type CrmQuotesSidebarProspectLike = {
  id?: number;
  name?: string;
  phone?: string;
  email?: string;
  data?: {
    id?: number;
    email?: string;
    data?: { email?: string };
  };
};

export function selectCrmQuotesSidebarRecordId(
  prospect: CrmQuotesSidebarProspectLike | null | undefined,
): number {
  if (prospect == null) return 0;
  return Number(prospect.id ?? prospect.data?.id ?? 0);
}

export function selectCrmQuotesSidebarRecordName(
  prospect: CrmQuotesSidebarProspectLike | null | undefined,
): string {
  return prospect?.name ?? "Prospect";
}

export function selectCrmQuotesSidebarRecordPhone(
  prospect: CrmQuotesSidebarProspectLike | null | undefined,
): string {
  return prospect?.phone ?? "";
}

export function selectCrmQuotesSidebarRecordEmail(
  prospect: CrmQuotesSidebarProspectLike | null | undefined,
): string {
  if (prospect == null) return "";
  return (
    prospect.data?.email ??
    prospect.data?.data?.email ??
    prospect.email ??
    ""
  );
}

/** Resolves campaign display names for ids (batched API calls). */
export async function fetchCrmCampaignIdToNameMap(
  campaignIds: readonly number[],
): Promise<Record<number, string>> {
  const campaignsMap: Record<number, string> = {};
  try {
    for (let i = 0; i < campaignIds.length; i += crmCampaignFetchBatchSize) {
      const batch = campaignIds.slice(i, i + crmCampaignFetchBatchSize);
      const campaignsResponse = await getCampaigns({
        per_page: 1000,
        filters: { ids: [...batch] },
        module_slug: ModuleSlug.CRM_CAMPAIGNS,
      });
      for (const campaign of campaignsResponse.data) {
        campaignsMap[campaign.id] = campaign.name;
      }
    }
    return campaignsMap;
  } catch (error) {
    console.error("Failed to fetch campaigns by IDs:", error);
    return {};
  }
}
