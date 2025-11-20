import React from 'react';
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
    if (!hasPermission) {
        return null;
    }

    return (
        <GenericListPage
            key={`users-table-${customFieldColumns.length}-${customFieldColumns.map(c => c.key).join('|')}`}
            columns={columns}
            fetchData={fetchData}
            title="Users"
            searchPlaceholder="Search users..."
            defaultPageSize={15}
            filters={currentFilters}
            rowClick={true}
            showCanvas={true}
            search={true}
            tableStyle="table-style-2"
        />
    );
};

export default UsersList;

