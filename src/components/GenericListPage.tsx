import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import CustomDataTable, { Column, ServerPaginationInfo } from '@components/CustomDataTable';
import SimpleCanvas from '@components/SimpleCanvas';
import { useDebouncedValue } from '@hooks/useDebouncedValue';

export type GenericListPageQueryParams = Readonly<{
    page: number;
    perPage: number;
    search: string;
    filters: unknown;
}>;

export type GenericListPageQueryOptions = Readonly<{
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
}>;

type GenericListPagePropsBase = {
    /** Row type varies by page; use `Column<YourRow>` at the call site. */
    columns: Column<any>[];
    title: string;
    searchPlaceholder?: string;
    defaultPageSize?: number;
    onRowClick?: (row: any) => void;
    filters?: any;
    /** Legacy: bumps refetch when using `fetchData` mode. Ignored in TanStack list mode. */
    refreshKey?: number;
    search?: boolean;
    pagination?: boolean;
    rowClick?: boolean;
    showCanvas?: boolean;
    rowSelection?: boolean;
    onSelectionChange?: (selectedRows: any[]) => void;
    keyField?: string;
    clearSelectedRows?: boolean;
    tableStyle?: string;
    onFiltersClick?: () => void;
    onExportClick?: () => void;
    onNewClick?: () => void;
    filtersText?: string;
    exportText?: string;
    newText?: string;
    pageName?: string;
    searchDebounceMs?: number;
};

export type GenericListPageProps = GenericListPagePropsBase &
    (
        | {
              fetchData: (page: number, perPage: number, search: string) => Promise<any>;
              getListQueryOptions?: undefined;
          }
        | {
              fetchData?: undefined;
              getListQueryOptions: (params: GenericListPageQueryParams) => GenericListPageQueryOptions;
          }
    );

function parseListResponse(
    response: unknown,
    fallbackPage: number,
    fallbackPerPage: number,
): { data: any[]; paginationInfo: ServerPaginationInfo } {
    if (response && typeof response === 'object' && 'data' in response) {
        const r = response as Record<string, unknown>;
        const data = (r.data as any[]) || [];
        return {
            data,
            paginationInfo: {
                totalRows: Number(r.total) || 0,
                totalPages: Number(r.last_page) || 0,
                currentPage: Number(r.current_page) || fallbackPage,
                perPage: Number(r.per_page) || fallbackPerPage,
            },
        };
    }
    const r = response as Record<string, unknown> | null | undefined;
    const dataList = (r?.dataList as any[]) || (r?.data as any[]) || [];
    const meta = r?.meta as Record<string, unknown> | undefined;
    return {
        data: dataList,
        paginationInfo: {
            totalRows: Number(meta?.total) || dataList.length || 0,
            totalPages: Number(meta?.last_page) || 1,
            currentPage: Number(meta?.current_page) || fallbackPage,
            perPage: fallbackPerPage,
        },
    };
}

