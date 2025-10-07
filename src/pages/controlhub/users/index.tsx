import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';

import { getAllUsers, SyncLdapUsers } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { Row, Modal, Table, Col, Button } from 'react-bootstrap';
import FormModal from '@pages/partial/FormModal';
import UsersFilters from '@components/filters/UsersFilters';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ProtectedRoute from '@components/ProtectedRoute';

import AnimatedNumber from '@components/AnimatedNumber';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import EmptyState from '@components/EmptyState';
import dynamic from 'next/dynamic';
import '@assets/scss/tabs.scss'


import '@assets/scss/common.scss';

import { formatDateTimeToLocal, GlobalDateTimeFormat } from '@utils/Helper';
import { motion } from 'framer-motion';
import { FiEdit } from 'react-icons/fi';
import DatatableActionButton from '@components/DatatableActionButton';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });


interface Summary {
    users: number;
    departments: number;
    ranks: number;
    groups: number;
    activeUsers: number;
}

const Users = () => {
    const { data:session, status } = useSession();
    const [activeTab, setActiveTab] = useState('overview');

    // Local dynamic custom-field columns
    const [customFieldColumns, setCustomFieldColumns] = useState<Column[]>([]);


    const [loadingLdapUsers, setLoadingLdapUsers] = useState(false);
    const [responseDataLdapUsers, setResponseDataLdapUsers] = useState<any>(null);
    const [showSyncLdapUsersModal, setShowSyncLdapUsersModal] = useState(false);
    const [errorLdapUsers, setErrorLdapUsers] = useState<any>(null);

    const handleCloseSyncLdapUsersModal = () => {
        setShowSyncLdapUsersModal(false);
    }

    const syncLdapUsers = async () => {
      try {
        console.log('Syncing LDAP users');
        setLoadingLdapUsers(true);
        setErrorLdapUsers(null);
        setShowSyncLdapUsersModal(true);

        const response = await SyncLdapUsers();
        if(response){
          console.log('Response fun:', response);
          setResponseDataLdapUsers(response);
          setLoadingLdapUsers(false);
        }
       
      } catch (error) {
        console.error(error);
      }
    }

    // Memoize base columns to prevent recreation on every render
    const baseColumns: Column[] = useMemo(() => [
        //{ key: 'ID', name: 'id', selector: (row: any) => row.id, sortable: true },
        
        // ...(session?.user?.permissions?.includes('show-ldap-uuid-users') ? [
        //     { key: 'ldap_uid', name: 'User ID', selector: (row: any) => row.ldap_uid, sortable: true }
        // ] : []),

        { key: 'name', name: 'Display Name', selector: (row: any) => row.name, sortable: true },
        { key: 'username', name: 'User Name', selector: (row: any) => row.username, sortable: true },
        { key: 'phone', name: 'Extension', selector: (row: any) => row.phone, sortable: true,
          cell: (props: any) => {
            return props.phone || '---';
          }
         },
         { key: 'Department', name: 'department', selector: (row: any) => row.department, sortable: true,
          cell: (props: any) => {
              return props.department?.name || '---';
          }
       },
        { key: 'Role', name: 'role', selector: (row: any) => row.role, sortable: true },
        { key: 'Group', name: 'group', selector: (row: any) => row.group, sortable: true ,
          cell: (props: any) => {
            return props.group || '---';
          }
        },

        { key: 'Email', name: 'email', selector: (row: any) => row.email, sortable: true },
        
        
        // ...(session?.user?.permissions?.includes('show-ou-users') ? [
        //     { key: 'OU', name: 'ou', selector: (row: any) => row.ou, sortable: true,
        //       cell: (props: any) => {
        //         return props.ou || '---';
        //       }
        //      }
        // ] : []),
       
        { key: 'Company', name: 'company', selector: (row: any) => row.company, sortable: true,
            cell: (props: any) => {
                return props.company?.name || '---';
            }
         },
        
        // { key: 'Status', name: 'status', selector: (row: any) => row.status, sortable: true },
        
        // { key: 'last_synced_at', name: 'Last Synced', selector: (row: any) => row.last_synced_at, sortable: true,
        //   cell: (props: any) => {
        //     return formatDateTimeToLocal(props.last_synced_at, GlobalDateTimeFormat);
        //   }
        //  },
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

    const [currentFilters, setCurrentFilters] = useState({});
    const [summary, setSummary] = useState<Summary>({
        users: 0,
        departments: 0,
        ranks: 0,
        groups: 0,
        activeUsers: 0
    });

    // Create cards data for PageSummaryGrid
    const summaryCards: SummaryCard[] = [
        {
            id: 'total-users',
            title: 'Total Users',
            value: summary?.users || 0,
            description: 'Total users in the system',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'departments',
            title: 'Departments',
            value: summary?.departments || 0,
            description: 'Departments in the system',
            delay: 0.3,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'ranks',
            title: 'Ranks',
            value: summary?.ranks || 0,
            description: 'Ranks in the system',
            delay: 0.5,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'groups',
            title: 'Groups',
            value: summary?.groups || 0,
            description: 'Groups in the system',
            delay: 0.7,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        }
    ];

    const fetchUsers = useCallback(
        async (page = 1, perPage = 15, search = "") => {
            const rssponse = await getAllUsers({ page, perPage, search, filters: currentFilters });
            
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

                   // setCustomFieldColumns(dynamicCols);
                } else {
                    setCustomFieldColumns([]);
                }
            } catch (error) {
                setCustomFieldColumns([]);
            }

            setSummary({
                users: rssponse?.summary?.users,
                departments: rssponse?.summary?.departments,
                ranks: rssponse?.summary?.ranks,
                groups: rssponse?.summary?.groups,
                //activeUsers: rssponse?.summary?.activeUsers,
                activeUsers: rssponse?.summary?.activeUserPercentage
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
          name: 'Sales',
          data: [10, 15, 20, 25, 30, 35]
        },
        {
          name: 'Support',
          data: [5, 8, 12, 18, 22, 25]
        },
        {
          name: 'IT',
          data: [2, 3, 8, 15, 15, 18]
        }],
        options: {
          colors: ['#FFB800', '#00E396', '#008FFB'],
          chart: {
            height: 250,
            type: 'line',
            toolbar: {
              show: false
            },
            zoom: {
              enabled: false
            }
          },
          grid: {
            show: true,
            borderColor: '#f1f1f1',
            strokeDashArray: 0,
            position: 'back'
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth'
          },
          legend: {
            show: true,
            position: 'bottom',
            horizontalAlign: 'center',
            offsetY: 8,
            itemMargin: {
              horizontal: 16
            },
            markers: {
              width: 16,
              height: 16,
              radius: 2,
              offsetX: 0
            },
            onItemClick: {
              toggleDataSeries: true
            },
            onItemHover: {
              highlightDataSeries: true
            }
          },
          xaxis: {
            type: 'category',
            
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
          },
          yaxis: {
            show: true,
            title: {
              text: 'Users'
            }
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


    const [ActiveInactiveChart, setActiveInactiveChart] = React.useState<{
      series: {name: string, data: number[]}[];
      options: any;
  }>({
      series: [
        {
          name: "Active",
          data: [44, 55, 41, 17, 15, 34]
        },
        {
          name: "Inactive",
          data: [17, 15, 41, 55, 44, 34]
        }
      ],
      options: {
        chart: {
          type: 'area',
          toolbar: {
            show: false
          }
        },
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May','Jun'],
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



  const [showUserModal, setShowUserModal] = React.useState(false);
  const [selectedUsers, setSelectedUsers] = React.useState<Array<{
    name: string;
    extension: string;
    lastLogin: string;
  }>>([]);

  const [FailedLoginAttemptsChart, setFailedLoginAttemptsChart] = React.useState<{
    series: {name: string, data: number[], color?: string}[];
    options: any;
  }>({
    series: [
      {
        name: 'Successful Login',
        data: [30, 25, 35, 28, 32, 27, 29],
        color: '#28a745' // Green
      },
      {
        name: 'Failed Login',
        data: [15, 18, 12, 14, 16, 13, 15],
        color: '#dc3545' // Yellow
      }
      
    ],
    options: {
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: false
        },
        fontFamily: 'inherit',
        background: 'transparent',
        // events: {
        //   dataPointSelection: (event: any, chartContext: any, config: any) => {
        //     const dayIndex = config.dataPointIndex;
        //     const seriesIndex = config.seriesIndex;
        //     const userTypes = ['Active', 'Idle', 'Dormant'];
        //     const userType = userTypes[seriesIndex];
            
        //     // Mock data - replace with actual API call
        //     const mockUsers = [
        //       { name: 'John Doe', extension: '1001', lastLogin: '2025-09-29 10:30:00' },
        //       { name: 'Jane Smith', extension: '1002', lastLogin: '2025-09-29 09:15:00' },
        //       { name: 'Bob Johnson', extension: '1003', lastLogin: '2025-09-29 08:45:00' }
        //     ];
            
        //     setSelectedUsers(mockUsers);
        //     setShowUserModal(true);
        //   }
        // }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 0,
          borderRadiusApplication: 'end'
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toString();
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        title: {
          text: ''
        }
      },
      yaxis: {
        title: {
          text: 'Number of Login',
         fontWeight: 'normal'
        }
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return val + " users"
          }
        }
      },
      legend: {
        position: 'bottom'
      }
    },
});


  const [userActivityChart, setUserActivityChart] = React.useState<{
   series: {name: string, data: number[], color?: string}[];
   options: any;
 }>({
   series: [
     {
       name: 'New Users',
       data: [5, 9, 10, 7, 10, 6],
       color: '#28a745' // Green
     },
     {
       name: 'Deactivated Users',
       data: [2, 4, 3, 5, 6, 3],
       color: '#dc3545' // Red
     }
   ],
   options: {
     chart: {
       type: 'bar',
       height: 350,
       toolbar: {
         show: false
       },
       fontFamily: 'inherit',
       background: 'transparent',
      //  events: {
      //    dataPointSelection: (event: any, chartContext: any, config: any) => {
      //      const monthIndex = config.dataPointIndex;
      //      const seriesIndex = config.seriesIndex;
      //      const userTypes = ['New', 'Deactivated'];
      //      const userType = userTypes[seriesIndex];
           
      //      // Mock data - replace with actual API call
      //      const mockUsers = [
      //        { name: 'John Doe', extension: '1001', lastLogin: '2025-09-29 10:30:00' },
      //        { name: 'Jane Smith', extension: '1002', lastLogin: '2025-09-29 09:15:00' },
      //        { name: 'Bob Johnson', extension: '1003', lastLogin: '2025-09-29 08:45:00' }
      //      ];
           
      //      setSelectedUsers(mockUsers);
      //      setShowUserModal(true);
      //    }
      //  }
     },
     plotOptions: {
       bar: {
         horizontal: false,
         columnWidth: '55%',
         borderRadius: 0
       },
     },
     dataLabels: {
       enabled: false,
       formatter: function (val: number) {
         return val.toString();
       }
     },
     stroke: {
       show: true,
       width: 2,
       colors: ['transparent']
     },
     grid: {
       borderColor: '#f1f1f1',
       strokeDashArray: 0,
       xaxis: {
         lines: {
           show: false
         }
       },
       yaxis: {
         lines: {
           show: true
         }
       }
     },
     xaxis: {
       categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
       title: {
         text: ''
       },
       axisBorder: {
         show: false
       },
       axisTicks: {
         show: false
       }
     },
       yaxis: {
         title: {
           text: 'Number of Users',
           fontWeight: 'normal'
         }
     },
     tooltip: {
       y: {
         formatter: function(val: number) {
           return val + " users"
         }
       }
     },
     legend: {
       position: 'bottom'
     }
   },
});

const [departmentGrowthChart, setDepartmentGrowthChart] = React.useState<{
  series: {name: string, data: number[]}[];
  options: any;
}>({
  series: [{
    name: 'Sales',
    data: [44, 55, 41, 17, 15, 34]
  },
  {
    name: 'Role',
    data: [17, 15, 41, 55, 44, 34]
  }],
  options: {
    chart: {
      type: 'area',
      height: 350,
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
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    tooltip: {
      x: {
        format: 'dd/MM/yy HH:mm'
      },
    },
  },
});

const [userLocationChart, setUserLocationChart] = React.useState<{
  series: {name: string, data: number[]}[];
  options: any;
}>({
  series: [
    {
      name: 'Active Users',
      data: [120, 80, 60, 45, 30],
     
    }
  ],
  options: {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: 'inherit',
      background: 'transparent'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: '55%',
        borderRadius: 0,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: false,
      formatter: function (val: number) {
        return val.toString();
      },
      offsetX: 30,
      style: {
        fontWeight: 'normal'
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'],
      title: {
        text: 'Number of Users',
        fontWeight: 'normal'
      }
    },
    yaxis: {
      title: {
        text: '',
        fontWeight: 'normal'
      }
    },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 0,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val: number) {
          return val + " users"
        }
      }
    },
    legend: {
      show: true,
      position: 'bottom'
    }
  }
});

const [loginHeatMapChart, setLoginHeatMapChart] = React.useState<{
  series: {name: string, data: number[]}[];
  options: any;
}>({
  series: [
    {
      name: 'Monday',
      data: [2, 1, 0, 0, 0, 0, 3, 15, 25, 30, 28, 22, 18, 20, 25, 30, 35, 40, 38, 32, 28, 20, 15, 8]
    },
    {
      name: 'Tuesday',
      data: [1, 0, 0, 0, 0, 0, 5, 18, 28, 35, 32, 25, 20, 22, 28, 35, 42, 45, 40, 35, 30, 22, 18, 10]
    },
    {
      name: 'Wednesday',
      data: [2, 1, 0, 0, 0, 0, 4, 16, 26, 32, 30, 24, 19, 21, 26, 32, 38, 42, 38, 33, 28, 21, 16, 9]
    },
    {
      name: 'Thursday',
      data: [1, 0, 0, 0, 0, 0, 3, 14, 24, 30, 28, 22, 18, 20, 25, 30, 36, 40, 36, 31, 26, 19, 14, 7]
    },
    {
      name: 'Friday',
      data: [3, 2, 1, 0, 0, 0, 6, 20, 30, 38, 35, 28, 22, 25, 30, 38, 45, 50, 45, 38, 32, 25, 20, 12]
    },
    {
      name: 'Saturday',
      data: [8, 5, 3, 2, 1, 0, 2, 8, 15, 20, 18, 15, 12, 10, 8, 6, 4, 3, 2, 1, 0, 0, 0, 0]
    },
    {
      name: 'Sunday',
      data: [6, 4, 2, 1, 0, 0, 1, 5, 10, 15, 12, 10, 8, 6, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0]
    }
  ],
  options: {
    chart: {
      type: 'heatmap',
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: 'inherit',
      background: 'transparent',
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const monthIndex = config.dataPointIndex;
          const seriesIndex = config.seriesIndex;
          const userTypes = ['New', 'Deactivated'];
          const userType = userTypes[seriesIndex];
          
          // Mock data - replace with actual API call
          const mockUsers = [
            { name: 'John Doe', extension: '1001', lastLogin: '2025-09-29 10:30:00' },
            { name: 'Jane Smith', extension: '1002', lastLogin: '2025-09-29 09:15:00' },
            { name: 'Bob Johnson', extension: '1003', lastLogin: '2025-09-29 08:45:00' }
          ];
          
          setSelectedUsers(mockUsers);
          setShowUserModal(true);
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      position: 'bottom'
    },
    colors: ['#008FFB'],
    xaxis: {
      type: 'category',
      categories: [
        '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
        '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
        '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
      ],
      labels: {
        style: {
          fontSize: '10px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 0,
        enableShades: false,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 0,
              color: '#E8F4FD',
              name: 'No Activity'
            },
            {
              from: 1,
              to: 5,
              color: '#B3D9F2',
              name: 'Low Activity'
            },
            {
              from: 6,
              to: 15,
              color: '#66A3D9',
              name: 'Medium Activity'
            },
            {
              from: 16,
              to: 30,
              color: '#1A75D2',
              name: 'High Activity'
            },
            {
              from: 31,
              to: 100,
              color: '#004C99',
              name: 'Very High Activity'
            }
          ]
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val: number) {
          return val + ' logins';
        }
      }
    },
    // title: {
    //   text: 'Login Activity Heatmap',
    //   align: 'center',
    //   style: {
    //     fontSize: '14px'
    //   }
    // }
  }
});

