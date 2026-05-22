import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import { useFaqProfilesPage } from "../useFaqProfilesPage";
import { Building2, Bot, ChevronRight, Globe, RefreshCw } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import Select from "react-select";
import React, { useMemo } from "react";
import type { ChatTrainingStatusResponse } from "@utils/chat";
import {
  findChatCompanySelectOption,
  mapChatCompaniesToSelectOptions,
} from "@page-modules/chat/shared/chatCompanySelectOptions";
import { ChatTrainingResultModal } from "@page-modules/chat/shared/ChatTrainingResultModal";

function formatTrainingLastUpdated(value: string | null): string {
  if (value == null || value === "") {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

type FaqTrainingStatusDetailsProps = Readonly<{
  tenantId: string;
  loading: boolean;
  errorMessage: string | null;
  status: ChatTrainingStatusResponse | null;
}>;

function FaqTrainingStatusDetails({
  tenantId,
  loading,
  errorMessage,
  status,
  showCompanyFilter,
}: FaqTrainingStatusDetailsProps & { showCompanyFilter: boolean }) {
  if (errorMessage) {
    return (
      <Alert variant="danger" className="mb-0">
        {errorMessage}
      </Alert>
    );
  }
  const tenantTrimmed = tenantId.trim();
  if (tenantTrimmed === "") {
    return (
      <p className="text-muted small mb-0">
        {showCompanyFilter
          ? "Choose a company to load training status."
          : "Your account is not linked to a company."}
      </p>
    );
  }
  if (loading && status == null) {
    return (
      <div className="d-flex align-items-center gap-2 text-muted">
        <Spinner animation="border" size="sm" />
        <span>Loading status…</span>
      </div>
    );
  }
  if (status == null) {
    return null;
  }
  return (
    <div className="row g-3 small">
      <div className="col-md-6 col-lg-4">
        <div className="text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>
          Trained
        </div>
        <div className="mt-1">
          {status.is_trained ? (
            <Badge bg="success">Yes</Badge>
          ) : (
            <Badge bg="secondary">Not yet</Badge>
          )}
        </div>
      </div>
      <div className="col-md-6 col-lg-4">
        <div className="text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>
          Last updated
        </div>
        <div className="mt-1 fw-medium">{formatTrainingLastUpdated(status.last_updated)}</div>
      </div>
      <div className="col-md-6 col-lg-4">
        <div className="text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>
          Processed files / FAQs
        </div>
        <div className="mt-1 fw-medium">
          {status.processed_files} / {status.processed_faqs}
        </div>
      </div>
      <div className="col-12">
        <div className="text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>
          Vector store path
        </div>
        <div className="mt-1 font-monospace text-break small">
          {status.vector_store_path ?? "—"}
        </div>
      </div>
    </div>
  );
}

export type FaqProfilesPageViewProps = Readonly<{
  ctx: ReturnType<typeof useFaqProfilesPage>;
}>;

export function FaqProfilesPageView({ ctx }: FaqProfilesPageViewProps) {
  const {
    router,
    companies,
    companiesLoading,
    showCompanyModal,
    setShowCompanyModal,
    showTrainingModal,
    trainingResponse,
    selectedCompanyId,
    setSelectedCompanyId,
    handleTrainBotClick,
    handleCompanySubmit,
    closeTrainingModal,
    trainingLoading,
    statusTenantId,
    setStatusTenantId,
    trainingStatus,
    trainingStatusLoading,
    trainingStatusErrorMessage,
    refetchTrainingStatus,
    showCompanyFilter,
  } = ctx;

  const companyOptions = useMemo(
    () => mapChatCompaniesToSelectOptions(companies),
    [companies],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="" />

      <PageHeader
        title=""
        showSearch={false}
        buttons={
          <Button variant="primary" onClick={handleTrainBotClick} disabled={trainingLoading}>
            {trainingLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Training...
              </>
            ) : (
              <>
                <Bot size={16} className="me-2" />
                Train Bot
              </>
            )}
          </Button>
        }
      />

      <Container fluid className="mb-4">
        <Card className="shadow-sm border-0" style={{ border: "1px solid #e9ecef" }}>
          <Card.Body>
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
              <div>
                <h5 className="mb-1" style={{ color: "#263238", fontWeight: 600 }}>
                  Bot training status
                </h5>
                <p className="text-muted small mb-0">
                  {showCompanyFilter
                    ? "Select a company to see whether the bot has been trained and when data was last processed."
                    : "Training status for your company."}
                </p>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => refetchTrainingStatus()}
                  disabled={trainingStatusLoading || !statusTenantId.trim()}
                >
                  {trainingStatusLoading ? (
                    <Spinner animation="border" size="sm" className="me-1" />
                  ) : (
                    <RefreshCw size={14} className="me-1" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
            {showCompanyFilter ? (
              <Form.Group className="mb-3" style={{ maxWidth: "420px" }}>
                <Form.Label>Company (tenant)</Form.Label>
                <Select
                  isLoading={companiesLoading}
                  options={companyOptions}
                  value={findChatCompanySelectOption(companies, statusTenantId)}
                  onChange={(opt) => setStatusTenantId(opt?.value ?? "")}
                  placeholder="Select company to load status..."
                  isClearable
                />
              </Form.Group>
            ) : null}

            <FaqTrainingStatusDetails
              tenantId={statusTenantId}
              loading={trainingStatusLoading}
              errorMessage={trainingStatusErrorMessage}
              status={trainingStatus}
              showCompanyFilter={showCompanyFilter}
            />
          </Card.Body>
        </Card>
      </Container>

      <Container fluid className="">
        <Row className="g-4">
          <Col md={6}>
            <Card
              className="h-100 shadow-sm"
              style={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "1px solid #e9ecef",
              }}
              onClick={() => router.push("/chat/ai-faqs/tenant")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }}
            >
              <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                  }}
                >
                  <Building2 size={40} />
                </div>
                <h4 className="mb-3" style={{ color: "#263238", fontWeight: "600" }}>
                  Tenant FAQs
                </h4>
                <p className="text-muted mb-4" style={{ fontSize: "0.95rem" }}>
                  Manage and configure tenant-specific frequently asked questions for your AI chat system.
                </p>
                <div
                  className="d-flex align-items-center text-primary"
                  style={{ fontSize: "0.9rem", fontWeight: "500" }}
                >
                  View Tenant FAQs
                  <ChevronRight size={18} className="ms-1" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card
              className="h-100 shadow-sm"
              style={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "1px solid #e9ecef",
              }}
              onClick={() => router.push("/chat/ai-faqs/global")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }}
            >
              <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "white",
                  }}
                >
                  <Globe size={40} />
                </div>
                <h4 className="mb-3" style={{ color: "#263238", fontWeight: "600" }}>
                  Global FAQs
                </h4>
                <p className="text-muted mb-4" style={{ fontSize: "0.95rem" }}>
                  Manage and configure global frequently asked questions that apply across all tenants.
                </p>
                <div
                  className="d-flex align-items-center text-primary"
                  style={{ fontSize: "0.9rem", fontWeight: "500" }}
                >
                  View Global FAQs
                  <ChevronRight size={18} className="ms-1" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {showCompanyFilter ? (
      <Modal
        show={showCompanyModal}
        onHide={() => !trainingLoading && setShowCompanyModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <Bot size={20} />
            Train Bot
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Company</Form.Label>
            <Select
              isLoading={companiesLoading}
              options={companyOptions}
              value={findChatCompanySelectOption(companies, selectedCompanyId)}
              onChange={(opt) => setSelectedCompanyId(opt?.value ?? "")}
              placeholder="Select company..."
              isClearable
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompanyModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCompanySubmit} disabled={!selectedCompanyId?.trim()}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
      ) : null}

      <ChatTrainingResultModal
        show={showTrainingModal}
        response={trainingResponse}
        onClose={closeTrainingModal}
      />
    </React.Fragment>
  );
}
