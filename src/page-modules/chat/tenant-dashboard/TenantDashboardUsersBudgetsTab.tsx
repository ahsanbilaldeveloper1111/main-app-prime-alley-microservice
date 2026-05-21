import { AlertTriangle, RefreshCw, Users, Wallet } from "lucide-react";
import React from "react";
import { Alert, Badge, Button, Card, Col, Row, Spinner, Table } from "react-bootstrap";

import { ChatBudgetUsageBar } from "../shared/ChatBudgetUsageBar";
import {
  clampUsedPct,
  formatBudgetPct,
  formatBudgetUsd,
  isUnlimitedBudgetSource,
} from "../shared/chatBudgetUsage";

import {
  chatbotsDashboardColUserClass,
  chatbotsDashboardTdClass,
  chatbotsDashboardThClass,
  chatbotsDashboardThWrapClass,
  chatbotsDashboardUsersBudgetsTableClass,
} from "../shared/chatbotsDashboardTable";
import { DashboardTableCard } from "../shared/DashboardTableCard";

import type { TenantUserBudgetRow } from "./types";
import { useChatTenantUsersQuery } from "./useChatTenantUsersQuery";

function formatNullableUsd(value: string | null): string {
  if (value == null) return "—";
  return formatBudgetUsd(value);
}

function formatLastSeen(iso: string | null): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type TenantDashboardUsersBudgetsTabProps = Readonly<{
  tenantId: string;
  active: boolean;
}>;

