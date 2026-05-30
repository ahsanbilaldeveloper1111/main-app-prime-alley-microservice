import type { TenantChatPricingTable } from "./mapTenantChatSettings";
import { AI_CHATBOT_DECIMAL_PLACES } from "./aiChatbotDecimalFormat";
import {
  AI_CHATBOT_DEFAULT_PRICING_TABLE,
  type ModelPricingDefaultRow,
} from "./constants";

export function formatUsdPerMillionTokens(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "—";
  }
  const numeric = Number.parseFloat(trimmed.replace(/^\$/, ""));
  if (Number.isFinite(numeric)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: AI_CHATBOT_DECIMAL_PLACES,
      maximumFractionDigits: AI_CHATBOT_DECIMAL_PLACES,
    }).format(numeric);
  }
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
}

export function buildModelPricingReferenceRows(
  pricingTable: TenantChatPricingTable,
): ModelPricingDefaultRow[] {
  const rows: ModelPricingDefaultRow[] = AI_CHATBOT_DEFAULT_PRICING_TABLE.map(
    (row) => {
      const fromApi = pricingTable[row.model];
      if (!fromApi) {
        return row;
      }
      return {
        model: row.model,
        inputUsdPerMillion: fromApi.input || row.inputUsdPerMillion,
        outputUsdPerMillion: fromApi.output || row.outputUsdPerMillion,
      };
    },
  );

  for (const [model, pricing] of Object.entries(pricingTable)) {
    if (rows.some((row) => row.model === model)) {
      continue;
    }
    rows.push({
      model,
      inputUsdPerMillion: pricing.input,
      outputUsdPerMillion: pricing.output,
    });
  }

  return rows;
}
