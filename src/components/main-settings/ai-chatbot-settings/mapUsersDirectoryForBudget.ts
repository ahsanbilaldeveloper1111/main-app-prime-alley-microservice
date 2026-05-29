import { resolveTenantIdFromCompany } from "@page-modules/chat/shared/chatCompanySelectOptions";
import type { ChatCompanyOption } from "@page-modules/chat/useChatCompaniesQuery";

/** Row shape from Main Settings → Users & Teams → User Directory (`POST users/list`). */
export type UsersDirectoryListRow = Readonly<{
  id?: number | string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string | number | null;
  extension?: string | number | null;
  extension_number?: string | number | null;
  company?: {
    id?: number | string;
    name?: string;
    identifier?: string;
    company_identifier?: string;
    tenant_id?: string;
  } | null;
}>;

export type ChatbotPerUserBudgetOption = Readonly<{
  /** Chat API `user_id` (extension / phone). */
  userId: string;
  displayName: string;
  username: string;
  extension: string;
  directoryUserId: string;
}>;

function readStringCandidate(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

/** Extension used as chat `user_id` (matches `resolveChatAssistantUserId`). */
export function resolveChatUserIdFromDirectoryUser(
  user: UsersDirectoryListRow,
): string {
  return (
    readStringCandidate(user.extension) ||
    readStringCandidate(user.extension_number) ||
    readStringCandidate(user.phone) ||
    readStringCandidate(user.username) ||
    readStringCandidate(user.id) ||
    ""
  );
}

function resolveDisplayName(user: UsersDirectoryListRow): string {
  const name = readStringCandidate(user.name);
  if (name) return name;
  return readStringCandidate(user.username) || "—";
}

function resolveAppliedCompany(
  tenantId: string,
  companies: readonly ChatCompanyOption[],
): ChatCompanyOption | undefined {
  const tid = tenantId.trim();
  if (!tid) return undefined;
  return companies.find((c) => resolveTenantIdFromCompany(c) === tid);
}

function userMatchesTenant(
  user: UsersDirectoryListRow,
  tenantId: string,
  appliedCompany: ChatCompanyOption | undefined,
): boolean {
  const tid = tenantId.trim();
  if (!tid) return true;

  const userCompanyId = resolveTenantIdFromCompany(user.company);
  if (userCompanyId && userCompanyId === tid) {
    return true;
  }

  if (appliedCompany && user.company && typeof user.company === "object") {
    const rowCompany = user.company;
    const appliedId = readStringCandidate(appliedCompany.id);
    const rowId = readStringCandidate(rowCompany.id);
    if (appliedId && rowId && appliedId === rowId) {
      return true;
    }
    const appliedName = appliedCompany.name?.trim();
    const rowName = readStringCandidate(rowCompany.name);
    if (appliedName && rowName && appliedName === rowName) {
      return true;
    }
  }

  if (!user.company) {
    return true;
  }

  return false;
}

function mapUsersDirectoryRows(
  users: readonly UsersDirectoryListRow[],
  tenantId: string,
  appliedCompany: ChatCompanyOption | undefined,
  applyTenantFilter: boolean,
): ChatbotPerUserBudgetOption[] {
  const options: ChatbotPerUserBudgetOption[] = [];

  for (const user of users) {
    if (applyTenantFilter && !userMatchesTenant(user, tenantId, appliedCompany)) {
      continue;
    }

    const userId = resolveChatUserIdFromDirectoryUser(user);
    if (!userId) continue;

    const displayName = resolveDisplayName(user);
    const username = readStringCandidate(user.username);
    const extension =
      readStringCandidate(user.extension) ||
      readStringCandidate(user.extension_number) ||
      readStringCandidate(user.phone);

    options.push({
      userId,
      displayName,
      username,
      extension,
      directoryUserId: readStringCandidate(user.id),
    });
  }

  options.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    }),
  );

  return options;
}

export function mapUsersDirectoryForBudget(
  users: readonly UsersDirectoryListRow[],
  tenantId = "",
  companies: readonly ChatCompanyOption[] = [],
): ChatbotPerUserBudgetOption[] {
  const appliedCompany = resolveAppliedCompany(tenantId, companies);
  const withFilter = mapUsersDirectoryRows(
    users,
    tenantId,
    appliedCompany,
    Boolean(tenantId.trim()),
  );

  if (withFilter.length > 0 || !tenantId.trim() || users.length === 0) {
    return withFilter;
  }

  return mapUsersDirectoryRows(users, tenantId, appliedCompany, false);
}

export function formatChatbotPerUserBudgetOptionLabel(
  row: ChatbotPerUserBudgetOption,
): string {
  const ext = row.extension;
  if (ext && row.displayName !== ext) {
    return `${row.displayName} (${ext})`;
  }
  if (row.username && row.displayName !== row.username) {
    return `${row.displayName} (${row.username})`;
  }
  return row.displayName;
}
