import { TextSkeleton } from "@components/skeletons";
import imgStatus1 from "@assets/images/widget/img-status-1.svg";
import imgStatus3 from "@assets/images/widget/img-status-3.svg";
import {
  formatAnalysisFieldLabel,
  formatUnknownForDisplay,
  hasData,
} from "@pages/ai-ml/analysis/analysisHelpers";
import React from "react";
import { Col, Row } from "react-bootstrap";

import { CallAnalysisPendingOrEmpty } from "./CallAnalysisPendingOrEmpty";

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
  const hasMainTopic =
    Boolean(chunksAnalysisData?.main_topic) && String(chunksAnalysisData.main_topic).trim().length > 0;

  return (
    <Row>
      <Col md={6}>
        <div className="card" style={{ backgroundImage: `url(${imgStatus1.src})` }}>
          <div className="card-body box1 gbox">
            <div className="vbox w-100">
              <h5>Resolution Status</h5>
              <div className="card-text">
                <CallAnalysisPendingOrEmpty
                  analysisComplete={analysisComplete}
                  hasData={hasData(resolutionStatus)}
                  skeleton={<TextSkeleton lines={1} />}
                  renderContent={() => <h6>{formatAnalysisFieldLabel(resolutionStatus)}</h6>}
                />
              </div>
            </div>

            <div className="vbox w-100">
              <h5>Sentiment</h5>
              <div className="card-text">
                <CallAnalysisPendingOrEmpty
                  analysisComplete={analysisComplete}
                  hasData={hasData(sentiment)}
                  skeleton={<TextSkeleton lines={1} />}
                  renderContent={() => <h6>{formatAnalysisFieldLabel(sentiment)}</h6>}
                />
              </div>
            </div>

            <div className="vbox w-100">
              <h5>Main Intention</h5>
              <div className="card-text">
                <CallAnalysisPendingOrEmpty
                  analysisComplete={analysisComplete}
                  hasData={hasMainTopic}
                  skeleton={<TextSkeleton lines={1} />}
                  renderContent={() => <h6>{chunksAnalysisData.main_topic}</h6>}
                />
              </div>
            </div>

            <div className="vbox w-100">
              <h5>Summary</h5>
              <div className="card-text">
                <CallAnalysisPendingOrEmpty
                  analysisComplete={analysisComplete}
                  hasData={hasData(summary)}
                  skeleton={<TextSkeleton lines={2} lastLineWidth="70%" />}
                  renderContent={() => <h6>{formatUnknownForDisplay(summary)}</h6>}
                />
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
                  <CallAnalysisPendingOrEmpty
                    analysisComplete={analysisComplete}
                    hasData={hasData(qualified)}
                    skeleton={<TextSkeleton lines={1} />}
                    renderContent={() => (
                      <p className="card-text text-white size2">{qualified ? "Qualified" : "Unqualified"}</p>
                    )}
                  />
                </div>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="card">
              <div className="card-body gbox">
                <h5>Completion Percent</h5>
                <div className="card-text size2 text-bold d-block w-100">
                  <CallAnalysisPendingOrEmpty
                    analysisComplete={analysisComplete}
                    hasData={hasCompletionPercent}
                    skeleton={<TextSkeleton lines={2} />}
                    renderContent={() => (
                      <>
                        <p className="card-text size2 text-bold">{completionPercent}%</p>
                        <div className="mb-3 w-100">
                          <progress
                            className="w-100 d-block rounded-pill border-0"
                            style={{
                              height: "0.5rem",
                              accentColor: "var(--bs-success, #198754)",
                            }}
                            value={completionPercent}
                            max={100}
                            aria-label={`Completion ${completionPercent} percent`}
                          />
                        </div>
                      </>
                    )}
                  />
                </div>
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
                  <CallAnalysisPendingOrEmpty
                    analysisComplete={analysisComplete}
                    hasData={Boolean(customerIntent)}
                    skeleton={<TextSkeleton lines={2} />}
                    renderContent={() => (
                      <div className="card-text size2">
                        <h6>{customerIntent.charAt(0).toUpperCase() + customerIntent.slice(1)}</h6>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
