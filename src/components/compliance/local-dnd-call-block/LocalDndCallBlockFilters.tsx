import React from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Building2, Search } from "lucide-react";

import type { LocalDndCallBlockViewModel } from "./useLocalDndCallBlockPage";

import "./localDndCallBlockPage.scss";

export function LocalDndCallBlockFilters(
  props: Readonly<{ vm: LocalDndCallBlockViewModel }>,
): React.ReactElement {
  const { vm } = props;

  return (
    <>
      <Row className="mb-3">
        <Col>
          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <div className="d-flex align-items-center localDndCallBlockPage-filterShell">
                <Search size={16} className="localDndCallBlockPage-filterIcon" />
                <Form.Control
                  type="text"
                  placeholder="Search (Called Number or Comments)"
                  value={vm.searchQuery}
                  onChange={(e) => vm.setSearchQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && vm.handleApplyFilters()
                  }
                  className="localDndCallBlockPage-filterInputSearch"
                />
              </div>
              <div className="d-flex align-items-center localDndCallBlockPage-filterShell">
                <Building2
                  size={16}
                  className="localDndCallBlockPage-filterIcon"
                />
                <Form.Control
                  type="text"
                  placeholder="Company Name"
                  value={vm.companyFilter}
                  onChange={(e) => vm.setCompanyFilter(e.target.value)}
                  className="localDndCallBlockPage-filterInputCompany"
                />
              </div>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <Button
                variant="light"
                onClick={vm.handleResetFilters}
                className="localDndCallBlockPage-btnReset"
              >
                Reset
              </Button>
              <Button
                onClick={vm.handleApplyFilters}
                className="localDndCallBlockPage-btnApply"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {(vm.appliedFilters.search || vm.appliedFilters.company) && (
        <div className="mb-3 px-2">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <span className="localDndCallBlockPage-activeFiltersLabel">
              Active Filters:
            </span>
            {vm.appliedFilters.search && (
              <span className="localDndCallBlockPage-filterPill">
                Search: {vm.appliedFilters.search}
              </span>
            )}
            {vm.appliedFilters.company && (
              <span className="localDndCallBlockPage-filterPill">
                Company: {vm.appliedFilters.company}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
