import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import GenericTable, {
  FilterPill,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import { Column } from "@components/CustomDataTable";
import SimpleCanvas from "@components/SimpleCanvas";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";

interface UsersListProps {
  columns: Column[];
  fetchData: (page?: number, perPage?: number, search?: string) => Promise<any>;
  customFieldColumns: Column[];
  currentFilters: any;
  handleFiltersChange: (filters: any) => void;
  /** When incremented, refetches the current page (e.g. after parent invalidates TanStack cache). */
  listRefreshToken?: number;
  hasPermission: boolean;
  showFilters: boolean;
}

type UsersPaginationState = {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
};

const USER_FILTER_FIELDS: Array<{
  key: string;
  label: string;
  placeholder: string;
  activeLabel: string;
}> = [
  { key: "name", label: "Name", placeholder: "Type Name", activeLabel: "Search by name" },
  {
    key: "extension",
    label: "Extension",
    placeholder: "Type Extension",
    activeLabel: "Search by extension",
  },
  { key: "role", label: "Rank", placeholder: "Type Role", activeLabel: "Search by rank" },
  { key: "group", label: "Group", placeholder: "Type Group", activeLabel: "Search by group" },
  {
    key: "department",
    label: "Department",
    placeholder: "Type Department",
    activeLabel: "Search by department",
  },
  {
    key: "company",
    label: "Company",
    placeholder: "Type Company",
    activeLabel: "Search by company",
  },
];

const UsersList: React.FC<UsersListProps> = ({
  columns,
  fetchData,
  customFieldColumns,
  currentFilters,
  handleFiltersChange,
  listRefreshToken = 0,
  hasPermission,
  showFilters,
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<Record<string, any>>(currentFilters || {});
  const pendingFiltersRef = useRef(pendingFilters);
  pendingFiltersRef.current = pendingFilters;
  const handleFiltersChangeRef = useRef(handleFiltersChange);
  handleFiltersChangeRef.current = handleFiltersChange;

  const {
    inputValue: searchInput,
    queryValue: searchQuery,
    handleInputChange: handleSearchChange,
    submitQuery: flushSearchToFilters,
    setInputValue: setSearchInputValue,
    setQueryValue: setSearchQueryValue,
  } = useDebouncedSearchInput({
    initialValue: currentFilters?.search || "",
  });

  const [pagination, setPagination] = useState<UsersPaginationState>({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
  });

  const [canvasVisible, setCanvasVisible] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);

  const tableKey = useMemo(() => {
    const columnKeys = customFieldColumns
      .map((c) => c.key)
      .sort((a, b) => a.localeCompare(b))
      .join("|");
    return `users-table-${customFieldColumns.length}-${columnKeys}`;
  }, [customFieldColumns]);

  useEffect(() => {
    setPendingFilters(currentFilters || {});
    const s = currentFilters?.search || "";
    setSearchInputValue(s);
    setSearchQueryValue(s);
  }, [currentFilters, setSearchInputValue, setSearchQueryValue]);

  useEffect(() => {
    handleFiltersChangeRef.current({
      ...pendingFiltersRef.current,
      search: searchQuery.trim() ? searchQuery : undefined,
    });
  }, [searchQuery]);

  useEffect(() => {
    setPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [currentFilters]);

  const fetchAndSetData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchData(
        pagination.currentPage,
        pagination.rowsPerPage,
        currentFilters?.search || "",
      );

      if (response?.data) {
        setRows(response.data || []);
        setPagination((prev) => ({
          ...prev,
          totalRows: response.total || 0,
          currentPage: response.current_page || prev.currentPage,
          rowsPerPage: response.per_page || prev.rowsPerPage,
        }));
      } else {
        const fallbackRows = response?.dataList || response?.data || [];
        setRows(fallbackRows);
        setPagination((prev) => ({
          ...prev,
          totalRows: response?.meta?.total || fallbackRows.length || 0,
          currentPage: response?.meta?.current_page || prev.currentPage,
          rowsPerPage: response?.meta?.per_page || prev.rowsPerPage,
        }));
      }
    } catch {
      setRows([]);
      setPagination((prev) => ({
        ...prev,
        totalRows: 0,
      }));
    } finally {
      setLoading(false);
    }
  }, [fetchData, pagination.currentPage, pagination.rowsPerPage, currentFilters, listRefreshToken]);

  useEffect(() => {
    fetchAndSetData();
  }, [fetchAndSetData]);

  const applyFilterField = useCallback(
    (key: string, value: string | undefined) => {
      const nextPending = { ...pendingFilters, [key]: value || undefined };
      setPendingFilters(nextPending);
      const searchMerge = searchInput.trim() ? searchInput : undefined;
      handleFiltersChange({
        ...nextPending,
        search: searchMerge,
      });
    },
    [pendingFilters, handleFiltersChange, searchInput],
  );

  const clearFilterField = useCallback(
    (key: string) => {
      const nextPending = { ...pendingFilters, [key]: undefined };
      setPendingFilters(nextPending);
      const searchMerge = searchInput.trim() ? searchInput : undefined;
      handleFiltersChange({
        ...nextPending,
        search: searchMerge,
      });
    },
    [pendingFilters, handleFiltersChange, searchInput],
  );

  const handleResetFilters = useCallback(() => {
    setPendingFilters({});
    setSearchInputValue("");
    setSearchQueryValue("");
    handleFiltersChange({});
  }, [handleFiltersChange, setSearchInputValue, setSearchQueryValue]);

  const filterPills = useMemo<FilterPill[]>(() => {
    return USER_FILTER_FIELDS.map((field) => {
      const activeValue = pendingFilters?.[field.key];
      return {
        id: `users-${field.key}`,
        label: field.label,
        showDropdown: true,
        searchable: false,
        active: Boolean(activeValue),
        activeLabel: activeValue || undefined,
        onClear: activeValue ? () => clearFilterField(field.key) : undefined,
        dropdownContent: (
          <Form.Group style={{ minWidth: "220px", margin: 0 }}>
            <Form.Label className="small fw-bold">{field.activeLabel}</Form.Label>
            <Form.Control
              type="text"
              placeholder={field.placeholder}
              value={activeValue || ""}
              onChange={(e) => applyFilterField(field.key, e.target.value || undefined)}
            />
          </Form.Group>
        ),
      };
    });
  }, [pendingFilters, applyFilterField, clearFilterField]);

  const genericColumns = useMemo<TableColumn<any>[]>(() => {
    return columns.map((col) => ({
      key: col.key,
      label: col.name,
      sortable: col.sortable,
      type: col.cell ? "custom" : "text",
      accessor: col.selector,
      render: col.cell ? (row: any) => col.cell?.(row) : undefined,
      emptyValue: "--",
    }));
  }, [columns]);

  const toolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchInput,
      searchPlaceholder: "Type ( Extension, User Name, Display Name )",
      onSearchChange: handleSearchChange,
      onSearch: flushSearchToFilters,
      showFiltersButton: showFilters,
      showFilterPills: false,
      filterPills,
      showMoreFiltersButton: false,
      rightActions: (
        <button
          type="button"
          onClick={handleResetFilters}
          className="btn btn-outline-secondary btn-sm"
        >
          Reset
        </button>
      ),
    }),
    [searchInput, handleSearchChange, flushSearchToFilters, showFilters, filterPills, handleResetFilters],
  );

  if (!hasPermission) {
    return null;
  }

  return (
    <>
      <GenericTable
        key={tableKey}
        data={rows}
        columns={genericColumns}
        loading={loading}
        emptyMessage="No users found"
        showActions={false}
        actions={[]}
        showToolbar
        toolbar={toolbarConfig}
        pagination={{
          currentPage: pagination.currentPage,
          rowsPerPage: pagination.rowsPerPage,
          totalRows: pagination.totalRows,
          pageSizeOptions: [15, 30, 50, 100],
        }}
        onPaginationChange={(page, rowsPerPage) => {
          setPagination((prev) => ({
            ...prev,
            currentPage: page,
            rowsPerPage,
          }));
        }}
        onRowClick={(row) => {
          setSelectedRowData(row);
          setCanvasVisible(true);
        }}
        uniqueKey="id"
        customizableColumns
        defaultSelectedColumns={columns.map((col) => col.key)}
        columnStorageKey="datatable-columns-users"
        showToolbarActions={false}
      />

      <SimpleCanvas
        show={canvasVisible}
        onHide={() => setCanvasVisible(false)}
        rowData={selectedRowData}
        title={`Canvas for ${selectedRowData?.name || selectedRowData?.id || "Selected Item"}`}
      />
    </>
  );
};

export default UsersList;
