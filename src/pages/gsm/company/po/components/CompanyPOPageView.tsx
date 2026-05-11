import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import type { Column } from "@components/CustomDataTable";
import CompanyPOFilters from "@components/filters/CompanyPOFilters";
import { useCompanyPOPage } from "../useCompanyPOPage";
import { Row, Col } from "react-bootstrap";
import { FiRefreshCw } from "react-icons/fi";
import React from "react";

export type CompanyPOPageViewProps = Readonly<{
  ctx: ReturnType<typeof useCompanyPOPage>;
}>;

export function CompanyPOPageView({ ctx }: CompanyPOPageViewProps) {
  const { refreshKey, columns, fetchCompanyPOData, handleRefresh, handleFiltersChange, memoizedFilters } =
    ctx;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Company" mainLink="/company" subTitle="Company PO" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5} />
              <Col md={7} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <CompanyPOFilters onFiltersChange={handleFiltersChange} />

                  <button type="button" className="btn btn-primary" onClick={handleRefresh}>
                    <FiRefreshCw className="me-2" /> Refresh
                  </button>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns as Column[]}
        fetchData={fetchCompanyPOData}
        title="Company PO"
        searchPlaceholder="Search companies, GSMs, or ports..."
        defaultPageSize={15}
        refreshKey={refreshKey}
        search={false}
        filters={memoizedFilters}
        tableStyle="table-style-2"
      />
    </React.Fragment>
  );
}
