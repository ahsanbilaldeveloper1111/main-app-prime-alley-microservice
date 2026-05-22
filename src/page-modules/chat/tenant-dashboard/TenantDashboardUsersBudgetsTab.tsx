import { AlertTriangle, RefreshCw, Users, Wallet } from "lucide-react";
import React, { useMemo } from "react";
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

function countExhaustedUsers(rows: readonly TenantUserBudgetRow[]): number {
  return rows.filter((r) => r.isExhausted).length;
}

function countAtThresholdUsers(rows: readonly TenantUserBudgetRow[]): number {
  return rows.filter(
    (r) =>
      !isUnlimitedBudgetSource(r.budgetSource) &&
      !r.isExhausted &&
      clampUsedPct(r.usedPct) >= r.effectiveThresholdPct,
  ).length;
}

function resolveUsersBudgetsErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to load user budgets.";
}

function UsersBudgetsLoadingState(): React.ReactElement {
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

type BudgetAttentionSummaryAlertProps = Readonly<{
  exhaustedCount: number;
  atThresholdCount: number;
}>;

function BudgetAttentionSummaryAlert({
  exhaustedCount,
  atThresholdCount,
}: BudgetAttentionSummaryAlertProps): React.ReactNode {
  if (exhaustedCount === 0 && atThresholdCount === 0) {
    return null;
  }

  const variant = exhaustedCount > 0 ? "danger" : "warning";
  const exhaustedVerb = exhaustedCount === 1 ? " has" : "s have";
  const thresholdVerb = atThresholdCount === 1 ? " is" : "s are";

  return (
    <Alert variant={variant} className="d-flex align-items-start gap-2">
      <AlertTriangle size={18} className="flex-shrink-0 mt-1" aria-hidden />
      <span>
        {exhaustedCount > 0 ? (
          <>
            <strong>{exhaustedCount}</strong> user{exhaustedVerb} exhausted their
            budget.
            {atThresholdCount > 0 ? " " : null}
          </>
        ) : null}
        {atThresholdCount > 0 ? (
          <>
            <strong>{atThresholdCount}</strong> user{thresholdVerb} at or above
            the alert threshold.
          </>
        ) : null}
      </span>
    </Alert>
  );
}

type StatIconCardProps = Readonly<{
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}>;

function StatIconCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: StatIconCardProps): React.ReactElement {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="d-flex align-items-center gap-3">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center"
          style={{
            width: 40,
            height: 40,
            backgroundColor: iconBg,
            color: iconColor,
          }}
          aria-hidden
        >
          {icon}
        </div>
        <div>
          <div className="text-muted small text-uppercase fw-semibold">
            {label}
          </div>
          <div className="fs-4 fw-semibold">{value}</div>
        </div>
      </Card.Body>
    </Card>
  );
}

type UsersBudgetsStatsRowProps = Readonly<{
  count: number;
  atThresholdCount: number;
  exhaustedCount: number;
  isFetching: boolean;
  onRefresh: () => void;
}>;

function UsersBudgetsStatsRow({
  count,
  atThresholdCount,
  exhaustedCount,
  isFetching,
  onRefresh,
}: UsersBudgetsStatsRowProps): React.ReactElement {
  return (
    <Row className="g-3 mb-3">
      <Col xs={12} sm={6} md={3}>
        <StatIconCard
          label="Users"
          value={count}
          icon={<Users size={20} />}
          iconBg="#2563eb18"
          iconColor="#2563eb"
        />
      </Col>
      <Col xs={12} sm={6} md={3}>
        <StatIconCard
          label="At threshold"
          value={atThresholdCount}
          icon={<AlertTriangle size={20} />}
          iconBg="#d9770618"
          iconColor="#d97706"
        />
      </Col>
      <Col xs={12} sm={6} md={3}>
        <StatIconCard
          label="Budget exhausted"
          value={exhaustedCount}
          icon={<Wallet size={20} />}
          iconBg="#dc262618"
          iconColor="#dc2626"
        />
      </Col>
      <Col
        xs={12}
        md={3}
        className="d-flex align-items-center justify-content-md-end"
      >
        <Button
          variant="outline-primary"
          size="sm"
          onClick={onRefresh}
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
  );
}

