import React, { useMemo } from 'react';
import { Column } from '@components/CustomDataTable';
import { FiEdit } from 'react-icons/fi';
import DatatableActionButton from '@components/DatatableActionButton';

export const useUserColumns = (session: any, customFieldColumns: Column[]) => {
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
    ], [session?.user?.permissions]);

    // Action column kept last
    const actionColumn: Column = useMemo(() => ({
        key: 'Action',
        name: 'action',
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
            <div className="d-flex gap-3">
                {session?.user?.permissions?.includes('edit-users') && (
                    <DatatableActionButton
                        actions={[
                            {
                                label: 'Edit',
                                icon: <FiEdit className="me-2" />,
                                onClick: () => {
                                    window.location.href = `/controlhub/users/${props.encId}`;
                                },
                                className: 'action-edit'
                            }
                        ]}
                    />
                )}
            </div>
        ),
    }), [session?.user?.permissions]);

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
