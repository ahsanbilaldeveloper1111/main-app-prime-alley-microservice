import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import {
  formatVatRateString,
  parseVatPercentToClampedNumber,
  sanitizeVatPercentDecimalInput,
} from "./accountOverviewVat";

export type AccountOverviewTaxEditModalProps = Readonly<{
  show: boolean;
  taxEditSaving: boolean;
  taxForm: { vat_rate: string; vat_exemption: boolean };
  onHide: () => void;
  onTaxFormChange: React.Dispatch<
    React.SetStateAction<{ vat_rate: string; vat_exemption: boolean }>
  >;
  onSave: () => void;
}>;

export function AccountOverviewTaxEditModal({
  show,
  taxEditSaving,
  taxForm,
  onHide,
  onTaxFormChange,
  onSave,
}: AccountOverviewTaxEditModalProps) {
  return (
    <Modal
      show={show}
      onHide={() => {
        if (!taxEditSaving) onHide();
      }}
      backdrop={taxEditSaving ? "static" : true}
      keyboard={!taxEditSaving}
      centered
    >
      <Modal.Header closeButton={!taxEditSaving}>
        <Modal.Title>Edit tax information</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-3">
          VAT rate and exemption are saved on the accounting customer profile for
          this company.
        </p>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>VAT rate (%)</Form.Label>
            <Form.Control
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 22 or 22.5"
              value={taxForm.vat_rate}
              onChange={(e) =>
                onTaxFormChange((p) => ({
                  ...p,
                  vat_rate: sanitizeVatPercentDecimalInput(e.target.value),
                }))
              }
              onBlur={() => {
                onTaxFormChange((p) => ({
                  ...p,
                  vat_rate:
                    p.vat_rate.trim() === ""
                      ? "0.00"
                      : formatVatRateString(
                          String(parseVatPercentToClampedNumber(p.vat_rate)),
                        ),
                }));
              }}
              aria-describedby="account-overview-vat-rate-hint"
            />
            <Form.Text id="account-overview-vat-rate-hint" muted>
              Up to two decimal places. Values are clamped between 0 and 100.
            </Form.Text>
          </Form.Group>
          <Form.Check
            type="checkbox"
            id="account-overview-vat-exemption"
            className="mb-0"
            label="VAT exempt (no VAT charged for this customer)"
            checked={taxForm.vat_exemption}
            onChange={(e) =>
              onTaxFormChange((p) => ({
                ...p,
                vat_exemption: e.target.checked,
              }))
            }
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          disabled={taxEditSaving}
          onClick={onHide}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={taxEditSaving}
          onClick={() => {
            onSave();
          }}
        >
          {taxEditSaving ? "Saving…" : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
