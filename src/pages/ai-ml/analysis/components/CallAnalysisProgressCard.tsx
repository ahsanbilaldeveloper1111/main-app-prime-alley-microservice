import type { AnalysisStepEntry } from "@pages/ai-ml/analysis/types";
import React from "react";
import { Card, Col, Row, Spinner } from "react-bootstrap";

function stepModifierClassName(isActive: boolean, isCompleted: boolean, stepIsError: boolean): string {
  if (isActive) return "active";
  if (isCompleted) return "done";
  if (stepIsError) return "error";
  return "pending";
}

type StepCircleContentProps = Readonly<{
  isActive: boolean;
  isCompleted: boolean;
  stepIsError: boolean;
  stepNumber: number;
}>;

function StepCircleContent({ isActive, isCompleted, stepIsError, stepNumber }: StepCircleContentProps) {
  if (isCompleted) {
    return <i className="ti ti-check"></i>;
  }
  if (stepIsError) {
    return <i className="ti ti-x"></i>;
  }
  if (isActive) {
    return <Spinner animation="border" size="sm" variant="light" />;
  }
  return <span className="step-number">{stepNumber}</span>;
}

type Props = Readonly<{
  steps: AnalysisStepEntry[];
  currentStep: string | null;
}>;

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

                    return (
                      <React.Fragment key={`${stepEntry.step}-${stepEntry.timestamp}-${index}`}>
                        <div
                          className="analysis-progress-step-wrapper"
                          style={{
                            flex: `1 1 ${100 / steps.length}%`,
                            maxWidth: `${100 / steps.length}%`,
                          }}
                        >
                          <div
                            className={`analysis-progress-step ${stepModifierClassName(
                              isActive,
                              isCompleted,
                              stepIsError,
                            )}`}
                          >
                            <div className="step-indicator-wrapper">
                              <div
                                className={`step-circle ${stepModifierClassName(
                                  isActive,
                                  isCompleted,
                                  stepIsError,
                                )}`}
                              >
                                <StepCircleContent
                                  isActive={isActive}
                                  isCompleted={isCompleted}
                                  stepIsError={stepIsError}
                                  stepNumber={index + 1}
                                />
                              </div>
                              {!isLast && (
                                <div
                                  className={`step-connector ${isCompleted || prevCompleted ? "completed" : ""}`}
                                />
                              )}
                            </div>
                            <div className="step-content">
                              <div className="step-title">{stepEntry.step.replace(/_/g, " ")}</div>
                              {stepEntry.message && (
                                <div className="step-message">
                                  {stepEntry.message || stepEntry.step.replace(/_/g, " ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                <style>{`
                      .analysis-progress-container {
                        padding: 0.5rem 0;
                      }

                      .analysis-progress-wrapper {
                        display: flex;
                        align-items: flex-start;
                        gap: 0.25rem;
                        padding: 0.5rem 0;
                        width: 100%;
                      }

                      .analysis-progress-step-wrapper {
                        flex: 1 1 auto;
                        padding: 0 0.15rem;
                        min-width: 0;
                      }

                      .analysis-progress-step {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        position: relative;
                        transition: all 0.3s ease;
                      }

                      .step-indicator-wrapper {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        position: relative;
                        margin-bottom: 0.4rem;
                        min-height: 32px;
                        justify-content: center;
                      }

                      .step-circle {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 0.85rem;
                        position: relative;
                        z-index: 2;
                        transition: all 0.3s ease;
                        flex-shrink: 0;
                        margin: 0 auto;
                      }

                      .step-circle.pending {
                        background: #e9ecef;
                        color: #6c757d;
                        border: 2px solid #ced4da;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                      }

                      .step-circle.active {
                        background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
                        color: white;
                        border: 2px solid #0a58ca;
                        box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.2), 0 2px 8px rgba(13, 110, 253, 0.3);
                        animation: pulse-ring 2s infinite;
                      }

                      .step-circle.done {
                        background: linear-gradient(135deg, #198754 0%, #146c43 100%);
                        color: white;
                        border: 2px solid #146c43;
                        box-shadow: 0 2px 8px rgba(25, 135, 84, 0.25);
                      }

                      .step-circle.error {
                        background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
                        color: white;
                        border: 2px solid #b02a37;
                        box-shadow: 0 2px 8px rgba(220, 53, 69, 0.25);
                      }

                      .step-circle i {
                        font-size: 1rem;
                      }

                      .step-number {
                        font-size: 0.9rem;
                        font-weight: 700;
                      }

                      .step-connector {
                        position: absolute;
                        height: 2px;
                        width: calc(100% + 0.25rem);
                        left: calc(50% + 16px);
                        top: 50%;
                        transform: translateY(-50%);
                        background: #dee2e6;
                        border-radius: 1px;
                        transition: all 0.3s ease;
                        z-index: 1;
                      }

                      .step-connector.completed {
                        background: linear-gradient(90deg, #198754 0%, #20c997 100%);
                      }

                      .step-content {
                        text-align: center;
                        width: 100%;
                        padding: 0;
                      }

                      .step-title {
                        font-weight: 600;
                        font-size: 0.75rem;
                        line-height: 1.2;
                        margin-bottom: 0.1rem;
                        text-transform: capitalize;
                        word-break: break-word;
                        transition: color 0.3s ease;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      }

                      .analysis-progress-step.pending .step-title {
                        color: #6c757d;
                      }

                      .analysis-progress-step.active .step-title {
                        color: #0d6efd;
                        font-weight: 700;
                      }

                      .analysis-progress-step.done .step-title {
                        color: #198754;
                        font-weight: 600;
                      }

                      .analysis-progress-step.error .step-title {
                        color: #dc3545;
                        font-weight: 600;
                      }

                      .step-message {
                        font-size: 0.65rem;
                        color: #6c757d;
                        line-height: 1.2;
                        margin-top: 0.1rem;
                        word-break: break-word;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      }

                      @keyframes pulse-ring {
                        0% {
                          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.2), 0 2px 8px rgba(13, 110, 253, 0.3);
                        }
                        50% {
                          box-shadow: 0 0 0 6px rgba(13, 110, 253, 0.15), 0 2px 10px rgba(13, 110, 253, 0.4);
                        }
                        100% {
                          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.2), 0 2px 8px rgba(13, 110, 253, 0.3);
                        }
                      }

                      @media (max-width: 768px) {
                        .step-circle {
                          width: 28px;
                          height: 28px;
                          font-size: 0.75rem;
                        }

                        .step-circle i {
                          font-size: 0.85rem;
                        }

                        .step-title {
                          font-size: 0.7rem;
                        }

                        .step-message {
                          font-size: 0.6rem;
                        }

                        .step-indicator-wrapper {
                          min-height: 28px;
                          margin-bottom: 0.3rem;
                        }
                      }

                      @keyframes skeleton-loading {
                        0% {
                          background-position: 200% 0;
                        }
                        100% {
                          background-position: -200% 0;
                        }
                      }
                    `}</style>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
