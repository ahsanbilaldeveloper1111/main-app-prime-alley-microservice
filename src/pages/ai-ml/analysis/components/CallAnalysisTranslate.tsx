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

const TRANSLATION_TABS = [
  { eventKey: "en", title: "English", field: "en" },
  { eventKey: "ar", title: "Arabic", field: "ar" },
  { eventKey: "ur", title: "Urdu", field: "ur" },
  { eventKey: "hi", title: "Hindi", field: "hi" },
] as const;

export function CallAnalysisTranslate({ chunksAnalysisData, subActiveTab, setSubActiveTab }: Props) {
  const translations = chunksAnalysisData?.translations;

  return (
    <Row>
      <Col md={12}>
        {translations && (
          <Row>
            <Col md={12}>
              <Tabs
                defaultActiveKey="calls_chart"
                id="system-tabs"
                className="mb-3 justify-content-center"
                activeKey={subActiveTab}
                onSelect={(k) => setSubActiveTab(k || "en")}
              >
                {TRANSLATION_TABS.map(({ eventKey, title, field }) => (
                  <Tab key={eventKey} eventKey={eventKey} title={title}>
                    <p style={translationParagraphStyle}>{translations[field]}</p>
                  </Tab>
                ))}
              </Tabs>
            </Col>
          </Row>
        )}
      </Col>
    </Row>
  );
}
