import React, { FormEvent } from "react";
import { Button, Col, Row } from "react-bootstrap";

import { CheckNumberBulkResultTable } from "./CheckNumberBulkResultTable";
import { CheckNumberSingleResultTable } from "./CheckNumberSingleResultTable";
import type { CheckNumberPageViewModel } from "./useCheckNumberPage";

import "./checkNumberPage.scss";

export interface CheckNumberMainCardProps {
  vm: Pick<
    CheckNumberPageViewModel,
    | "phoneNumber"
    | "isChecking"
    | "checkResultRows"
    | "bulkResults"
    | "handleCheckNumber"
    | "handleClearAll"
    | "onPhoneChange"
    | "onPhoneKeyPress"
  >;
}

export function CheckNumberMainCard(
  props: Readonly<CheckNumberMainCardProps>,
): React.ReactElement {
  const { vm } = props;

  return (
    <Row>
      <Col md={12}>
        <div className="card">
          <div className="card-header">
            <h5 className="card-title">Check Number on DNCR</h5>
          </div>
          <div className="card-body">
            <form
              onSubmit={(e: FormEvent) => {
                void vm.handleCheckNumber(e);
              }}
            >
              <div className="row align-items-end">
                <Col md={3}>
                  <div className="form-group">
                    <label htmlFor="number" className="form-label fw-bold">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="number"
                      name="number"
                      value={vm.phoneNumber}
                      onChange={vm.onPhoneChange}
                      onKeyPress={vm.onPhoneKeyPress}
                      placeholder="Enter phone number (e.g., +1 234-567-8900)"
                      pattern="[\d\s\-\+\(\)]+"
                      maxLength={20}
                      required
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="form-group d-flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={!vm.phoneNumber.trim() || vm.isChecking}
                    >
                      {vm.isChecking ? "Checking..." : "Check Number Status"}
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="lg"
                      className="ms-2"
                      type="button"
                      onClick={vm.handleClearAll}
                    >
                      Clear All
                    </Button>
                  </div>
                </Col>
              </div>
            </form>

            {vm.checkResultRows && (
              <CheckNumberSingleResultTable rows={vm.checkResultRows} />
            )}

            {vm.bulkResults && (
              <CheckNumberBulkResultTable results={vm.bulkResults} />
            )}
          </div>
        </div>
      </Col>
    </Row>
  );
}
