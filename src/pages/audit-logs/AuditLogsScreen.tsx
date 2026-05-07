import React from "react";
import moment from "moment";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Modal, Form, Button, Dropdown } from "react-bootstrap";
import GenericTable from "@components/GenericTable";
import StatsCards from "@components/GenericStatsCards";
import AuditLogSidebar from "@components/AuditLogSidebar";
import type { AuditFilterNode, AuditFilterService } from "@config/auditFilterConfig";
import { getColumnsForModule } from "./auditLogsColumns";
import { CaretDown, IconCopy, IconGrid, IconUndo } from "./auditLogsIcons";
import { asStringOrEmpty } from "./auditLogsDomain";
import type { AuditLogsPageViewModel } from "./useAuditLogsPage";

export function AuditLogsScreen(props: Readonly<AuditLogsPageViewModel>) {
  return (
    <>
      <BreadcrumbItem mainTitle="Audit Logs" mainLink="/audit-logs" subTitle="Audit Logs" />

      <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
        <div style={{ padding: "20px" }}>
          <h1 style={{ fontWeight: 300, color: "#141414", fontSize: "24px", marginBottom: "8px" }}>Audit Logs</h1>
          <p style={{ fontSize: "14px", fontWeight: 100, color: "#666", marginBottom: "20px" }}>
            View audit logs by module and service
          </p>

          {props.visibleAuditModules.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div className="al-tabs-row">
                <div className="al-tabs-group">
                  {props.visibleAuditModules.map((module: AuditFilterNode) => (
                    <button
                      type="button"
                      key={module.moduleName}
                      className={`al-tab-btn${props.selectedAuditModule?.moduleName === module.moduleName ? " al-tab-active" : ""}`}
                      onClick={() => props.handleAuditModuleChange(module.moduleName)}
                    >
                      {module.moduleName}
                    </button>
                  ))}
                </div>

                <div className="al-tabs-actions">
                  <button
                    type="button"
                    className="al-mobile-tabs-toggle"
                    onClick={() => props.setMobileTabsOpen((prev) => !prev)}
                    aria-expanded={props.mobileTabsOpen}
                    aria-label="Toggle modules"
                  >
                    {props.selectedAuditModule?.moduleName || "Modules"} <CaretDown />
                  </button>
                  <div className="al-tabs-actions-right">
                    <button type="button" className="al-tabs-icon-btn" title="Undo">
                      <IconUndo />
                    </button>
                    <button type="button" className="al-tabs-icon-btn" title="Duplicate">
                      <IconCopy />
                    </button>
                    <button type="button" className="al-tabs-icon-btn" title="Grid view">
                      <IconGrid />
                    </button>
                    <button type="button" className="al-tabs-more-btn">
                      More <CaretDown />
                    </button>
                  </div>
                </div>
              </div>

              {props.mobileTabsOpen && (
                <div className="al-mobile-tabs-menu">
                  {props.visibleAuditModules.map((module: AuditFilterNode) => (
                    <button
                      type="button"
                      key={`mobile-${module.moduleName}`}
                      className={`al-mobile-tabs-item${props.selectedAuditModule?.moduleName === module.moduleName ? " al-mobile-tabs-item-active" : ""}`}
                      onClick={() => props.handleAuditModuleChange(module.moduleName)}
                    >
                      {module.moduleName}
                    </button>
                  ))}
                </div>
              )}

              {props.selectedAuditModule && (
                <div className="al-filter-row">
                  {props.visibleAuditServices.length > 0 && (
                    <div className="al-filter-item">
                      <span className="al-filter-label">Resource</span>
                      <Dropdown className="al-filter-dd">
                        <Dropdown.Toggle>
                          {props.selectedAuditService ? props.selectedAuditService.serviceName : "All"} <CaretDown />
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ maxHeight: "280px", overflowY: "auto" }}>
                          <div className="px-2 pb-2">
                            <Form.Control
                              size="sm"
                              type="search"
                              placeholder="Search..."
                              value={props.serviceSearch}
                              onChange={(e) => props.setServiceSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                          <Dropdown.Item
                            onClick={() => {
                              props.clearAuditService();
                            }}
                          >
                            All
                          </Dropdown.Item>
                          {props.visibleAuditServices
                            .filter((s: AuditFilterService) =>
                              s.serviceName.toLowerCase().includes(props.serviceSearch.toLowerCase()),
                            )
                            .map((s: AuditFilterService) => (
                              <Dropdown.Item
                                key={s.serviceName}
                                onClick={() => {
                                  props.handleAuditServiceChange(s.serviceName);
                                  props.setServiceSearch("");
                                }}
                              >
                                {s.serviceName}
                              </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  )}

                  {props.actionOptions.length > 0 && (
                    <div className="al-filter-item">
                      <span className="al-filter-label">Action</span>
                      <Dropdown className="al-filter-dd">
                        <Dropdown.Toggle>
                          {props.selectedAuditAction || "All"} <CaretDown />
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ maxHeight: "280px", overflowY: "auto" }}>
                          <div className="px-2 pb-2">
                            <Form.Control
                              size="sm"
                              type="search"
                              placeholder="Search..."
                              value={props.actionSearch}
                              onChange={(e) => props.setActionSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                          <Dropdown.Item
                            onClick={() => {
                              props.setSelectedAuditAction("");
                              props.setActionSearch("");
                            }}
                          >
                            All
                          </Dropdown.Item>
                          {props.actionOptions
                            .filter((a) => a.toLowerCase().includes(props.actionSearch.toLowerCase()))
                            .map((a) => (
                              <Dropdown.Item
                                key={a}
                                onClick={() => {
                                  props.setSelectedAuditAction(a);
                                  props.setActionSearch("");
                                }}
                              >
                                {a}
                              </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  )}

                  {props.showUserFilter && (
                    <div className="al-filter-item">
                      <span className="al-filter-label">User</span>
                      <Dropdown className="al-filter-dd">
                        <Dropdown.Toggle>
                          {props.selectedAuditUser
                            ? props.auditUserOptions.find((o) => o.value === props.selectedAuditUser)?.label ||
                              props.selectedAuditUser
                            : "Anyone"}{" "}
                          <CaretDown />
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ maxHeight: "280px", overflowY: "auto" }}>
                          <div className="px-2 pb-2">
                            <Form.Control
                              size="sm"
                              type="search"
                              placeholder="Search..."
                              value={props.userSearch}
                              onChange={(e) => props.setUserSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                          <Dropdown.Item
                            onClick={() => {
                              props.setSelectedAuditUser("");
                              props.setUserSearch("");
                            }}
                          >
                            Anyone
                          </Dropdown.Item>
                          {props.auditUserOptions
                            .filter((o) => o.label.toLowerCase().includes(props.userSearch.toLowerCase()))
                            .map((o) => (
                              <Dropdown.Item
                                key={o.value}
                                onClick={() => {
                                  props.setSelectedAuditUser(o.value);
                                  props.setUserSearch("");
                                }}
                              >
                                {o.label}
                              </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  )}

                  <div className="al-filter-item">
                    <span className="al-filter-label">Date</span>
                    <Dropdown className="al-filter-dd">
                      <Dropdown.Toggle>
                        {props.dateLabel} <CaretDown />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          onClick={() => {
                            props.setAuditStartDate("");
                            props.setAuditEndDate("");
                          }}
                        >
                          All Time
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            const t = moment().format("YYYY-MM-DD");
                            props.setAuditStartDate(t);
                            props.setAuditEndDate(t);
                          }}
                        >
                          Today
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            props.setAuditStartDate(moment().subtract(7, "days").format("YYYY-MM-DD"));
                            props.setAuditEndDate(moment().format("YYYY-MM-DD"));
                          }}
                        >
                          Last 7 Days
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            props.setAuditStartDate(moment().subtract(30, "days").format("YYYY-MM-DD"));
                            props.setAuditEndDate(moment().format("YYYY-MM-DD"));
                          }}
                        >
                          Last 30 Days
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            props.setCustomStartDate(props.auditStartDate || "");
                            props.setCustomEndDate(props.auditEndDate || "");
                            props.setShowAuditDateCustomModal(true);
                          }}
                        >
                          Custom range...
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  <button type="button" className="al-export-btn">
                    Export report
                  </button>
                </div>
              )}
            </div>
          )}

          {props.auditLogsStatsCards.length > 0 && (
            <StatsCards data={props.auditLogsStatsCards} gridMinWidth="160px" valueFontSize="28px" />
          )}

          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <GenericTable
              data={props.dataList}
              columns={getColumnsForModule(props.selectedAuditModule?.moduleName ?? null)}
              actions={[]}
              showActions={false}
              selectable={false}
              selectedRows={[]}
              onSelectionChange={() => {}}
              pagination={props.pagination}
              onPaginationChange={props.handlePaginationChange}
              sortable
              defaultSortBy="formatted_timestamp"
              defaultSortOrder="desc"
              onSort={() => {}}
              onPreviewClick={props.handlePreviewClick}
              loading={props.auditLogsLoading}
              emptyMessage="No audit logs found matching your criteria"
              loadingMessage="Loading audit logs..."
              hover
              uniqueKey="id"
              fixedHeight
              maxHeight="calc(100vh - 280px)"
              showToolbar={false}
              showToolbarActions={false}
              noBorder={true}
            />
          </div>
        </div>
      </div>

      {props.showSidebar && props.selectedRow && (
        <AuditLogSidebar
          isOpen={props.showSidebar}
          onClose={props.handleCloseSidebar}
          title="Additional details"
          subtitle={asStringOrEmpty(props.selectedRow.formatted_timestamp)}
          fields={props.sidebarFields}
          onSaveComment={() => {}}
        />
      )}

      <Modal show={props.showAuditDateCustomModal} onHide={() => props.setShowAuditDateCustomModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Custom date range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Start date</Form.Label>
            <Form.Control
              type="date"
              value={props.customStartDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.setCustomStartDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-0">
            <Form.Label>End date</Form.Label>
            <Form.Control
              type="date"
              value={props.customEndDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.setCustomEndDate(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => props.setShowAuditDateCustomModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={props.applyCustomDateRange}>
            Apply
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
