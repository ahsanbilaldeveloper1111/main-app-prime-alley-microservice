import React from "react";
import { Button, Col, Row } from "react-bootstrap";
import {
  AlertCircle as AlertCircleIcon,
  ArrowDown,
  ArrowUp,
  Calendar,
  Clock as ClockIcon,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { CrmKPICard as KPICard } from "@components/crm/CrmListPageUi";

/** Subset of CRM list metrics used by the quotes list KPI strip (billing + CRM quotes). */
export type CrmQuotesListProspectKpiMetrics = {
  scheduled_records?: number;
  not_scheduled_records?: number;
  scheduled_next_hour_records?: number;
  scheduled_next_24_hours_records?: number;
  assigned_records?: number;
  unassigned_records?: number;
};

export type CrmQuotesListProspectKpiAnalyticsSectionProps = Readonly<{
  show: boolean;
  totalRecords: number;
  metrics: CrmQuotesListProspectKpiMetrics;
  showAllProspectStats: boolean;
  onToggleShowAllProspectStats: () => void;
}>;

/**
 * Collapsible “prospect” analytics KPI row (Total Prospects, scheduled counts, etc.)
 * shared by billing and CRM quotes list pages.
 */
export function CrmQuotesListProspectKpiAnalyticsSection({
  show,
  totalRecords,
  metrics,
  showAllProspectStats,
  onToggleShowAllProspectStats,
}: CrmQuotesListProspectKpiAnalyticsSectionProps) {
  if (!show) return null;

  return (
    <>
      <Row className="mb-2">
        <Col xl={3} lg={4} md={6} className="mb-3">
          <KPICard
            title="Total Prospects"
            value={totalRecords}
            icon={<Users size={24} />}
            color="primary"
          />
        </Col>
        <Col xl={3} lg={4} md={6} className="mb-3">
          <KPICard
            title="Prospects with Calls Scheduled"
            value={metrics.scheduled_records ?? 0}
            icon={<Calendar size={24} />}
            color="success"
          />
        </Col>
        <Col xl={3} lg={4} md={6} className="mb-3">
          <KPICard
            title="Prospects with No Calls Scheduled"
            value={metrics.not_scheduled_records ?? 0}
            icon={<XCircle size={24} />}
            color="secondary"
          />
        </Col>
        <Col xl={3} lg={4} md={6} className="mb-3">
          <KPICard
            title="Meetings in Next Hour"
            value={metrics.scheduled_next_hour_records ?? 0}
            icon={<ClockIcon size={24} />}
            color="info"
          />
        </Col>
        {showAllProspectStats ? (
          <>
            <Col xl={3} lg={4} md={6} className="mb-3">
              <KPICard
                title="Meetings in Next 24h"
                value={metrics.scheduled_next_24_hours_records ?? 0}
                icon={<Calendar size={24} />}
                color="warning"
              />
            </Col>
            <Col xl={3} lg={4} md={6} className="mb-3">
              <KPICard
                title="Prospects Assigned to Team Members"
                value={metrics.assigned_records ?? 0}
                icon={<UserPlus size={24} />}
                color="primary"
              />
            </Col>
            <Col xl={3} lg={4} md={6} className="mb-3">
              <KPICard
                title="Prospects Not Assigned to Team Members"
                value={metrics.unassigned_records ?? 0}
                icon={<AlertCircleIcon size={24} />}
                color="warning"
              />
            </Col>
          </>
        ) : null}
      </Row>

      <div className="text-center mb-4">
        <Button
          variant="link"
          onClick={onToggleShowAllProspectStats}
          className="text-decoration-none"
        >
          {showAllProspectStats ? (
            <>
              <ArrowUp size={16} className="me-1" />
              Show Less
            </>
          ) : (
            <>
              <ArrowDown size={16} className="me-1" />
              Show More Stats
            </>
          )}
        </Button>
      </div>
    </>
  );
}
