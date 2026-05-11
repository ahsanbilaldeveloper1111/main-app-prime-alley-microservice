import { ListSkeleton, TextSkeleton } from "@components/skeletons";
import { hasArrayData, hasData } from "@pages/ai-ml/analysis/analysisHelpers";
import { withOccurrenceKeys } from "@pages/ai-ml/analysis/callAnalysisListKeys";
import React from "react";
import { Col, Row } from "react-bootstrap";

import { CallAnalysisPendingOrEmpty } from "./CallAnalysisPendingOrEmpty";

type Props = Readonly<{
  chunksAnalysisData: any;
  analysis: any;
  analysisComplete: boolean;
}>;

function TopicCheckLine({ label }: Readonly<{ label: string }>) {
  return (
    <div className="mb-2 callType">
      <div className="ic_box bg-success">
        <i className="material-icons-two-tone">check</i>
      </div>
      <div>
        <h6 className="card-text text-capitalize font-weight-normal">{label}</h6>
      </div>
    </div>
  );
}

function EmotionStringList(props: Readonly<{
  title: string;
  items: unknown;
  keyPrefix: string;
  analysisComplete: boolean;
}>) {
  const { title, items, keyPrefix, analysisComplete } = props;
  return (
    <Col md={6}>
      <div className="vbox">
        <h5 className="mb-3">{title}</h5>
      </div>
      <div className="card-text">
        <CallAnalysisPendingOrEmpty
          analysisComplete={analysisComplete}
          hasData={hasArrayData(items)}
          skeleton={<ListSkeleton items={3} />}
          renderContent={() =>
            withOccurrenceKeys(items as string[], keyPrefix, (e) => e).map(({ key, item: emotion }) => (
              <div className="text-capitalize me-2" key={key}>
                <div className="emo_text">{emotion}</div>
              </div>
            ))
          }
        />
      </div>
    </Col>
  );
}

export function CallAnalysisEmotionsAndTopics({
  chunksAnalysisData,
  analysis,
  analysisComplete,
}: Props) {
  const customerEmotions = analysis?.customer_emotions;
  const operatorEmotions = analysis?.operator_emotions;
  const keyTopics = analysis?.key_topics;
  const actionItems = analysis?.action_items;
  const callCategories = analysis?.call_categories;
  const qualificationFields = chunksAnalysisData?.extracted_qualification_fields;
  const hasQualificationFields =
    qualificationFields && Object.entries(qualificationFields).length > 0;

  return (
    <Row>
      <Col md={7}>
        <Row>
          <Col md={7}>
            <div className="card">
              <div className="card-body gbox gbox3">
                <Row className="w-100">
                  <EmotionStringList
                    title="Customer Emotions"
                    items={customerEmotions}
                    keyPrefix="cust-emo"
                    analysisComplete={analysisComplete}
                  />
                  <EmotionStringList
                    title="Operator Emotions"
                    items={operatorEmotions}
                    keyPrefix="op-emo"
                    analysisComplete={analysisComplete}
                  />
                </Row>
              </div>
            </div>
          </Col>

          <Col md={5}>
            <div className="card">
              <div className="card-body gbox gbox3">
                <div className="vbox">
                  <h5 className="mb-3">Key Topics</h5>
                </div>
                <div className="vbox w-100">
                  <div className="card-text">
                    <CallAnalysisPendingOrEmpty
                      analysisComplete={analysisComplete}
                      hasData={hasArrayData(keyTopics)}
                      skeleton={<ListSkeleton items={3} />}
                      renderContent={() =>
                        withOccurrenceKeys(keyTopics as string[], "key-topic", (t) => t).map(({ key, item }) => (
                          <TopicCheckLine key={key} label={item} />
                        ))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <div className="card">
              <div className="card-body gbox">
                <h5 className="card-title">Tags</h5>
                <div className="card-text w-100">
                  <CallAnalysisPendingOrEmpty
                    analysisComplete={analysisComplete}
                    hasData={hasArrayData(chunksAnalysisData?.tags)}
                    skeleton={<TextSkeleton lines={3} />}
                    renderContent={() => (
                      <table className="table-bordered table-sm w-100">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Percentage</th>
                            <th className="text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withOccurrenceKeys(chunksAnalysisData.tags as any[], "tag", (t: any) =>
                            [t?.name, t?.percentage, t?.description, String(t?.status)].join("|"),
                          ).map(({ key, item }) => {
                            const isTrue = item.status === true;
                            return (
                              <tr key={key}>
                                <td className="text-capitalize">
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="tboxIn">
                                      <div className={`ic_box small ${isTrue ? "bg-success" : "bg-danger"}`}>
                                        <i className="material-icons-two-tone">{isTrue ? "check" : "close"}</i>
                                      </div>
                                    </div>
                                    <div>{item.name || "N/A"}</div>
                                  </div>
                                </td>
                                <td className="text-capitalize">{item.percentage || "N/A"}</td>
                                <td className="text-capitalize">{item.description || "N/A"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  />
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <div className="card">
              <div className="card-body gbox vboxStyleTwo">
                <div className="vbox">
                  <h5 className="mb-3">Details Summary</h5>
                </div>
                <div className="vbox w-100">
                  <div className="card-text">
                    <CallAnalysisPendingOrEmpty
                      analysisComplete={analysisComplete}
                      hasData={hasData(chunksAnalysisData?.summary)}
                      skeleton={<TextSkeleton lines={4} lastLineWidth="70%" />}
                      renderContent={() => <p>{chunksAnalysisData.summary}</p>}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Col>

      <Col md={5}>
        <Row>
          <Col md={12}>
            <div className="card">
              <div className="card-body gbox">
                <h5 className="card-title">Qualification Fields</h5>
                <div className="card-text w-100">
                  <CallAnalysisPendingOrEmpty
                    analysisComplete={analysisComplete}
                    hasData={!!hasQualificationFields}
                    skeleton={<TextSkeleton lines={6} />}
                    renderContent={() => (
                      <table className="table-bordered table-sm w-100">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th className="text-center">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(qualificationFields).map(([fieldKey, value]) => (
                            <tr key={fieldKey}>
                              <td>{fieldKey}</td>
                              <td className="text-capitalize text-center">
                                {value === "null" ? "-" : String(value as string)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  />
                </div>
              </div>
            </div>
          </Col>

          <Col md={12}>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Action Items</h5>
                <CallAnalysisPendingOrEmpty
                  analysisComplete={analysisComplete}
                  hasData={hasArrayData(actionItems)}
                  skeleton={<TextSkeleton lines={3} />}
                  renderContent={() =>
                    withOccurrenceKeys(actionItems as string[], "action", (a) => a).map(({ key, item }) => (
                      <div className="tagOuter" key={key}>
                        <div className="tagIcon bg-success">
                          <i className="material-icons-two-tone">check</i>
                        </div>
                        <div className="tagVal">
                          <h6 className="card-text text-capitalize">{item}</h6>
                        </div>
                      </div>
                    ))
                  }
                />
              </div>
            </div>

            <div className="card">
              <div className="card-body gbox vboxStyleTwo">
                <div className="vbox">
                  <h5 className="mb-3">Categories</h5>
                </div>
                <div className="vbox w-100">
                  <div className="card-text">
                    <CallAnalysisPendingOrEmpty
                      analysisComplete={analysisComplete}
                      hasData={hasArrayData(callCategories)}
                      skeleton={<TextSkeleton lines={3} />}
                      renderContent={() =>
                        withOccurrenceKeys(callCategories as string[], "call-cat", (c) => c).map(({ key, item }) => (
                          <TopicCheckLine key={key} label={item} />
                        ))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