function UserBudgetTableRow({
  row,
}: Readonly<{ row: TenantUserBudgetRow }>): React.ReactElement {
  const isUnlimited = row.budgetSource === "unlimited";

  return (
    <tr key={row.userId}>
      <td
        className={`${chatbotsDashboardTdClass} ${chatbotsDashboardColUserClass} fw-medium`}
        data-label="User"
      >
        <div>{row.displayName}</div>
        {row.displayName === row.userId ? null : (
          <code className="small text-muted d-block">{row.userId}</code>
        )}
        {row.isExhausted ? <Badge bg="danger">Exhausted</Badge> : null}
      </td>
      <td className={chatbotsDashboardTdClass} data-label="Row budget">
        {formatNullableUsd(row.monthlyBudgetUsd)}
      </td>
      <td className={chatbotsDashboardTdClass} data-label="Row threshold">
        {row.budgetThresholdPct == null
          ? "—"
          : formatBudgetPct(row.budgetThresholdPct)}
      </td>
      <td className={chatbotsDashboardTdClass} data-label="Effective budget">
        {formatBudgetUsd(row.effectiveBudgetUsd)}
      </td>
      <td className={chatbotsDashboardTdClass} data-label="Effective threshold">
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
          bg={isUnlimited ? "secondary" : "light"}
          text={isUnlimited ? undefined : "dark"}
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
  );
}

type UsersBudgetsTableProps = Readonly<{
  rows: TenantUserBudgetRow[];
  isFetching: boolean;
}>;

function UsersBudgetsTable({
  rows,
  isFetching,
}: UsersBudgetsTableProps): React.ReactElement {
  return (
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
            <UserBudgetTableRow key={row.userId} row={row} />
          ))}
        </tbody>
      </Table>
    </DashboardTableCard>
  );
}

type UsersBudgetsTabBodyProps = Readonly<{
  rows: TenantUserBudgetRow[];
  count: number;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  exhaustedCount: number;
  atThresholdCount: number;
  onRefresh: () => void;
}>;

function UsersBudgetsTabBody({
  rows,
  count,
  isFetching,
  isError,
  error,
  exhaustedCount,
  atThresholdCount,
  onRefresh,
}: UsersBudgetsTabBodyProps): React.ReactElement {
  return (
    <>
      {isError ? (
        <Alert
          variant="danger"
          className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2"
        >
          <span className="flex-grow-1">
            {resolveUsersBudgetsErrorMessage(error)}
          </span>
          <Button variant="outline-danger" size="sm" onClick={onRefresh}>
            Retry
          </Button>
        </Alert>
      ) : null}

      <BudgetAttentionSummaryAlert
        exhaustedCount={exhaustedCount}
        atThresholdCount={atThresholdCount}
      />

      <UsersBudgetsStatsRow
        count={count}
        atThresholdCount={atThresholdCount}
        exhaustedCount={exhaustedCount}
        isFetching={isFetching}
        onRefresh={onRefresh}
      />

      <UsersBudgetsTable rows={rows} isFetching={isFetching} />
    </>
  );
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

  const exhaustedCount = useMemo(() => countExhaustedUsers(rows), [rows]);
  const atThresholdCount = useMemo(() => countAtThresholdUsers(rows), [rows]);

  const handleRefresh = () => {
    refetch().catch(() => undefined);
  };

  if (isFetching && rows.length === 0) {
    return <UsersBudgetsLoadingState />;
  }

  return (
    <UsersBudgetsTabBody
      rows={rows}
      count={count}
      isFetching={isFetching}
      isError={isError}
      error={error}
      exhaustedCount={exhaustedCount}
      atThresholdCount={atThresholdCount}
      onRefresh={handleRefresh}
    />
  );
}
