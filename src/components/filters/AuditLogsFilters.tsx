import React, { useState, useEffect } from 'react';
import GenericFilter from './GenericFilter';
import { AuditLogResourceType } from '../../pages/tms/audit-logs/index';

interface AuditLogsFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
}

export default function AuditLogsFilters({ onFiltersChange, onExport }: AuditLogsFiltersProps) {
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Resource type filter options
  const resourceTypeOptions = [
    { value: '', label: 'All Resource Types' },
    { value: AuditLogResourceType.RANK, label: 'Rank' },
    { value: AuditLogResourceType.PERMISSION, label: 'Permission' },
    { value: AuditLogResourceType.USER, label: 'User' },
    { value: AuditLogResourceType.COMPANY, label: 'Company' },
    { value: AuditLogResourceType.AUDIT_LOG, label: 'Audit Log' },
    { value: AuditLogResourceType.CISCO_DB, label: 'Cisco DB' },
    { value: AuditLogResourceType.UNIFIED_OP, label: 'Unified OP' },
    { value: AuditLogResourceType.CUSTOMER_PROFILING, label: 'Customer Profiling' },
    { value: AuditLogResourceType.USER_PROFILING, label: 'User Profiling' },
    { value: AuditLogResourceType.USER_PROFILING_ERROR_LOG, label: 'User Profiling Error Log' },
    { value: AuditLogResourceType.GLOBAL, label: 'Global' },
    { value: AuditLogResourceType.LDAP_USER, label: 'LDAP User' },
    { value: AuditLogResourceType.MODULE, label: 'Module' },
  ];

  // Create filter configuration
  const auditLogsConfig = [
    {
      id: 'audit-logs-filters',
      title: 'Audit Logs',
      icon: 'ti ti-file-text',
      fields: [
        {
          name: 'resource_type',
          label: 'Resource Type',
          type: 'select' as const,
          options: resourceTypeOptions,
          placeholder: 'Select resource type...',
          description: 'Filter by the type of resource being audited'
        }
      ]
    }
  ];

  useEffect(() => {
    // Show filters by default
    setShowFilters(true);
    
    // Show export if onExport prop is provided
    if (onExport) {
      setShowExport(true);
    }
  }, [onExport]);

  return (
    <GenericFilter
      tabs={auditLogsConfig}
      onFiltersChange={onFiltersChange}
      showFilters={showFilters}
      onExport={onExport}
      showExport={showExport}
      exportOptions={[
        { label: 'Excel', value: 'excel' },
        { label: 'PDF', value: 'pdf' }
      ]}
    />
  );
}