const GenericListPage: React.FC<GenericListPageProps> = (props) => {
    const {
        columns,
        title,
        searchPlaceholder = 'Search...',
        defaultPageSize = 15,
        onRowClick,
        filters = {},
        refreshKey = 0,
        search = true,
        pagination = true,
        rowClick = false,
        showCanvas = false,
        rowSelection = false,
        onSelectionChange,
        keyField,
        clearSelectedRows = false,
        tableStyle = 'table-style-1',
        onFiltersClick,
        onExportClick,
        onNewClick,
        filtersText,
        exportText,
        newText,
        pageName,
        searchDebounceMs = 400,
    } = props;

    const isQueryMode = 'getListQueryOptions' in props && props.getListQueryOptions != null;
    const fetchData = !isQueryMode ? props.fetchData : undefined;
    const getListQueryOptions = isQueryMode ? props.getListQueryOptions : undefined;

    const [listPage, setListPage] = useState(1);
    const [listPerPage, setListPerPage] = useState(defaultPageSize);

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [paginationInfo, setPaginationInfo] = useState<ServerPaginationInfo>({
        totalRows: 0,
        totalPages: 0,
        currentPage: 1,
        perPage: defaultPageSize,
    });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const debouncedSearchTerm = useDebouncedValue(searchTerm, searchDebounceMs);

    const [canvasVisible, setCanvasVisible] = useState<boolean>(false);
    const [selectedRowData, setSelectedRowData] = useState<any>(null);

    const prevFiltersRef = useRef(filters);
    const prevDebouncedSearchRef = useRef(debouncedSearchTerm);

    useEffect(() => {
        if (!isQueryMode) return;
        const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
        const searchChanged = debouncedSearchTerm !== prevDebouncedSearchRef.current;
        if (filtersChanged || searchChanged) {
            setListPage(1);
        }
        prevFiltersRef.current = filters;
        prevDebouncedSearchRef.current = debouncedSearchTerm;
    }, [isQueryMode, filters, debouncedSearchTerm]);

    const listQuerySpec = useMemo(() => {
        if (!isQueryMode || !getListQueryOptions) return null;
        return getListQueryOptions({
            page: listPage,
            perPage: listPerPage,
            search: debouncedSearchTerm,
            filters,
        });
    }, [isQueryMode, getListQueryOptions, listPage, listPerPage, debouncedSearchTerm, filters]);

    const listQuery = useQuery({
        queryKey: listQuerySpec?.queryKey ?? (['genericListPage', 'disabled', title] as const),
        queryFn: listQuerySpec?.queryFn ?? (async () => ({})),
        enabled: Boolean(isQueryMode && listQuerySpec),
        placeholderData: keepPreviousData,
    });

    const queryDerived = useMemo(() => {
        if (!isQueryMode || listQuery.data === undefined) return null;
        return parseListResponse(listQuery.data, listPage, listPerPage);
    }, [isQueryMode, listQuery.data, listPage, listPerPage]);

    const fetchAndSetData = useCallback(
        async (page = 1, perPage = defaultPageSize, searchArg = '') => {
            if (!fetchData) return;
            setLoading(true);
            try {
                const response = await fetchData(page, perPage, searchArg);

                if (response?.data) {
                    setData(response.data || []);
                    setPaginationInfo({
                        totalRows: response.total || 0,
                        totalPages: response.last_page || 0,
                        currentPage: response.current_page || 1,
                        perPage: response.per_page || defaultPageSize,
                    });
                } else {
                    setData(response?.dataList || response?.data || []);
                    setPaginationInfo({
                        totalRows: response?.meta?.total || response?.dataList?.length || 0,
                        totalPages: response?.meta?.last_page || 1,
                        currentPage: response?.meta?.current_page || 1,
                        perPage,
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setData([]);
                setPaginationInfo({
                    totalRows: 0,
                    totalPages: 0,
                    currentPage: 1,
                    perPage: defaultPageSize,
                });
            } finally {
                setLoading(false);
            }
        },
        [fetchData, defaultPageSize],
    );

    useEffect(() => {
        if (isQueryMode) return;
        const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
        const searchChanged = debouncedSearchTerm !== prevDebouncedSearchRef.current;

        const pageToFetch = filtersChanged || searchChanged ? 1 : paginationInfo.currentPage;
        void fetchAndSetData(pageToFetch, paginationInfo.perPage, debouncedSearchTerm);

        prevFiltersRef.current = filters;
        prevDebouncedSearchRef.current = debouncedSearchTerm;
    }, [isQueryMode, fetchAndSetData, filters, refreshKey, paginationInfo.perPage, debouncedSearchTerm]);

    const displayData = isQueryMode ? queryDerived?.data ?? [] : data;
    const displayPagination: ServerPaginationInfo = isQueryMode
        ? queryDerived?.paginationInfo ?? {
              totalRows: 0,
              totalPages: 0,
              currentPage: listPage,
              perPage: listPerPage,
          }
        : paginationInfo;
    // Use `isPending` only: `isFetching` is also true during background refetches when cached
    // data is shown — combining them made every tab remount look like a full reload (not cached).
    const displayLoading = isQueryMode ? listQuery.isPending : loading;

    const handlePageChange = (page: number) => {
        if (isQueryMode) {
            setListPage(page);
            return;
        }
        void fetchAndSetData(page, paginationInfo.perPage, debouncedSearchTerm);
    };

    const handlePerPageChange = (perPage: number) => {
        if (isQueryMode) {
            setListPerPage(perPage);
            setListPage(1);
            return;
        }
        void fetchAndSetData(1, perPage, debouncedSearchTerm);
    };

    const handleSearch = (nextSearch: string) => {
        setSearchTerm(nextSearch);
    };

    const handleRowClickWithCanvas = (row: any) => {
        if (showCanvas) {
            setSelectedRowData(row);
            setCanvasVisible(true);
        }
        if (onRowClick) {
            onRowClick(row);
        }
    };

    return (
        <>
            <CustomDataTable
                columns={columns}
                data={displayData}
                title={title}
                loading={displayLoading}
                defaultPageSize={defaultPageSize}
                searchPlaceholder={searchPlaceholder}
                onRowClick={rowClick || showCanvas ? handleRowClickWithCanvas : onRowClick}
                rowClick={rowClick}
                serverSide={true}
                paginationInfo={displayPagination}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                onSearch={handleSearch}
                showSearch={search}
                pagination={pagination}
                showPageSizeSelector={pagination}
                rowSelection={rowSelection}
                onSelectionChange={onSelectionChange}
                keyField={keyField}
                clearSelectedRows={clearSelectedRows}
                tableStyle={tableStyle}
                onFiltersClick={onFiltersClick}
                onExportClick={onExportClick}
                onNewClick={onNewClick}
                filtersText={filtersText}
                exportText={exportText}
                newText={newText}
                pageName={pageName}
            />

            {showCanvas && (
                <SimpleCanvas
                    show={canvasVisible}
                    onHide={() => setCanvasVisible(false)}
                    rowData={selectedRowData}
                    title={`Canvas for ${selectedRowData?.name || selectedRowData?.id || 'Selected Item'}`}
                />
            )}
        </>
    );
};

export default GenericListPage;
