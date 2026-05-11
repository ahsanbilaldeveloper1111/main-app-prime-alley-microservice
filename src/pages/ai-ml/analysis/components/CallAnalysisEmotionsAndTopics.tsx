import { ListSkeleton, TextSkeleton } from "@components/skeletons";
import {
  hasArrayData,
  hasData,
  keyedBySignature,
  keyedStringItems,
} from "@pages/ai-ml/analysis/analysisHelpers";
import React from "react";
import { Col, Row } from "react-bootstrap";

type Props = Readonly<{
  chunksAnalysisData: any;
  analysis: any;
  analysisComplete: boolean;
}>;

type ChunksAnalysisTag = Readonly<{
  name?: string;
  percentage?: unknown;
  description?: string;
  status?: unknown;
}>;

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
                      {hasArrayData(customerEmotions) ? (
                        keyedStringItems(customerEmotions, "customer-emotion").map(({ key, value }) => (
                          <div className="text-capitalize me-2" key={key}>
                            <div className="emo_text">{value}</div>
                          </div>
                        ))
                      ) : (
                        <>
                          {!analysisComplete && <ListSkeleton items={3} />}
                          {analysisComplete && <p className="text-muted">No data available</p>}
                        </>
                      )}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="vbox">
                      <h5 className="mb-3">Operator Emotions</h5>
                      <div className="card-text">
                        {hasArrayData(operatorEmotions) ? (
                          keyedStringItems(operatorEmotions, "operator-emotion").map(({ key, value }) => (
                            <div className="text-capitalize me-2" key={key}>
                              <div className="emo_text">{value}</div>
                            </div>
                          ))
                        ) : (
                          <>
                            {!analysisComplete && <ListSkeleton items={3} />}
                            {analysisComplete && <p className="text-muted">No data available</p>}
                          </>
                        )}
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
                    {hasArrayData(keyTopics) ? (
                      keyedStringItems(keyTopics, "key-topic").map(({ key, value }) => (
                        <div className="mb-2 callType" key={key}>
                          <div className="ic_box bg-success">
                            <i className="material-icons-two-tone">check</i>
                          </div>
                          <div>
                            <h6 className="card-text text-capitalize font-weight-normal">{value}</h6>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {!analysisComplete && <ListSkeleton items={3} />}
                        {analysisComplete && <p className="text-muted">No data available</p>}
                      </>
                    )}
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
                  {hasArrayData(chunksAnalysisData?.tags) ? (
                    <table className="table-bordered table-sm w-100">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Percentage</th>
                          <th className="text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keyedBySignature(
                          (chunksAnalysisData.tags ?? []) as ChunksAnalysisTag[],
                          (item) =>
                            `${String(item.name ?? "")}|${String(item.percentage ?? "")}|${String(item.description ?? "")}|${String(item.status ?? "")}`,
                          "analysis-tag",
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
                              <td className="text-capitalize">
                                {item.percentage == null || item.percentage === ""
                                  ? "N/A"
                                  : String(item.percentage)}
                              </td>
                              <td className="text-capitalize">{item.description || "N/A"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <>
                      {!analysisComplete && <TextSkeleton lines={3} />}
                      {analysisComplete && <p className="text-muted">No data available</p>}
                    </>
                  )}
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
                    {hasData(chunksAnalysisData?.summary) ? (
                      <p>{chunksAnalysisData.summary}</p>
                    ) : (
                      <>
                        {!analysisComplete && <TextSkeleton lines={4} lastLineWidth="70%" />}
                        {analysisComplete && <p className="text-muted">No data available</p>}
                      </>
                    )}
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
                  {hasQualificationFields ? (
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
                  ) : (
                    <>
                      {!analysisComplete && <TextSkeleton lines={6} />}
                      {analysisComplete && <p className="text-muted">No data available</p>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Col>

          <Col md={12}>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Action Items</h5>
                {hasArrayData(actionItems) ? (
                  keyedStringItems(actionItems, "action-item").map(({ key, value }) => (
                    <div className="tagOuter" key={key}>
                      <div className="tagIcon bg-success">
                        <i className="material-icons-two-tone">check</i>
                      </div>
                      <div className="tagVal">
                        <h6 className="card-text text-capitalize">{value}</h6>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {!analysisComplete && <TextSkeleton lines={3} />}
                    {analysisComplete && <p className="text-muted">No data available</p>}
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-body gbox vboxStyleTwo">
                <div className="vbox">
                  <h5 className="mb-3">Categories</h5>
                </div>
                <div className="vbox w-100">
                  <div className="card-text">
                    {hasArrayData(callCategories) ? (
                      keyedStringItems(callCategories, "call-category").map(({ key, value }) => (
                        <div className="mb-2 callType" key={key}>
                          <div className="ic_box bg-success">
                            <i className="material-icons-two-tone">check</i>
                          </div>
                          <div>
                            <h6 className="card-text text-capitalize font-weight-normal">{value}</h6>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {!analysisComplete && <TextSkeleton lines={3} />}
                        {analysisComplete && <p className="text-muted">No data available</p>}
                      </>
                    )}
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
