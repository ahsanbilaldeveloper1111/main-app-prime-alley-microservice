import type { ChatCompanyOption } from "@page-modules/chat/useChatCompaniesQuery";
import { useChatTenantUsersQuery } from "@page-modules/chat/tenant-dashboard/useChatTenantUsersQuery";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

import {
  formatChatbotPerUserBudgetOptionLabel,
  type ChatbotPerUserBudgetOption,
} from "./mapUsersDirectoryForBudget";
import {
  MAIN_SETTINGS_USERS_FETCH_ERROR_MESSAGE,
  useMainSettingsUsersForChatbotQuery,
} from "./useMainSettingsUsersForChatbotQuery";
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

function formatUserCountLabel(count: number): string {
  const label = count === 1 ? "user" : "users";
  return `${count} ${label}`;
}

function renderUserCountStatus(
  isFetching: boolean,
  userCount: number,
): React.ReactNode {
  if (isFetching) {
    return <Spinner animation="border" size="sm" aria-hidden />;
  }
  return formatUserCountLabel(userCount);
}

export type PerUserBudgetOverridesSectionProps = Readonly<{
  tenantId: string;
  companies?: readonly ChatCompanyOption[];
  enabled: boolean;
  canEdit: boolean;
}>;

export function PerUserBudgetOverridesSection({
  tenantId,
  companies = [],
  enabled,
  canEdit,
}: PerUserBudgetOverridesSectionProps) {
  const usersQuery = useMainSettingsUsersForChatbotQuery(
    enabled,
    tenantId,
    companies,
  );
  const chatBudgetQuery = useChatTenantUsersQuery(tenantId, enabled);
  const saveMutation = useUpdateChatbotUserBudgetMutation(tenantId);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [monthlyCapUsd, setMonthlyCapUsd] = useState("");

  const users = usersQuery.users;
  const userCount = users.length;

  const monthlyBudgetByUserId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const row of chatBudgetQuery.rows) {
      if (row.userId) {
        map.set(row.userId, row.monthlyBudgetUsd);
      }
    }
    return map;
  }, [chatBudgetQuery.rows]);

  const usersByUserId = useMemo(() => {
    const map = new Map<string, ChatbotPerUserBudgetOption>();
    for (const user of users) {
      if (user.userId) map.set(user.userId, user);
    }
    return map;
  }, [users]);

  useEffect(() => {
    setSelectedUserId("");
    setMonthlyCapUsd("");
  }, [tenantId]);

  const handleUserChange = useCallback(
    (userId: string) => {
      setSelectedUserId(userId);
      const existing = monthlyBudgetByUserId.get(userId);
      setMonthlyCapUsd(formatMonthlyCapValue(existing));
    },
    [monthlyBudgetByUserId],
  );

  const handleSave = useCallback(() => {
    if (!selectedUserId.trim()) {
      toast.info("Please select a user");
      return;
    }
    if (!usersByUserId.has(selectedUserId)) {
      toast.error("Selected user is not in the list. Please choose again.");
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
  }, [monthlyCapUsd, saveMutation, selectedUserId, usersByUserId]);

  const capValidationError = validateMonthlyCap(monthlyCapUsd);
  const usersListLoading =
    usersQuery.isPending || (usersQuery.isFetching && userCount === 0);
  const selectDisabled = usersListLoading || userCount === 0;
  const capFieldsDisabled =
    !canEdit || usersListLoading || saveMutation.isPending;
  const hasSelectedUser = Boolean(selectedUserId.trim());
  const canSave =
    canEdit &&
    hasSelectedUser &&
    capValidationError == null &&
    saveMutation.isPending === false;

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
          {renderUserCountStatus(usersListLoading, userCount)}
        </span>
      </div>

      <p className="ai-chatbot-settings__per-user-budget-lead">
        Set a custom cap for individual users — overrides the tenant default
        above. Leave blank to inherit.
      </p>

      <p className="ai-chatbot-settings__per-user-budget-note">
        Users are loaded from Main Settings → Users &amp; Teams (User Directory).
        Overrides are saved with PUT /api/chat/users/&#123;tenant&#125;/&#123;extension&#125;/.
      </p>

      {usersQuery.isError ? (
        <p className="ai-chatbot-settings__status" role="alert">
          {MAIN_SETTINGS_USERS_FETCH_ERROR_MESSAGE}{" "}
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

      {!usersListLoading && !usersQuery.isError && userCount === 0 ? (
        <p className="ai-chatbot-settings__status">
          No users found for this company. Check Users &amp; Teams → User
          Directory, or apply the company filter above.
        </p>
      ) : null}

      <div className="ai-chatbot-settings__per-user-budget-grid">
        <label className="ai-chatbot-settings__field">
          <span className="ai-chatbot-settings__field-label">User</span>
          <select
            className="ai-chatbot-settings__select"
            value={selectedUserId}
            disabled={selectDisabled}
            onChange={(e) => handleUserChange(e.target.value)}
          >
            <option value="">— Select a user —</option>
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {formatChatbotPerUserBudgetOptionLabel(user)}
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
            disabled={capFieldsDisabled || hasSelectedUser === false}
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
          disabled={canSave === false}
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
