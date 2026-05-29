import { Filter, History, RefreshCw, Search } from "lucide-react";
import React from "react";
import { Alert, Button, Spinner, Table } from "react-bootstrap";

import { ChatModuleDateTimeFilterField } from "@page-modules/chat/shared/ChatModuleDateTimeFilterField";

import {
  formatSettingsHistoryChangeLine,
  formatSettingsHistoryEventLabel,
  formatSettingsHistoryTimestamp,
} from "./formatTenantSettingsHistory";
import type { ChatTenantSettingsHistoryCtx } from "./useChatTenantSettingsHistory";

export type AIChatbotSettingsHistoryPanelProps = Readonly<{
  ctx: ChatTenantSettingsHistoryCtx;
}>;

function formatHistoryEventCount(count: number): string {
  const label = count === 1 ? "event" : "events";
  return `${count} ${label}`;
}

function renderHistoryHeaderStatus(
  isLoading: boolean,
  rowCount: number,
): React.ReactNode {
  if (isLoading) {
    return (
      <span className="d-inline-flex align-items-center gap-2">
        <Spinner animation="border" size="sm" />
        Loading…
      </span>
    );
  }
  return formatHistoryEventCount(rowCount);
}

export function AIChatbotSettingsHistoryPanel({
  ctx,
}: AIChatbotSettingsHistoryPanelProps) {
  const {
    draftFilters,
    updateDraft,
    applyFilters,
    clearFilters,
    rows,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = ctx;

  return (
    <div className="ai-chatbot-settings__history">
      <div className="ai-chatbot-settings__section">
        <p className="ai-chatbot-settings__row-label d-flex align-items-center gap-2">
          <Filter size={16} className="text-primary" aria-hidden />
          Filters
        </p>
        <div className="ai-chatbot-settings__history-filters">
          <ChatModuleDateTimeFilterField
            layout="ai-chatbot"
            label="Start date & time"
            bound="from"
            value={draftFilters.from}
            disabled={isLoading}
            onChange={(from) => updateDraft({ from })}
          />
          <ChatModuleDateTimeFilterField
            layout="ai-chatbot"
            label="End date & time"
            bound="to"
            value={draftFilters.to}
            disabled={isLoading}
            onChange={(to) => updateDraft({ to })}
          />
          <label className="ai-chatbot-settings__field">
            <span className="ai-chatbot-settings__field-label">Limit</span>
            <input
              type="number"
              className="ai-chatbot-settings__input"
              min={1}
              max={200}
              value={draftFilters.limit}
              onChange={(e) => updateDraft({ limit: e.target.value })}
            />
          </label>
          <div className="ai-chatbot-settings__history-filter-actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={applyFilters}
              disabled={isLoading}
            >
              <Search size={16} className="me-2" aria-hidden />
              Search
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              onClick={clearFilters}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              aria-label="Refresh history"
            >
              <RefreshCw size={16} aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      {isError && errorMessage ? (
        <Alert variant="danger" className="mb-0">
          {errorMessage}
        </Alert>
      ) : null}

      <div className="ai-chatbot-settings__section">
        <div className="ai-chatbot-settings__history-header">
          <p className="ai-chatbot-settings__row-label d-flex align-items-center gap-2 mb-0">
            <History size={16} className="text-primary" aria-hidden />
            Change history
          </p>
          <span className="text-muted small">
            {renderHistoryHeaderStatus(isLoading, rows.length)}
          </span>
        </div>

        <div className="ai-chatbot-settings__history-table-wrap">
          <Table hover size="sm" className="ai-chatbot-settings__history-table mb-0">
            <thead className="table-light">
              <tr>
                <th>Time (UTC)</th>
                <th>Event</th>
                <th>User</th>
                <th>Changes</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    No settings changes in this range.
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => {
                const changeLines = Object.entries(row.changes ?? {}).map(
                  ([field, change]) =>
                    formatSettingsHistoryChangeLine(field, change),
                );
                return (
                  <tr key={`${row.ts}-${row.event}-${row.user_id ?? ""}`}>
                    <td className="text-nowrap small">
                      {formatSettingsHistoryTimestamp(row.ts, row.ts_raw)}
                    </td>
                    <td className="text-nowrap">
                      <code className="small">
                        {formatSettingsHistoryEventLabel(row.event)}
                      </code>
                    </td>
                    <td className="text-nowrap small">{row.user_id ?? "—"}</td>
                    <td className="small">
                      {changeLines.length === 0 ? (
                        "—"
                      ) : (
                        <ul className="ai-chatbot-settings__history-changes mb-0">
                          {changeLines.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
