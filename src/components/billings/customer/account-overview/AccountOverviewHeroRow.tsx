import React from "react";
import { Card, Col, Row, Button } from "react-bootstrap";
import { Users, Wallet } from "lucide-react";
import { formatNumber } from "@utils/Helper";
import { formatUnknownAmount } from "./accountOverviewParsing";
import type {
  BillingCustomerView,
  OverviewDashboardCounters,
} from "./accountOverviewTypes";

export type AccountOverviewHeroRowProps = Readonly<{
  selectedCompanyName: string;
  selectedCompanyId: string | number;
  companyDetails: BillingCustomerView | null;
  dashboardCounters: OverviewDashboardCounters | null;
  onPayNow: () => void;
  onViewInvoices: () => void;
}>;

export function AccountOverviewHeroRow({
  selectedCompanyName,
  selectedCompanyId,
  companyDetails,
  dashboardCounters,
  onPayNow,
  onViewInvoices,
}: AccountOverviewHeroRowProps) {
  const currencyLabel =
    typeof companyDetails?.profile?.currency === "string"
      ? companyDetails.profile.currency
      : typeof companyDetails?.profile?.currency_code === "string"
        ? companyDetails.profile.currency_code
        : "";

  return (
    <Row className="mb-3">
      <Col lg={8} className="mb-3">
        <Card
          style={{ border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
        >
          <Card.Body className="p-3">
            <div className="d-flex align-items-start gap-3 mb-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  flexShrink: 0,
                }}
              >
                <Users size={20} style={{ color: "#3b82f6" }} />
              </div>
              <div className="flex-grow-1">
                <h5
                  className="mb-1"
                  style={{ fontWeight: "600", fontSize: "1rem" }}
                >
                  {selectedCompanyName ?? selectedCompanyId}
                </h5>
                {companyDetails ? (
                  <p
                    className="text-muted mb-0"
                    style={{ fontSize: "0.70rem" }}
                  >
                    {companyDetails?.profile?.address}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className="p-2 rounded d-flex justify-content-between align-items-center"
              style={{ backgroundColor: "#f8f9fa" }}
            >
              <div>
                <small
                  className="text-muted d-block"
                  style={{ fontSize: "0.75rem" }}
                >
                  Total Invoice Amount
                </small>
                <h4
                  className="mb-0"
                  style={{ fontWeight: "700", fontSize: "1.3rem" }}
                >
                  {currencyLabel}{" "}
                  {formatNumber(
                    Number(dashboardCounters?.invoices?.total_amount ?? 0),
                  )}
                </h4>
              </div>
              <div className="d-flex gap-2">
                <Button
                  onClick={onPayNow}
                  variant="primary"
                  size="sm"
                  style={{
                    fontSize: "0.85rem",
                    padding: "0.4rem 1rem",
                    fontWeight: "600",
                  }}
                >
                  Pay Now
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={4} className="mb-3">
        <Card
          style={{ border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
        >
          <Card.Body className="p-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  flexShrink: 0,
                }}
              >
                <Wallet size={16} style={{ color: "#22c55e" }} />
              </div>
              <h6
                className="mb-0"
                style={{ fontWeight: "600", fontSize: "0.9rem" }}
              >
                Account Balance
              </h6>
            </div>

            <div className="d-flex justify-content-between align-items-center py-2">
              <small className="text-muted" style={{ fontSize: "0.8rem" }}>
                Pending Amount
              </small>
              <span className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                {currencyLabel}{" "}
                {formatUnknownAmount(companyDetails?.account_balance)}
              </span>
            </div>
            <div className="d-flex justify-content-end">
              <Button
                onClick={onViewInvoices}
                variant="outline-secondary"
                size="sm"
                style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}
              >
                View Invoices
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
