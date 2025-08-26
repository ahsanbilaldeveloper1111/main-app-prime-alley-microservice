import React, { useState, useEffect, useCallback } from 'react';
import CustomDataTable, { Column, ServerPaginationInfo } from '@components/CustomDataTable';

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

    const fetchAndSetData = useCallback(async (page = 1, perPage = defaultPageSize, search = '') => {
        setLoading(true);
        try {
            const response = await fetchData(page, perPage, search);
            
            // Handle the response structure where meta is directly in the response
            if (response && response.meta) {
                setData(response.dataList || []);
                setPaginationInfo({
                    totalRows: response.meta.total || 0,
                    totalPages: response.meta.last_page || 0,
                    currentPage: response.meta.current_page || 1,
                    perPage: response.meta.per_page || defaultPageSize,
                });
                console.log('paginationInfo updated:', {
                    totalRows: response.meta.total || 0,
                    totalPages: response.meta.last_page || 0,
                    currentPage: response.meta.current_page || 1,
                    perPage: response.meta.per_page || defaultPageSize,
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
                console.log('paginationInfo fallback:', paginationInfo);
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
            console.log("HERE???? REDASDA")
            setLoading(false);
        }
    }, [fetchData, defaultPageSize]);

    // Combined effect to handle initial load, filters change, and refresh key changes
    useEffect(() => {
        fetchAndSetData(1, paginationInfo.perPage, searchTerm);
    }, [fetchAndSetData, filters, refreshKey, paginationInfo.perPage, searchTerm]);

    const handlePageChange = (page: number) => {
        fetchAndSetData(page, paginationInfo.perPage, searchTerm);
    };

    const handlePerPageChange = (perPage: number) => {
        fetchAndSetData(1, perPage, searchTerm);
    };

    const handleSearch = (search: string) => {
        setSearchTerm(search);
        fetchAndSetData(1, paginationInfo.perPage, search);
    };

    return (
        <CustomDataTable
            columns={columns}
            data={data}
            title={title}
            loading={loading}
            defaultPageSize={defaultPageSize}
            searchPlaceholder={searchPlaceholder}
            onRowClick={onRowClick}
            serverSide={true}
            paginationInfo={paginationInfo}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSearch={handleSearch}
            showSearch={search}
        />
    );
};

export default GenericListPage; 