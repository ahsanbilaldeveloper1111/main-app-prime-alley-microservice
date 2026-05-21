import { readUser } from "@auth/authStorage";
import { resolveChatTenantIdFromSession } from "@components/main-settings/ai-chatbot-settings/resolveChatTenantId";

function readIdCandidate(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function tenantIdFromAuthUser(): string {
  const user = readUser();
  if (!user) return "";
  return (
    readIdCandidate(user.company_identifier) ||
    readIdCandidate(user.company_id)
  );
}

function userIdFromAuthUser(): string {
  const user = readUser();
  return readIdCandidate(user?.id);
}

/** Tenant id for chat user APIs (session user, then auth storage). */
export function resolveChatAssistantTenantId(sessionUser: unknown): string {
  return resolveChatTenantIdFromSession(sessionUser) || tenantIdFromAuthUser();
}

/** Current user id for chat user APIs (session user, then auth storage). */
export function resolveChatAssistantUserId(sessionUser: unknown): string {
  if (sessionUser && typeof sessionUser === "object") {
    const record = sessionUser as Record<string, unknown>;
    for (const key of ["id", "user_id", "userId"]) {
      const id = readIdCandidate(record[key]);
      if (id) return id;
    }
  }
  return userIdFromAuthUser();
}
