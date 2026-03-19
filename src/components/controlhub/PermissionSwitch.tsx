import React from 'react';
import { Form, OverlayTrigger, Tooltip } from 'react-bootstrap';

interface Permission {
    id: number;
    name: string;
    key: string;
    enabled: boolean;
    description: string;
    module_id: number;
    is_special: string;
    severity_level?: string;
}

interface PermissionSwitchProps {
    perm: Permission;
    groupKey: string;
    tooltipIdPrefix: 'regular' | 'special';
    groupIdx: number;
    originalIndex: number;
    onPermissionChange: (groupIdx: number, subGroupIdx: number | null, permIdx: number) => void;
    getSeverityBadgeClass: (severityLevel: string) => string;
}

export const PermissionSwitch: React.FC<PermissionSwitchProps> = ({
    perm,
    groupKey,
    tooltipIdPrefix,
    groupIdx,
    originalIndex,
    onPermissionChange,
    getSeverityBadgeClass
}) => (
    <div className="col-md-4 mb-3">
        <OverlayTrigger
            placement="right"
            overlay={
                <Tooltip id={`tooltip-${tooltipIdPrefix}-${perm.id}`}>
                    {perm?.description || 'No description available'}
                </Tooltip>
            }
        >
            <div className="d-inline-block">
                <Form.Check
                    type="switch"
                    id={`${perm.key}_${groupKey}`}
                    label={perm.name}
                    checked={perm.enabled}
                    onChange={() => {
                        if (originalIndex !== -1) {
                            onPermissionChange(groupIdx, null, originalIndex);
                        }
                    }}
                />
                {perm?.severity_level && perm?.severity_level !== "" && (
                    <span className={`status-badge ${getSeverityBadgeClass(perm.severity_level)} ms-1 small`}>
                        {perm?.severity_level}
                    </span>
                )}
            </div>
        </OverlayTrigger>
    </div>
);
