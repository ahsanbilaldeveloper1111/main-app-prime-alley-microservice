import React, { useMemo } from "react";

import type { TenantChatPricingTable } from "./mapTenantChatSettings";
import {
  buildModelPricingReferenceRows,
  formatUsdPerMillionTokens,
} from "./modelPricingReference";

export type ModelPricingDefaultsTableProps = Readonly<{
  pricingTable: TenantChatPricingTable;
}>;

export function ModelPricingDefaultsTable({
  pricingTable,
}: ModelPricingDefaultsTableProps) {
  const rows = useMemo(
    () => buildModelPricingReferenceRows(pricingTable),
    [pricingTable],
  );

  return (
    <div className="ai-chatbot-settings__section ai-chatbot-settings__pricing-reference">
      <p className="ai-chatbot-settings__row-label">
        Per-model defaults (reference)
      </p>
      <p className="ai-chatbot-settings__hint">
        These apply when a tenant has no pricing override set, and the model the
        chatbot used matches one of these names.
      </p>
      <div className="ai-chatbot-settings__pricing-reference-scroll">
        <table className="ai-chatbot-settings__pricing-reference-table">
          <thead>
            <tr>
              <th scope="col">Model</th>
              <th scope="col" className="ai-chatbot-settings__pricing-ref-num">
                Input / 1M tokens (USD)
              </th>
              <th scope="col" className="ai-chatbot-settings__pricing-ref-num">
                Output / 1M tokens (USD)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.model}>
                <td>
                  <code className="ai-chatbot-settings__pricing-ref-model">
                    {row.model}
                  </code>
                </td>
                <td className="ai-chatbot-settings__pricing-ref-num">
                  {formatUsdPerMillionTokens(row.inputUsdPerMillion)}
                </td>
                <td className="ai-chatbot-settings__pricing-ref-num">
                  {formatUsdPerMillionTokens(row.outputUsdPerMillion)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
