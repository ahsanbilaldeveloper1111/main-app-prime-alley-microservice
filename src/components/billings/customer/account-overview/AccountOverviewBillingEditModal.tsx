import React from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import type { SingleValue } from "react-select";
import ThemeSelect from "@components/ThemeSelect";
import type { BillingInfoFormState, CountrySelectOption } from "./accountOverviewTypes";

export type AccountOverviewBillingEditModalProps = Readonly<{
  show: boolean;
  billingInfo: BillingInfoFormState;
  selectedCountryOption: SingleValue<CountrySelectOption>;
  countryOptions: CountrySelectOption[];
  isSaving: boolean;
  onHide: () => void;
  onBillingChange: React.Dispatch<React.SetStateAction<BillingInfoFormState>>;
  onSave: () => void;
}>;

export function AccountOverviewBillingEditModal({
  show,
  billingInfo,
  selectedCountryOption,
  countryOptions,
  isSaving,
  onHide,
  onBillingChange,
  onSave,
}: AccountOverviewBillingEditModalProps) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Billing Information</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name *</Form.Label>
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
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  value={billingInfo.email}
                  onChange={(e) =>
                    onBillingChange({ ...billingInfo, email: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Phone *</Form.Label>
                <Form.Control
                  type="tel"
                  value={billingInfo.phone}
                  onChange={(e) =>
                    onBillingChange({ ...billingInfo, phone: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Country *</Form.Label>
                <ThemeSelect
                  value={selectedCountryOption}
                  onChange={(option: unknown) => {
                    const o = option as SingleValue<CountrySelectOption>;
                    const next =
                      o && typeof o === "object"
                        ? String(o.value ?? o.label ?? "")
                        : "";
                    onBillingChange((prev) => ({ ...prev, country: next }));
                  }}
                  options={countryOptions}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Address *</Form.Label>
                <Form.Control
                  type="text"
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
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Postcode *</Form.Label>
                <Form.Control
                  type="text"
                  value={billingInfo.profile?.postal_code}
                  onChange={(e) =>
                    onBillingChange({
                      ...billingInfo,
                      profile: {
                        ...billingInfo.profile,
                        postal_code: e.target.value,
                      },
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onSave();
          }}
          disabled={isSaving}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
