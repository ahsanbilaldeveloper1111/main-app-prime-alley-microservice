import { ListSkeleton, TextSkeleton } from "@components/skeletons";
import { hasArrayData, hasData } from "@pages/ai-ml/analysis/analysisHelpers";
import React from "react";
import { Col, Row } from "react-bootstrap";

type Props = Readonly<{
  chunksAnalysisData: any;
  analysis: any;
  analysisComplete: boolean;
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
                        customerEmotions.map((emotion: string, index: number) => (
                          <div className="text-capitalize me-2" key={index}>
                            <div className="emo_text">{emotion}</div>
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
                          operatorEmotions.map((emotion: string, index: number) => (
                            <div className="text-capitalize me-2" key={index}>
                              <div className="emo_text">{emotion}</div>
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
                      keyTopics.map((item: string, index: number) => (
                        <div className="mb-2 callType" key={index}>
                          <div className="ic_box bg-success">
                            <i className="material-icons-two-tone">check</i>
                          </div>
                          <div>
                            <h6 className="card-text text-capitalize font-weight-normal">{item}</h6>
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
                        {chunksAnalysisData?.tags?.map((item: any, index: number) => {
                          const isTrue = item.status === true;
                          return (
                            <tr key={index}>
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
                    {!hasData(chunksAnalysisData?.summary) ? (
                      <>
                        {!analysisComplete && <TextSkeleton lines={4} lastLineWidth="70%" />}
                        {analysisComplete && <p className="text-muted">No data available</p>}
                      </>
                    ) : (
                      <p>{chunksAnalysisData.summary}</p>
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
                        {Object.entries(qualificationFields).map(([key, value], index: number) => (
                          <tr key={index}>
                            <td>{key}</td>
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
                  actionItems.map((item: string, index: number) => (
                    <div className="tagOuter" key={index}>
                      <div className="tagIcon bg-success">
                        <i className="material-icons-two-tone">check</i>
                      </div>
                      <div className="tagVal">
                        <h6 className="card-text text-capitalize">{item}</h6>
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
                      callCategories.map((item: string, index: number) => (
                        <div className="mb-2 callType" key={index}>
                          <div className="ic_box bg-success">
                            <i className="material-icons-two-tone">check</i>
                          </div>
                          <div>
                            <h6 className="card-text text-capitalize font-weight-normal">{item}</h6>
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
