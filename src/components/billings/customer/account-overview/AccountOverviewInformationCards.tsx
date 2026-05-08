import React from "react";
import { Badge, Button, Card, Col, Row } from "react-bootstrap";
import {
  Clock,
  DollarSign,
  Edit,
  FileText,
  Mail,
  Phone,
  User,
  Users,
} from "lucide-react";
import type { BillingCustomerView } from "./accountOverviewTypes";
import { formatUnknownAmount } from "./accountOverviewParsing";
import { formatVatRateString } from "./accountOverviewVat";

export type AccountOverviewInformationCardsProps = Readonly<{
  selectedCompanyId: string | number;
  isLoadingCustomer: boolean;
  companyDetails: BillingCustomerView | null;
  selectedCompanyName: string;
  onOpenTaxEdit: () => void;
  paymentMethodBody: React.ReactNode;
}>;

export function AccountOverviewInformationCards({
  selectedCompanyId,
  isLoadingCustomer,
  companyDetails,
  selectedCompanyName,
  onOpenTaxEdit,
  paymentMethodBody,
}: AccountOverviewInformationCardsProps) {
  const profile = companyDetails?.profile;

  return (
    <Row>
      <Col md={6} lg={3} className="mb-3">
        <Card className="billing-details-cards">
          <Card.Body className="p-2">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <div className="d-flex align-items-center gap-2 min-w-0">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: "rgba(251, 191, 36, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={14} style={{ color: "#fbbf24" }} />
                </div>
                <h6
                  className="mb-0 text-truncate"
                  style={{ fontWeight: "600", fontSize: "0.85rem" }}
                >
                  Tax Information
                </h6>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                className="flex-shrink-0 py-0 px-2"
                style={{ fontSize: "0.7rem", lineHeight: 1.5 }}
                disabled={!selectedCompanyId || isLoadingCustomer}
                onClick={onOpenTaxEdit}
                title="Edit VAT rate and exemption"
              >
                <Edit size={12} className="me-1" aria-hidden />
                Edit
              </Button>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                VAT Number
              </small>
              <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                {profile?.tax_id || "N/A"}
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                VAT Rate
              </small>
              <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                {profile?.vat_rate != null &&
                String(profile.vat_rate).trim() !== ""
                  ? `${formatVatRateString(profile.vat_rate)} %`
                  : "N/A"}
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1">
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Exemption
              </small>
              <Badge
                bg="secondary"
                style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem" }}
              >
                {profile?.vat_exemption ? "Yes" : "No"}
              </Badge>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={3} className="mb-3">
        <Card className="billing-details-cards">
          <Card.Body className="p-2">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <Users size={14} style={{ color: "#3b82f6" }} />
                </div>
                <h6
                  className="mb-0"
                  style={{ fontWeight: "600", fontSize: "0.85rem" }}
                >
                  Billing Contact
                </h6>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 py-1 border-bottom">
              <User size={12} style={{ color: "#3b82f6" }} />
              <p
                className="mb-0 text-truncate flex-grow-1 text-capitalize"
                style={{ fontSize: "0.75rem", fontWeight: "500" }}
              >
                {selectedCompanyName}
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 py-1 border-bottom">
              <Mail size={12} style={{ color: "#3b82f6" }} />
              <p
                className="mb-0 text-truncate flex-grow-1 text-lowercase"
                style={{ fontSize: "0.75rem", fontWeight: "500" }}
              >
                {companyDetails?.email}
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 py-1">
              <Phone size={12} style={{ color: "#3b82f6" }} />
              <p
                className="mb-0 flex-grow-1"
                style={{ fontSize: "0.75rem", fontWeight: "500" }}
              >
                {companyDetails?.phone}
              </p>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={3} className="mb-3">
        <Card className="billing-details-cards">
          <Card.Body className="p-2">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "rgba(34, 211, 238, 0.1)",
                  flexShrink: 0,
                }}
              >
                <Clock size={14} style={{ color: "#22d3ee" }} />
              </div>
              <h6
                className="mb-0"
                style={{ fontWeight: "600", fontSize: "0.85rem" }}
              >
                Payment Terms
              </h6>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Payment Due
              </small>
              <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                Net {profile?.payment_terms} days
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Late Fee
              </small>
              <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                {formatUnknownAmount(profile?.late_fee_rule)}
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Payment Mode
              </small>
              <span
                className="fw-semibold text-capitalize"
                style={{ fontSize: "0.8rem" }}
              >
                {typeof profile?.payment_mode === "string"
                  ? profile.payment_mode.replace("_", " ")
                  : undefined}
              </span>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={3} className="mb-3">
        <Card className="billing-details-cards">
          <Card.Body className="p-2">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "rgba(168, 85, 247, 0.1)",
                  flexShrink: 0,
                }}
              >
                <DollarSign size={14} style={{ color: "#a855f7" }} />
              </div>
              <h6
                className="mb-0"
                style={{ fontWeight: "600", fontSize: "0.85rem" }}
              >
                Payment Method
              </h6>
            </div>

            {paymentMethodBody}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
