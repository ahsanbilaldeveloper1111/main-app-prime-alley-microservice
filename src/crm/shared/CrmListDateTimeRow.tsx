import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import moment from "moment";

export type CrmListDateTimeRowProps = Readonly<{
  dateLabel: string;
  timeLabel: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}>;

export function CrmListDateTimeRow({
  dateLabel,
  timeLabel,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}: Readonly<CrmListDateTimeRowProps>) {
  return (
    <Row>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>{dateLabel}</Form.Label>
          <Form.Control
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            min={moment().format("YYYY-MM-DD")}
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>{timeLabel}</Form.Label>
          <Form.Control
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
          />
        </Form.Group>
      </Col>
    </Row>
  );
}
