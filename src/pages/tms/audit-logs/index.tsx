import "@assets/scss/datatable-style.scss";
import "@assets/scss/tms.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Column } from "@components/CustomDataTable";
import { useSession } from "next-auth/react";
import moment from "moment";

import { GetTmsAuditLogs } from "@utils/tms/List";
import { AuditLog } from "@models/tms/AuditLog";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEye } from "react-icons/fi";


interface SelectOption {
  value: number;
  label: string;
}
export enum AuditLogResourceType {
  RANK = "rank",
  PERMISSION = "permission",
  USER = "user",
  COMPANY = "company",
  AUDIT_LOG = "audit_log",
  CISCO_DB = "cisco_db",
  UNIFIED_OP = "unified_op",
  CUSTOMER_PROFILING = "customer_profiling",
  USER_PROFILING = "user_profiling",
  USER_PROFILING_ERROR_LOG = "user_profiling_error_log",
  GLOBAL = "global",
  LDAP_USER = "ldap_user",
  MODULE = "module",
}
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

const TmsAuditLogs = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({search: ""});

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  const [showDetail, setShowDetail] = useState(false);
    const [auditLog, setAuditLog] = useState<AuditLog | null>(null);


  const columns: Column[] = useMemo(
    () => [
      // {key: "id", name: "Company", selector: (row: any) => row.id, sortable: true,
      //   cell: (row: any) => {
      //     return <div>
      //       <p>{row.company?.name}</p>
      //     </div>
      //   }
      // },
      {key: "company_id", name: "User Name", selector: (row: any) => row.company_id, sortable: true,
        cell: (row: any) => {
          return <div>
            <p>{row.user?.name}</p>
          </div>
        }
      },
      
      // {key: "id", name: "Type", selector: (row: any) => row.action, sortable: true,
      //   cell: (row: any) => {
      //     return <div>
      //       <p>{row?.resource_type}</p>
      //     </div>
      //   }
      // },
      {key: "ip_address", name: "Ip Address", selector: (row: any) => row.ip_address, sortable: true},
      {key: "user_agent", name: "User Agent", selector: (row: any) => row.user_agent, sortable: true},
      {key: "created_at", name: "Data Time", selector: (row: any) => row.created_at, sortable: true,
        cell: (row: any) => {
          return <div>
            <p>{moment(row.created_at).format("YYYY-MM-DD HH:mm:ss A").toLocaleString()}</p>
          </div>
        }
      },
      {key: "action", name: "Action", selector: (row: any) => row.action, sortable: true,
        cell: (row: any) => {
          return <div>
            <DatatableActionButton
              
              actions={[
                {
                  label: ' Details',
                  icon: <FiEye />,
                  onClick: () => {
                    setAuditLog(row);
                    setShowDetail(true);
                  },
                  className: 'gap-2'
                }
              ]

            }
            />
          </div>
        }
      },
      
     
    ],
    []
  );



  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchData = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await GetTmsAuditLogs({ page, perPage, search: search || currentFilters?.search || "", filters: currentFilters });
      },
      [memoizedFilters,currentFilters]
    );

    const [detailsModal, setDetailsModal] = useState(false);
    const [details, setDetails] = useState(null);

  const handleAction = (row: any) => {
    console.log(row);
    setDetails(row);
    setDetailsModal(true);
  }

  const parseJsonData = (data: any) => {
    if (!data) return null;
    
    // If it's already an object or array, return it
    if (typeof data === 'object') return data;
    
    // If it's a string, try to parse it as JSON
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data; // Return as string if parsing fails
      }
    }
    
    return data;
  };

  const formatValue = (value: any, depth: number = 0): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (Array.isArray(value)) {
      if (depth > 2) return '[Array]'; // Prevent infinite recursion
      return `[${value.map(item => formatValue(item, depth + 1)).join(', ')}]`;
    }
    
    if (typeof value === 'object') {
      if (depth > 2) return '{Object}'; // Prevent infinite recursion
      const entries = Object.entries(value).map(([key, val]) => 
        `${key}: ${formatValue(val, depth + 1)}`
      );
      return `{${entries.join(', ')}}`;
    }
    
    return String(value);
  };

  const renderValueContent = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="null-value">N/A</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div className="array-display">
          {value.length === 0 ? (
            <span className="empty-array">Empty Array</span>
          ) : (
            value.map((item, index) => (
              <div key={index} className="array-item-display">
                <div className="item-content capitalize">
                  {renderValueContent(item)}
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="object-display">
          {Object.keys(value).length === 0 ? (
            <span className="empty-object">Empty Object</span>
          ) : (
            Object.entries(value).map(([key, val]) => (
              <div key={key} className="object-item-display">
                <span className="object-key">{key}:</span>
                <div className="object-value">
                  {renderValueContent(val)}
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    return <span className="primitive-value">{String(value)}</span>;
  };

  const renderObjectComparison = (oldObj: any, newObj: any) => {
    const allKeys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]));

    if (allKeys.length === 0) {
      return null;
    }

    return (
      <div className="g-3 row">
        <div className="col-md-12">
          <div className="comparison-header">
            <div className="old-column">
              <h6 className="text-danger mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus-circle" style={{width: '16px', height: '16px', marginRight: '4px'}}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>Old Values
              </h6>
            </div>
            <div className="new-column">
              <h6 className="text-success mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus-circle" style={{width: '16px', height: '16px', marginRight: '4px'}}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>New Values
              </h6>
            </div>
          </div>
        </div>
        {allKeys.map((key) => {
          const oldValue = oldObj?.[key];
          const newValue = newObj?.[key];
          const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

          return (
            <div className="col-md-12" key={key}>
              <div className={`data-change-item ${hasChanged ? 'changed' : 'unchanged'}`}>
                <div className="field-name">
                  <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                </div>
                <div className="field-values">
                  <div className="old-value">
                    <div className="value-content">
                      {renderValueContent(oldValue)}
                    </div>
                  </div>
                  <div className="change-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-right" style={{width: '16px', height: '16px'}}>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                  <div className="new-value">
                    <div className="value-content">
                      {renderValueContent(newValue)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPrimitiveComparison = (oldValue: any, newValue: any) => {
    const hasChanged = oldValue !== newValue;
    
    return (
      <div className="g-3 row">
        <div className="col-md-12">
          <div className={`data-change-item ${hasChanged ? 'changed' : 'unchanged'}`}>
            <div className="field-values">
              <div className="old-value">
                <span className="value-text">
                  {formatValue(oldValue)}
                </span>
              </div>
              <div className="change-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-right" style={{width: '16px', height: '16px'}}>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
              <div className="new-value">
                <span className="value-text">
                  {formatValue(newValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDataComparison = () => {
    if (!auditLog || (!auditLog.old_values && !auditLog.new_values)) {
      return null;
    }

    const oldData = parseJsonData(auditLog.old_values);
    const newData = parseJsonData(auditLog.new_values);

    // Handle different data types
    if ((Array.isArray(oldData) && oldData.length > 0) || (Array.isArray(newData) && newData.length > 0)) {
      // For arrays, we'll show a simple comparison for now
      return renderPrimitiveComparison(oldData, newData);
    } else if (typeof oldData === 'object' && oldData !== null && typeof newData === 'object' && newData !== null) {
      // Both are objects
      return renderObjectComparison(oldData, newData);
    } else {
      // Handle primitive values or mixed types
      return renderPrimitiveComparison(oldData, newData);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Audit Logs"
        mainLink="/tms/audit-logs"
        subTitle="Audit Logs"
      />
      
        <PageHeader
          title="Audit Logs"
          showSearch={false}
          searchPlaceholder="Search Audit Logs..."
          searchValue={currentFilters?.search || ""}
          onSearchChange={(value: any) => handleFiltersChange({...currentFilters, search: value})}
          
          leftGrid={3}
          rightGrid={9}
        />

      {/* {auditLog && (
                <AuditLogDetail
                    auditLog={auditLog}
                    show={showDetail}
                    close={() => setShowDetail(false)}
                />
            )}   */}

      <FormModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        title="Audit Log Details"
        desc="View detailed information about the selected audit log entry."
        submitButtonText="Close"
        cancelButtonText="Close"
        onSubmit={() => setShowDetail(false)}
        onCancel={() => setShowDetail(false)}
        ShowSubmitButton={false}
        formHtml={
          auditLog ? (
            <div>
              
              <div className="border-0 shadow-sm card">
                <div className="bg-primary text-white card-header p-2" style={{borderBottom: 'none', borderRadius: '0.375rem 0.375rem 0px 0px'}}>
                  <h5 className="mb-0 text-white d-flex align-items-center">Log Information</h5>
                </div>
                <div className="card-body" style={{padding: '1.5rem'}}>
                  <div className="g-3 row">
                    <div className="col-md-6">
                      <div className="detail-item">
                        <label className="detail-label">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-briefcase">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>Company
                        </label>
                        <p className="detail-value">{auditLog.company?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-item">
                        <label className="detail-label">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-user">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>User
                        </label>
                        <p className="detail-value">{auditLog.user?.name || auditLog.user_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-item">
                        <label className="detail-label">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-zap">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                          </svg>Action
                        </label>
                        <p className="detail-value">{auditLog.action || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-item">
                        <label className="detail-label">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-tag">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                          </svg>Resource Type
                        </label>
                        <p className="detail-value">{auditLog.resource_type || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-item">
                        <label className="detail-label">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-monitor">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                          </svg>IP Address
                        </label>
                        <p className="detail-value">{auditLog.ip_address || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-item">
                        <label className="detail-label">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-tablet">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                            <line x1="12" y1="18" x2="12.01" y2="18"></line>
                          </svg>User Agent
                        </label>
                        <p className="detail-value text-truncate" title={auditLog.user_agent || 'N/A'}>
                          {auditLog.user_agent || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-item">
                        <label className="detail-label">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-calendar">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>Created At
                        </label>
                        <p className="detail-value">
                          {auditLog.created_at ? moment(auditLog.created_at).format("YYYY-MM-DD HH:mm:ss A") : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-item">
                        <label className="detail-label">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-edit">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>Updated At
                        </label>
                        <p className="detail-value">
                          {auditLog.updated_at ? moment(auditLog.updated_at).format("YYYY-MM-DD HH:mm:ss A") : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

             
              {auditLog.old_values || auditLog.new_values ? (
                <div className="border-0 shadow-sm mt-3 card">
                  <div className="bg-info text-white card-header p-2" style={{borderBottom: 'none', borderRadius: '0.375rem 0.375rem 0px 0px'}}>
                    <h5 className="mb-0 text-white d-flex align-items-center">Data Changes</h5>
                  </div>
                  <div className="card-body" style={{padding: '1.5rem'}}>
                    {renderDataComparison()}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div>No audit log data available</div>
          )
        }
      />

      
        <GenericListPage
          columns={columns}
          fetchData={fetchData}
          title="Audit Logs"
          searchPlaceholder="Search Audit Logs..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
          tableStyle="table-style-2"
        />
        
      
      <style>{`
        .comparison-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background-color: #f8f9fa;
          border-radius: 0.25rem;
        }
        
        .old-column, .new-column {
          flex: 1;
          text-align: center;
        }
        
        .data-change-item {
          padding: 0.75rem;
          border: 1px solid #e9ecef;
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
          background-color: #fff;
        }
        
        .data-change-item.changed {
          border-left: 4px solid #28a745;
          background-color: #f8fff9;
        }
        
        .data-change-item.unchanged {
          border-left: 4px solid #6c757d;
          background-color: #f8f9fa;
        }
        
        .field-name {
          font-weight: 600;
          color: #495057;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .field-values {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .old-value, .new-value {
          flex: 1;
          padding: 0.5rem;
          border-radius: 0.25rem;
          min-height: 40px;
          display: flex;
          align-items: center;
        }
        
        .old-value {
          background-color: #fff5f5;
          border: 1px solid #fed7d7;
        }
        
        .new-value {
          background-color: #f0fff4;
          border: 1px solid #c6f6d5;
        }
        
        .change-arrow {
          color: #6c757d;
          display: flex;
          align-items: center;
        }
        
        .value-text {
          word-break: break-word;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }
        
        .value-content {
          width: 100%;
          min-height: 40px;
          display: flex;
          align-items: flex-start;
          padding: 0.5rem;
        }
        
        .null-value {
          color: #6c757d;
          font-style: italic;
        }
        
        .array-display {
          width: 100%;
          font-size: 0.875rem;
        }
        
        .empty-array {
          color: #6c757d;
          font-style: italic;
          padding: 0.5rem;
          background-color: #f8f9fa;
          border-radius: 0.25rem;
          text-align: center;
        }
        
        .array-item-display {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.5rem;
          margin-bottom: 0.25rem;
          background-color: #f8f9fa;
          border-radius: 0.25rem;
          border-left: 3px solid #007bff;
        }
        
        .array-item-display:last-child {
          margin-bottom: 0;
        }
        
        .item-content {
          flex: 1;
          padding-left: 0.5rem;
        }
        
        .object-display {
          width: 100%;
          font-size: 0.875rem;
        }
        
        .empty-object {
          color: #6c757d;
          font-style: italic;
          padding: 0.5rem;
          background-color: #f8f9fa;
          border-radius: 0.25rem;
          text-align: center;
        }
        
        .object-item-display {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.5rem;
          margin-bottom: 0.25rem;
          background-color: #fff3cd;
          border-radius: 0.25rem;
          border-left: 3px solid #ffc107;
        }
        
        .object-item-display:last-child {
          margin-bottom: 0;
        }
        
        .object-key {
          font-weight: 600;
          color: #856404;
          font-size: 0.875rem;
          min-width: 80px;
          padding: 0.25rem 0.5rem;
          background-color: #fff8e1;
          border-radius: 0.25rem;
          text-align: right;
        }
        
        .object-value {
          flex: 1;
          padding-left: 0.5rem;
        }
        
        .primitive-value {
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          color: #212529;
          padding: 0.5rem;
          background-color: #e9ecef;
          border-radius: 0.25rem;
          word-break: break-word;
        }
      `}</style>

    </React.Fragment>
  );
};

TmsAuditLogs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TmsAuditLogs;