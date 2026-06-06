import React from "react";
import { Button, Dropdown, Form, InputGroup } from "react-bootstrap";
import {
  Filter,
  Menu,
  MoreVertical,
  Plus,
  Search,
  X,
} from "lucide-react";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import { useRouter } from "next/router";
import { sanitizeSearchInputLive } from "@utils/Helper";
import { DROPDOWN_MENU_POPPER_CONFIG } from "./dropdownMenuPopperConfig";
import {
  GenericTableFilterPillsList,
  type FilterPillMenuPopperConfig,
} from "./genericTableFilterPills";
import type { ToolbarConfig, ToolbarTabsDropdownItem } from "./genericTableTypes";

const DEFAULT_CRM_DROPDOWN_ITEMS: ToolbarTabsDropdownItem[] = [
  { label: "Prospects", href: "/crm/prospects" },
  { label: "Leads", href: "/crm/leads" },
  { label: "Deals", href: "/crm/deals" },
  { label: "Orders", href: "/crm/orders" },
  { label: "Company", href: "/crm/companies" },
  { label: "Inbox", href: "/crm/inbox" },
  { label: "Approvals", href: "/crm/approvals" },
];

function isToolbarTabsDropdownHrefActive(
  pathname: string,
  href: string,
): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveToolbarTabsDropdownToggleLabel(
  pathname: string,
  items: ToolbarTabsDropdownItem[],
  fallbackLabel: string,
): string {
  const activeItem = items.find(
    (item) =>
      item.href != null &&
      isToolbarTabsDropdownHrefActive(pathname, item.href),
  );
  return activeItem?.label ?? fallbackLabel;
}

function getTableViewToggleLabel(toolbar: ToolbarConfig): string {
  if (toolbar.currentTableView === undefined) {
    return toolbar.tableViewLabel || "Table view";
  }
  return toolbar.currentTableView === "table" ? "Table view" : "Board View";
}

function openToolbarSettings(path: string, router: ReturnType<typeof useRouter>) {
  if (globalThis.window === undefined) {
    router.push(path);
    return;
  }
  const win = globalThis.open(path, "_blank", "noopener,noreferrer");
  if (win != null) {
    win.opener = null;
  }
}

function handleTabsDropdownItemClick(
  item: ToolbarTabsDropdownItem,
  router: ReturnType<typeof useRouter>,
) {
  if (item.disabled) {
    return;
  }
  if (item.onClick) {
    item.onClick();
    return;
  }
  if (item.href) {
    router.push(item.href);
  }
}

function handleFiltersButtonClick(
  toolbar: ToolbarConfig,
  showFilterPills: boolean,
  setShowFilterPills: React.Dispatch<React.SetStateAction<boolean>>,
) {
  if (toolbar.onFiltersClick) {
    toolbar.onFiltersClick();
    return;
  }
  setShowFilterPills(!showFilterPills);
}

function handleClearAllFilterPills(toolbar: ToolbarConfig) {
  if (toolbar.clearAllFilters) {
    toolbar.clearAllFilters();
    return;
  }
  toolbar.filterPills
    ?.filter((pill) => pill.active && pill.onClear)
    .forEach((pill) => pill.onClear?.());
}

type SortableToolbarColumn = {
  key: string;
  label: string;
};

