import { AI_CHAT_SETTINGS_TAB_PERMISSIONS } from "./aiChatPermissions";

/** Tenant company name required to show Main Settings → AI Chat → AI Chatbot Settings. */
export const AI_CHATBOT_SETTINGS_PRIME_ALLEY_TENANT_NAME =
  "Prime Alley Technology LLC" as const;

export function isPrimeAlleyTechnologyTenant(
  companyName: string | null | undefined,
): boolean {
  const normalized = companyName?.trim() ?? "";
  return normalized === AI_CHATBOT_SETTINGS_PRIME_ALLEY_TENANT_NAME;
}

export function canViewAIChatbotSettingsTab(options: {
  userPermissions: readonly string[];
  companyName: string | null | undefined;
}): boolean {
  return (
    options.userPermissions.includes(
      AI_CHAT_SETTINGS_TAB_PERMISSIONS.chatbotSettings,
    ) && isPrimeAlleyTechnologyTenant(options.companyName)
  );
}
