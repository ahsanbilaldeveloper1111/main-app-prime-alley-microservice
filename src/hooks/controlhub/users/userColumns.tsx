import React, { useMemo } from 'react';
import { Column } from '@components/CustomDataTable';
import { Button, Dropdown } from 'react-bootstrap';
import { Eye, Key } from 'lucide-react';

const STATUS_OPTIONS = ['processing', 'completed', 'deleted'] as const;

interface UseUserColumnsOptions {
    onResetPassword?: (username: string) => void;
    onChangeStatus?: (encId: string, status: string) => void;
    onStatusOptionSelect?: (row: any, status: string) => void;
}

export const useUserColumns = (session: any, customFieldColumns: Column[], options?: UseUserColumnsOptions) => {
    const { onResetPassword, onChangeStatus, onStatusOptionSelect } = options || {};
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
            <div className="d-flex gap-3">
                
                {session?.user?.permissions?.includes('reset-password-users') && (
                <Button 
                variant="light" size="sm" 
                className="btn-action-style-2 p-1 text-primary" 
                title="Reset Password"
                onClick={() => onResetPassword && onResetPassword(props.username)}
              >
                <Key className="text-primary" size={16} />
              </Button>
              )}

                {session?.user?.permissions?.includes('edit-users') && (
                    <Button variant="light"  className="btn-action-style-2 p-1 text-primary" title="View" onClick={() => {
                        if (typeof globalThis !== 'undefined' && globalThis.window) {
                            globalThis.window.location.href = `/controlhub/users/${props.encId}`;
                        }
                    }}>
                        <Eye size={16} />
                    </Button>
                )}

{session?.user?.permissions?.includes('change-status-users') && (
                    <Dropdown align="end" onSelect={(status) => {
                        if (!status) return;
                        if (onStatusOptionSelect) {
                            onStatusOptionSelect(props, status);
                        }
                    }}>
                        <Dropdown.Toggle variant="outline-primary" size="sm" className="" title="Status" id={`status-dropdown-${props.encId}`}>
                            Change Status
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {STATUS_OPTIONS.filter((status) => status.toLowerCase() !== (props.status || '').toLowerCase()).map((status) => (
                                <Dropdown.Item key={status} eventKey={status}>
                                    {status}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                )}
            </div>
        ),
    }), [session?.user?.permissions, onResetPassword, onChangeStatus, onStatusOptionSelect]);

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

