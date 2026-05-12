import "@assets/scss/common.scss";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Row, Col, Card, Form, Spinner } from "react-bootstrap";
import React from "react";
import Select from "react-select";
import { useGsmSyncPage } from "../useGsmSyncPage";
import type { GsmSyncSelectOption } from "@page-modules/gsm/useGsmSyncGsmListQuery";

export type GsmSyncPageViewProps = Readonly<{
  ctx: ReturnType<typeof useGsmSyncPage>;
}>;

export function GsmSyncPageView({ ctx }: GsmSyncPageViewProps) {
  const {
    gsmList,
    isFetchingGsm,
    selectedGsm,
    selectedType,
    portsList,
    selectedPorts,
    typeOptions,
    handleGsmChange,
    handleTypeChange,
    handlePortsChange,
    handleFetchDetails,
    handleSyncMobileNumbers,
    isFetchButtonDisabled,
    isMobileSyncButtonDisabled,
    isLoading,
    isLoadingMobile,
  } = ctx;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="GSM" mainLink="/gsm" subTitle="Sync GSM" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5}></Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5 className="card-title mb-0">GSM Sync Configuration</h5>
            </Card.Header>
            <Card.Body>
              <Row className="d-flex justify-content-between align-items-center">
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select GSM</Form.Label>
                    <Select<GsmSyncSelectOption, false>
                      value={selectedGsm}
                      onChange={(opt) => handleGsmChange(opt)}
                      options={gsmList}
                      placeholder="Choose a GSM..."
                      isLoading={isFetchingGsm}
                      isClearable
                      isSearchable
                    />
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Type</Form.Label>
                    <Select<{ value: string; label: string }, false>
                      value={selectedType}
                      onChange={(opt) => handleTypeChange(opt)}
                      options={[...typeOptions]}
                      placeholder="Choose a type..."
                      isClearable
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label></Form.Label>
                    <Button
                      variant="primary"
                      className="btn-sm app-button"
                      onClick={handleFetchDetails}
                      disabled={isFetchButtonDisabled}
                      size="sm"
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Syncing...
                        </>
                      ) : (
                        "Sync Ports"
                      )}
                    </Button>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Ports (Multi-select)</Form.Label>
                    <Select<{ value: string | number; label: string }, true>
                      value={selectedPorts}
                      onChange={(opts) =>
                        handlePortsChange(opts as readonly { value: string | number; label: string }[] | null)
                      }
                      options={portsList}
                      placeholder="Choose ports..."
                      isMulti
                      isClearable
                      isSearchable
                      isDisabled={!selectedGsm}
                    />
                  </Form.Group>
                  <Button
                    variant="success"
                    onClick={handleSyncMobileNumbers}
                    className="btn-sm app-button"
                    disabled={isMobileSyncButtonDisabled}
                    size="sm"
                  >
                    {isLoadingMobile ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Syncing...
                      </>
                    ) : (
                      "Sync Mobile Numbers"
                    )}
                  </Button>
                </Col>
              </Row>

              {(selectedGsm && selectedType) || (selectedGsm && selectedPorts.length > 0) ? (
                <Row className="mt-4">
                  <Col md={12}>
                    <Card className="bg-light">
                      <Card.Body>
                        <h6>Selected Configuration:</h6>
                        <p className="mb-1">
                          <strong>GSM:</strong> {selectedGsm.label}
                        </p>
                        {selectedType && (
                            <p className="mb-1">
                              <strong>Type:</strong> {selectedType.label}
                            </p>
                          )}
                        {selectedPorts.length > 0 && (
                          <p className="mb-0">
                            <strong>Selected Ports:</strong>{" "}
                            {selectedPorts.map((port) => port.label).join(", ")}
                          </p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              ) : null}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
}
