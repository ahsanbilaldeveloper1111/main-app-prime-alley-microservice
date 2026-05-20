import type { CrmExtensionLookup } from "@crm/shared/crmListExtensionDisplayName";
import { getCrmExtensionDisplayNameForUserExtension } from "@crm/shared/crmListExtensionDisplayName";
import type { CrmCreatedCountsBundle, CrmCreatedCountRow, CrmListCounts } from "./mainDashboard";

export interface ActivityCategoryRow {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

const CRM_ACTIVITY_CATEGORY_DEFS = [
  { key: "leads", name: "Leads", color: "#F4A57A" },
  { key: "deals", name: "Deals", color: "#90CAF9" },
  { key: "orders", name: "Orders", color: "#A5D6A7" },
  { key: "companies", name: "Companies", color: "#4ECDC4" },
  { key: "meetings", name: "Meetings", color: "#F4D47A" },
] as const satisfies ReadonlyArray<{
  key: keyof CrmListCounts;
  name: string;
  color: string;
}>;

export const CRM_ACTIVITY_LEGEND_ITEMS = CRM_ACTIVITY_CATEGORY_DEFS.map(({ name, color }) => ({
  label: name,
  color,
}));

export interface TopActivitiesLeaderboardRow {
  name: string;
  userExtension: string;
  prospects: number;
  leads: number;
  deals: number;
}

function countRowsByExtension(rows: readonly CrmCreatedCountRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.user_extension, row.count);
  }
  return map;
}

export function buildTopActivitiesLeaderboardRows(
  bundle: CrmCreatedCountsBundle | null | undefined,
  extensions: readonly CrmExtensionLookup[],
  scale = 1,
): TopActivitiesLeaderboardRow[] {
  if (!bundle) return [];

  const prospectsByExtension = countRowsByExtension(bundle.prospects);
  const leadsByExtension = countRowsByExtension(bundle.leads);
  const dealsByExtension = countRowsByExtension(bundle.deals);

  const extensionKeys = new Set<string>([
    ...prospectsByExtension.keys(),
    ...leadsByExtension.keys(),
    ...dealsByExtension.keys(),
  ]);

  const rows = Array.from(extensionKeys, (userExtension) => {
    const prospects = scaleNumber(prospectsByExtension.get(userExtension) ?? 0, scale);
    const leads = scaleNumber(leadsByExtension.get(userExtension) ?? 0, scale);
    const deals = scaleNumber(dealsByExtension.get(userExtension) ?? 0, scale);
    return {
      userExtension,
      name: getCrmExtensionDisplayNameForUserExtension(extensions, userExtension),
      prospects,
      leads,
      deals,
    };
  });

  return rows.sort(
    (a, b) => b.prospects + b.leads + b.deals - (a.prospects + a.leads + a.deals),
  );
}

function scaleNumber(value: number, scale: number) {
  return Math.round(value * scale);
}

export function buildCrmActivityCategoryRows(
  counts: CrmListCounts | null | undefined,
  scale = 1,
): ActivityCategoryRow[] {
  const rows = CRM_ACTIVITY_CATEGORY_DEFS.map(({ key, name, color }) => ({
    name,
    color,
    count: Math.round((counts?.[key] ?? 0) * scale),
  }));

  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;

  return rows.map((row) => ({
    ...row,
    percentage: (row.count / total) * 100,
  }));
}
