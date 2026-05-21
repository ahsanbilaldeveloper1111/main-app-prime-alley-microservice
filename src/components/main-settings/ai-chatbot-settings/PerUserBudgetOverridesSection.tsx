import type { TenantUserBudgetRow } from "@page-modules/chat/tenant-dashboard/types";
import { useChatTenantUsersQuery } from "@page-modules/chat/tenant-dashboard/useChatTenantUsersQuery";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

import { useUpdateChatbotUserBudgetMutation } from "./useUpdateChatbotUserBudgetMutation";

function formatMonthlyCapValue(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

function validateMonthlyCap(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return "Monthly cap must be a valid non-negative number.";
  }
  return null;
}

export type PerUserBudgetOverridesSectionProps = Readonly<{
  tenantId: string;
  enabled: boolean;
  canEdit: boolean;
}>;

export function PerUserBudgetOverridesSection({
  tenantId,
  enabled,
  canEdit,
}: PerUserBudgetOverridesSectionProps) {
  const usersQuery = useChatTenantUsersQuery(tenantId, enabled);
  const saveMutation = useUpdateChatbotUserBudgetMutation(tenantId);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [monthlyCapUsd, setMonthlyCapUsd] = useState("");

  const rows = usersQuery.rows;
  const userCount = rows.length;

  const rowsByUserId = useMemo(() => {
    const map = new Map<string, TenantUserBudgetRow>();
    for (const row of rows) {
      if (row.userId) map.set(row.userId, row);
    }
    return map;
  }, [rows]);

  useEffect(() => {
    setSelectedUserId("");
    setMonthlyCapUsd("");
  }, [tenantId]);

  const handleUserChange = useCallback(
    (userId: string) => {
      setSelectedUserId(userId);
      const row = rowsByUserId.get(userId);
      setMonthlyCapUsd(formatMonthlyCapValue(row?.monthlyBudgetUsd));
    },
    [rowsByUserId],
  );

  const handleSave = useCallback(() => {
    if (!selectedUserId.trim()) {
      toast.info("Please select a user");
      return;
    }
    const capError = validateMonthlyCap(monthlyCapUsd);
    if (capError) {
      toast.error(capError);
      return;
    }
    saveMutation.mutate({
      userId: selectedUserId,
      payload: { monthly_budget_usd: monthlyCapUsd.trim() },
    });
  }, [monthlyCapUsd, saveMutation, selectedUserId]);

  const capValidationError = validateMonthlyCap(monthlyCapUsd);
  const fieldsDisabled =
    !canEdit || usersQuery.isFetching || saveMutation.isPending;
  const canSave =
    canEdit &&
    Boolean(selectedUserId.trim()) &&
    !capValidationError &&
    !saveMutation.isPending;

  return (
    <section
      className="ai-chatbot-settings__per-user-budget"
      aria-labelledby="ai-chatbot-per-user-budget-title"
    >
      <div className="ai-chatbot-settings__per-user-budget-header">
        <h3
          id="ai-chatbot-per-user-budget-title"
          className="ai-chatbot-settings__per-user-budget-title"
        >
          Per-user budget overrides
        </h3>
        <span className="ai-chatbot-settings__per-user-budget-count">
          {usersQuery.isFetching ? (
            <Spinner animation="border" size="sm" aria-hidden />
          ) : (
            `${userCount} user${userCount === 1 ? "" : "s"}`
          )}
        </span>
      </div>

      <p className="ai-chatbot-settings__per-user-budget-lead">
        Set a custom cap for individual users — overrides the tenant default
        above. Leave blank to inherit.
      </p>

      <p className="ai-chatbot-settings__per-user-budget-note">
        User list source: ChatbotUser rows for this tenant — populated by
        mainapp via{" "}
        <code className="ai-chatbot-settings__per-user-budget-code">
          PUT /api/users/&lt;tenant&gt;/&lt;user_id&gt;/
        </code>
        .
      </p>

      {usersQuery.isError ? (
        <p className="ai-chatbot-settings__status" role="alert">
          Could not load users for this tenant.{" "}
          <button
            type="button"
            className="ai-chatbot-settings__retry"
            onClick={() => {
              usersQuery.refetch().catch(() => undefined);
            }}
          >
            Retry
          </button>
        </p>
      ) : null}

      <div className="ai-chatbot-settings__per-user-budget-grid">
        <label className="ai-chatbot-settings__field">
          <span className="ai-chatbot-settings__field-label">User</span>
          <select
            className="ai-chatbot-settings__select"
            value={selectedUserId}
            disabled={fieldsDisabled || userCount === 0}
            onChange={(e) => handleUserChange(e.target.value)}
          >
            <option value="">— Select a user —</option>
            {rows.map((row) => (
              <option key={row.userId} value={row.userId}>
                {row.displayName}
                {row.displayName !== row.userId ? ` (${row.userId})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="ai-chatbot-settings__field">
          <span className="ai-chatbot-settings__field-label">
            Monthly cap (USD)
          </span>
          <input
            type="number"
            className="ai-chatbot-settings__input"
            value={monthlyCapUsd}
            placeholder="e.g. 10.00"
            min={0}
            step="0.01"
            disabled={fieldsDisabled || !selectedUserId}
            onChange={(e) => setMonthlyCapUsd(e.target.value)}
          />
        </label>
      </div>

      {capValidationError ? (
        <p className="ai-chatbot-settings__status" role="alert">
          {capValidationError}
        </p>
      ) : null}

      <div className="ai-chatbot-settings__per-user-budget-actions">
        <Button
          type="button"
          variant="primary"
          disabled={!canSave}
          onClick={handleSave}
        >
          {saveMutation.isPending ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" aria-hidden />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </section>
  );
}
