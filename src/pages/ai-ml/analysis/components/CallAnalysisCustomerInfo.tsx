import { TextSkeleton } from "@components/skeletons";
import { hasData } from "@pages/ai-ml/analysis/analysisHelpers";
import React from "react";
import { Col, Row } from "react-bootstrap";

type Props = Readonly<{
  analysis: any;
  analysisComplete: boolean;
  callType: string | null;
  remotePartyNumber: string;
  callDurationFormatted: string | null;
}>;

export function CallAnalysisCustomerInfo({
  analysis,
  analysisComplete,
  callType,
  remotePartyNumber,
  callDurationFormatted,
}: Props) {
  const followUpRequired = analysis?.follow_up_required;

  return (
    <Row>
      <Col md={12}>
        <div className="card">
          <div className="card-header">
            <h5 className="card-title">Customer Information</h5>
          </div>
          <div className="card-body">
            <Row className="between">
              {hasData(followUpRequired) ? (
                <Col>
                  <div className="callType">
                    <div className={`ic_box ${followUpRequired ? "bg-success" : "bg-danger"}`}>
                      <i
                        className={`material-icons-two-tone ${followUpRequired ? "check" : "close"}`}
                      />
                    </div>
                    <div className="desc">
                      <small className="card-title">Follow Up Required</small>
                      <h5 className="card-text">{followUpRequired ? "Yes" : "No"}</h5>
                    </div>
                  </div>
                </Col>
              ) : (
                <Col>
                  <div className="callType">
                    <div className="desc">
                      <small className="card-title">Follow Up Required</small>
                      {analysisComplete ? (
                        <p className="text-muted">No data available</p>
                      ) : (
                        <TextSkeleton lines={1} />
                      )}
                    </div>
                  </div>
                </Col>
              )}

              {callType ? (
                <Col>
                  <div className="callType">
                    <div className="ic_box bg-success">
                      <i className="material-icons-two-tone">call</i>
                    </div>
                    <div className="desc">
                      <small className="card-title">Call Type</small>
                      <h5 className="card-text">{callType}</h5>
                    </div>
                  </div>
                </Col>
              ) : (
                <Col>
                  <div className="callType">
                    <div className="desc">
                      <small className="card-title">Call Type</small>
                      <TextSkeleton lines={1} />
                    </div>
                  </div>
                </Col>
              )}

              <Col>
                <div className="callType">
                  <div className="desc">
                    <small className="card-title">Phone Number</small>
                    <h5 className="card-text">{remotePartyNumber}</h5>
                  </div>
                </div>
              </Col>

              <Col>
                <div className="callType">
                  <div className="desc">
                    <small className="card-title">Call Duration</small>
                    {callDurationFormatted ? (
                      <h5 className="card-text">{callDurationFormatted}</h5>
                    ) : (
                      <div className="card-text">
                        <TextSkeleton lines={1} />
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Col>
    </Row>
  );
}
