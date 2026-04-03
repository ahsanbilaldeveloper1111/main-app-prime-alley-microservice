import React from "react";
import { Row, Col, Form, Alert } from "react-bootstrap";
import { CrmListDateTimeRow } from "./CrmListDateTimeRow";

export interface AfterCallData {
  disposition: string;
  callStatus: string;
  comment: string;
  nextCallDate: string;
  nextCallTime: string;
  generateLead: string;
}

export interface CrmListAfterCallFormContentProps {
  afterCallData: AfterCallData;
  setAfterCallData: React.Dispatch<React.SetStateAction<AfterCallData>>;
}

export function CrmListAfterCallFormContent({
  afterCallData,
  setAfterCallData,
}: CrmListAfterCallFormContentProps) {
  const update = (patch: Partial<AfterCallData>) =>
    setAfterCallData((prev) => ({ ...prev, ...patch }));

  return (
    <>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Disposition *</Form.Label>
            <Form.Select
              value={afterCallData.disposition}
              onChange={(e) => update({ disposition: e.target.value })}
            >
              <option value="">Select Disposition</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
              <option value="callback_requested">Call Back Requested</option>
              <option value="follow_up">Follow Up</option>
              <option value="do_not_call">Do Not Call</option>
              <option value="wrong_number">Wrong Number</option>
              <option value="spam">Spam</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Call Status *</Form.Label>
            <Form.Select
              value={afterCallData.callStatus}
              onChange={(e) => update({ callStatus: e.target.value })}
            >
              <option value="">Select Call Status</option>
              <option value="answered">Answered</option>
              <option value="no_answer">No Answer</option>
              <option value="busy">Busy</option>
              <option value="voicemail">Voicemail</option>
              <option value="disconnected">Disconnected</option>
              <option value="network_error">Network Error</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Call Comment *</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={afterCallData.comment}
          onChange={(e) => update({ comment: e.target.value })}
          placeholder="Enter call details, client response, and any important notes..."
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Generate Lead *</Form.Label>
        <div className="d-flex gap-4">
          <Form.Check
            type="radio"
            id="generate-lead-yes"
            name="generateLead"
            value="yes"
            checked={afterCallData.generateLead === "yes"}
            onChange={(e) => update({ generateLead: e.target.value })}
            label="Yes, generate lead"
          />
          <Form.Check
            type="radio"
            id="generate-lead-no"
            name="generateLead"
            value="no"
            checked={afterCallData.generateLead === "no"}
            onChange={(e) => update({ generateLead: e.target.value })}
            label="No, do not generate lead"
          />
        </div>
        <Form.Text className="text-muted">
          Select &quot;Yes&quot; if this call resulted in a qualified lead that
          should be created in the CRM system.
        </Form.Text>
      </Form.Group>

      <CrmListDateTimeRow
        dateLabel="Schedule Next Call (Optional)"
        timeLabel="Time (Optional)"
        dateValue={afterCallData.nextCallDate}
        timeValue={afterCallData.nextCallTime}
        onDateChange={(v) => update({ nextCallDate: v })}
        onTimeChange={(v) => update({ nextCallTime: v })}
      />

      <Alert variant="info">
        <strong>Note:</strong> This dialog will be used to record call outcomes
        and schedule follow-up actions. All fields marked with * are required.
      </Alert>
    </>
  );
}
