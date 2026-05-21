import {
  formatPricingHistoryChangeLine,
  formatPricingHistoryTimestamp,
} from "@page-modules/chat/shared/formatPricingHistoryChanges";
import { Filter, History, RefreshCw, Search } from "lucide-react";
import React from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import { ChatModuleDateTimeFilterField } from "@page-modules/chat/shared/ChatModuleDateTimeFilterField";

import {
  chatbotsDashboardColTenantClass,
  chatbotsDashboardTdClass,
  chatbotsDashboardThWrapClass,
  chatbotsDashboardUsersBudgetsTableClass,
} from "../shared/chatbotsDashboardTable";
import { DashboardTableCard } from "../shared/DashboardTableCard";

import {
  ADMIN_PRICING_HISTORY_FIELD_OPTIONS,
  type AdminPricingHistoryFilterForm,
} from "./adminPricingHistoryTypes";
import type { ChatAdminPricingHistoryPageCtx } from "./useChatAdminPricingHistoryPage";

export type AdminDashboardPricingHistoryTabProps = Readonly<{
  ctx: ChatAdminPricingHistoryPageCtx;
}>;

function formatPricingHistoryEventCount(count: number): string {
  const label = count === 1 ? "event" : "events";
  return `${count} ${label}`;
}

function renderPricingHistoryHeaderStatus(
  isLoading: boolean,
  count: number,
): React.ReactNode {
  if (isLoading) {
    return (
      <>
        <Spinner animation="border" size="sm" />
        Loading…
      </>
    );
  }
  return formatPricingHistoryEventCount(count);
}

export function AdminDashboardPricingHistoryTab({
  ctx,
}: AdminDashboardPricingHistoryTabProps) {
  const {
    draftFilters,
    updateDraft,
    applyFilters,
    clearFilters,
    rows,
    count,
    isLoading,
    isError,
    error,
    refetch,
  } = ctx;

  return (
    <>
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <h5 className="mb-3 fw-semibold d-flex align-items-center gap-2">
            <Filter size={18} className="text-primary" aria-hidden />
            Filters
          </h5>
          <Row className="g-3">
            <Col xs={12} md={6} lg={3}>
              <Form.Label className="small text-muted text-uppercase fw-semibold">
                Field
              </Form.Label>
              <Form.Select
                value={draftFilters.field}
                onChange={(e) =>
                  updateDraft({
                    field: e.target
                      .value as AdminPricingHistoryFilterForm["field"],
                  })
                }
              >
                {ADMIN_PRICING_HISTORY_FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={6} lg={3}>
              <ChatModuleDateTimeFilterField
                label="Start date & time"
                bound="from"
                value={draftFilters.from}
                disabled={isLoading}
                onChange={(from) => updateDraft({ from })}
              />
            </Col>
            <Col xs={12} md={6} lg={3}>
              <ChatModuleDateTimeFilterField
                label="End date & time"
                bound="to"
                value={draftFilters.to}
                disabled={isLoading}
                onChange={(to) => updateDraft({ to })}
              />
            </Col>
            <Col xs={12} md={6} lg={3}>
              <Form.Label className="small text-muted text-uppercase fw-semibold">
                Limit
              </Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={500}
                value={draftFilters.limit}
                onChange={(e) => updateDraft({ limit: e.target.value })}
              />
            </Col>
            <Col
              xs={12}
              className="d-flex align-items-end gap-2 flex-wrap pb-1"
            >
              <Button variant="primary" onClick={applyFilters} disabled={isLoading}>
                <Search size={16} className="me-2" aria-hidden />
                Search
              </Button>
              <Button variant="outline-secondary" onClick={clearFilters}>
                Clear
              </Button>
              <Button
                variant="outline-primary"
                onClick={refetch}
                disabled={isLoading}
                aria-label="Refresh pricing history"
              >
                <RefreshCw size={16} aria-hidden />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isError ? (
        <Alert variant="danger" className="mb-3">
          {error instanceof Error
            ? error.message
            : "Failed to load pricing history."}
        </Alert>
      ) : null}

      <DashboardTableCard title="Pricing history">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <span className="text-muted small d-flex align-items-center gap-2">
            <History size={16} className="text-primary" aria-hidden />
            {renderPricingHistoryHeaderStatus(isLoading, count)}
          </span>
        </div>
        <Table hover size="sm" className={chatbotsDashboardUsersBudgetsTableClass}>
          <colgroup>
            <col style={{ width: "16%" }} />
            <col className="chatbots-dashboard__col-tenant-width" />
            <col />
          </colgroup>
          <thead className="table-light">
            <tr>
              <th className={chatbotsDashboardThWrapClass}>Time (UTC)</th>
              <th className={chatbotsDashboardThWrapClass}>Tenant</th>
              <th className={chatbotsDashboardThWrapClass}>Changes</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted py-4">
                  No pricing changes match these filters.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => {
              const changeLines = Object.entries(row.changes ?? {}).map(
                ([field, change]) => formatPricingHistoryChangeLine(field, change),
              );
              return (
                <tr
                  key={`${row.ts}-${row.tenant_id}-${changeLines.join("|")}`}
                >
                  <td
                    className={`${chatbotsDashboardTdClass} text-nowrap small`}
                    data-label="Time (UTC)"
                  >
                    {formatPricingHistoryTimestamp(row.ts, row.ts_raw)}
                  </td>
                  <td
                    className={`${chatbotsDashboardTdClass} ${chatbotsDashboardColTenantClass} fw-medium`}
                    data-label="Tenant"
                  >
                    <div>{row.tenantName}</div>
                    {row.tenantName === row.tenant_id ? null : (
                      <code className="small text-muted d-block">
                        {row.tenant_id}
                      </code>
                    )}
                  </td>
                  <td className={chatbotsDashboardTdClass} data-label="Changes">
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
      </DashboardTableCard>
    </>
  );
}
