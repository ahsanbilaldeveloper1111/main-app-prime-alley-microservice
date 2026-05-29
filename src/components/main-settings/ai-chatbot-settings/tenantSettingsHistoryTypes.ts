import { chatDateTimeUiToApiDate } from "@page-modules/chat/shared/chatDateTimeFilters";
import type { TenantChatSettingsHistoryQueryParams } from "@utils/chat";

export type AIChatbotSettingsInnerTab = "settings" | "history";

export const AI_CHATBOT_SETTINGS_INNER_TABS: ReadonlyArray<{
  id: AIChatbotSettingsInnerTab;
  label: string;
}> = [
  { id: "settings", label: "Settings" },
  { id: "history", label: "Change history" },
];

export type TenantSettingsHistoryFilterForm = Readonly<{
  from: string;
  to: string;
  limit: string;
}>;

export const defaultTenantSettingsHistoryFilters =
  (): TenantSettingsHistoryFilterForm => ({
    from: "",
    to: "",
    limit: "50",
  });

export function tenantSettingsHistoryFiltersToQuery(
  tenantId: string,
  form: TenantSettingsHistoryFilterForm,
): TenantChatSettingsHistoryQueryParams {
  const limitRaw = form.limit.trim();
  const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
  const limit = Number.isFinite(limitParsed) ? limitParsed : 50;

  return {
    tenant_id: tenantId.trim() || undefined,
    from: chatDateTimeUiToApiDate(form.from, "from"),
    to: chatDateTimeUiToApiDate(form.to, "to"),
    limit,
  };
}
