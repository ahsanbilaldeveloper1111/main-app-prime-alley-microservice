import type { AnalysisStepEntry } from "@page-modules/ai-ml/analysis/types";
import React from "react";
import { Card, Col, Row, Spinner } from "react-bootstrap";

type Props = Readonly<{
  steps: AnalysisStepEntry[];
  currentStep: string | null;
}>;

export function CallAnalysisStatusBanner({ steps, currentStep }: Props) {
  const isCurrentStepProcessing =
    Boolean(currentStep) &&
    steps.some((s) => s.step === currentStep && s.status === "processing");
  const isCompleteWithoutCurrentStep =
    steps.some((s) => s.status === "done") && !currentStep;

  let main: React.ReactNode;
  if (isCurrentStepProcessing && currentStep) {
    const stepMessage = steps.find((s) => s.step === currentStep)?.message;
    const subtitleLabel =
      stepMessage || `${currentStep.replaceAll("_", " ").toLowerCase()}...`;

    main = (
      <>
        <div className="me-3">
          <Spinner animation="border" size="sm" variant="primary" className="me-2" />
        </div>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center mb-1">
            <span className="badge bg-primary bg-opacity-10 text-primary me-2 px-2 py-1">
              <i className="ti ti-brain me-1"></i>{" "}
              Processing...
            </span>
            <span className="text-muted small text-capitalize">{subtitleLabel}</span>
          </div>
          <div className="skeleton-container mt-2">
            <div
              className="skeleton-text"
              style={{ height: "8px", width: "100%", animationDelay: "0s" }}
            />
            <div
              className="skeleton-text"
              style={{ height: "8px", width: "75%", animationDelay: "0.1s" }}
            />
          </div>
        </div>
      </>
    );
  } else if (isCompleteWithoutCurrentStep) {
    main = (
      <>
        <div className="me-3">
          <i className="ti ti-check-circle text-success icon-large"></i>
        </div>
        <div className="flex-grow-1">
          <h6 className="mb-1 text-success fw-bold">Analysis Complete</h6>
          <p className="text-muted small mb-0">
            All steps have been processed successfully. Review the results below.
          </p>
        </div>
      </>
    );
  } else {
    main = (
      <>
        <div className="me-3">
          <Spinner animation="border" size="sm" variant="secondary" className="me-2" />
        </div>
        <div className="flex-grow-1">
          <h6 className="mb-1">Preparing Analysis</h6>
          <p className="text-muted small mb-0">Initializing analysis pipeline...</p>
        </div>
      </>
    );
  }

  return (
    <Row className="mb-3">
      <Col md={12}>
        <Card className="border-0 shadow-sm">
          <Card.Body className="py-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center flex-grow-1">{main}</div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
