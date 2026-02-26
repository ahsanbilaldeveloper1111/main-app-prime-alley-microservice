import React from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'react-bootstrap';
import { FiMoreVertical } from 'react-icons/fi';
import { IconType } from 'react-icons';

export interface Action {
    label: string;
    icon: IconType;
    onClick: () => void;
    permission?: string;
    variant?: 'edit' | 'delete' | 'default';
}

interface TableActionProps {
    actions: Action[];
    userPermissions?: string[];
    placement?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
    size?: 'sm' | 'lg';
}

const TableAction: React.FC<TableActionProps> = ({
    actions,
    userPermissions = [],
    placement = 'top-start',
    size = 'sm'
}) => {
    const getActionClassName = (variant?: string) => {
        switch (variant) {
            case 'edit':
                return 'action-edit';
            case 'delete':
                return 'action-delete';
            default:
                return '';
        }
    };

    return (
        <Dropdown className="table-action-dropdown" placement={placement}>
            <DropdownToggle variant="outline-secondary" size={size}>
                <FiMoreVertical size={14} />
            </DropdownToggle>
            <DropdownMenu>
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    const hasPermission = !action.permission || userPermissions.includes(action.permission);

                    if (!hasPermission) return null;

                    return (
                        <DropdownItem
                            key={index}
                            className={getActionClassName(action.variant)}
                            onClick={action.onClick}
                        >
                            <Icon className="me-2" />
                            {action.label}
                        </DropdownItem>
                    );
                })}
            </DropdownMenu>
        </Dropdown>
    );
};

export default TableAction;
