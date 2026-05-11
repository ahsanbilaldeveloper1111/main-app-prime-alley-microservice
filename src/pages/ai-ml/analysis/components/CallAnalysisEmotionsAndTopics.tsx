import { ListSkeleton, TextSkeleton } from "@components/skeletons";
import { hasArrayData, hasData } from "@pages/ai-ml/analysis/analysisHelpers";
import React from "react";
import { Col, Row } from "react-bootstrap";

import { CallAnalysisPendingOrEmpty } from "./CallAnalysisPendingOrEmpty";

type Props = Readonly<{
  chunksAnalysisData: any;
  analysis: any;
  analysisComplete: boolean;
}>;

/** Stable list keys without using array index (per-value occurrence handles duplicates). */
function withOccurrenceKeys<T>(items: T[], prefix: string, identity: (item: T) => string): { key: string; item: T }[] {
  const tallies = new Map<string, number>();
  return items.map((item) => {
    const part = identity(item);
    const next = (tallies.get(part) ?? 0) + 1;
    tallies.set(part, next);
    return { key: `${prefix}__${part}__${next}`, item };
  });
}

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
                  <Col md={6}>
                    <div className="vbox">
                      <h5 className="mb-3">Customer Emotions</h5>
                    </div>
                    <div className="card-text">
                      <CallAnalysisPendingOrEmpty
                        analysisComplete={analysisComplete}
                        hasData={hasArrayData(customerEmotions)}
                        skeleton={<ListSkeleton items={3} />}
                        renderContent={() =>
                          withOccurrenceKeys(customerEmotions as string[], "cust-emo", (e) => e).map(
                            ({ key, item: emotion }) => (
                              <div className="text-capitalize me-2" key={key}>
                                <div className="emo_text">{emotion}</div>
                              </div>
                            ),
                          )
                        }
                      />
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="vbox">
                      <h5 className="mb-3">Operator Emotions</h5>
                      <div className="card-text">
                        <CallAnalysisPendingOrEmpty
                          analysisComplete={analysisComplete}
                          hasData={hasArrayData(operatorEmotions)}
                          skeleton={<ListSkeleton items={3} />}
                          renderContent={() =>
                            withOccurrenceKeys(operatorEmotions as string[], "op-emo", (e) => e).map(
                              ({ key, item: emotion }) => (
                                <div className="text-capitalize me-2" key={key}>
                                  <div className="emo_text">{emotion}</div>
                                </div>
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  </Col>
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
