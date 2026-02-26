import React, { useMemo, useRef } from 'react';
import GenericListPage from '@components/GenericListPage';
import { Column } from '@components/CustomDataTable';

interface UsersListProps {
    columns: Column[];
    fetchData: (page?: number, perPage?: number, search?: string) => Promise<any>;
    customFieldColumns: Column[];
    currentFilters: any;
    hasPermission: boolean;
}

const UsersList: React.FC<UsersListProps> = ({
    columns,
    fetchData,
    customFieldColumns,
    currentFilters,
    hasPermission
}) => {
    // Memoize the key to prevent unnecessary remounts
    // Only change when the actual column structure changes
    const tableKey = useMemo(() => {
        const columnKeys = customFieldColumns.map(c => c.key).sort((a, b) => a.localeCompare(b)).join('|');
        return `users-table-${customFieldColumns.length}-${columnKeys}`;
    }, [customFieldColumns]);

    // Use ref to track previous filters to maintain stable reference
    const prevFiltersRef = useRef<any>(currentFilters || {});
    const prevFiltersStringRef = useRef<string>('');
    
    // Memoize filters to prevent unnecessary re-renders when object reference changes but values are the same
    const memoizedFilters = useMemo(() => {
        const filtersString = JSON.stringify(currentFilters || {});
        // Only update if the stringified filters actually changed
        if (filtersString !== prevFiltersStringRef.current) {
            prevFiltersStringRef.current = filtersString;
            prevFiltersRef.current = currentFilters || {};
            return currentFilters || {};
        }
        // Return the previous reference to maintain stability
        return prevFiltersRef.current;
    }, [currentFilters]);

    if (!hasPermission) {
        return null;
    }

    return (
        <GenericListPage
            key={tableKey}
            columns={columns}
            fetchData={fetchData}
            title="Users"
            searchPlaceholder="Search users..."
            defaultPageSize={15}
            filters={memoizedFilters}
            rowClick={true}
            showCanvas={true}
            search={false}
            tableStyle="table-style-2"
        />
    );
};

export default UsersList;

