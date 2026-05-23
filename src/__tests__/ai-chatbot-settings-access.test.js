/**
 * Tab visibility rules for Main Settings → AI Chat → AI Chatbot Settings.
 * Logic must stay aligned with `src/config/aiChatbotSettingsAccess.ts`.
 */

const AI_CHATBOT_SETTINGS_PRIME_ALLEY_TENANT_NAME = "Prime Alley Technology LLC";
const VIEW_TENANT_SETTING_AI_CHAT = "view-tenant-settings-ai-chat";

function isPrimeAlleyTechnologyTenant(companyName) {
  const normalized = companyName?.trim() ?? "";
  return normalized === AI_CHATBOT_SETTINGS_PRIME_ALLEY_TENANT_NAME;
}

function canViewAIChatbotSettingsTab({ userPermissions, companyName }) {
  return (
    userPermissions.includes(VIEW_TENANT_SETTING_AI_CHAT) &&
    isPrimeAlleyTechnologyTenant(companyName)
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTests() {
  assert(
    isPrimeAlleyTechnologyTenant(AI_CHATBOT_SETTINGS_PRIME_ALLEY_TENANT_NAME),
    "exact tenant name should match",
  );
  assert(
    isPrimeAlleyTechnologyTenant(
      `  ${AI_CHATBOT_SETTINGS_PRIME_ALLEY_TENANT_NAME}  `,
    ),
    "trimmed tenant name should match",
  );
  assert(
    !isPrimeAlleyTechnologyTenant("Other Company LLC"),
    "other tenants should not match",
  );
  assert(
    canViewAIChatbotSettingsTab({
      userPermissions: [VIEW_TENANT_SETTING_AI_CHAT],
      companyName: AI_CHATBOT_SETTINGS_PRIME_ALLEY_TENANT_NAME,
    }),
    "permission + Prime Alley tenant should allow tab",
  );
  assert(
    !canViewAIChatbotSettingsTab({
      userPermissions: [VIEW_TENANT_SETTING_AI_CHAT],
      companyName: "Other Company LLC",
    }),
    "permission without Prime Alley tenant should deny tab",
  );
  assert(
    !canViewAIChatbotSettingsTab({
      userPermissions: [],
      companyName: AI_CHATBOT_SETTINGS_PRIME_ALLEY_TENANT_NAME,
    }),
    "Prime Alley tenant without permission should deny tab",
  );
  console.log("All ai-chatbot-settings-access tests passed.");
}

runTests();
