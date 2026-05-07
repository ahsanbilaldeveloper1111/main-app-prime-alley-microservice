import React from "react";
import { Button, Card, Col, Form } from "react-bootstrap";
import { Download, Upload } from "lucide-react";

import "./addRecordsPage.scss";

export interface AddRecordsBulkCsvCardProps {
  csvFile: File | null;
  csvPreview: string;
  bulkSubmitting: boolean;
  csvInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkUpload: () => void;
  onDownloadSample: () => void;
  singleColumnWidth: boolean;
}

export function AddRecordsBulkCsvCard(
  props: Readonly<AddRecordsBulkCsvCardProps>,
): React.ReactElement {
  const {
    csvFile,
    csvPreview,
    bulkSubmitting,
    csvInputRef,
    onFileChange,
    onBulkUpload,
    onDownloadSample,
    singleColumnWidth,
  } = props;

  return (
    <Col lg={singleColumnWidth ? 6 : 12}>
      <Card className="border addRecordsPage-card">
        <Card.Body className="p-3">
          <h6 className="mb-3 addRecordsPage-cardTitle d-flex align-items-center gap-2">
            <Upload size={18} /> Bulk Add Records (CSV)
          </h6>
          <p className="addRecordsPage-mutedText">
            Upload a CSV file with columns:{" "}
            <strong>called_number</strong>, <strong>comments</strong>
          </p>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Sample CSV format:</span>
              <Button
                variant="link"
                size="sm"
                onClick={onDownloadSample}
                className="addRecordsPage-sampleLink"
              >
                <Download size={14} className="me-1" />
                Download Sample
              </Button>
            </div>
            <div className="addRecordsPage-codeSample">
              <pre>
                {`called_number,comments
0511111111,Comments for the record
0511111112,Comments for the record`}
              </pre>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="addRecordsPage-formLabel">
              Choose CSV File
            </Form.Label>
            <Form.Control
              ref={csvInputRef}
              id="csvFileInput"
              type="file"
              accept=".csv"
              onChange={onFileChange}
              disabled={bulkSubmitting}
              className="addRecordsPage-formControlFile"
            />
            {csvPreview && (
              <Form.Text className="text-muted small d-block mt-2">
                {csvFile?.name} ({(csvFile?.size || 0) / 1024} KB)
              </Form.Text>
            )}
          </Form.Group>

          <Button
            variant="primary"
            onClick={onBulkUpload}
            disabled={!csvFile || bulkSubmitting}
            className="addRecordsPage-primaryBtn"
          >
            {bulkSubmitting ? "Uploading..." : "Upload & Add"}
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
}
