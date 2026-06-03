import React, { useMemo } from 'react';
import { Column } from '@components/CustomDataTable';
import { UserDirectoryRowActions } from '@page-modules/controlhub/users/partials/UserDirectoryRowActions';

interface UseUserColumnsOptions {
    onResetPassword?: (username: string) => void;
    onChangeStatus?: (encId: string, status: string) => void;
    onStatusOptionSelect?: (row: any, status: string) => void;
}

export const useUserColumns = (session: any, customFieldColumns: Column[], options?: UseUserColumnsOptions) => {
    const { onResetPassword, onStatusOptionSelect } = options || {};
    // Memoize base columns to prevent recreation on every render
    const baseColumns: Column[] = useMemo(() => [
        { key: 'name', name: 'Display Name', selector: (row: any) => row.name, sortable: true },
        { key: 'username', name: 'User Name', selector: (row: any) => row.username, sortable: true },
        { 
            key: 'phone', 
            name: 'Extension', 
            selector: (row: any) => row.phone, 
            sortable: true,
            cell: (props: any) => {
                return props.phone || '---';
            }
        },
        { 
            key: 'Department', 
            name: 'department', 
            selector: (row: any) => row.department, 
            sortable: true,
            cell: (props: any) => {
                return props.department?.name || '---';
            }
        },
        { key: 'Role', name: 'role', selector: (row: any) => row.role, sortable: true },
        { 
            key: 'Group', 
            name: 'group', 
            selector: (row: any) => row.group, 
            sortable: true,
            cell: (props: any) => {
                return props.group || '---';
            }
        },
        { 
            key: 'Company', 
            name: 'company', 
            selector: (row: any) => row.company, 
            sortable: true,
            cell: (props: any) => {
                return props.company?.name || '---';
            }
        },
        { 
            key: 'Status', 
            name: 'status', 
            selector: (row: any) => row.status, 
            sortable: true,
            cell: (props: any) => {
                return props.status
            }
        },
    ], [session?.user?.permissions]);

    // Action column kept last
    const actionColumn: Column = useMemo(() => ({
        key: 'Action',
        name: 'action',
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
            <UserDirectoryRowActions
                row={props}
                permissions={session?.user?.permissions}
                onResetPassword={onResetPassword}
                onStatusOptionSelect={onStatusOptionSelect}
            />
        ),
    }), [session?.user?.permissions, onResetPassword, onStatusOptionSelect]);

    // Memoize the columns array to prevent unnecessary re-renders
    const columns: Column[] = useMemo(() => {
        const finalColumns = [...baseColumns, ...customFieldColumns, actionColumn];
        return finalColumns;
    }, [baseColumns, customFieldColumns, actionColumn]);

    return {
        baseColumns,
        actionColumn,
        columns
    };
};

