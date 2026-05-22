import { AlertTriangle, Wallet } from "lucide-react";
import React, { useMemo } from "react";
import { Alert, Card, Col, ProgressBar, Row, Spinner } from "react-bootstrap";

import { ChatBudgetUsageBar } from "../shared/ChatBudgetUsageBar";
import {
  aggregateTenantBudgetRows,
  clampUsedPct,
  formatBudgetPct,
  formatBudgetUsd,
  listTenantBudgetAttentionUsers,
  resolveTenantAggregateProgressVariant,
  type TenantBudgetAggregate,
  type TenantBudgetAttentionRow,
} from "../shared/chatBudgetUsage";

import type { TenantUserBudgetRow } from "./types";
import { useChatTenantUsersQuery } from "./useChatTenantUsersQuery";

function toAttentionRow(row: TenantUserBudgetRow): TenantBudgetAttentionRow {
  return {
    userId: row.userId,
    displayName: row.displayName,
    usedPct: row.usedPct,
    effectiveThresholdPct: row.effectiveThresholdPct,
    isExhausted: row.isExhausted,
    remainingUsd: row.remainingUsd,
    budgetSource: row.budgetSource,
    mtdSpend: row.mtdSpend,
    effectiveBudgetUsd: row.effectiveBudgetUsd,
  };
}

function formatPooledBudgetSubtitle(aggregate: TenantBudgetAggregate): string {
  const userLabel = aggregate.limitedUserCount === 1 ? "user" : "users";
  const unlimitedSuffix =
    aggregate.unlimitedUserCount > 0
      ? ` (${aggregate.unlimitedUserCount} unlimited)`
      : "";
  return `Rolled up across ${aggregate.limitedUserCount} ${userLabel} with a set budget${unlimitedSuffix}.`;
}

function BudgetOverviewLoadingCard(): React.ReactElement {
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="d-flex align-items-center gap-2 text-muted">
        <Spinner animation="border" size="sm" aria-hidden />
        Loading budget usage…
      </Card.Body>
    </Card>
  );
}

function BudgetOverviewErrorAlert(): React.ReactElement {
  return (
    <Alert variant="warning" className="mb-3">
      Budget usage could not be loaded. Open the Users budgets tab or refresh
      the page to try again.
    </Alert>
  );
}

function BudgetOverviewUnlimitedAlert(): React.ReactElement {
  return (
    <Alert variant="info" className="mb-3">
      All users have unlimited chat budgets — no monthly usage progress to
      display.
    </Alert>
  );
}

type BudgetOverviewContentProps = Readonly<{
  aggregate: TenantBudgetAggregate;
  attentionRows: TenantBudgetAttentionRow[];
}>;

function TenantDashboardBudgetOverviewContent({
  aggregate,
  attentionRows,
}: BudgetOverviewContentProps): React.ReactElement {
  const tenantVariant = resolveTenantAggregateProgressVariant(aggregate);
  const exhaustedVerb = aggregate.exhaustedCount === 1 ? " has" : "s have";
  const thresholdVerb = aggregate.atThresholdCount === 1 ? " is" : "s are";

  return (
    <div className="mb-3">
      {aggregate.exhaustedCount > 0 ? (
        <Alert variant="danger" className="d-flex align-items-start gap-2">
          <AlertTriangle size={18} className="flex-shrink-0 mt-1" aria-hidden />
          <span>
            <strong>{aggregate.exhaustedCount}</strong> user{exhaustedVerb}{" "}
            exhausted their monthly chat budget.
          </span>
        </Alert>
      ) : null}

      {aggregate.atThresholdCount > 0 ? (
        <Alert variant="warning" className="d-flex align-items-start gap-2">
          <AlertTriangle size={18} className="flex-shrink-0 mt-1" aria-hidden />
          <span>
            <strong>{aggregate.atThresholdCount}</strong> user{thresholdVerb}{" "}
            at or above their alert threshold.
          </span>
        </Alert>
      ) : null}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#7c3aed18",
                color: "#7c3aed",
              }}
              aria-hidden
            >
              <Wallet size={20} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-1 fw-semibold">Monthly budget usage</h5>
              <p className="mb-0 small text-muted">
                {formatPooledBudgetSubtitle(aggregate)}
              </p>
            </div>
          </div>

          <div className="mb-2 d-flex justify-content-between small">
            <span>
              <strong>{formatBudgetPct(aggregate.usedPct)}</strong> of pooled
              budget used
            </span>
            <span className="text-muted">
              {formatBudgetUsd(aggregate.totalSpendUsd, true)} /{" "}
              {formatBudgetUsd(aggregate.totalBudgetUsd)} MTD
            </span>
          </div>
          <ProgressBar
            now={clampUsedPct(aggregate.usedPct)}
            variant={tenantVariant}
            style={{ height: 8 }}
            aria-label="Tenant pooled monthly budget usage"
          />

          {attentionRows.length > 0 ? (
            <Row className="g-3 mt-3">
              {attentionRows.map((row) => (
                <Col key={row.userId} xs={12} md={6}>
                  <div className="border rounded p-2 h-100">
                    <div className="fw-medium small mb-2">{row.displayName}</div>
                    <ChatBudgetUsageBar row={row} barHeight={8} />
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <p className="small text-muted mb-0 mt-3">
              No users are at or above their alert threshold.
            </p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export type TenantDashboardBudgetOverviewProps = Readonly<{
  tenantId: string;
  active: boolean;
}>;

export function TenantDashboardBudgetOverview({
  tenantId,
  active,
}: TenantDashboardBudgetOverviewProps) {
  const { rows, isFetching, isError } = useChatTenantUsersQuery(tenantId, active);

  const attentionRows = useMemo(
    () => listTenantBudgetAttentionUsers(rows.map(toAttentionRow)),
    [rows],
  );

  const aggregate = useMemo(
    () => aggregateTenantBudgetRows(rows.map(toAttentionRow)),
    [rows],
  );

  if (!active) {
    return null;
  }

  if (isFetching && rows.length === 0) {
    return <BudgetOverviewLoadingCard />;
  }

  if (isError) {
    return <BudgetOverviewErrorAlert />;
  }

  if (!aggregate) {
    return <BudgetOverviewUnlimitedAlert />;
  }

  return (
    <TenantDashboardBudgetOverviewContent
      aggregate={aggregate}
      attentionRows={attentionRows}
    />
  );
}
