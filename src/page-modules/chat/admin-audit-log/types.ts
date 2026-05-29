import { chatDateTimeUiToApiDate } from "@page-modules/chat/shared/chatDateTimeFilters";
import type { ChatAdminAuditLogQueryParams } from "@utils/chat";

export type ChatAdminAuditLogFilterForm = Readonly<{
  tenantId: string;
  event: string;
  from: string;
  to: string;
  q: string;
  limit: string;
}>;

export const defaultChatAdminAuditLogFilters =
  (): ChatAdminAuditLogFilterForm => ({
    tenantId: "",
    event: "",
    from: "",
    to: "",
    q: "",
    limit: "100",
  });

export function chatAdminAuditLogFiltersToQuery(
  form: ChatAdminAuditLogFilterForm,
): ChatAdminAuditLogQueryParams {
  const limitRaw = form.limit.trim();
  const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : 100;
  const limit = Number.isFinite(limitParsed) ? limitParsed : 100;

  return {
    tenant_id: form.tenantId.trim() || undefined,
    event: form.event.trim() || undefined,
    from: chatDateTimeUiToApiDate(form.from, "from"),
    to: chatDateTimeUiToApiDate(form.to, "to"),
    q: form.q.trim() || undefined,
    limit,
  };
}
