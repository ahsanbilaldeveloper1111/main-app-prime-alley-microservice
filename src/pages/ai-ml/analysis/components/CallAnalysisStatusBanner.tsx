import type { AnalysisStepEntry } from "@pages/ai-ml/analysis/types";

import React from "react";

import { Card, Col, Row, Spinner } from "react-bootstrap";



type Props = Readonly<{

  steps: AnalysisStepEntry[];

  currentStep: string | null;

}>;



export function CallAnalysisStatusBanner({ steps, currentStep }: Props) {

  const isProcessingCurrentStep =

    Boolean(currentStep) &&

    steps.some((s) => s.step === currentStep && s.status === "processing");



  const isCompleteIdle = steps.some((s) => s.status === "done") && !currentStep;



  const currentStepEntry = currentStep ? steps.find((s) => s.step === currentStep) : undefined;



  let bannerBody: React.ReactNode;

  if (isProcessingCurrentStep) {

    bannerBody = (

      <>

        <div className="me-3">

          <Spinner animation="border" size="sm" variant="primary" className="me-2" />

        </div>

        <div className="flex-grow-1">

          <div className="d-flex align-items-center mb-1">

            <span className="badge bg-primary bg-opacity-10 text-primary me-2 px-2 py-1">

              <i className="ti ti-brain me-1" aria-hidden />

              {"Processing..."}

            </span>

            <span className="text-muted small text-capitalize">

              {currentStepEntry?.message || `${(currentStep ?? "").replaceAll("_", " ").toLowerCase()}...`}

            </span>

          </div>

          <div className="skeleton-container mt-2">

            <div className="skeleton-text" style={{ height: "8px", width: "100%", animationDelay: "0s" }} />

            <div className="skeleton-text" style={{ height: "8px", width: "75%", animationDelay: "0.1s" }} />

          </div>

        </div>

      </>

    );

  } else if (isCompleteIdle) {

    bannerBody = (

      <>

        <div className="me-3">

          <i className="ti ti-check-circle text-success icon-large"></i>

        </div>

        <div className="flex-grow-1">

          <h6 className="mb-1 text-success fw-bold">Analysis Complete</h6>

          <p className="text-muted small mb-0">All steps have been processed successfully. Review the results below.</p>

        </div>

      </>

    );

  } else {

    bannerBody = (

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

              <div className="d-flex align-items-center flex-grow-1">{bannerBody}</div>

            </div>

          </Card.Body>

        </Card>

      </Col>

    </Row>

  );

}

