import React, { FormEvent } from "react";
import { Button, Card, Col, Form } from "react-bootstrap";

import "./addRecordsPage.scss";

export interface AddRecordsSingleRecordCardProps {
  calledNumber: string;
  comments: string;
  submitting: boolean;
  onCalledNumberChange: (value: string) => void;
  onCommentsChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  bulkColumnWidth: boolean;
}

export function AddRecordsSingleRecordCard(
  props: Readonly<AddRecordsSingleRecordCardProps>,
): React.ReactElement {
  const {
    calledNumber,
    comments,
    submitting,
    onCalledNumberChange,
    onCommentsChange,
    onSubmit,
    bulkColumnWidth,
  } = props;

  return (
    <Col lg={bulkColumnWidth ? 6 : 12}>
      <Card className="border addRecordsPage-card">
        <Card.Body className="p-3">
          <h6 className="mb-3 addRecordsPage-cardTitle">
            <span className="addRecordsPage-cardTitlePlus">+</span> Add Single
            Record
          </h6>
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="addRecordsPage-formLabel">
                Called Number{" "}
                <span className="addRecordsPage-requiredMark">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. 0501234567"
                value={calledNumber}
                onChange={(e) => onCalledNumberChange(e.target.value)}
                required
                className="addRecordsPage-formControl"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="addRecordsPage-formLabel">
                Comments (Optional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Reason for blocking..."
                value={comments}
                onChange={(e) => onCommentsChange(e.target.value)}
                className="addRecordsPage-formControl"
              />
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="addRecordsPage-primaryBtn"
            >
              {submitting ? "Adding..." : "Add Block"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Col>
  );
}
