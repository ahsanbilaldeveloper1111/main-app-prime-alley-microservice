import { readUser } from "@auth/authStorage";
import type { AuthUser } from "@auth/authStorage";
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

/** Keys tried in order for chat `GET/PUT /api/chat/users/{tenant}/{user_id}`. */
const CHAT_USER_ID_KEYS = [
  "extension",
  "user_extension",
  "extension_number",
  "phone",
  "id",
  "user_id",
  "userId",
  "username",
] as const;

function readChatUserIdFromRecord(record: Record<string, unknown>): string {
  for (const key of CHAT_USER_ID_KEYS) {
    const id = readIdCandidate(record[key]);
    if (id) return id;
  }
  return "";
}

function readChatUserIdFromAuthUser(user: AuthUser | null): string {
  if (!user) return "";
  return (
    readIdCandidate(user.extension) ||
    readIdCandidate(user.user_extension) ||
    readIdCandidate(user.phone) ||
    readIdCandidate(user.id) ||
    readIdCandidate(user.username)
  );
}

function tenantIdFromAuthUser(): string {
  const user = readUser();
  if (!user) return "";
  return (
    readIdCandidate(user.company_identifier) ||
    readIdCandidate(user.company_id)
  );
}

/** Tenant id for chat user APIs (session user, then auth storage). */
export function resolveChatAssistantTenantId(sessionUser: unknown): string {
  return resolveChatTenantIdFromSession(sessionUser) || tenantIdFromAuthUser();
}

/**
 * Current user id for chat user APIs (`/api/chat/users/{tenant}/{user_id}`).
 * Prefer portal extension over numeric login id so budget/detail match backend keys.
 */
export function resolveChatAssistantUserId(sessionUser: unknown): string {
  if (sessionUser && typeof sessionUser === "object") {
    const fromSession = readChatUserIdFromRecord(
      sessionUser as Record<string, unknown>,
    );
    if (fromSession) return fromSession;
  }
  return readChatUserIdFromAuthUser(readUser());
}
