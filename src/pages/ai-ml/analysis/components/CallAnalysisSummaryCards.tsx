import { TextSkeleton } from "@components/skeletons";
import imgStatus1 from "@assets/images/widget/img-status-1.svg";
import imgStatus3 from "@assets/images/widget/img-status-3.svg";
import { capitalizeFirst, hasData } from "@pages/ai-ml/analysis/analysisHelpers";
import React from "react";
import { Col, Row } from "react-bootstrap";

/** Safe display string for API fields; avoids `[object Object]` from blind coercion. */
function analysisScalarToString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

type Props = Readonly<{
  chunksAnalysisData: any;
  analysis: any;
  analysisComplete: boolean;
}>;

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
  const resolutionLabel = analysisScalarToString(resolutionStatus);
  const sentimentLabel = analysisScalarToString(sentiment);
  const summaryLabel = analysisScalarToString(summary);
  const customerIntentLabel = analysisScalarToString(customerIntent);
  const mainTopicRaw =
    typeof chunksAnalysisData?.main_topic === "string" ? chunksAnalysisData.main_topic : "";
  const hasMainTopic = mainTopicRaw.trim().length > 0;

  return (
    <Row>
      <Col md={6}>
        <div className="card" style={{ backgroundImage: `url(${imgStatus1.src})` }}>
          <div className="card-body box1 gbox">
            <div className="vbox w-100">
              <h5>Resolution Status</h5>
              <div className="card-text">
                {resolutionLabel != null && (
                  <h6>{capitalizeFirst(resolutionLabel)}</h6>
                )}
                {resolutionLabel == null && analysisComplete === false && (
                  <TextSkeleton lines={1} />
                )}
                {resolutionLabel == null && analysisComplete && (
                  <p className="text-muted">No data available</p>
                )}
              </div>
            </div>

            <div className="vbox w-100">
              <h5>Sentiment</h5>
              <div className="card-text">
                {sentimentLabel != null && (
                  <h6>{capitalizeFirst(sentimentLabel)}</h6>
                )}
                {sentimentLabel == null && analysisComplete === false && (
                  <TextSkeleton lines={1} />
                )}
                {sentimentLabel == null && analysisComplete && (
                  <p className="text-muted">No data available</p>
                )}
              </div>
            </div>

            <div className="vbox w-100">
              <h5>Main Intention</h5>
              <div className="card-text">
                {hasMainTopic && <h6>{mainTopicRaw}</h6>}
                {hasMainTopic === false && analysisComplete === false && (
                  <TextSkeleton lines={1} />
                )}
                {hasMainTopic === false && analysisComplete && (
                  <p className="text-muted">No data available</p>
                )}
              </div>
            </div>

            <div className="vbox w-100">
              <h5>Summary</h5>
              <div className="card-text">
                {summaryLabel != null && <h6>{summaryLabel}</h6>}
                {summaryLabel == null && analysisComplete === false && (
                  <TextSkeleton lines={2} lastLineWidth="70%" />
                )}
                {summaryLabel == null && analysisComplete && (
                  <p className="text-muted">No data available</p>
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
                      {analysisComplete === false && <TextSkeleton lines={1} />}
                      {analysisComplete && <p className="text-muted">No data available</p>}
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
                  <p className="card-text size2 text-bold">{completionPercent}%</p>
                ) : null}
                {hasCompletionPercent ? (
                  <progress
                    className="mb-3 progress-thin"
                    style={{
                      accentColor: "var(--bs-success, #198754)",
                      width: "100%",
                      verticalAlign: "middle",
                    }}
                    max={100}
                    value={completionPercent}
                    aria-label={`Analysis completion ${completionPercent} percent`}
                  />
                ) : (
                  <div className="card-text size2 text-bold d-block w-100">
                    {analysisComplete === false && <TextSkeleton lines={2} />}
                    {analysisComplete && <p className="text-muted">No data available</p>}
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
                  {customerIntentLabel != null && (
                    <div className="card-text size2">
                      <h6>
                        {customerIntentLabel.charAt(0).toUpperCase() +
                          customerIntentLabel.slice(1)}
                      </h6>
                    </div>
                  )}
                  {customerIntentLabel == null && analysisComplete === false && (
                    <div className="card-text d-block w-100">
                      <TextSkeleton lines={2} />
                    </div>
                  )}
                  {customerIntentLabel == null && analysisComplete && (
                    <div className="card-text d-block w-100">
                      <p className="text-muted">No data available</p>
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