export function TenantDashboardUsersBudgetsTab({
  tenantId,
  active,
}: TenantDashboardUsersBudgetsTabProps) {
  const { rows, count, isFetching, isError, error, refetch } = useChatTenantUsersQuery(
    tenantId,
    active,
  );

  const exhaustedCount = rows.filter((r) => r.isExhausted).length;
  const atThresholdCount = rows.filter(
    (r) =>
      !isUnlimitedBudgetSource(r.budgetSource) &&
      !r.isExhausted &&
      clampUsedPct(r.usedPct) >= r.effectiveThresholdPct,
  ).length;

  if (isFetching && rows.length === 0) {
    return (
      <div
        className="d-flex justify-content-center align-items-center py-5"
        style={{ minHeight: 200 }}
      >
        <output className="spinner-border text-primary" aria-label="Loading users">
          <span className="visually-hidden">Loading…</span>
        </output>
      </div>
    );
  }

  return (
    <>
      {isError ? (
        <Alert
          variant="danger"
          className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2"
        >
          <span className="flex-grow-1">
            {error instanceof Error
              ? error.message
              : "Failed to load user budgets."}
          </span>
          <Button variant="outline-danger" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Alert>
      ) : null}

      {exhaustedCount > 0 || atThresholdCount > 0 ? (
        <Alert
          variant={exhaustedCount > 0 ? "danger" : "warning"}
          className="d-flex align-items-start gap-2"
        >
          <AlertTriangle size={18} className="flex-shrink-0 mt-1" aria-hidden />
          <span>
            {exhaustedCount > 0 ? (
              <>
                <strong>{exhaustedCount}</strong> user
                {exhaustedCount === 1 ? " has" : "s have"} exhausted their budget.
                {atThresholdCount > 0 ? " " : ""}
              </>
            ) : null}
            {atThresholdCount > 0 ? (
              <>
                <strong>{atThresholdCount}</strong> user
                {atThresholdCount === 1 ? " is" : "s are"} at or above the alert
                threshold.
              </>
            ) : null}
          </span>
        </Alert>
      ) : null}

      <Row className="g-3 mb-3">
        <Col xs={12} sm={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#2563eb18",
                  color: "#2563eb",
                }}
                aria-hidden
              >
                <Users size={20} />
              </div>
              <div>
                <div className="text-muted small text-uppercase fw-semibold">
                  Users
                </div>
                <div className="fs-4 fw-semibold">{count}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#d9770618",
                  color: "#d97706",
                }}
                aria-hidden
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="text-muted small text-uppercase fw-semibold">
                  At threshold
                </div>
                <div className="fs-4 fw-semibold">{atThresholdCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#dc262618",
                  color: "#dc2626",
                }}
                aria-hidden
              >
                <Wallet size={20} />
              </div>
              <div>
                <div className="text-muted small text-uppercase fw-semibold">
                  Budget exhausted
                </div>
                <div className="fs-4 fw-semibold">{exhaustedCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col
          xs={12}
          md={3}
          className="d-flex align-items-center justify-content-md-end"
        >
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <RefreshCw size={16} className="me-2" aria-hidden />
            )}
            Refresh
          </Button>
        </Col>
      </Row>

      <DashboardTableCard title="Users budgets &amp; usage">
        <Table hover size="sm" className={chatbotsDashboardUsersBudgetsTableClass}>
          <colgroup>
            <col className="chatbots-dashboard__col-user-width" />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead className="table-light">
            <tr>
              <th
                className={`${chatbotsDashboardThWrapClass} ${chatbotsDashboardColUserClass}`}
              >
                User
              </th>
              <th className={chatbotsDashboardThClass}>Row budget</th>
              <th className={chatbotsDashboardThClass}>Row threshold</th>
              <th className={chatbotsDashboardThClass}>Effective budget</th>
              <th className={chatbotsDashboardThClass}>Effective threshold</th>
              <th className={chatbotsDashboardThClass}>MTD spend</th>
              <th className={chatbotsDashboardThClass}>Usage</th>
              <th className={chatbotsDashboardThClass}>Source</th>
              <th className={chatbotsDashboardThClass}>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {!isFetching && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-muted py-4">
                  No users found for this tenant.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.userId}>
                <td
                  className={`${chatbotsDashboardTdClass} ${chatbotsDashboardColUserClass} fw-medium`}
                  data-label="User"
                >
                  <div>{row.displayName}</div>
                  {row.displayName === row.userId ? null : (
                    <code className="small text-muted d-block">
                      {row.userId}
                    </code>
                  )}
                  {row.isExhausted ? (
                    <Badge bg="danger">Exhausted</Badge>
                  ) : null}
                </td>
                <td className={chatbotsDashboardTdClass} data-label="Row budget">
                  {formatNullableUsd(row.monthlyBudgetUsd)}
                </td>
                <td
                  className={chatbotsDashboardTdClass}
                  data-label="Row threshold"
                >
                  {row.budgetThresholdPct == null
                    ? "—"
                    : formatPct(row.budgetThresholdPct)}
                </td>
                <td
                  className={chatbotsDashboardTdClass}
                  data-label="Effective budget"
                >
                  {formatBudgetUsd(row.effectiveBudgetUsd)}
                </td>
                <td
                  className={chatbotsDashboardTdClass}
                  data-label="Effective threshold"
                >
                  {formatBudgetPct(row.effectiveThresholdPct)}
                </td>
                <td className={chatbotsDashboardTdClass} data-label="MTD spend">
                  {formatBudgetUsd(row.mtdSpend, true)}
                </td>
                <td
                  className={chatbotsDashboardTdClass}
                  data-label="Usage"
                  style={{ minWidth: 140 }}
                >
                  <ChatBudgetUsageBar row={row} />
                </td>
                <td className={chatbotsDashboardTdClass} data-label="Source">
                  <Badge
                    bg={
                      row.budgetSource === "unlimited"
                        ? "secondary"
                        : "light"
                    }
                    text={
                      row.budgetSource === "unlimited" ? undefined : "dark"
                    }
                    className="border"
                  >
                    {row.budgetSourceLabel}
                  </Badge>
                </td>
                <td
                  className={`${chatbotsDashboardTdClass} text-muted small text-nowrap`}
                  data-label="Last seen"
                >
                  {formatLastSeen(row.lastSeen)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DashboardTableCard>
    </>
  );
}
