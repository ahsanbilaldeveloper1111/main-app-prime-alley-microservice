import { Building2, Filter, RefreshCw, Search, Users, Wallet } from "lucide-react";
import React from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  ProgressBar,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import Select from "react-select";

import {
  chatbotsDashboardColTenantClass,
  chatbotsDashboardColUserClass,
  chatbotsDashboardTdClass,
  chatbotsDashboardThClass,
  chatbotsDashboardThWrapClass,
  chatbotsDashboardUsersBudgetsTableClass,
} from "../shared/chatbotsDashboardTable";
import { DashboardTableCard } from "../shared/DashboardTableCard";

import type { AdminUserBudgetRow } from "./types";
import { useChatAdminUsersPage } from "./useChatAdminUsersPage";

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd4 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const pct1 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatUsd(value: string | null | undefined, precise = false): string {
  const trimmed = value?.trim();
  if (!trimmed) return "—";
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n)) return trimmed;
  return precise ? usd4.format(n) : usd2.format(n);
}

function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${pct1.format(value)}%`;
}

function formatNullableUsd(value: string | null): string {
  if (value == null) return "—";
  return formatUsd(value);
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

function computeRemainingUsd(row: AdminUserBudgetRow): string | null {
  const budget = Number.parseFloat(row.effectiveBudgetUsd);
  const spend = Number.parseFloat(row.mtdSpend);
  if (!Number.isFinite(budget) || !Number.isFinite(spend)) return null;
  return (budget - spend).toFixed(4);
}

function UsedPctBar({ row }: Readonly<{ row: AdminUserBudgetRow }>) {
  const pct = Math.min(100, Math.max(0, row.usedPct));
  let variant: "success" | "warning" | "danger" = "success";
  if (row.isExhausted) {
    variant = "danger";
  } else if (pct >= row.effectiveThresholdPct) {
    variant = "warning";
  }
  const remaining = computeRemainingUsd(row);

  return (
    <div className="tenant-dashboard-users__usage">
      <div className="d-flex justify-content-between small mb-1">
        <span>{pct1.format(pct)}%</span>
        {remaining != null ? (
          <span className="text-muted">{formatUsd(remaining, true)} left</span>
        ) : null}
      </div>
      <ProgressBar
        now={pct}
        variant={variant}
        style={{ height: 6 }}
        aria-label={`${row.displayName} budget used ${pct}%`}
      />
    </div>
  );
}

export type AdminDashboardUsersBudgetsTabProps = Readonly<{
  active: boolean;
}>;

export function AdminDashboardUsersBudgetsTab({
  active,
}: AdminDashboardUsersBudgetsTabProps) {
  const {
    updateDraft,
    selectedCompanyOption,
    companyOptions,
    companiesLoading,
    applyFilters,
    clearFilters,
    rows,
    count,
    totalCount,
    isLoading,
    isError,
    error,
    refetch,
  } = useChatAdminUsersPage(active);

  const tenantCount = new Set(rows.map((r) => r.tenantId).filter(Boolean)).size;
  const isFetching = isLoading;

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
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <h5 className="mb-3 fw-semibold d-flex align-items-center gap-2">
            <Filter size={18} className="text-primary" aria-hidden />
            Filters
          </h5>
          <Row className="g-3 align-items-end">
            <Col xs={12} md={6} lg={4}>
              <Form.Label className="small text-muted text-uppercase fw-semibold">
                Tenant
              </Form.Label>
              <Select
                isLoading={companiesLoading}
                options={companyOptions}
                value={selectedCompanyOption}
                onChange={(opt) => updateDraft({ tenantId: opt?.value ?? "" })}
                placeholder="All tenants"
                isClearable
                classNamePrefix="chat-admin-users-tenant"
              />
            </Col>
            <Col xs={12} className="d-flex gap-2 flex-wrap pb-1">
              <Button
                variant="primary"
                onClick={applyFilters}
                disabled={isFetching}
              >
                <Search size={16} className="me-2" aria-hidden />
                Search
              </Button>
              <Button variant="outline-secondary" onClick={clearFilters}>
                Clear
              </Button>
            </Col>
          </Row>
          {totalCount !== count ? (
            <p className="text-muted small mb-0 mt-2">
              Showing {count} of {totalCount} users
            </p>
          ) : null}
        </Card.Body>
      </Card>

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

      <Row className="g-3 mb-3">
        <Col xs={12} sm={6} md={4}>
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
        <Col xs={12} sm={6} md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center gap-3">
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
                <Building2 size={20} />
              </div>
              <div>
                <div className="text-muted small text-uppercase fw-semibold">
                  Tenants
                </div>
                <div className="fs-4 fw-semibold">{tenantCount}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
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
                <div className="fs-4 fw-semibold">
                  {rows.filter((r) => r.isExhausted).length}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} className="d-flex justify-content-md-end">
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
            <col className="chatbots-dashboard__col-tenant-width" />
            <col className="chatbots-dashboard__col-user-width" />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>
          <thead className="table-light">
            <tr>
              <th
                className={`${chatbotsDashboardThWrapClass} ${chatbotsDashboardColTenantClass}`}
              >
                Tenant
              </th>
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
              <th className={chatbotsDashboardThClass}>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {!isFetching && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-muted py-4">
                  No users found.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={`${row.tenantId}-${row.userId}`}>
                <td
                  className={`${chatbotsDashboardTdClass} ${chatbotsDashboardColTenantClass} fw-medium`}
                  data-label="Tenant"
                >
                  <div>{row.tenantName}</div>
                  {row.tenantName === row.tenantId ? null : (
                    <code className="small text-muted d-block">
                      {row.tenantId}
                    </code>
                  )}
                </td>
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
                  {formatUsd(row.effectiveBudgetUsd)}
                </td>
                <td
                  className={chatbotsDashboardTdClass}
                  data-label="Effective threshold"
                >
                  {formatPct(row.effectiveThresholdPct)}
                </td>
                <td className={chatbotsDashboardTdClass} data-label="MTD spend">
                  {formatUsd(row.mtdSpend, true)}
                </td>
                <td
                  className={chatbotsDashboardTdClass}
                  data-label="Usage"
                  style={{ minWidth: 140 }}
                >
                  <UsedPctBar row={row} />
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