// Function to generate realistic login heatmap data
const generateLoginHeatmapData = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = 24;
  
  return days.map(day => {
    const data = [];
    for (let hour = 0; hour < hours; hour++) {
      let loginCount = 0;
      
      // Business hours (8 AM - 6 PM) have higher activity
      if (hour >= 8 && hour <= 18) {
        // Weekdays have higher activity than weekends
        if (day === 'Saturday' || day === 'Sunday') {
          loginCount = Math.floor(Math.random() * 20) + 5; // 5-25 logins
        } else {
          loginCount = Math.floor(Math.random() * 40) + 20; // 20-60 logins
        }
        // Peak hours (9-11 AM and 2-4 PM) have even higher activity
        if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
          loginCount += Math.floor(Math.random() * 20) + 10; // Additional 10-30 logins
        }
      } else if (hour >= 6 && hour <= 7) {
        // Early morning (6-7 AM) - some early birds
        loginCount = Math.floor(Math.random() * 15) + 5;
      } else if (hour >= 19 && hour <= 22) {
        // Evening (7-10 PM) - some late workers
        loginCount = Math.floor(Math.random() * 10) + 2;
      } else {
        // Late night (11 PM - 5 AM) - minimal activity
        loginCount = Math.floor(Math.random() * 5);
      }
      
      data.push(loginCount);
    }
    
    return {
      name: day,
      data: data
    };
  });
};

