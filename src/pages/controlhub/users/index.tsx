import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';

import { getAllUsers } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import UsersFilters from '@components/filters/UsersFilters';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from 'react-bootstrap';
import ProtectedRoute from '@components/ProtectedRoute';

import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import EmptyState from '@components/EmptyState';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Summary {
    users: number;
    departments: number;
    ranks: number;
    groups: number;
}

const Users = () => {
    const { data:session, status } = useSession();

    // Local dynamic custom-field columns
    const [customFieldColumns, setCustomFieldColumns] = useState<Column[]>([]);

    // Memoize base columns to prevent recreation on every render
    const baseColumns: Column[] = useMemo(() => [
        //{ key: 'ID', name: 'id', selector: (row: any) => row.id, sortable: true },
        ...(session?.user?.permissions?.includes('show-ldap-uuid-users') ? [
            { key: 'User ID', name: 'ldap_uid', selector: (row: any) => row.ldap_uid, sortable: true }
        ] : []),
        { key: 'DisplayName', name: 'name', selector: (row: any) => row.name, sortable: true },
        { key: 'Email', name: 'email', selector: (row: any) => row.email, sortable: true },
        { key: 'Username', name: 'username', selector: (row: any) => row.username, sortable: true },
        { key: 'Ext', name: 'phone', selector: (row: any) => row.phone, sortable: true },
        ...(session?.user?.permissions?.includes('show-ou-users') ? [
            { key: 'OU', name: 'ou', selector: (row: any) => row.ou, sortable: true }
        ] : []),
        { key: 'Department', name: 'department', selector: (row: any) => row.department, sortable: true,
            cell: (props: any) => {
                console.log('Department:', props.department);
                return props.department?.name ||'';
            }
         },
        { key: 'Company', name: 'company', selector: (row: any) => row.company, sortable: true,
            cell: (props: any) => {
                console.log('Company:', props.company);
                return props.company?.name ||'';
            }
         },
        { key: 'Role', name: 'role', selector: (row: any) => row.role, sortable: true },
        { key: 'Group', name: 'group', selector: (row: any) => row.group, sortable: true },
        { key: 'Status', name: 'status', selector: (row: any) => row.status, sortable: true },
        { key: 'Last Synced', name: 'last_synced_at', selector: (row: any) => row.last_synced_at, sortable: true },
    ], [session?.user?.permissions]);

    // Action column kept last
    const actionColumn: Column = useMemo(() => ({
        key: 'Action',
        name: 'action',
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
            <div className="d-flex gap-3">
                {session?.user?.permissions?.includes('edit-users')  && (
                    <Link 
                        href={`/controlhub/users/${props.encId}`} 
                        className="btn btn-sm btn-outline-primary">
                        Edit
                    </Link> 
                )}
            </div>
        ),
    }), [session?.user?.permissions]);

    // Memoize the columns array to prevent unnecessary re-renders
    const columns: Column[] = useMemo(() => {
        const finalColumns = [...baseColumns, ...customFieldColumns, actionColumn];
        console.log('Final columns:', finalColumns);
        console.log('Custom field columns count:', customFieldColumns.length);
        return finalColumns;
    }, [baseColumns, customFieldColumns, actionColumn]);

    const [currentFilters, setCurrentFilters] = useState({});
    const [summary, setSummary] = useState<Summary>({
        users: 0,
        departments: 0,
        ranks: 0,
        groups: 0
    });

    const fetchUsers = useCallback(
        async (page = 1, perPage = 15, search = "") => {
            const rssponse = await getAllUsers({ page, perPage, search, filters: currentFilters });
            console.log(rssponse);

            // Derive dynamic custom-field columns from the returned rows
            try {
                const rows = rssponse?.dataList || rssponse?.dataList || [];
                
                if (Array.isArray(rows)) { 
                    const baseKeysLower = new Set(baseColumns.map(c => c.key.toLowerCase()));
                    const seen = new Set<string>();
                    const dynamicCols: Column[] = [];

                    rows.forEach((row: any) => {
                        const fields = Array.isArray(row?.custom_fields) ? row.custom_fields : [];
                        fields.forEach((f: any) => {
                            const fieldNameRaw = f?.field_name;
                            const fieldName = typeof fieldNameRaw === 'string' ? fieldNameRaw.trim() : '';
                            if (!fieldName) return;
                            const normalized = fieldName.toLowerCase();
                            if (baseKeysLower.has(normalized)) return;
                            if (seen.has(normalized)) return;
                            seen.add(normalized);

                            dynamicCols.push({
                                key: fieldName,
                                name: fieldName,
                                sortable: true,
                                selector: (r: any) => {
                                    const cf = (Array.isArray(r?.custom_fields) ? r.custom_fields : []).find((x: any) => String(x?.field_name).trim() === fieldName);
                                    return cf?.field_value ?? '';
                                },
                            });
                        });
                    });

                    console.log('Setting custom field columns:', dynamicCols);
                   // setCustomFieldColumns(dynamicCols);
                } else {
                    setCustomFieldColumns([]);
                }
            } catch (error) {
                console.error('Error processing custom fields:', error);
                setCustomFieldColumns([]);
            }

            setSummary({
                users: rssponse?.summary?.users,
                departments: rssponse?.summary?.departments,
                ranks: rssponse?.summary?.ranks,
                groups: rssponse?.summary?.groups
            });
            return rssponse;
        },
        [session, currentFilters, baseColumns]
    );

    const handleFiltersChange = (filters: any) => {
        setCurrentFilters(filters);
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
        try {
            await getAllUsers({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
        } catch (error) {
            toast.error('Export failed. Please try again.');
        }
    };

    const [showAddGroupModal, setShowAddGroupModal] = useState(false);

    const handleShowAddGroupModal = () => {
        setShowAddGroupModal(true);
    }

    const handleCloseAddGroupModal = () => {
        setShowAddGroupModal(false);
    }

    const [growthChart, setGrowthChart] = React.useState<{
        series: Array<{ name: string; data: number[] }>;
        options: any;
    }>({
          
        series: [{
          name: 'series1',
          data: [31, 40, 28, 51, 42, 109]
        }],
        options: {
          chart: {
            height: 250,
            type: 'area',
            toolbar: {
              show: false
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth'
          },
          xaxis: {
            type: 'category',
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
          },
          tooltip: {
            x: {
              //format: 'MMM'
            },
          },
        },
    });

    const [departmentChart, setDepartmentChart] = React.useState<{
        series: number[];
        options: any;
    }>({
        series: [44, 55, 41, 17, 15],
        options: {
          chart: {
            type: 'donut',
            toolbar: {
              show: false
            }
          },
          labels: ['Sales', 'Marketing', 'Development', 'HR', 'Finance'],
          legend: {
            position: 'bottom',
            markers: {
              shape: 'rect',
              
            }
          },
          plotOptions: {
            pie: {
              donut: {
                size: '40%'
              }
            }
          },
          dataLabels: {
            enabled: false,
          },
          responsive: [{
            breakpoint: 480,
            options: {
              chart: {
                width: 200
              },
              legend: {
                position: 'bottom'
              }
            }
          }]
        },
    });

    return (
        <ProtectedRoute requiredPermissions={['view-users']}>
            <React.Fragment>
                <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/users" subTitle="Users" />
                
                <Row className="mb-3">
                    <Col md={12}>
                        <div className="page-header-title">
                            <div className="align-items-center row">
                                <div className="col-md-4">
                                    <h3 className="mb-0 d-flex align-items-center">User Directory</h3>
                                </div>
                                <div className="d-flex justify-content-end col-md-8">
                                    <UsersFilters onFiltersChange={handleFiltersChange} onExport={handleExport} />
                                </div>
                            </div>
                            
                        </div>
                    </Col>
                </Row>

                <Row>
               <Col md={3}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-users f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Users</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.users > 0 ? (
                                                <AnimatedNumber value={summary?.users} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>  
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-buildings f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Departments</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.departments > 0 ? (
                                                <AnimatedNumber value={summary?.departments} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-2 text-white me-3">
                                          <i className="ph-duotone ph-align-center-horizontal f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Ranks</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.ranks > 0 ? (
                                                <AnimatedNumber value={summary?.ranks} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus2.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="fas fa-layer-group f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Groups</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.groups > 0 ? (
                                                <AnimatedNumber value={summary?.groups} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>
            </Row>
                
                {session?.user?.permissions?.includes('list-users') && (
                    <GenericListPage
                        key={`users-table-${customFieldColumns.length}-${customFieldColumns.map(c => c.key).join('|')}`}
                        columns={columns}
                        fetchData={fetchUsers}
                        title="Users"
                        searchPlaceholder="Search users..."
                        defaultPageSize={15}
                        filters={currentFilters}
                        // Feature flags - set these to true to enable functionality
                        rowClick={true}
                        showCanvas={true}
                    />
                )}

                <Row className=" mt-3">
                  
                  <Col md={7} className="mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5>User Growwth (Last 6 Months)</h5>
                        <ReactApexChart
                  options={growthChart.options}
                  series={growthChart.series}
                  type="area"
                  height={300}
                />
                      </div>
                    </div>
                  </Col>

                  <Col md={5} className="mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5>Department Distribution</h5>
                        <ReactApexChart
                  options={departmentChart.options}
                  series={departmentChart.series}
                  type="donut"
                  height={300}
                />
                      </div>
                    </div>
                  </Col>

                  <Col md={12} className="mb-3">
                    <div className="card">
                        <div className="card-header">
                            <h5>Recent Activities</h5>
                        </div>
                      <div className="card-body">
                      <Row className="recent-activity">
                                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                                    <div className="ico">
                                                    <i className="ti ti-history"></i>
                                                    </div>
                                                </Col>
                                                <Col md={10} className="d-flex align-items-center">
                                                    <div className="info">
                                                    <h6>Login to platform</h6>
                                                    <p className="mb-2 small">
                                                        <span className=""><b>Date: </b> </span>
                                                        <span className="text-muted me-4">23 Aug 2024</span>

                                                        <span className=""><b>Time: </b> </span>
                                                        <span className="text-muted me-4">12:00:00</span>

                                                        <span className=""><b>Device: </b> </span>
                                                        <span className="text-muted me-4">MacBook Pro</span>

                                                        <span className=""><b>Browser: </b> </span>
                                                        <span className="text-muted me-4">Chrome</span>


                                                    </p>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                                <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                                </Col>
                                            </Row>
                      </div>
                    </div>
                  </Col>


                </Row>

            



            </React.Fragment>
        </ProtectedRoute>
    );
};

Users.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Users;
