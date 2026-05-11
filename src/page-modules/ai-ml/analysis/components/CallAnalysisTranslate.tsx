import React from "react";
import { Col, Row, Tab, Tabs } from "react-bootstrap";

type Props = Readonly<{
  chunksAnalysisData: any;
  subActiveTab: string;
  setSubActiveTab: (k: string) => void;
}>;

const translationParagraphStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  fontFamily: "monospace",
  fontSize: "20px",
};

export function CallAnalysisTranslate({ chunksAnalysisData, subActiveTab, setSubActiveTab }: Props) {
  return (
    <Row>
      <Col md={12}>
        {chunksAnalysisData?.translations && (
          <Row>
            <Col md={12}>
              <Tabs
                defaultActiveKey="calls_chart"
                id="system-tabs"
                className="mb-3 justify-content-center"
                activeKey={subActiveTab}
                onSelect={(k) => setSubActiveTab(k || "en")}
              >
                <Tab eventKey="en" title="English">
                  <p style={translationParagraphStyle}>{chunksAnalysisData?.translations?.en}</p>
                </Tab>
                <Tab eventKey="ar" title="Arabic">
                  <p style={translationParagraphStyle}>{chunksAnalysisData?.translations?.ar}</p>
                </Tab>
                <Tab eventKey="ur" title="Urdu">
                  <p style={translationParagraphStyle}>{chunksAnalysisData?.translations?.ur}</p>
                </Tab>
                <Tab eventKey="hi" title="Hindi">
                  <p style={translationParagraphStyle}>{chunksAnalysisData?.translations?.hi}</p>
                </Tab>
              </Tabs>
            </Col>
          </Row>
        )}
      </Col>
    </Row>
  );
}
