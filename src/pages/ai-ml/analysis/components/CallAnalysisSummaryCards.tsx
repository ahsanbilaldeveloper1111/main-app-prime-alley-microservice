import { TextSkeleton } from "@components/skeletons";
import imgStatus1 from "@assets/images/widget/img-status-1.svg";
import imgStatus3 from "@assets/images/widget/img-status-3.svg";
import { capitalizeFirst, hasData } from "@pages/ai-ml/analysis/analysisHelpers";
import React from "react";
import { Col, Row } from "react-bootstrap";

type Props = Readonly<{
  chunksAnalysisData: any;
  analysis: any;
  analysisComplete: boolean;
}>;

function analysisFieldPlaceholder(
  analysisComplete: boolean,
  skeleton: Readonly<{ lines: number; lastLineWidth?: string }>,
): React.ReactNode {
  if (analysisComplete) {
    return <p className="text-muted">No data available</p>;
  }
  if (skeleton.lastLineWidth === undefined) {
    return <TextSkeleton lines={skeleton.lines} />;
  }
  return <TextSkeleton lines={skeleton.lines} lastLineWidth={skeleton.lastLineWidth} />;
}

export function CallAnalysisSummaryCards({
  chunksAnalysisData,
  analysis,
  analysisComplete,
}: Props) {
  const resolutionStatus = analysis?.resolution_status;
  const sentiment = analysis?.sentiment;
  const summary = chunksAnalysisData?.summary;
  const customerIntent = analysis?.customer_intent;
  const qualified = chunksAnalysisData?.qualified;
  const hasCompletionPercent =
    chunksAnalysisData?.completion_percent !== undefined &&
    chunksAnalysisData.completion_percent !== null;
  const completionPercent = hasCompletionPercent ? chunksAnalysisData.completion_percent : 0;

  return (
    <Row>
      <Col md={6}>
        <div className="card" style={{ backgroundImage: `url(${imgStatus1.src})` }}>
          <div className="card-body box1 gbox">
            <div className="vbox w-100">
              <h5>Resolution Status</h5>
              <div className="card-text">
                {hasData(resolutionStatus) ? (
                  <h6>{capitalizeFirst(String(resolutionStatus))}</h6>
                ) : (
                  analysisFieldPlaceholder(analysisComplete, { lines: 1 })
                )}
              </div>
            </div>

            <div className="vbox w-100">
              <h5>Sentiment</h5>
              <div className="card-text">
                {hasData(sentiment) ? (
                  <h6>{capitalizeFirst(String(sentiment))}</h6>
                ) : (
                  analysisFieldPlaceholder(analysisComplete, { lines: 1 })
                )}
              </div>
            </div>

            <div className="vbox w-100">
              <h5>Main Intention</h5>
              <div className="card-text">
                {chunksAnalysisData?.main_topic && chunksAnalysisData.main_topic.trim().length > 0 ? (
                  <h6>{chunksAnalysisData.main_topic}</h6>
                ) : (
                  analysisFieldPlaceholder(analysisComplete, { lines: 1 })
                )}
              </div>
            </div>

            <div className="vbox w-100">
              <h5>Summary</h5>
              <div className="card-text">
                {hasData(summary) ? (
                  <h6>{String(summary)}</h6>
                ) : (
                  analysisFieldPlaceholder(analysisComplete, { lines: 2, lastLineWidth: "70%" })
                )}
              </div>
            </div>
          </div>
        </div>
      </Col>

      <Col md={6}>
        <Row>
          <Col md={12}>
            <div
              className={`card ${qualified ? "bg-success" : "bg-danger"}`}
              style={{ backgroundImage: `url(${imgStatus3.src})` }}
            >
              <div className="card-body gbox">
                <div className="vbox">
                  <h6 className="text-white">Overall Assessment</h6>
                </div>
                <div className="vbox">
                  {hasData(qualified) ? (
                    <p className="card-text text-white size2">{qualified ? "Qualified" : "Unqualified"}</p>
                  ) : (
                    <div className="card-text text-white size2">
                      {analysisFieldPlaceholder(analysisComplete, { lines: 1 })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="card">
              <div className="card-body gbox">
                <h5>Completion Percent</h5>
                {hasCompletionPercent ? (
                  <div>
                    <p className="card-text size2 text-bold">{completionPercent}%</p>
                    <div className="progress mb-3 progress-thin">
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${completionPercent}%` }}
                        aria-valuenow={completionPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="card-text size2 text-bold d-block w-100">
                    {analysisFieldPlaceholder(analysisComplete, { lines: 2 })}
                  </div>
                )}
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="card">
              <div className="card-body gbox">
                <div className="vbox">
                  <h5>Customer Intention</h5>
                </div>
                <div className="vbox w-100">
                  {customerIntent ? (
                    <div className="card-text size2">
                      <h6>{customerIntent.charAt(0).toUpperCase() + customerIntent.slice(1)}</h6>
                    </div>
                  ) : (
                    <div className="card-text d-block w-100">
                      {analysisFieldPlaceholder(analysisComplete, { lines: 2 })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
