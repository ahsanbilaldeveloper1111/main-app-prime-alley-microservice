import type { AnalysisStepEntry } from "@pages/ai-ml/analysis/types";
import React from "react";
import { Card, Col, Row, Spinner } from "react-bootstrap";

type Props = Readonly<{
  steps: AnalysisStepEntry[];
  currentStep: string | null;
}>;

type StepVisualState = "active" | "done" | "error" | "pending";

function stepVisualStateClass(
  isActive: boolean,
  isCompleted: boolean,
  stepIsError: boolean,
): StepVisualState {
  if (isActive) return "active";
  if (isCompleted) return "done";
  if (stepIsError) return "error";
  return "pending";
}

function stepCircleInner(
  isCompleted: boolean,
  stepIsError: boolean,
  isActive: boolean,
  stepNumber: number,
): React.ReactNode {
  if (isCompleted) {
    return <i className="ti ti-check" />;
  }
  if (stepIsError) {
    return <i className="ti ti-x" />;
  }
  if (isActive) {
    return <Spinner animation="border" size="sm" variant="light" />;
  }
  return <span className="step-number">{stepNumber}</span>;
}

export function CallAnalysisProgressCard({ steps, currentStep }: Props) {
  return (
    <Row className="mb-3">
      <Col md={12}>
        <Card>
          <Card.Header className="py-2">
            <h6 className="card-title mb-0">Analysis Progress</h6>
          </Card.Header>
          <Card.Body className="py-2">
            {steps.length === 0 ? (
              <div className="text-center p-2">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Initializing analysis...</span>
              </div>
            ) : (
              <div className="analysis-progress-container">
                <div className="analysis-progress-wrapper">
                  {steps.map((stepEntry, index) => {
                    const isActive = stepEntry.step === currentStep && stepEntry.status === "processing";
                    const isCompleted = stepEntry.status === "done";
                    const stepIsError = stepEntry.status === "error";
                    const isLast = index === steps.length - 1;
                    const prevCompleted = index > 0 && steps[index - 1]?.status === "done";
                    const visualState = stepVisualStateClass(isActive, isCompleted, stepIsError);

                    return (
                      <React.Fragment key={`${stepEntry.step}-${stepEntry.timestamp}-${index}`}>
                        <div
                          className="analysis-progress-step-wrapper"
                          style={{
                            flex: `1 1 ${100 / steps.length}%`,
                            maxWidth: `${100 / steps.length}%`,
                          }}
                        >
                          <div className={`analysis-progress-step ${visualState}`}>
                            <div className="step-indicator-wrapper">
                              <div className={`step-circle ${visualState}`}>
                                {stepCircleInner(isCompleted, stepIsError, isActive, index + 1)}
                              </div>
                              {!isLast && (
                                <div
                                  className={`step-connector ${isCompleted || prevCompleted ? "completed" : ""}`}
                                />
                              )}
                            </div>
                            <div className="step-content">
                              <div className="step-title">{stepEntry.step.replaceAll("_", " ")}</div>
                              {stepEntry.message && (
                                <div className="step-message">
                                  {stepEntry.message || stepEntry.step.replaceAll("_", " ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
