import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import type { Dispatch, SetStateAction } from "react";
import {
  applyCrmListExportDateRangePreset,
  crmListExportDateRangePresetValue,
  CRM_LIST_EXPORT_MODAL_DEFAULT_DATE_RANGE_FIELDS,
} from "@crm/shared/crmListExportModalDateRangePresets";

export type CrmProspectsListExportModalFiltersBodyProps = Readonly<{
  extensions: readonly {
    id?: string | number;
    extension?: string;
    display_name?: string;
    name?: string;
  }[];
  exportFilters: Record<string, any>;
  setExportFilters: Dispatch<SetStateAction<Record<string, any>>>;
}>;

/**
 * Shared export-filter fields for CRM prospects-style lists (quotes + prospects pages).
 */
export function CrmProspectsListExportModalFiltersBody({
  extensions,
  exportFilters,
  setExportFilters,
}: CrmProspectsListExportModalFiltersBodyProps) {
  return (
    <>
      <hr />
      <h6 className="mb-3">Export filters</h6>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Associate with</Form.Label>
            <Form.Select
              value={
                exportFilters.user_extension
                  ? String(exportFilters.user_extension)
                  : ""
              }
              onChange={(e) => {
                const v = e.target.value;
                setExportFilters((prev) => {
                  const next = { ...prev };
                  if (v) next.user_extension = v;
                  else delete next.user_extension;
                  return next;
                });
              }}
            >
              <option value="">All owners</option>
              {extensions.map((ext) => (
                <option
                  key={String(ext.id || ext.extension)}
                  value={String(ext.id || ext.extension)}
                >
                  {ext.display_name ||
                    ext.name ||
                    ext.id ||
                    ext.extension ||
                    ""}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Lead status</Form.Label>
            <Form.Select
              value={exportFilters.disposition || ""}
              onChange={(e) => {
                const v = e.target.value;
                setExportFilters((prev) => {
                  const next = { ...prev };
                  if (v) next.disposition = v;
                  else delete next.disposition;
                  return next;
                });
              }}
            >
              <option value="">All status</option>
              <option value="hot_lead">Hot Lead</option>
              <option value="warm_lead">Warm Lead</option>
              <option value="cold_lead">Cold Lead</option>
              <option value="interested">Interested</option>
              <option value="callback_requested">Callback Requested</option>
              <option value="no_answer">No Answer</option>
              <option value="not_interested">Not Interested</option>
              <option value="follow_up">Follow Up</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        {CRM_LIST_EXPORT_MODAL_DEFAULT_DATE_RANGE_FIELDS.map(
          ({ label, keys }) => (
            <Col md={6} key={keys.from}>
              <Form.Group className="mb-3">
                <Form.Label>{label}</Form.Label>
                <Form.Select
                  value={crmListExportDateRangePresetValue(
                    exportFilters,
                    keys,
                  )}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) =>
                      applyCrmListExportDateRangePreset(prev, v, keys),
                    );
                  }}
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                </Form.Select>
              </Form.Group>
            </Col>
          ),
        )}
      </Row>
      <Form.Group className="mb-0">
        <Form.Label>Search (optional)</Form.Label>
        <Form.Control
          type="text"
          placeholder="Filter by name, phone, etc."
          value={exportFilters.search || ""}
          onChange={(e) => {
            const v = e.target.value.trim();
            setExportFilters((prev) => {
              const next = { ...prev };
              if (v) next.search = v;
              else delete next.search;
              return next;
            });
          }}
        />
      </Form.Group>
    </>
  );
}