// Update login heatmap data when component mounts
React.useEffect(() => {
  const heatmapData = generateLoginHeatmapData();
  setLoginHeatMapChart(prev => ({
    ...prev,
    series: heatmapData
  }));
}, []);








    const renderOverviewTab = () => (
        <>
           

            {/* <Row>
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
        </Row> */}

        {/* GSM Summary Cards */}
        <PageSummaryGrid cards={summaryCards} />
            
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
                    search={false}
                    tableStyle="table-style-2"
                />
            )}

            <Row className=" mt-3">
              
              <Col md={7} className="mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5>User Growth (Last 6 Months)</h5>
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
        </>
    );

    const renderInsightTab = () => (
        <React.Fragment>
            {/* GSM Summary Cards */}
        <PageSummaryGrid cards={summaryCards} />


        <Row>
          <Col md={4}>
            <div className="card">
              <div className="card-body">
                <h5>Active vs Inactive Users</h5>
                <ReactApexChart
              options={userActivityChart.options}
              series={userActivityChart.series}
              type="bar"
              height={300}
            />
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="card">
              <div className="card-body">
                <h5>Login Activity Breakdown</h5>
                <ReactApexChart
              options={FailedLoginAttemptsChart.options}
              series={FailedLoginAttemptsChart.series}
              type="bar"
              height={300}
            />
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="card">
              <div className="card-body">
                <h5>Department / Role Growth</h5>
                <ReactApexChart
              options={departmentGrowthChart.options}
              series={departmentGrowthChart.series}
              type="area"
              height={300}
            />
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={8}>
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Login Heat Map</h5>
                  {/* <Button 
                    size="sm" 
                    variant="outline-primary"
                    onClick={() => {
                      const heatmapData = generateLoginHeatmapData();
                      setLoginHeatMapChart(prev => ({
                        ...prev,
                        series: heatmapData
                      }));
                    }}
                  >
                    <i className="ph-duotone ph-arrow-clockwise me-1"></i>
                    Refresh
                  </Button> */}
                </div>
                <ReactApexChart
                  options={loginHeatMapChart.options}
                  series={loginHeatMapChart.series}
                  type="heatmap"
                  height={420}
                />
              </div>
            </div>
          </Col>

          <Col md={4}>

          <PageSummaryGrid cards={
            [
              {
                id: 'peak-activity',
                title: 'Peak Activity ',
                value: 100,
                description: 'Peak activity hours/day(s)',
                delay: 0.1,
                showAnimatedNumber: true,
                animationDuration: 1000,
                fontStyle: 'style-2'
              },
              {
                id: 'lowest-activity',
                title: 'Lowest Activity',
                value: 100,
                description: 'Lowest activity (hours/days)',
                delay: 0.1,
                showAnimatedNumber: true,
                animationDuration: 1000,
                fontStyle: 'style-2'
              },
              {
                id: 'weekend-activity',
                title: 'Total Weekend Login',
                value: 100,
                description: 'Total Weekend Logins',
                delay: 0.1,
                showAnimatedNumber: true,
                animationDuration: 1000,
                fontStyle: 'style-2'
              }
            ]
          } />






            <div className="card">
                <div className="card-body">
                  <h5>Active user location</h5>
                  <ReactApexChart
                    options={userLocationChart.options}
                    series={userLocationChart.series}
                    type="bar"
                    height={350}
                  />
                </div>
              </div>
          </Col>
        </Row>



        </React.Fragment>
    );

    return (
        <ProtectedRoute requiredPermissions={['view-users']}>
            <React.Fragment>
                <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/users" subTitle="Users" />
                <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title style-2">
                        {/* <div className="align-items-center row">
                            <div className="col-md-4">
                                <h2 className="mb-0 d-flex align-items-center">Overview</h2>
                            </div>
                            <div className="d-flex justify-content-end col-md-8">
                                <UsersFilters onFiltersChange={handleFiltersChange} onExport={handleExport} />
                            </div>
                        </div> */}
                        <Row className="d-flex justify-content-between align-items-center">
                    <Col md={3}>
                      
                      <h2 className="mb-0">Users Directory</h2>

                    </Col>


                    <Col md={9} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                        <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search users..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div>
                        <UsersFilters onFiltersChange={handleFiltersChange} onExport={handleExport}  />

                        {session?.user?.permissions?.includes('sync-ldap') && (
                            <Button variant="primary" size="sm" onClick={() => syncLdapUsers()}>Sync Users</Button>
                        )}

                        
                    </div>



                    </Col>
                  </Row>
                    </div>
                </Col>
            </Row>
                {/* Tabs Navigation */}
                <Row className="mb-3">
                    <Col md={12}>
                    <ul id="system-tabs" className="mb-3  nav nav-tabs" role="tablist">
                                            <li className="nav-item" role="presentation">
                                                <button
                                                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                                                    onClick={() => setActiveTab('overview')}
                                                    type="button"
                                                    role="tab"
                                                >
                                                    Overview
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button
                                                    className={`nav-link ${activeTab === 'insight' ? 'active' : ''}`}
                                                    onClick={() => setActiveTab('insight')}
                                                    type="button"
                                                    role="tab"
                                                >
                                                    Insight
                                                </button>
                                            </li>
                                        </ul>
                    </Col>
                </Row>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="tab-pane fade show active" role="tabpanel">
                            {renderOverviewTab()}
                        </div>
                    )}
                    {activeTab === 'insight' && (
                        <div className="tab-pane fade show active" role="tabpanel">
                            {renderInsightTab()}
                        </div>
                    )}
                </div>

                {/* User Details Modal */}
                <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>User Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Extension</th>
                                    <th>Last Login</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedUsers.map((user, index) => (
                                    <tr key={index}>
                                        <td>{user.name}</td>
                                        <td>{user.extension}</td>
                                        <td>{user.lastLogin}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowUserModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>



                <FormModal
                    show={showSyncLdapUsersModal}
                    onHide={handleCloseSyncLdapUsersModal}
                    title="Synced Users"
                    desc=""
                    formHtml={
                        loadingLdapUsers ? (
                            <p>Syncing users...</p>
                        ) : responseDataLdapUsers ? (
                            <table className="table table-bordered table-align-center">
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th>Total Users</th>
                                </tr>
                              </thead>
                                <tbody>
                                  <tr>
                                      <td>New</td>
                                      <td>{responseDataLdapUsers?.count_new_user}</td>
                                  </tr>
                                  <tr>
                                      <td>Updated</td>
                                      <td>{responseDataLdapUsers?.count_updated_user}</td>
                                  </tr>
                                  <tr>
                                      <td>Removed</td>
                                      <td>{responseDataLdapUsers?.count_removed_user}</td>
                                  </tr>
                                  <tr>
                                      <td>Errors</td>
                                      <td>{responseDataLdapUsers?.count_errors}</td>
                                  </tr>
                                </tbody>
                            </table>
                        ) : (
                            <></>
                        )
                    }
                    submitButtonText="Close"
                    cancelButtonText="Close"
                    onSubmit={handleCloseSyncLdapUsersModal}
                    ShowSubmitButton={false}
                    submitButtonVariant="primary"
                />
            </React.Fragment>
        </ProtectedRoute>
    );
};

Users.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Users;
