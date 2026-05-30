import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row, Col, Card, Badge, Spinner } from "react-bootstrap";
import { Info, Tag } from "lucide-react";
import Select from "react-select";
import React from "react";

export type FAQTypesPageViewProps = Readonly<{
  selectedTopic: number | null;
  onTopicChange: (topicId: number | null) => void;
  topicOptions: { value: number | null; label: string }[];
  isLoadingTopics: boolean;
  types: string[];
  loading: boolean;
  showBreadcrumb?: boolean;
  breadcrumbMainLink?: string;
}>;

export const FAQTypesPageView: React.FC<FAQTypesPageViewProps> = ({
  selectedTopic,
  onTopicChange,
  topicOptions,
  isLoadingTopics,
  types,
  loading,
  showBreadcrumb = true,
  breadcrumbMainLink = "/main-settings/help-center/types",
}) => {
  const renderCardBody = (): React.ReactNode => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading FAQ types...</p>
        </div>
      );
    }

    if (types.length > 0) {
      const typePluralSuffix = types.length === 1 ? "" : "s";
      return (
        <div>
          <div className="mb-3">
            <p className="text-muted mb-0">
              <Info size={14} className="me-1" />
              Found {types.length} unique type{typePluralSuffix}
              {selectedTopic == null ? null : " for selected topic"}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {types.map((type) => (
              <Badge key={type} bg="primary" className="p-2" style={{ fontSize: "0.9rem" }}>
                <Tag size={14} className="me-1" />
                {type}
              </Badge>
            ))}
          </div>
        </div>
      );
    }

    const emptyMessage =
      selectedTopic == null
        ? "No FAQ types found. Types are automatically created when FAQ items are assigned a type."
        : "No types found for the selected topic";

    return (
      <div className="text-center py-5">
        <Tag size={48} className="text-muted mb-3" />
        <p className="text-muted">{emptyMessage}</p>
      </div>
    );
  };

  return (
    <React.Fragment>
      {showBreadcrumb ? (
        <BreadcrumbItem mainTitle="FAQs" mainLink={breadcrumbMainLink} subTitle="Types" />
      ) : null}

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={6} />
              <Col md={6} className="d-flex justify-content-end align-items-center">
                <div style={{ minWidth: "250px" }}>
                  <Select
                    options={topicOptions}
                    value={topicOptions.find((opt) => opt.value === selectedTopic)}
                    onChange={(option: { value: number | null } | null) =>
                      onTopicChange(option?.value ?? null)
                    }
                    placeholder="Filter by topic..."
                    isLoading={isLoadingTopics}
                    isClearable={true}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Body>{renderCardBody()}</Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};
