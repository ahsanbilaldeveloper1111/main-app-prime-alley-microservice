import React from "react";
import {
  Button,
  Card,
  Dropdown,
  Form,
  Table,
} from "react-bootstrap";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
} from "lucide-react";

import type { LocalDNDBlockRecord } from "./localDndCallBlockDomain";
import type { LocalDndCallBlockViewModel } from "./useLocalDndCallBlockPage";

import "./localDndCallBlockPage.scss";

export function LocalDndCallBlockDataTable(
  props: Readonly<{ vm: LocalDndCallBlockViewModel }>,
): React.ReactElement {
  const { vm } = props;

  return (
    <Card className="border localDndCallBlockPage-tableCard">
      <Card.Body className="p-0">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom localDndCallBlockPage-tableCardHeader">
          <h6 className="mb-0 localDndCallBlockPage-tableCardTitle">
            Local DND Blocks{" "}
            <span className="localDndCallBlockPage-titleMuted">
              — Blocked Numbers
            </span>
          </h6>
          <div className="d-flex align-items-center gap-2">
            <span className="localDndCallBlockPage-metaMuted">
              {vm.totalRecords} Records | Page {vm.currentPage} of{" "}
              {vm.totalPages || 1}
            </span>
            <Button
              variant="light"
              size="sm"
              onClick={vm.handlePrevPage}
              disabled={vm.currentPage === 1}
              className="localDndCallBlockPage-pageNavBtn"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={vm.handleNextPage}
              disabled={vm.currentPage === vm.totalPages || vm.totalPages === 0}
              className="localDndCallBlockPage-pageNavBtn"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="localDndCallBlockPage-tableWrap">
          <Table className="mb-0 localDndCallBlockPage-table">
            <thead className="localDndCallBlockPage-thead">
              <tr>
                <th className="localDndCallBlockPage-thCheckbox">
                  <Form.Check
                    type="checkbox"
                    checked={
                      vm.apiData.length > 0 &&
                      vm.selectedRecords.length === vm.apiData.length
                    }
                    onChange={vm.handleSelectAll}
                    disabled={vm.loading || vm.apiData.length === 0}
                  />
                </th>
                <th className="localDndCallBlockPage-th">ID</th>
                <th className="localDndCallBlockPage-th">CALLED NUMBER</th>
                <th className="localDndCallBlockPage-th">COMPANY NAME</th>
                <th className="localDndCallBlockPage-th">DATE/TIME</th>
                <th className="localDndCallBlockPage-th">COMMENTS</th>
                <th className="localDndCallBlockPage-thActions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (vm.loading) {
                  return (
                    <tr>
                      <td colSpan={7} className="localDndCallBlockPage-stateLoading">
                        Loading...
                      </td>
                    </tr>
                  );
                }
                if (vm.error) {
                  return (
                    <tr>
                      <td colSpan={7} className="localDndCallBlockPage-stateError">
                        {vm.error}
                      </td>
                    </tr>
                  );
                }
                if (vm.apiData.length > 0) {
                  return vm.apiData.map((record: LocalDNDBlockRecord) => (
                    <tr key={record.id} className="localDndCallBlockPage-row">
                      <td className="localDndCallBlockPage-td">
                        <Form.Check
                          type="checkbox"
                          checked={vm.selectedRecords.includes(record.id)}
                          onChange={() => vm.handleSelectRecord(record.id)}
                        />
                      </td>
                      <td className="localDndCallBlockPage-td">{record.id}</td>
                      <td className="localDndCallBlockPage-td">
                        {record.called_number}
                      </td>
                      <td className="localDndCallBlockPage-td">
                        {record.company_name || "-"}
                      </td>
                      <td className="localDndCallBlockPage-td">
                        {vm.formatDateTime(record.date_time)}
                      </td>
                      <td className="localDndCallBlockPage-td">
                        <span className="localDndCallBlockPage-comments">
                          {record.comments || "-"}
                        </span>
                      </td>
                      <td className="localDndCallBlockPage-td">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => vm.handleDeleteClick(record)}
                          className="localDndCallBlockPage-deleteLink"
                          title="Delete record"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ));
                }
                return (
                  <tr>
                    <td colSpan={7} className="localDndCallBlockPage-stateEmpty">
                      No records found matching your filters
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </Table>
        </div>

        <div className="d-flex justify-content-between align-items-center p-3 border-top localDndCallBlockPage-tableCardHeader">
          <span className="localDndCallBlockPage-metaMuted">
            {vm.totalRecords} Records | Page {vm.currentPage} of{" "}
            {vm.totalPages || 1}
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className="localDndCallBlockPage-footerMeta">
              Records per page:
            </span>
            <Dropdown>
              <Dropdown.Toggle
                variant="light"
                size="sm"
                className="localDndCallBlockPage-dropdownToggle"
              >
                {vm.recordsPerPage} ▼
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => vm.handleRecordsPerPageChange(10)}>
                  10
                </Dropdown.Item>
                <Dropdown.Item onClick={() => vm.handleRecordsPerPageChange(25)}>
                  25
                </Dropdown.Item>
                <Dropdown.Item onClick={() => vm.handleRecordsPerPageChange(50)}>
                  50
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => vm.handleRecordsPerPageChange(100)}
                >
                  100
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button
              variant="light"
              size="sm"
              onClick={vm.handleFirstPage}
              disabled={vm.currentPage === 1}
              className="localDndCallBlockPage-pageBtnEdge"
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={vm.handlePrevPage}
              disabled={vm.currentPage === 1}
              className="localDndCallBlockPage-pageNavBtn"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="localDndCallBlockPage-pageCurrent"
            >
              {vm.currentPage}
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={vm.handleNextPage}
              disabled={
                vm.currentPage === vm.totalPages || vm.totalPages === 0
              }
              className="localDndCallBlockPage-pageNavBtn"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={vm.handleLastPage}
              disabled={
                vm.currentPage === vm.totalPages || vm.totalPages === 0
              }
              className="localDndCallBlockPage-pageNavBtn"
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
