import React, { type Dispatch, type SetStateAction } from "react";
import { Button, Form } from "react-bootstrap";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getTotalPages } from "./crmListSortPaginationUtils";

type CrmListPagination = {
  currentPage: number;
  rowsPerPage: number;
  sortColumn: string;
  sortDirection: "asc" | "desc";
};

interface UseCrmListSortPaginationParams {
  pagination: CrmListPagination;
  setPagination: Dispatch<SetStateAction<CrmListPagination>>;
  totalRecords: number;
  entityName: string;
}

export function useCrmListSortPagination({
  pagination,
  setPagination,
  totalRecords,
  entityName,
}: UseCrmListSortPaginationParams) {
  const handleSort = (column: string) => {
    const newDirection =
      pagination.sortColumn === column && pagination.sortDirection === "asc"
        ? "desc"
        : "asc";
    setPagination({
      ...pagination,
      sortColumn: column,
      sortDirection: newDirection,
      currentPage: 1,
    });
  };

  const renderSortIcon = (column: string) => {
    if (pagination.sortColumn !== column) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return pagination.sortDirection === "asc" ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };

  const renderPaginationControls = () => {
    const totalPages = getTotalPages(totalRecords, pagination.rowsPerPage);
    const { currentPage, rowsPerPage } = pagination;
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, totalRecords);

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Show</span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) =>
              setPagination({
                ...pagination,
                rowsPerPage: Number(e.target.value),
                currentPage: 1,
              })
            }
            style={{ width: "auto" }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
          <span className="text-muted small">entries</span>
        </div>

        <div className="text-muted small">
          Showing {startRow} to {endRow} of {totalRecords} {entityName}
        </div>

        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPagination({ ...pagination, currentPage: 1 })}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() =>
              setPagination({ ...pagination, currentPage: currentPage - 1 })
            }
          >
            <ChevronLeft size={14} />
          </Button>

          {[...Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={
                    currentPage === pageNum ? "primary" : "outline-secondary"
                  }
                  onClick={() =>
                    setPagination({ ...pagination, currentPage: pageNum })
                  }
                >
                  {pageNum}
                </Button>
              );
            } else if (
              pageNum === currentPage - 2 ||
              pageNum === currentPage + 2
            ) {
              return (
                <span key={pageNum} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPagination({ ...pagination, currentPage: currentPage + 1 })
            }
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPagination({ ...pagination, currentPage: totalPages })
            }
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    );
  };

  return { handleSort, renderSortIcon, renderPaginationControls };
}
