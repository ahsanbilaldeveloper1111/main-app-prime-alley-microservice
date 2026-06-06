import React from "react";
import { Button, Form } from "react-bootstrap";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
type GenericTablePaginationConfig = {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  pageSizeOptions?: number[];
};

type GenericTablePaginationControlsProps = Readonly<{
  pagination: GenericTablePaginationConfig;
  onPaginationChange?: (page: number, rowsPerPage: number) => void;
}>;

export function GenericTablePaginationControls({
  pagination,
  onPaginationChange,
}: GenericTablePaginationControlsProps) {
  const {
    currentPage,
    rowsPerPage,
    totalRows,
    pageSizeOptions = [10, 25, 50, 100],
  } = pagination;
  const totalPages = totalRows === 0 ? 1 : Math.ceil(totalRows / rowsPerPage);
  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow =
    totalRows === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalRows);

  return (
    <div className="generic-table-pagination">
      <div className="pagination-info">
        <span className="text-muted small">Show</span>
        <Form.Select
          size="sm"
          value={rowsPerPage}
          onChange={(e) => onPaginationChange?.(1, Number(e.target.value))}
          className="pagination-select"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Form.Select>
        <span className="text-muted small">entries</span>
      </div>

      <div className="text-muted small">
        Showing {startRow} to {endRow} of {totalRows} entries
      </div>

      <div className="pagination-buttons">
        <Button
          size="sm"
          variant="outline-secondary"
          disabled={currentPage === 1}
          onClick={() => onPaginationChange?.(1, rowsPerPage)}
        >
          <ChevronsLeft size={14} />
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          disabled={currentPage === 1}
          onClick={() => onPaginationChange?.(currentPage - 1, rowsPerPage)}
        >
          <ChevronLeft size={14} />
        </Button>

        {Array.from({ length: totalPages }, (_, index) => {
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
                onClick={() => onPaginationChange?.(pageNum, rowsPerPage)}
              >
                {pageNum}
              </Button>
            );
          }
          if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
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
          onClick={() => onPaginationChange?.(currentPage + 1, rowsPerPage)}
        >
          <ChevronRight size={14} />
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          disabled={currentPage === totalPages}
          onClick={() => onPaginationChange?.(totalPages, rowsPerPage)}
        >
          <ChevronsRight size={14} />
        </Button>
      </div>
    </div>
  );
}
