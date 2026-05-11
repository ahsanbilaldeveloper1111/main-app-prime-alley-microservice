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
  { eventKey: "en", title: "English", translationKey: "en" },
  { eventKey: "ar", title: "Arabic", translationKey: "ar" },
  { eventKey: "ur", title: "Urdu", translationKey: "ur" },
  { eventKey: "hi", title: "Hindi", translationKey: "hi" },
] as const;

export function CallAnalysisTranslate({ chunksAnalysisData, subActiveTab, setSubActiveTab }: Props) {
  const translations = chunksAnalysisData?.translations;

  return (
    <Row>
      <Col md={12}>
        {translations ? (
          <Row>
            <Col md={12}>
              <Tabs
                defaultActiveKey="calls_chart"
                id="system-tabs"
                className="mb-3 justify-content-center"
                activeKey={subActiveTab}
                onSelect={(k) => setSubActiveTab(k || "en")}
              >
                {TRANSLATION_TABS.map(({ eventKey, title, translationKey }) => (
                  <Tab key={eventKey} eventKey={eventKey} title={title}>
                    <p style={translationParagraphStyle}>{translations?.[translationKey]}</p>
                  </Tab>
                ))}
              </Tabs>
            </Col>
          </Row>
        ) : null}
      </Col>
    </Row>
  );
}
