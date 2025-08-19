import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button, Row, Col, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';

// Dynamic import to avoid SSR issues
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false
});

// Import export utilities
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

interface DataTableWithExportProps {
  columns: any[];
  data: any[];
  title?: string;
  loading?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  onRowClick?: (row: any) => void;
  serverSide?: boolean;
  paginationInfo?: {
    totalRows: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onSearch?: (search: string) => void;
}

const DataTableWithExport: React.FC<DataTableWithExportProps> = ({
  columns,
  data,
  title = "Data Table",
  loading = false,
  defaultPageSize = 15,
  pageSizeOptions = [10, 15, 25, 50],
  searchPlaceholder = "Search...",
  onRowClick,
  serverSide = false,
  paginationInfo,
  onPageChange,
  onPerPageChange,
  onSearch
}) => {
  const [currentPageSize, setCurrentPageSize] = useState(defaultPageSize);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  // Update filtered data when data changes
  useEffect(() => {
    if (!serverSide) {
      setFilteredData(data);
    }
  }, [data, serverSide]);

  // Handle search
  const handleSearch = (search: string) => {
    setSearchTerm(search);
    if (serverSide && onSearch) {
      onSearch(search);
    } else {
      // Client-side filtering
      const filtered = data.filter((row) =>
        Object.values(row).some((value) =>
          value && value.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
      setFilteredData(filtered);
    }
  };

  // Handle page size change
  const handlePerRowsChange = (newPerPage: number) => {
    setCurrentPageSize(newPerPage);
    if (serverSide && onPerPageChange) {
      onPerPageChange(newPerPage);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (serverSide && onPageChange) {
      onPageChange(page);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for export (exclude action columns)
      const exportColumns = columns.filter(col => col.key !== 'Action' && col.key !== 'Actions');
      const exportData = filteredData.map(row => {
        const exportRow: any = {};
        exportColumns.forEach(col => {
          const value = col.selector ? col.selector(row) : row[col.key];
          exportRow[col.name] = value;
        });
        return exportRow;
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title);

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Download file
      saveAs(dataBlob, `${title.toLowerCase().replace(/\s+/g, '-')}-export.xlsx`);
      toast.success('Excel export completed successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Excel export failed. Please try again.');
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      // Prepare data for export (exclude action columns)
      const exportColumns = columns.filter(col => col.key !== 'Action' && col.key !== 'Actions');
      const exportData = filteredData.map(row => {
        const exportRow: any = {};
        exportColumns.forEach(col => {
          const value = col.selector ? col.selector(row) : row[col.key];
          exportRow[col.name] = value;
        });
        return exportRow;
      });

      // Create PDF
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 15);
      
      // Add export date
      doc.setFontSize(10);
      doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 25);

      // Prepare table data
      const tableData = exportData.map(row => 
        exportColumns.map(col => row[col.name] || '')
      );

      // Add table
      (doc as any).autoTable({
        head: [exportColumns.map(col => col.name)],
        body: tableData,
        startY: 35,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Save PDF
      doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-export.pdf`);
      toast.success('PDF export completed successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF export failed. Please try again.');
    }
  };

  // Pagination component options
  const paginationComponentOptions = {
    rowsPerPageText: "Rows per page:",
    rangeSeparatorText: "of",
    selectAllRowsItem: true,
    selectAllRowsItemText: "All",
  };

  return (
    <div className="data-table-with-export">
      {/* Header with Export Buttons */}
      <Row className="mb-3">
        <Col md={6}>
          <h4 className="mb-0">{title}</h4>
        </Col>
        <Col md={6} className="text-end">
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" size="sm">
              <i className="ri-download-line me-1"></i>
              Export
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={exportToExcel}>
                <i className="ri-file-excel-line me-2"></i>
                Export to Excel
              </Dropdown.Item>
              <Dropdown.Item onClick={exportToPDF}>
                <i className="ri-file-pdf-line me-2"></i>
                Export to PDF
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Search and Page Size Controls */}
      <Row className="mb-3">
        <Col md={6}>
          <div className="d-flex align-items-center">
            <label className="me-2">Show:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={currentPageSize}
              onChange={(e) => handlePerRowsChange(Number(e.target.value))}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="ms-2">entries</span>
          </div>
        </Col>
        <Col md={6}>
          <div className="d-flex justify-content-end">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
        </Col>
      </Row>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        paginationPerPage={currentPageSize}
        paginationRowsPerPageOptions={pageSizeOptions}
        onChangeRowsPerPage={handlePerRowsChange}
        onChangePage={handlePageChange}
        paginationComponentOptions={paginationComponentOptions}
        progressPending={loading}
        onRowClicked={onRowClick}
        pointerOnHover={!!onRowClick}
        highlightOnHover
        striped
        responsive
        paginationTotalRows={serverSide ? paginationInfo?.totalRows : undefined}
        paginationServer={serverSide}
      />

      {/* Info Text */}
      {!serverSide && (
        <div className="mt-2 text-muted small">
          Showing {filteredData.length} of {data.length} entries
        </div>
      )}
    </div>
  );
};

export default DataTableWithExport; 