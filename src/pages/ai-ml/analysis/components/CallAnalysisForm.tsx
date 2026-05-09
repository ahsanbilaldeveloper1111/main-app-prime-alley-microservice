import React from "react";
import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

type Props = Readonly<{
  uuid: string;
  setUuid: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  localPartyNumber: string;
  setLocalPartyNumber: (v: string) => void;
  ownerUsername: string;
  setOwnerUsername: (v: string) => void;
  imagicle: string;
  setImagicle: (v: string) => void;
  loading: boolean;
  socketConnecting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}>;

export function CallAnalysisForm({
  uuid,
  setUuid,
  date,
  setDate,
  localPartyNumber,
  setLocalPartyNumber,
  ownerUsername,
  setOwnerUsername,
  imagicle,
  setImagicle,
  loading,
  socketConnecting,
  onSubmit,
  onReset,
}: Props) {
  return (
    <Row className="mb-1">
      <Col md={12}>
        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Analysis Parameters</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={onSubmit}>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>UUID</Form.Label>
                    <Form.Control
                      type="text"
                      value={uuid}
                      onChange={(e) => setUuid(e.target.value)}
                      placeholder="Enter UUID"
                      autoFocus
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="Enter Date"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      value={localPartyNumber}
                      onChange={(e) => setLocalPartyNumber(e.target.value)}
                      placeholder="Enter Extension"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Extension</Form.Label>
                    <Form.Control
                      type="text"
                      value={ownerUsername}
                      onChange={(e) => setOwnerUsername(e.target.value)}
                      placeholder="Enter Username"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Node</Form.Label>
                    <Form.Control
                      type="text"
                      value={imagicle}
                      onChange={(e) => setImagicle(e.target.value)}
                      placeholder="Enter Node"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <div className="d-flex justify-content-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading || socketConnecting}
                      className="me-2"
                    >
                      {socketConnecting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Connecting...
                        </>
                      ) : loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze Call"
                      )}
                    </Button>
                    <Button type="button" variant="outline-secondary" onClick={onReset} className="me-2">
                      Reset
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
