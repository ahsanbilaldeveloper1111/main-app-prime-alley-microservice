import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import type { UserRequestCategory } from "@utils/staffManagement";
import { getWorkforceTableDatePresetRange } from "@utils/workforceTableDatePresetRange";

export const TAB_TO_STATUS: Record<string, string> = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
};

export type ApprovalRequestsTab = "All" | "Pending" | "Approved" | "Rejected";

export type ApprovalRequestsListFilters = Readonly<{
  activeTab: ApprovalRequestsTab;
  searchTerm: string;
  selectedType: string;
  selectedRequestedByUserId: string | null;
  selectedDate: string;
}>;

export function approvalCategoriesIdSignature(categories: readonly UserRequestCategory[]): string {
  return [...categories.map((c) => c.id)].sort((a, b) => a - b).join(",");
}

export function serializeApprovalRequestsListFiltersKey(
  filters: ApprovalRequestsListFilters,
  categories: readonly UserRequestCategory[],
): string {
  const sig = approvalCategoriesIdSignature(categories);
  const tab = filters.activeTab;
  const search = filters.searchTerm.trim();
  const type = filters.selectedType;
  const user = filters.selectedRequestedByUserId ?? "";
  const date = filters.selectedDate ?? "";
  return `${sig}::${tab}::${search}::${type}::${user}::${date}`;
}

export function buildUserRequestsListApiParams(args: Readonly<{
  page: number;
  limit: number;
  filters: ApprovalRequestsListFilters;
  categories: readonly UserRequestCategory[];
}>): Record<string, unknown> {
  const status = TAB_TO_STATUS[args.filters.activeTab] ?? "";
  const params: Record<string, unknown> = {
    page: args.page,
    limit: args.limit,
    status,
  };
  const trimmedSearch = args.filters.searchTerm?.trim();
  if (trimmedSearch) params.search = trimmedSearch;
  const category = args.filters.selectedType
    ? args.categories.find((c) => (c.name ?? c.code ?? String(c.id)) === args.filters.selectedType)
    : undefined;
  if (category?.id != null) params.user_request_category_id = category.id;
  const requestedByTrimmed = args.filters.selectedRequestedByUserId?.trim();
  if (requestedByTrimmed) params.user_ids = [requestedByTrimmed];
  const dateRange = getWorkforceTableDatePresetRange(args.filters.selectedDate ?? "");
  if (dateRange) {
    params.created_at_from = dateRange.from;
    params.created_at_to = dateRange.to;
  }
  return params;
}

export function consumeHandledApprovalRequestsError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "ApprovalRequests" });
}

export function formatRequestDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

export function getAgingLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (days < 1) return "Less than 1 day";
    if (days <= 3) return "1-3 days";
    if (days <= 7) return "3-7 days";
    return "7d+";
  } catch {
    return "—";
  }
}

export function parseOpenIdFromQuery(openId: string | string[] | undefined): string | undefined {
  if (typeof openId === "string") return openId;
  if (Array.isArray(openId)) return openId[0];
  return undefined;
}

export function requestStatusBadgeVariant(status: string | null | undefined): "success" | "danger" | "info" {
  const s = status?.toLowerCase();
  if (s === "approved") return "success";
  if (s === "rejected") return "danger";
  return "info";
}

export function resolveUserRequestParentCategoryId(category: UserRequestCategory | undefined): number | null {
  if (!category) return null;
  const raw = category.parent_id;
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isNaN(n) ? null : n;
}

/** API may return parents with a nested `children` array but omit `parent_id` on the child in the flat list. */
export type CategoryWithOptionalChildren = UserRequestCategory & {
  children?: Array<{ id: number; name?: string | null; code?: string | null; is_active?: boolean }>;
};

export function findParentCategoryNodeForChildId(
  categories: UserRequestCategory[],
  childId: number,
): UserRequestCategory | null {
  for (const c of categories) {
    const children = (c as CategoryWithOptionalChildren).children;
    if (!Array.isArray(children)) continue;
    if (children.some((ch) => ch.id === childId)) {
      return c;
    }
  }
  return null;
}

/** When the request category is a sub-category, expose parent + sub names for read-only display. */
export function getEditRequestCategoryView(
  userRequestCategoryId: number | null | undefined,
  categories: UserRequestCategory[],
  getNameById: (id: number) => string,
  options?: { categoryDetail?: UserRequestCategory | null },
): {
  hasParent: boolean;
  parentName: string;
  subCategoryId: number;
  subCategoryName: string;
} | null {
  if (userRequestCategoryId == null) return null;
  const id = userRequestCategoryId;
  const detail = options?.categoryDetail;
  const currentFromList = categories.find((c) => c.id === id);
  const current =
    detail != null && Number(detail.id) === Number(id) ? detail : currentFromList;
  const parentNode = findParentCategoryNodeForChildId(categories, id);
  const parentIdFromField = resolveUserRequestParentCategoryId(current);
  const parentIdFromTree = parentNode?.id == null ? null : Number(parentNode.id);
  const parentId =
    parentIdFromField ??
    (parentIdFromTree != null && !Number.isNaN(parentIdFromTree) ? parentIdFromTree : null);

  const subName = current?.name ?? current?.code ?? getNameById(id);
  if (parentId == null) {
    return {
      hasParent: false,
      parentName: "",
      subCategoryId: id,
      subCategoryName: subName,
    };
  }
  const parentFromList = categories.find((c) => c.id === parentId);
  const parentName =
    (parentId === parentNode?.id ? parentNode?.name ?? parentNode?.code : undefined) ??
    parentFromList?.name ??
    parentFromList?.code ??
    getNameById(parentId);
  return {
    hasParent: true,
    parentName,
    subCategoryId: id,
    subCategoryName: subName,
  };
}

/** Sidebar approval endpoint payload shape (API response). */
export interface UserRequestApprovalInfo {
  can_approve: boolean;
  can_reject: boolean;
  assignees_for_current_level: string[];
  current_approval_level: string | number | null;
  approval_rule?: string | null;
  approve_in_order?: boolean | null;
}
