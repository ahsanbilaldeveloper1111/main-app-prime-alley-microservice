import React, { ReactElement, useEffect, useRef, useState } from 'react';
import Layout from '@layout/index';
import '@assets/scss/datatable-style.scss';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Button, Card, Col, Dropdown, Row } from 'react-bootstrap';
import dynamic from 'next/dynamic';
import data  from '@common/JsonData/GsmInbox';
import AnimatedNumber from '@components/AnimatedNumber';

import GsmInboxFilter from '@components/filters/GsmInboxFilter';

import  '@assets/scss/gsm-dashboard.scss'
import '@assets/scss/gsm-assign.scss';
import '@assets/scss/dashboard-card.scss';



import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';

const DataTable = dynamic(() => import("react-data-table-component"), {
      ssr: false
});

const paginationComponentOptions = {
      rowsPerPageText: "Data per page",
      rangeSeparatorText: "of",
      selectAllRowsItem: true,
      selectAllRowsItemText: ""
};

    
const GsmInbox = () => {

      const [filters, setFilters] = useState<boolean>(false);
      const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      import('bootstrap/dist/js/bootstrap.bundle.min.js' as any); 
    }, []);

    const handleFilter = () => {
      if(filters){
        setFilters(false);
      }else{
        setFilters(true);
      }
    }

      const allColumns = [
            // {key: 'id',name: 'ID', selector: (row: any) => row.id, sortable: true},
             { key: 'name', name: 'Gsm Name', selector: (row: any) => row.name, sortable: true },
             { key: 'port', name: 'Port', selector: (row: any) => row.port, sortable: true },
             { key: 'mobile_number', name: 'Mobile Number', selector: (row: any) => row.mobile_number, sortable: true },
             { key: 'sender_number', name: 'Sender Number', selector: (row: any) => row.sender_number, sortable: true },
             { key: 'message', name: 'Message', selector: (row: any) => row.message, sortable: true },
            
       { key: 'created_at', name: 'DateTime', selector: (row: any) => row.created_at, sortable: true },
            
             
          ];

  
    // State to track which columns are visible
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        allColumns.map(col => col.key) // Initially all columns are visible
    );

    // Show all columns
      const showAllColumns = () => {
      setVisibleColumns(allColumns.map(col => col.key));
    };
  
    // Hide all columns (keep at least one visible for usability)
    const hideAllColumns = () => {
      setVisibleColumns([allColumns[0].key]); // Keep first column visible
    };
  
    const [pageSize, setPageSize] = useState<number>(5);
  
    const onChangeInSelect = (event: any) => {
      const newPageSize = Number(event.target.value);
      setPageSize(newPageSize);
    };
  
    const handlePerRowsChange = (newPerPage: number) => {
      setPageSize(newPerPage);
    };


    const [searchTerm, setSearchTerm] = useState("");

    const handleSearchChange = (event: any) => {
      setSearchTerm(event.target.value);
    };
    const filteredData = data.filter((row) =>
      Object.values(row).some(
          (value) =>
              value &&
              value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  
    // Toggle column visibility
    const toggleColumnVisibility = (columnKey: string) => {
      setVisibleColumns(prev =>
          prev.includes(columnKey)
              ? prev.filter(key => key !== columnKey)
              : [...prev, columnKey]
      );
    };
  
    const conditionalRowStyles = [
      {
        when: () => true, // apply to all rows
        style: {
          animation: 'fadeInUp 0.9s ease-in-out',
        },
      },
    ];
  
    // Filter columns based on visibility
    const visibleColumnsData = allColumns.filter(col =>
        visibleColumns.includes(col.key)
    );

    const [expandedRow, setExpandedRow] = useState<any>(null);

      const filteredDataWithFlag = data.map((row) => ({
      ...row,
      defaultExpanded: expandedRow?.id === row.id,
      }));


      const ExpandedComponent = ({ data }: { data: any }) => (
      <div ref={contentRef}
      className="animate fadeInUp  p-3">
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit, quasi laudantium! Amet recusandae adipisci reprehenderit soluta dolor quos, architecto ducimus sunt tempora eligendi corporis, tenetur possimus eaque odit, error in!</p>
      </div>
    );


  return (
    <>
      
      <BreadcrumbItem mainTitle="Gsm" mainLink="/call-recordings/dashboard" subTitle="Call Recordings" />



      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title ">
            <h2 className="mb-0 d-flex align-items-center">
                  Gsm Inbox
                  <GsmInboxFilter />
            </h2>
          </div>
        </Col>
      </Row>



      <Row className="mb-3">
          <Col sm={12} md={6}>
            <div className="dataTables_length" id="dom-jqry_length">
              <label className="d-flex align-items-center">
                Show{" "}
                <select
                    onChange={onChangeInSelect}
                    className="form-select form-select-sm mx-1"
                    style={{ width: "auto" }}
                    value={pageSize}
                >
                  {[5,10, 25, 50, 100].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                  ))}
                </select>{" "}
                entries
              </label>
            </div>
          </Col>

          <Col sm={12} md={6}>

          <div className='d-flex align-items-center justify-content-end gap-2'>
            {/* search box */}
            <div>
                  <label className="d-flex align-items-center justify-content-end">
                  Search:
                  <input
                  type="search"
                  className="form-control form-control-sm ms-1"
                  placeholder=""
                  aria-controls="dom-jqry"
                  onChange={handleSearchChange}
                  value={searchTerm}
                  />
                  </label>
            </div>

            {/* Column Visibility Controls */}
            <div className="d-flex align-items-center justify-content-end">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  Columns ({visibleColumns.length}/{allColumns.length})
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Header>Select Columns to Show</Dropdown.Header>
                  <Dropdown.Divider />
                  {allColumns.map((column) => (
                      <div key={column.key} className="px-3 py-1">
                        <div className="form-check">
                          <input
                              type="checkbox"
                              className="form-check-input"
                              checked={visibleColumns.includes(column.key)}
                              onChange={() => toggleColumnVisibility(column.key)}
                              id={`column-${column.key}`}
                          />
                          <label
                              className="form-check-label"
                              htmlFor={`column-${column.key}`}
                              style={{ cursor: 'pointer' }}
                          >
                            {column.name}
                          </label>
                        </div>
                      </div>
                  ))}
                  {/* <Dropdown.Divider />
                <Dropdown.Item onClick={showAllColumns}>
                  Show All
                </Dropdown.Item>
                <Dropdown.Item onClick={hideAllColumns}>
                  Hide All
                </Dropdown.Item> */}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

            
          </Col>
        </Row>

        {visibleColumnsData.length > 0 ? (
            <DataTable
                key={`datatable-${pageSize}`}
                striped={true}
                columns={visibleColumnsData}
                data={filteredData}
                paginationComponentOptions={paginationComponentOptions}
                pagination
                paginationPerPage={pageSize}
                paginationRowsPerPageOptions={[5,10, 25, 50, 100]}
                onChangeRowsPerPage={handlePerRowsChange}
                highlightOnHover
                pointerOnHover
                conditionalRowStyles={conditionalRowStyles}
                className="table-bordered"
                
            />
        ) : (
            <div className="text-center p-4 border rounded">
              <p className="mb-0">No columns selected. Please select at least one column to display the table.</p>
            </div>
        )}
        <Tooltip id="my-tooltip" />
    </>
  );
};

GsmInbox.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmInbox;