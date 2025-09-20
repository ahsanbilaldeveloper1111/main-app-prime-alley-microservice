import "@assets/scss/datatable-style.scss";
import "@assets/scss/tms.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";
import Select from "react-select";
import AuditLogDetail from "./Details";

import { getAuditLogs } from "@utils/tms/List";
import AuditLogsFilters from "@components/filters/AuditLogsFilters";
import { AuditLog } from "@models/tms/AuditLog";

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
  const [currentFilters, setCurrentFilters] = useState({});

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  const [showDetail, setShowDetail] = useState(false);
    const [auditLog, setAuditLog] = useState<AuditLog | null>(null);


  const columns: Column[] = useMemo(
    () => [
      {key: "id", name: "Company", selector: (row: any) => row.id, sortable: true,
        cell: (row: any) => {
          return <div>
            <p>{row.company?.name}</p>
          </div>
        }
      },
      {key: "company_id", name: "User Name", selector: (row: any) => row.company_id, sortable: true,
        cell: (row: any) => {
          return <div>
            <p>{row.user?.name}</p>
          </div>
        }
      },
      
      {key: "id", name: "Type", selector: (row: any) => row.action, sortable: true,
        cell: (row: any) => {
          return <div>
            <p>{row?.resource_type}</p>
          </div>
        }
      },
      {key: "ip_address", name: "Ip Address", selector: (row: any) => row.resource_type, sortable: true},
      {key: "user_agent", name: "User Agent", selector: (row: any) => row.resource_type, sortable: true},
      {key: "created_at", name: "Data Time", selector: (row: any) => row.created_at, sortable: true},
      {key: "action", name: "Action", selector: (row: any) => row.action, sortable: true,
        cell: (row: any) => {
          return <div>
            <Button size="sm" variant="outline-primary" onClick={() => {
                            setAuditLog(row);
                            setShowDetail(true);
                        }}>Details</Button>
          </div>
        }
      },
      
     
    ],
    []
  );



  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchData = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await getAuditLogs({ page, perPage, search, filters: currentFilters });
      },
      [memoizedFilters]
    );

    const [detailsModal, setDetailsModal] = useState(false);
    const [details, setDetails] = useState(null);

  const handleAction = (row: any) => {
    console.log(row);
    setDetails(row);
    setDetailsModal(true);
  }


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Audit Logs"
        mainLink="/tms/audit-logs"
        subTitle="Audit Logs"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center justify-content-between">
              List Audit Logs
              <AuditLogsFilters onFiltersChange={handleFiltersChange} />
            </h2>
          </div>
        </Col>
      </Row>

      {auditLog && (
                <AuditLogDetail
                    auditLog={auditLog}
                    show={showDetail}
                    close={() => setShowDetail(false)}
                />
            )}  

      
        <GenericListPage
          columns={columns}
          fetchData={fetchData}
          title="Audit Logs"
          searchPlaceholder="Search Audit Logs..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
        {detailsModal && (
          <Modal 
          show={detailsModal} 
          onHide={() => setDetailsModal(false)}
          size="lg"
          centered
        >

        

          <Modal.Header closeButton>
            <Modal.Title>Audit Log Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* {details && ( */}
              <div>
                

                <div className="border-0 shadow-sm card">
                  <div className="bg-primary text-white card-header p-2" style={{borderBottom: 'none', borderRadius: '0.375rem 0.375rem 0px 0px'}}>
                    <h5 className="mb-0 text-white d-flex align-items-center">Log Information</h5></div>
                  <div className="card-body" style={{padding: '1.5rem'}}>
                    <div className="g-3 row">
                      <div className="col-md-6">
                        <div className="detail-item">
                          <label className="detail-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-briefcase">
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>Company</label>
                          <p className="detail-value">XYZ FZ LLC</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="detail-item">
                          <label className="detail-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-user">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>User</label>
                          <p className="detail-value">crm user</p>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="detail-item">
                          <label className="detail-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-zap">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>Action</label>
                          <p className="detail-value">create</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="detail-item">
                          <label className="detail-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-monitor">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                              <line x1="8" y1="21" x2="16" y2="21"></line>
                              <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>IP Address</label>
                          <p className="detail-value">192.168.30.254</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="detail-item">
                          <label className="detail-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-tablet">
                              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                              <line x1="12" y1="18" x2="12.01" y2="18"></line>
                            </svg>User Agent</label>
                          <p className="detail-value text-truncate" title="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36">Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36</p>
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
                            </svg>Created At</label>
                          <p className="detail-value">August 30, 2025 at 01:49:03 PM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-0 shadow-sm mt-3 card">
                  <div className="bg-info text-white card-header p-2" style={{borderBottom: 'none', borderRadius: '0.375rem 0.375rem 0px 0px'}}>
                    <h5 className="mb-0 text-white d-flex align-items-center">Data Changes</h5></div>
                  <div className="card-body" style={{padding: '1.5rem'}}>
                    <div className="g-3 row">
                      <div className="col-md-12">
                        <div className="comparison-header">
                          <div className="old-column">
                            <h6 className="text-danger mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-minus-circle" style={{width: '16px', height: '16px', marginRight: '4px'}}><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>Old Values</h6></div>
                          <div className="new-column">
                            <h6 className="text-success mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-plus-circle" style={{width: '16px', height: '16px', marginRight: '4px'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>New Values</h6></div>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="data-change-item changed">
                          <div className="field-name"><strong>CompanyName</strong></div>
                          <div className="field-values">
                            <div className="old-value">
                              <div className="value-content"><span className="null-value">N/A</span></div>
                            </div>
                            <div className="change-arrow">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-arrow-right" style={{width: '16px', height: '16px'}}>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                              </svg>
                            </div>
                            <div className="new-value">
                              <div className="value-content"><span className="primitive-value">XYZ FZ LLC</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                     
                    </div>
                  </div>
                </div>




              </div>
            {/* )} */}
          </Modal.Body>
        </Modal>
      )}
      

    </React.Fragment>
  );
};

TmsAuditLogs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TmsAuditLogs;