import React, { useState, useEffect, useCallback, useRef } from 'react';
import CustomDataTable, { Column, ServerPaginationInfo } from '@components/CustomDataTable';
import SimpleCanvas from '@components/SimpleCanvas';
import { Card } from 'react-bootstrap';

interface GenericListPageProps {
    columns: Column[];
    fetchData: (page: number, perPage: number, search: string) => Promise<any>;
    title: string;
    searchPlaceholder?: string;
    defaultPageSize?: number;
    onRowClick?: (row: any) => void;
    filters?: any;
    refreshKey?: number;
    search?: boolean;
    pagination?: boolean;
    // Feature flags
    rowClick?: boolean;
    showCanvas?: boolean;
    // Row selection
    rowSelection?: boolean;
    onSelectionChange?: (selectedRows: any[]) => void;
    keyField?: string;
    clearSelectedRows?: boolean;
    tableStyle?: string;
    // Style-2 specific props
    onFiltersClick?: () => void;
    onExportClick?: () => void;
    onNewClick?: () => void;
    filtersText?: string;
    exportText?: string;
    newText?: string;
    noTableHead?: boolean;
    pageName?: string;
}

const GenericListPage: React.FC<GenericListPageProps> = ({
    columns,
    fetchData,
    title,
    searchPlaceholder = 'Search...',
    defaultPageSize = 15,
    onRowClick,
    filters = {},
    refreshKey = 0,
    search = true,
    pagination=true,
    // Feature flags
    rowClick = false,
    showCanvas = false,
    // Row selection
    rowSelection = false,
    onSelectionChange,
    keyField,
    clearSelectedRows = false,
    tableStyle = 'table-style-1',
    // Style-2 specific props
    onFiltersClick,
    onExportClick,
    onNewClick,
    filtersText,
    exportText,
    newText,
    noTableHead = false,
   

}) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [paginationInfo, setPaginationInfo] = useState<ServerPaginationInfo>({
        totalRows: 0,
        totalPages: 0,
        currentPage: 1,
        perPage: defaultPageSize,
    });
    const [searchTerm, setSearchTerm] = useState<string>('');
    
    // Canvas state
    const [canvasVisible, setCanvasVisible] = useState<boolean>(false);
    const [selectedRowData, setSelectedRowData] = useState<any>(null);
    //console.log("ZEZEZE", selectedRowData);
    const fetchAndSetData = useCallback(async (page = 1, perPage = defaultPageSize, search = '') => {
        setLoading(true);
        try {
            const response = await fetchData(page, perPage, search);
            
            // Handle the response structure where pagination data is directly in the response
            if (response && response.data) {
                setData(response.data || []);
                setPaginationInfo({
                    totalRows: response.total || 0,
                    totalPages: response.last_page || 0,
                    currentPage: response.current_page || 1,
                    perPage: response.per_page || defaultPageSize,
                });
                console.log('paginationInfo updated:', {
                    totalRows: response.total || 0,
                    totalPages: response.last_page || 0,
                    currentPage: response.current_page || 1,
                    perPage: response.per_page || defaultPageSize,
                });
            } else {
                // Fallback for other response structures
                setData(response?.dataList || response?.data || []);
                setPaginationInfo({
                    totalRows: response?.meta?.total || response?.dataList?.length || 0,
                    totalPages: response?.meta?.last_page || 1,
                    currentPage: response?.meta?.current_page || 1,
                    perPage,
                });
                //console.log('paginationInfo fallback:', paginationInfo);
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
    }, [fetchData, defaultPageSize]);

    // Track previous values to determine if this is a refresh or filter/search change
    const prevFiltersRef = useRef(filters);
    const prevSearchTermRef = useRef(searchTerm);
    
    // Combined effect to handle initial load, filters change, and refresh key changes
    useEffect(() => {
        // Check if filters or search term changed (reset to page 1)
        const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
        const searchChanged = searchTerm !== prevSearchTermRef.current;
        
        // Only reset to page 1 for filters and search changes, preserve current page for refreshKey changes
        const pageToFetch = (filtersChanged || searchChanged) ? 1 : paginationInfo.currentPage;
        fetchAndSetData(pageToFetch, paginationInfo.perPage, searchTerm);
        
        // Update refs for next comparison
        prevFiltersRef.current = filters;
        prevSearchTermRef.current = searchTerm;
    }, [fetchAndSetData, filters, refreshKey, paginationInfo.perPage, searchTerm]);

    const handlePageChange = (page: number) => {
        fetchAndSetData(page, paginationInfo.perPage, searchTerm);
    };

    const handlePerPageChange = (perPage: number) => {
        fetchAndSetData(1, perPage, searchTerm);
    };

    const handleSearch = (search: string) => {
        setSearchTerm(search);
        // Don't call fetchAndSetData here - let the useEffect handle it
        // This prevents double API calls
    };

    // Handle row click with canvas functionality
    const handleRowClickWithCanvas = (row: any) => {
        if (showCanvas) {
            setSelectedRowData(row);
            setCanvasVisible(true);
        }
        // Call the original onRowClick if provided
        if (onRowClick) {
            onRowClick(row);
        }
    };

    return (
        <>
            <CustomDataTable
                            columns={columns}
                            data={data}
                            title={title}
                            loading={loading}
                            defaultPageSize={defaultPageSize}
                            searchPlaceholder={searchPlaceholder}
                            onRowClick={rowClick || showCanvas ? handleRowClickWithCanvas : onRowClick}
                            // Feature flags
                            rowClick={rowClick}
                            showCanvas={showCanvas}
                            serverSide={true}
                            paginationInfo={paginationInfo}
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
                            noTableHead={noTableHead}
                            
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