export type GenericTableToolbarSectionProps = Readonly<{
  toolbar: ToolbarConfig;
  debounceToolbarSearch: boolean;
  toolbarSearchDraft: string;
  setToolbarSearchDraft: React.Dispatch<React.SetStateAction<string>>;
  flushDebouncedToolbarSearch: () => void;
  sortableColumns: SortableToolbarColumn[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortColumn: (column: string) => void;
  showFilterPills: boolean;
  setShowFilterPills: React.Dispatch<React.SetStateAction<boolean>>;
  openFilterPillId: string | null;
  setOpenFilterPillId: React.Dispatch<React.SetStateAction<string | null>>;
  filterPillSearch: Record<string, string>;
  setFilterPillSearch: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  filterPillMenuPopperConfig: FilterPillMenuPopperConfig;
  showToolbarActions: boolean;
  statsCards?: StatsCardData[];
  showMetrics: boolean;
  setShowMetrics: React.Dispatch<React.SetStateAction<boolean>>;
  metricsGridMinWidth: string;
  metricsColumns?: number;
}>;

export function GenericTableToolbarSection({
  toolbar,
  debounceToolbarSearch,
  toolbarSearchDraft,
  setToolbarSearchDraft,
  flushDebouncedToolbarSearch,
  sortableColumns,
  sortBy,
  sortOrder,
  onSortColumn,
  showFilterPills,
  setShowFilterPills,
  openFilterPillId,
  setOpenFilterPillId,
  filterPillSearch,
  setFilterPillSearch,
  filterPillMenuPopperConfig,
  showToolbarActions,
  statsCards,
  showMetrics,
  setShowMetrics,
  metricsGridMinWidth,
  metricsColumns,
}: GenericTableToolbarSectionProps) {
  const router = useRouter();
  const tableViewToggleLabel = getTableViewToggleLabel(toolbar);
  const tabsDropdownItems =
    toolbar.tabsDropdownItems ?? DEFAULT_CRM_DROPDOWN_ITEMS;
  const tabsDropdownToggleLabel = toolbar.tabsDropdownLabel
    ? resolveToolbarTabsDropdownToggleLabel(
        router.pathname,
        tabsDropdownItems,
        toolbar.tabsDropdownLabel,
      )
    : undefined;

  const applyToolbarSearchValue = (value: string) => {
    const sanitized = sanitizeSearchInputLive(value);
    if (debounceToolbarSearch) {
      setToolbarSearchDraft(sanitized);
      return;
    }
    toolbar.onSearchChange?.(sanitized);
  };

  return (
    <div className="gt-toolbar-container">
      {toolbar.showTabs && toolbar.tabs && toolbar.tabs.length > 0 && (
        <div className="gt-toolbar-tabs-section">
          <div className="gt-toolbar-tabs-row d-flex align-items-center gap-3">
            {toolbar.tabsDropdownLabel && (
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  className="gt-toolbar-dropdown"
                >
                  <span>{tabsDropdownToggleLabel}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu
                  renderOnMount
                  popperConfig={DROPDOWN_MENU_POPPER_CONFIG}
                  style={{ zIndex: 1080 }}
                >
                  {tabsDropdownItems.map((item) => {
                    const isActiveItem =
                      item.href != null &&
                      isToolbarTabsDropdownHrefActive(
                        router.pathname,
                        item.href,
                      );

                    return (
                      <Dropdown.Item
                        key={item.label}
                        active={isActiveItem}
                        disabled={item.disabled}
                        onClick={() =>
                          handleTabsDropdownItemClick(item, router)
                        }
                      >
                        {item.label}
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown>
            )}

            <div className="gt-toolbar-tabs-list d-flex align-items-center gap-2">
              {toolbar.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => toolbar.onTabChange?.(tab.id)}
                  className={`gt-tab-button ${
                    toolbar.activeTab === tab.id ? "active" : ""
                  }`}
                >
                  {tab.icon && (
                    <span className="gt-tab-icon">{tab.icon}</span>
                  )}
                  <span className="gt-tab-label" title={tab.label}>
                    {tab.label}
                  </span>
                  {tab.count !== undefined && (
                    <span className="gt-tab-count">{tab.count}</span>
                  )}
                  {tab.removable && (
                    <button
                      className="gt-tab-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        toolbar.onTabRemove?.(tab.id);
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </button>
              ))}
              {toolbar.onTabAdd && (
                <button
                  className="gt-tab-add-button"
                  onClick={toolbar.onTabAdd}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {toolbar.rightActions && (
              <div className="gt-toolbar-tabs-actions">
                {toolbar.rightActions}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="gt-toolbar-main">
        {toolbar.showSearch && (
          <div className="gt-toolbar-search">
            <InputGroup size="sm">
              <InputGroup.Text className="gt-search-icon">
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder={toolbar.searchPlaceholder || "Search"}
                value={
                  debounceToolbarSearch
                    ? toolbarSearchDraft
                    : toolbar.searchValue || ""
                }
                onChange={(e) => applyToolbarSearchValue(e.target.value)}
                onPaste={(e) => {
                  const target = e.currentTarget;
                  globalThis.setTimeout(() => {
                    applyToolbarSearchValue(target.value);
                  }, 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && toolbar.onSearch) {
                    flushDebouncedToolbarSearch();
                    toolbar.onSearch();
                  }
                }}
                className="gt-search-input"
              />
            </InputGroup>
          </div>
        )}

        <div className="gt-toolbar-actions">
          {toolbar.showTableViewDropdown && (
            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                className="gt-toolbar-btn"
              >
                <Menu size={16} className="me-1" />
                <span>{tableViewToggleLabel}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu
                renderOnMount
                popperConfig={DROPDOWN_MENU_POPPER_CONFIG}
              >
                {toolbar.currentTableView !== undefined &&
                toolbar.onTableViewChange ? (
                  <>
                    {toolbar.currentTableView === "table" && (
                      <Dropdown.Item
                        onClick={() => toolbar.onTableViewChange?.("board")}
                      >
                        Board View
                      </Dropdown.Item>
                    )}
                    {toolbar.currentTableView === "board" && (
                      <Dropdown.Item
                        onClick={() => toolbar.onTableViewChange?.("table")}
                      >
                        Table view
                      </Dropdown.Item>
                    )}
                  </>
                ) : (
                  <>
                    <Dropdown.Item onClick={toolbar.onTableViewClick}>
                      Table
                    </Dropdown.Item>
                    <Dropdown.Item>Grid</Dropdown.Item>
                    <Dropdown.Item>List</Dropdown.Item>
                  </>
                )}
              </Dropdown.Menu>
            </Dropdown>
          )}

          {toolbar.showEditColumns && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="gt-toolbar-btn"
              onClick={toolbar.onEditColumnsClick}
            >
              Edit columns
            </Button>
          )}

          {toolbar.showPipelineDropdown && (
            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                className="gt-toolbar-btn"
              >
                <span>{toolbar.pipelineLabel || "All Pipelines"}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu
                renderOnMount
                popperConfig={DROPDOWN_MENU_POPPER_CONFIG}
                onClick={toolbar.onPipelineClick}
              >
                <Dropdown.Item>All Pipelines</Dropdown.Item>
                <Dropdown.Item>Sales Pipeline</Dropdown.Item>
                <Dropdown.Item>Marketing Pipeline</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}

          {toolbar.showFiltersButton && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="gt-toolbar-btn"
              onClick={() =>
                handleFiltersButtonClick(
                  toolbar,
                  showFilterPills,
                  setShowFilterPills,
                )
              }
            >
              Filters
            </Button>
          )}

          {toolbar.actionsAfterFilters}

          {toolbar.showSortButton &&
            (toolbar.onSortClick ? (
              <Button
                variant="outline-secondary"
                size="sm"
                className="gt-toolbar-btn"
                onClick={toolbar.onSortClick}
              >
                Sort
              </Button>
            ) : (
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  className="gt-toolbar-btn"
                >
                  Sort
                </Dropdown.Toggle>
                <Dropdown.Menu
                  renderOnMount
                  popperConfig={DROPDOWN_MENU_POPPER_CONFIG}
                >
                  {sortableColumns.length === 0 ? (
                    <Dropdown.Item disabled>No sortable columns</Dropdown.Item>
                  ) : (
                    sortableColumns.map((col) => (
                      <Dropdown.Item
                        key={col.key}
                        onClick={() => onSortColumn(col.key)}
                      >
                        {col.label}
                        {sortBy === col.key &&
                          (sortOrder === "asc" ? " ↑" : " ↓")}
                      </Dropdown.Item>
                    ))
                  )}
                </Dropdown.Menu>
              </Dropdown>
            ))}

          {statsCards && statsCards.length > 0 && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="gt-toolbar-btn"
              onClick={() => setShowMetrics(!showMetrics)}
            >
              Metrics
            </Button>
          )}

          {toolbar.showExportButton && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="gt-toolbar-btn"
              onClick={toolbar.onExportClick}
            >
              Export
            </Button>
          )}

          {showToolbarActions && (
            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                className="gt-toolbar-btn gt-icon-btn"
              >
                <MoreVertical size={16} />
              </Dropdown.Toggle>
              <Dropdown.Menu
                align="end"
                renderOnMount
                popperConfig={DROPDOWN_MENU_POPPER_CONFIG}
              >
                {toolbar.showImport && (
                  <Dropdown.Item onClick={toolbar.onImportClick}>
                    Import
                  </Dropdown.Item>
                )}
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={() =>
                    openToolbarSettings(
                      toolbar.toolbarSettingsPath ??
                        "/main-settings/smart-crm",
                      router,
                    )
                  }
                >
                  Settings
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}

          {toolbar.customActions}

          {(!toolbar.showTabs ||
            !toolbar.tabs ||
            toolbar.tabs.length === 0) &&
            toolbar.rightActions}
        </div>
      </div>

      {showFilterPills &&
        toolbar.filterPills &&
        toolbar.filterPills.length > 0 && (
          <div className="gt-filter-pills">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <GenericTableFilterPillsList
                filterPills={toolbar.filterPills}
                openFilterPillId={openFilterPillId}
                onOpenChange={setOpenFilterPillId}
                filterPillSearch={filterPillSearch}
                setFilterPillSearch={setFilterPillSearch}
                filterPillMenuPopperConfig={filterPillMenuPopperConfig}
              />
              {toolbar.showMoreFiltersButton !== false && (
                <button className="gt-filter-pill-add">
                  <Plus size={14} className="me-1" />
                  <span>More</span>
                </button>
              )}
              {toolbar.showAdvancedFilters && (
                <span
                  style={{
                    color: "#cbd5e1",
                    fontSize: "16px",
                    userSelect: "none",
                  }}
                >
                  |
                </span>
              )}
              {toolbar.showAdvancedFilters && (
                <button
                  className="gt-filter-pill-add"
                  onClick={toolbar.onAdvancedFiltersClick}
                >
                  <Filter size={14} className="me-1" />
                  <span>Advanced filters</span>
                </button>
              )}
              {toolbar.filterPillsRightActions}
              {toolbar.filterPills.some((pill) => pill.active) && (
                <button
                  className="gt-filter-pill-add"
                  style={{ color: "#DC2626" }}
                  onClick={() => handleClearAllFilterPills(toolbar)}
                >
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>
        )}

      {toolbar.advancedFiltersOpen && toolbar.advancedFiltersContent && (
        <div className="gt-advanced-filters">
          {toolbar.advancedFiltersContent}
        </div>
      )}

      {showMetrics && statsCards && statsCards.length > 0 && (
        <div
          style={{
            paddingTop: "16px",
            paddingLeft: "25px",
            paddingRight: "25px",
            backgroundColor: "#ffffff",
            paddingBottom: "1px",
            borderLeft: "1px solid #cccccc",
            borderRight: "1px solid #cccccc",
          }}
        >
          <StatsCards
            data={statsCards}
            gridMinWidth={metricsGridMinWidth}
            columns={metricsColumns}
          />
        </div>
      )}
    </div>
  );
}
