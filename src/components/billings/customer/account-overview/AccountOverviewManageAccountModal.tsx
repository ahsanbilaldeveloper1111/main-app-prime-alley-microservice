import React from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import type { BillingInfoFormState } from "./accountOverviewTypes";

export type AccountOverviewManageAccountModalProps = Readonly<{
  show: boolean;
  billingInfo: BillingInfoFormState;
  onHide: () => void;
  onBillingChange: React.Dispatch<React.SetStateAction<BillingInfoFormState>>;
}>;

export function AccountOverviewManageAccountModal({
  show,
  billingInfo,
  onHide,
  onBillingChange,
}: AccountOverviewManageAccountModalProps) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Manage Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h6 className="mb-3">Account Information</h6>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={billingInfo.name}
                    onChange={(e) =>
                      onBillingChange({ ...billingInfo, name: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) =>
                      onBillingChange({
                        ...billingInfo,
                        email: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={billingInfo.phone}
                    onChange={(e) =>
                      onBillingChange({
                        ...billingInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Billing Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={billingInfo.profile?.address}
                onChange={(e) =>
                  onBillingChange({
                    ...billingInfo,
                    profile: {
                      ...billingInfo.profile,
                      address: e.target.value,
                    },
                  })
                }
              />
            </Form.Group>
          </Form>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onHide();
          }}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
