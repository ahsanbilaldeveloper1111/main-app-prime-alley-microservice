import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import {
  chatbotsDashboardTableClass,
  chatbotsDashboardTdClass,
  chatbotsDashboardThClass,
} from "@page-modules/chat/shared/chatbotsDashboardTable";
import { Filter, History, RefreshCw, Search } from "lucide-react";
import React from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import Select from "react-select";

import { CHAT_ADMIN_AUDIT_LOG_FETCH_ERROR_MESSAGE } from "@utils/chat";

import { formatAuditMeta } from "./formatAuditMeta";
import type { ChatAdminAuditLogPageCtx } from "./useChatAdminAuditLogPage";

export type ChatAdminAuditLogViewProps = Readonly<{
  ctx: ChatAdminAuditLogPageCtx;
}>;

export function ChatAdminAuditLogView({ ctx }: ChatAdminAuditLogViewProps) {
  const {
    draftFilters,
    updateDraft,
    selectedCompanyOption,
    companyOptions,
    companiesLoading,
    applyFilters,
    clearFilters,
    data,
    isLoading,
    isError,
    refetch,
  } = ctx;

  const rows = data?.rows ?? [];
  const count = data?.count ?? 0;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Chatbots · Audit Logs" />

      <PageHeader title="Audit Logs" showSearch={false} />

      <Container fluid className="px-2 px-sm-3 px-lg-4 pb-4">
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body>
            <h5 className="mb-3 fw-semibold d-flex align-items-center gap-2">
              <Filter size={18} className="text-primary" aria-hidden />
              Filters
            </h5>
            <Row className="g-3">
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
                  classNamePrefix="chat-audit-tenant"
                />
              </Col>
              <Col xs={12} md={6} lg={4}>
                <Form.Label className="small text-muted text-uppercase fw-semibold">
                  Event
                </Form.Label>
                <Form.Control
                  type="text"
                  value={draftFilters.event}
                  placeholder='Substring, e.g. "faq"'
                  onChange={(e) => updateDraft({ event: e.target.value })}
                />
              </Col>
              <Col xs={12} md={6} lg={4}>
                <Form.Label className="small text-muted text-uppercase fw-semibold">
                  Message search
                </Form.Label>
                <Form.Control
                  type="search"
                  value={draftFilters.q}
                  placeholder="Substring on message"
                  onChange={(e) => updateDraft({ q: e.target.value })}
                />
              </Col>
              <Col xs={12} md={6} lg={3}>
                <Form.Label className="small text-muted text-uppercase fw-semibold">
                  From (UTC)
                </Form.Label>
                <Form.Control
                  type="date"
                  value={draftFilters.from}
                  onChange={(e) => updateDraft({ from: e.target.value })}
                />
              </Col>
              <Col xs={12} md={6} lg={3}>
                <Form.Label className="small text-muted text-uppercase fw-semibold">
                  To (UTC)
                </Form.Label>
                <Form.Control
                  type="date"
                  value={draftFilters.to}
                  onChange={(e) => updateDraft({ to: e.target.value })}
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
                md={6}
                lg={3}
                className="d-flex align-items-end gap-2 flex-wrap"
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
                  aria-label="Refresh results"
                >
                  <RefreshCw size={16} aria-hidden />
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {isError && (
          <Alert
            variant="danger"
            className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2"
          >
            <span className="flex-grow-1">
              {CHAT_ADMIN_AUDIT_LOG_FETCH_ERROR_MESSAGE}
            </span>
            <Button variant="outline-danger" size="sm" onClick={refetch}>
              Retry
            </Button>
          </Alert>
        )}

        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                <History size={18} className="text-primary" aria-hidden />
                Events
              </h5>
              <span className="text-muted small">
                {isLoading && (
                  <span className="d-inline-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    Loading…
                  </span>
                )}
                {!isLoading && (
                  <span>{`${count} row${count === 1 ? "" : "s"}`}</span>
                )}
              </span>
            </div>

            <div className="table-responsive">
              <Table hover size="sm" className={chatbotsDashboardTableClass}>
                <thead className="table-light">
                  <tr>
                    <th className={chatbotsDashboardThClass}>Time (UTC)</th>
                    <th className={chatbotsDashboardThClass}>Tenant</th>
                    <th className={chatbotsDashboardThClass}>Event</th>
                    <th className={chatbotsDashboardThClass}>Message</th>
                    <th className={chatbotsDashboardThClass}>Target</th>
                    <th className={chatbotsDashboardThClass}>Actor</th>
                    <th className={chatbotsDashboardThClass}>Request ID</th>
                    <th className={chatbotsDashboardThClass}>Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {!isLoading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">
                        No audit events to display. Event data will load here once
                        the audit log API is available.
                      </td>
                    </tr>
                  ) : null}
                  {rows.map((row) => {
                    const target =
                      row.target_type || row.target_id
                        ? [row.target_type, row.target_id].filter(Boolean).join(" #")
                        : "—";
                    const metaText = formatAuditMeta(row.meta);
                    return (
                      <tr
                        key={`${row.request_id}-${row.ts}-${row.event}-${row.target_id ?? ""}`}
                      >
                        <td
                          className={`${chatbotsDashboardTdClass} text-nowrap small`}
                        >
                          {row.ts}
                        </td>
                        <td className={`${chatbotsDashboardTdClass} text-nowrap`}>
                          {row.tenant_id || "—"}
                        </td>
                        <td className={`${chatbotsDashboardTdClass} text-nowrap`}>
                          <code className="small">{row.event}</code>
                        </td>
                        <td className={chatbotsDashboardTdClass}>{row.message}</td>
                        <td className={`${chatbotsDashboardTdClass} small`}>
                          {target}
                        </td>
                        <td className={`${chatbotsDashboardTdClass} text-nowrap`}>
                          {row.actor ?? "—"}
                        </td>
                        <td
                          className={`${chatbotsDashboardTdClass} small text-break`}
                          style={{ maxWidth: 140 }}
                        >
                          {row.request_id}
                        </td>
                        <td
                          className={`${chatbotsDashboardTdClass} small text-break`}
                          style={{ maxWidth: 200 }}
                          title={metaText}
                        >
                          {metaText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </React.Fragment>
  );
}
