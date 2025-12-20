import React, { ReactElement, useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Row, Col, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg';
import imgStatus2 from '@assets/images/widget/img-status-2.svg';
import imgStatus3 from '@assets/images/widget/img-status-3.svg';
import imgStatus4 from '@assets/images/widget/img-status-4.svg';
import { GetCounterData, GetDashboardOverview, CompanyMonthlyInteraction, ComanyMobileUserStats, CompanyUserActivity, TopCompaniesByUserCount, AuditLogSummary, GetListCompanies } from '@utils/tms/analytics';
import moment from 'moment';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye, FiPlus, FiMaximize2 } from "react-icons/fi";

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CounterData {
    total_action_count: number;
    total_active_user_count: number;
    total_company_count: number;
    total_create_action_count: number;
    total_delete_action_count: number;
    total_mobile_user_count: number;
    total_non_admin_user_count: number;
    total_update_action_count: number;
    total_user_count: number;
}

interface ListCompanies {
    id: number;
    name: string;
}

interface DashboardOverview {
    create: number;
    update: number;
    delete: number;
    total_companies: number;
    total_users: number;
    mobile_users: number;
}

interface CompanuMobileUserStats {
    company_name: string;
    mobile_users: number;
    non_mobile_users: number;
    total_users: number;
}

interface MonthlyInteractionCompany {
    create: number;
    update: number;
    delete: number;
}
interface MonthlyInteraction {
    MonthlyInteractionCompany: MonthlyInteractionCompany;
}

// Raw API response interface (strings from API)
interface MonthlyInteractionCompanyRaw {
    create: string;
    update: string;
    delete: string;
}

// Helper function to convert string values to numbers
const convertStringToNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    return parseInt(value, 10) || 0;
};

// Helper function to transform raw API data to typed data
const transformMonthlyInteractionData = (rawData: Record<string, MonthlyInteractionCompanyRaw>): Record<string, MonthlyInteractionCompany> => {
    const transformed: Record<string, MonthlyInteractionCompany> = {};
    
    Object.entries(rawData).forEach(([companyName, data]) => {
        transformed[companyName] = {
            create: convertStringToNumber(data.create),
            update: convertStringToNumber(data.update),
            delete: convertStringToNumber(data.delete)
        };
    });
    
    return transformed;
};

const TmsDashboardOverview = React.memo(() => {
    const router = useRouter();
    // TMS auth has been removed - these values are set to defaults
    const isLoading = false;
    const isRefreshing = false;
    const isAuthenticated = false;
    const isValid = false;
    const [error, setError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalChart, setModalChart] = useState<{
        title: string;
        description: string;
        type: 'bar' | 'donut';
        options: any;
        series: any;
    } | null>(null);

    const [selectedMonth, setSelectedMonth] = useState<string>(moment().format('MM'));
    const [selectedYear, setSelectedYear] = useState<string>(moment().format('YYYY'));
    const [selectedDay, setSelectedDay] = useState<string>('30');
    const [selectedCompany, setSelectedCompany] = useState<string>('');

    const [counterData, setCounterData] = useState<CounterData>();
    const [listCompanies, setListCompanies] = useState<ListCompanies[]>([]);
    const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview>();
    const [companyMobileUserStats, setCompanyMobileUserStats] = useState<CompanuMobileUserStats[]>([]);
    const [monthlyInteractionData, setMonthlyInteractionData] = useState<Record<string, MonthlyInteractionCompany>>({});
   
    // Chart data states
    const [companyMonthlyInteractionChartData, setCompanyMonthlyInteractionChartData] = useState({
        series: [
            {
                name: "Create",
                data: [] as number[]
            },
            {
                name: "Update", 
                data: [] as number[]
            },
            {
                name: "Delete",
                data: [] as number[]
            }
        ],
        categories: [] as string[]
    });
    const [mobileUserChartData, setMobileUserChartData] = useState({
        series: [] as number[],
        labels: [] as string[]
    });
    const [userActivityChartData, setUserActivityChartData] = useState({
        series: [
            {
                name: "Active Users",
                data: [] as number[]
            },
            {
                name: "Inactive Users", 
                data: [] as number[]
            }
        ],
        categories: [] as string[]
    });
    const [topCompaniesChartData, setTopCompaniesChartData] = useState({
        series: [
            {
                name: "User Count",
                data: [] as number[]
            }
        ],
        categories: [] as string[]
    });
    const [auditLogChartData, setAuditLogChartData] = useState({
        series: [
            {
                name: "Create",
                data: [] as number[]
            },
            {
                name: "Update", 
                data: [] as number[]
            },
            {
                name: "Delete",
                data: [] as number[]
            }
        ],
        categories: [] as string[]
    });

    // Handle session validation
    useEffect(() => {
        if (!isLoading && !isRefreshing) {
           

            getListCompanies();
            getCounterData();
            getDashboardOverview();
            getCompanyMonthlyInteraction();
            getComanyMobileUserStats();
            getCompanyUserActivity();
            getTopCompaniesByUserCount();
            getAuditLogSummary();
           
        }
    }, [isLoading, isRefreshing, isAuthenticated, isValid, router]);

    const getListCompanies = async () => {
        try {
            const data = await GetListCompanies();
           
            if (Array.isArray(data) && data.length > 0) {
                console.log("Setting companies:", data);
                setListCompanies(data);
            } else {
                console.warn("No companies data received or empty array");
               
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
            // Set some dummy data for testing
           
        }
    };

    const getCounterData = async () => {
        const data = await GetCounterData();
        console.log("Counter Data", data);
        setCounterData(data);
    };
    const getDashboardOverview = async () => {
        const data = await GetDashboardOverview({company_id: selectedCompany});
        console.log("Dashboard Overview", data);
        setDashboardOverview(data);
    };
    const getCompanyMonthlyInteraction = async () => {
        const rawData = await CompanyMonthlyInteraction({company_id: selectedCompany,month: selectedMonth,year: selectedYear});
        console.log("Company Monthly Interaction (Raw)", rawData);
        
        // Transform string values to numbers
        const transformedData = transformMonthlyInteractionData(rawData);
        console.log("Company Monthly Interaction (Transformed)", transformedData);
        
        // Store the transformed data in state
        setMonthlyInteractionData(transformedData);
        
        // Process data for chart - prepare data for bar chart by company
        const companies = Object.keys(transformedData);
        const createData = companies.map(company => transformedData[company].create);
        const updateData = companies.map(company => transformedData[company].update);
        const deleteData = companies.map(company => transformedData[company].delete);
        
        setCompanyMonthlyInteractionChartData({
            series: [
                {
                    name: "Create",
                    data: createData
                },
                {
                    name: "Update", 
                    data: updateData
                },
                {
                    name: "Delete",
                    data: deleteData
                }
            ],
            categories: companies
        });
    };
    const getComanyMobileUserStats = async () => {
        const data = await ComanyMobileUserStats({company_id: selectedCompany});
        console.log("Company Mobile User Stats", data);
        setCompanyMobileUserStats(data);
        
        // Process data for mobile user chart
        if (data && data.length > 0) {
            const totalMobileUsers = data.reduce((sum: number, company: CompanuMobileUserStats) => {
                const mobileUsers = parseInt(company.mobile_users.toString(), 10) || 0;
                return sum + mobileUsers;
            }, 0);
            const totalNonMobileUsers = data.reduce((sum: number, company: CompanuMobileUserStats) => {
                const nonMobileUsers = parseInt(company.non_mobile_users.toString(), 10) || 0;
                return sum + nonMobileUsers;
            }, 0);
            
            console.log("Mobile User Chart Data:", { totalMobileUsers, totalNonMobileUsers });
            
            setMobileUserChartData({
                series: [totalMobileUsers, totalNonMobileUsers],
                labels: ["Mobile Users", "Non-Mobile Users"]
            });
        }
    };
    const getCompanyUserActivity = async () => {
        const data = await CompanyUserActivity({company_id: selectedCompany,days: selectedDay});
        console.log("Company User Activity", data);
        
        // Process data for user activity chart
        if (data && data.length > 0) {
            const companies = data.map((company: any) => company.company_name);
            const activeUsersData = data.map((company: any) => parseInt(company.active_users.toString(), 10) || 0);
            const inactiveUsersData = data.map((company: any) => parseInt(company.inactive_users.toString(), 10) || 0);
            
            console.log("User Activity Chart Data:", { companies, activeUsersData, inactiveUsersData });
            
            setUserActivityChartData({
                series: [
                    {
                        name: "Active Users",
                        data: activeUsersData
                    },
                    {
                        name: "Inactive Users", 
                        data: inactiveUsersData
                    }
                ],
                categories: companies
            });
        }
    };
    const getTopCompaniesByUserCount = async () => {
        const data = await TopCompaniesByUserCount({company_id: selectedCompany,limit: 10});
        console.log("Top Companies By User Count", data);
        
        // Process data for top companies chart
        if (data && data.length > 0) {
            const companies = data.map((company: any) => company.name);
            const userCounts = data.map((company: any) => parseInt(company.user_count.toString(), 10) || 0);
            
            console.log("Top Companies Chart Data:", { companies, userCounts });
            
            setTopCompaniesChartData({
                series: [
                    {
                        name: "User Count",
                        data: userCounts
                    }
                ],
                categories: companies
            });
        }
    };
    const getAuditLogSummary = async () => {
        const data = await AuditLogSummary({company_id: selectedCompany,days: selectedDay});
        console.log("Audit Log Summary", data);
        
        // Process data for audit log chart
        if (data && data.length > 0) {
            const companies = data.map((company: any) => company.company_name);
            const createCounts = data.map((company: any) => parseInt(company.create_count.toString(), 10) || 0);
            const updateCounts = data.map((company: any) => parseInt(company.update_count.toString(), 10) || 0);
            const deleteCounts = data.map((company: any) => parseInt(company.delete_count.toString(), 10) || 0);
            
            console.log("Audit Log Chart Data:", { companies, createCounts, updateCounts, deleteCounts });
            
            setAuditLogChartData({
                series: [
                    {
                        name: "Create",
                        data: createCounts
                    },
                    {
                        name: "Update", 
                        data: updateCounts
                    },
                    {
                        name: "Delete",
                        data: deleteCounts
                    }
                ],
                categories: companies
            });
        }
    };

    const handleSearch = async () => {
        setIsSearching(true);
        setError(null);
        
        try {
            // Refresh all data except companies and counters
            await Promise.all([
                getDashboardOverview(),
                getCompanyMonthlyInteraction(),
                getComanyMobileUserStats(),
                getCompanyUserActivity(),
                getTopCompaniesByUserCount(),
                getAuditLogSummary()
            ]);
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            setError('Failed to refresh data. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleExpandChart = (chartData: any) => {
        setModalChart(chartData);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalChart(null);
    };

    // Helper function to convert text to title case
    const toTitleCase = (str: string) => {
        return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    // Show loading state while checking session or refreshing
    if (isLoading || isRefreshing) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">{isRefreshing ? 'Refreshing Automation session...' : 'Loading Automation session...'}</p>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <PageHeader
                title="Automation Dashboard"
                buttons={
                    <>
                    </>
                }
            />

            <PageSummaryGrid cards={
                        [
                           {
                            id: 'total-users',
                            title: 'Total Users',
                            value: counterData?.total_user_count || 0,
                            description: 'Total users in the system'
                           },
                        //    {
                        //     id: 'total-companies',
                        //     title: 'Total Companies',
                        //     value: counterData?.total_company_count || 0,
                        //     description: 'Total companies in the system'
                        //    },
                           {
                            id: 'total-non-admin-users',
                            title: 'Total Non Admin Users',
                            value: counterData?.total_non_admin_user_count || 0,
                            description: 'Total non admin users in the system'
                           },
                           {
                            id: 'total-active-users',
                            title: 'Total Active Users',
                            value: counterData?.total_active_user_count || 0,
                            description: 'Total active users in the system'
                           },
                           {
                            id: 'total-mobile-users',
                            title: 'Total Mobile Users',
                            value: counterData?.total_mobile_user_count || 0,
                            description: 'Total mobile users in the system'
                           },
                           {
                            id: 'total-action-count',
                            title: 'Total Actions',
                            value: counterData?.total_action_count || 0,
                            description: 'Total actions in the system'
                           },
                           {
                            id: 'total-delete-action-count',
                            title: 'Total Delete Actions',
                            value: counterData?.total_delete_action_count || 0,
                            description: 'Total delete actions in the system'
                           },
                           {
                            id: 'total-create-actions',
                            title: 'Total Create Actions',
                            value: counterData?.total_create_action_count || 0,
                            description: 'Total create actions in the system'
                           },
                           {
                            id: 'total-update-actions',
                            title: 'Total Update Actions',
                            value: counterData?.total_update_action_count || 0,
                            description: 'Total update actions in the system'
                           }
                        ]
                    } />

            {/* Company Analytics Overview Form */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h4>Company Analytics Overview</h4>
                            <p className="text-muted mb-0">Monitor company-wise user interactions, mobile usage, and activity trends</p>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                
                                <Col md={3}>
                                    <div className="mb-3">
                                        <label htmlFor="yearSelect" className="form-label">Year</label>
                                        <select 
                                            className="form-select" 
                                            id="yearSelect"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                        >
                                            {Array.from({ length: 5 }, (_, i) => {
                                                const year = new Date().getFullYear() - i;
                                                return (
                                                    <option key={year} value={year.toString()}>
                                                        {year}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="mb-3">
                                        <label htmlFor="monthSelect" className="form-label">Month</label>
                                        <select 
                                            className="form-select" 
                                            id="monthSelect"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                        >
                                            <option value="01">January</option>
                                            <option value="02">February</option>
                                            <option value="03">March</option>
                                            <option value="04">April</option>
                                            <option value="05">May</option>
                                            <option value="06">June</option>
                                            <option value="07">July</option>
                                            <option value="08">August</option>
                                            <option value="09">September</option>
                                            <option value="10">October</option>
                                            <option value="11">November</option>
                                            <option value="12">December</option>
                                        </select>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="mb-3">
                                        <label htmlFor="activityDaysSelect" className="form-label">Activity Days</label>
                                        <select 
                                            className="form-select" 
                                            id="activityDaysSelect"
                                            value={selectedDay}
                                            onChange={(e) => setSelectedDay(e.target.value)}
                                        >
                                            <option value="">Select Activity Period</option>
                                            <option value="7">Last 7 days</option>
                                            <option value="30">Last 30 days</option>
                                            <option value="90">Last 90 days</option>
                                        </select>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="mb-3">
                                        <label className="form-label">&nbsp;</label>
                                        <button 
                                            className="app-button btn text-center btn-primary d-block w-100"
                                            onClick={handleSearch}
                                            disabled={isSearching}
                                        >
                                            {isSearching ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Searching...
                                                </>
                                            ) : (
                                                'Search'
                                            )}
                                        </button>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Company Monthly Interaction Chart */}
            {!isSearching && (
                <>
 
<Row className="mb-4">
                    <Col lg={8}>
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0 app-title-heading">Company Monthly Interactions</h5>
                                    <p className="text-muted mb-0">Create, Update, and Delete actions by company</p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="app-button"
                                    onClick={() => handleExpandChart({
                                        title: "Company Monthly Interactions",
                                        description: "Create, Update, and Delete actions by company",
                                        type: "bar",
                                        options: {
                                            chart: {
                                                height: 600,
                                                type: "bar",
                                                toolbar: {
                                                    show: false
                                                }
                                            },
                                            plotOptions: {
                                                bar: {
                                                    horizontal: false,
                                                    columnWidth: "55%",
                                                },
                                            },
                                            dataLabels: {
                                                enabled: false,
                                            },
                                            colors: ["#1DE9B6", "#04A9F5", "#3EBFEA"],
                                            stroke: {
                                                show: true,
                                                width: 2,
                                                colors: ["transparent"],
                                            },
                                            xaxis: {
                                                categories: companyMonthlyInteractionChartData.categories.map(category => toTitleCase(category)),
                                            },
                                            fill: {
                                                opacity: 1,
                                            },
                                            tooltip: {
                                                y: {
                                                    formatter: function (val: any) {
                                                        return val + " actions";
                                                    },
                                                },
                                            },
                                            legend: {
                                                position: "bottom",
                                                horizontalAlign: "center",
                                            },
                                        },
                                        series: companyMonthlyInteractionChartData.series
                                    })}
                                >
                                    <FiMaximize2 className="me-1" />
                                    Expand
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                {companyMonthlyInteractionChartData.categories.length > 0 ? (
                                    <ReactApexChart
                                        options={{
                                            chart: {
                                                height: 400,
                                                type: "bar",
                                                toolbar: {
                                                    show: false
                                                }
                                            },
                                        plotOptions: {
                                            bar: {
                                                horizontal: false,
                                                columnWidth: "55%",
                                            },
                                        },
                                        dataLabels: {
                                            enabled: false,
                                        },
                                        colors: ["#1DE9B6", "#04A9F5", "#3EBFEA"],
                                        stroke: {
                                            show: true,
                                            width: 2,
                                            colors: ["transparent"],
                                        },
                                            xaxis: {
                                                categories: companyMonthlyInteractionChartData.categories.map(category => toTitleCase(category)),
                                            },
                                        
                                        fill: {
                                            opacity: 1,
                                        },
                                        tooltip: {
                                            y: {
                                                formatter: function (val: any) {
                                                    return val + " actions";
                                                },
                                            },
                                        },
                                        legend: {
                                            position: "bottom",
                                            horizontalAlign: "center",
                                        },
                                    }}
                                        series={companyMonthlyInteractionChartData.series}
                                        type="bar"
                                        height={350}
                                    />
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No monthly interaction data available</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                     <Col lg={4}>
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0 app-title-heading">Mobile User Statistics</h5>
                                    <p className="text-muted mb-0">Mobile vs Non-Mobile Users</p>
                                </div>
                                <Button
                                    variant="primary"
                                    className="app-button"
                                    size="sm"
                                    onClick={() => handleExpandChart({
                                        title: "Mobile User Statistics",
                                        description: "Mobile vs Non-Mobile Users",
                                        type: "donut",
                                        options: {
                                            chart: {
                                                height: 600,
                                                type: "donut",
                                                toolbar: {
                                                    show: false
                                                }
                                            },
                                            colors: ["#1DE9B6", "#04A9F5"],
                                            labels: mobileUserChartData.labels,
                                            legend: {
                                                position: "bottom",
                                                horizontalAlign: "center",
                                            },
                                            plotOptions: {
                                                pie: {
                                                    donut: {
                                                        size: "70%",
                                                    },
                                                },
                                            },
                                            tooltip: {
                                                y: {
                                                    formatter: function (val: any) {
                                                        return val + " users";
                                                    },
                                                },
                                            },
                                        },
                                        series: mobileUserChartData.series
                                    })}
                                >
                                    <FiMaximize2 className="me-1" />
                                    Expand
                                </Button>
                            </Card.Header>
                             <Card.Body>
                                 {mobileUserChartData.series.length > 0 ? (
                                     <ReactApexChart
                                         dir="ltr"
                                         className="apex-charts"
                                        options={{
                                            chart: {
                                                height: 400,
                                                type: "donut",
                                                toolbar: {
                                                    show: false
                                                }
                                            },
                                             colors: ["#04A9F5", "#F4C22B"],
                                             legend: {
                                                 show: true,
                                                 position: "bottom",
                                                 horizontalAlign: "center",
                                             },
                                             labels: mobileUserChartData.labels,
                                             plotOptions: {
                                                 pie: {
                                                     donut: {
                                                         size: "65%",
                                                         labels: {
                                                             show: true,
                                                             name: {
                                                                 show: true,
                                                                 fontSize: "14px",
                                                                 fontFamily: "inherit",
                                                                 color: "#6c757d",
                                                             },
                                                             value: {
                                                                 show: true,
                                                                 fontSize: "16px",
                                                                 fontFamily: "inherit",
                                                                 color: "#495057",
                                                                 formatter: function (
                                                                     val: any,
                                                                 ) {
                                                                     return val;
                                                                 },
                                                             },
                                                             total: {
                                                                 show: true,
                                                                 label: "Total Users",
                                                                 fontSize: "16px",
                                                                 fontFamily: "inherit",
                                                                 color: "#495057",
                                                                 formatter: function (
                                                                     w: any,
                                                                 ) {
                                                                     return w.globals.seriesTotals.reduce(
                                                                         (
                                                                             a: number,
                                                                             b: number,
                                                                         ) => a + b,
                                                                         0,
                                                                     );
                                                                 },
                                                             },
                                                         },
                                                     },
                                                 },
                                             },
                                             dataLabels: {
                                                 enabled: true,
                                                 dropShadow: {
                                                     enabled: false,
                                                 },
                                                 formatter: function (
                                                     val: any,
                                                     opts: any,
                                                 ) {
                                                     return opts.w.globals.labels[
                                                         opts.seriesIndex
                                                     ];
                                                 },
                                             },
                                             responsive: [
                                                 {
                                                     breakpoint: 480,
                                                     options: {
                                                         legend: {
                                                             position: "bottom",
                                                         },
                                                     },
                                                 },
                                             ],
                                         }}
                                         series={mobileUserChartData.series}
                                         type="donut"
                                         height={350}
                                     />
                                 ) : (
                                     <div className="text-center py-4">
                                         <p className="text-muted">No mobile user data available</p>
                                     </div>
                                 )}
                             </Card.Body>
                         </Card>
                     </Col>
                </Row>

                 {/* <Row className="mb-4">  
                     <Col md={12}>   
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0 app-title-heading">User Activity by Company</h5>
                                    <p className="text-muted mb-0">Active vs Inactive users by company</p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="app-button"
                                    onClick={() => handleExpandChart({
                                        title: "User Activity by Company",
                                        description: "Active vs Inactive users by company",
                                        type: "bar",
                                        options: {
                                            chart: {
                                                height: 600,
                                                type: "bar",
                                                toolbar: {
                                                    show: false
                                                }
                                            },
                                            plotOptions: {
                                                bar: {
                                                    horizontal: false,
                                                    columnWidth: "55%",
                                                },
                                            },
                                            dataLabels: {
                                                enabled: false,
                                            },
                                            colors: ["#1DE9B6", "#04A9F5"],
                                            stroke: {
                                                show: true,
                                                width: 2,
                                                colors: ["transparent"],
                                            },
                                            xaxis: {
                                                categories: userActivityChartData.categories.map(category => toTitleCase(category)),
                                            },
                                            fill: {
                                                opacity: 1,
                                            },
                                            tooltip: {
                                                y: {
                                                    formatter: function (val: any) {
                                                        return val + " users";
                                                    },
                                                },
                                            },
                                            legend: {
                                                position: "bottom",
                                                horizontalAlign: "center",
                                            },
                                        },
                                        series: userActivityChartData.series
                                    })}
                                >
                                    <FiMaximize2 className="me-1" />
                                    Expand
                                </Button>
                            </Card.Header>
                             <Card.Body>
                                 {userActivityChartData.categories.length > 0 ? (
                                     <ReactApexChart
                                         options={{
                                             chart: {
                                                 height: 400,
                                                 type: "bar",
                                                 toolbar: {
                                                     show: false
                                                 }
                                             },
                                             plotOptions: {
                                                 bar: {
                                                     horizontal: false,
                                                     columnWidth: "55%",
                                                 },
                                             },
                                             dataLabels: {
                                                 enabled: false,
                                             },
                                             colors: ["#1DE9B6", "#F44236"],
                                             stroke: {
                                                 show: true,
                                                 width: 2,
                                                 colors: ["transparent"],
                                             },
                                             xaxis: {
                                                 categories: userActivityChartData.categories.map(category => toTitleCase(category)),
                                             },
                                             yaxis: {
                                                 title: {
                                                     text: "User Count",
                                                 },
                                             },
                                             fill: {
                                                 opacity: 1,
                                             },
                                             tooltip: {
                                                 y: {
                                                     formatter: function (val: any) {
                                                         return val + " users";
                                                     },
                                                 },
                                             },
                                             legend: {
                                                 show: true,
                                                 position: "bottom",
                                                 horizontalAlign: "center",
                                             },
                                         }}
                                         series={userActivityChartData.series}
                                         type="bar"
                                         height={350}
                                     />
                                 ) : (
                                     <div className="text-center py-4">
                                         <p className="text-muted">No user activity data available</p>
                                     </div>
                                 )}
                             </Card.Body>
                         </Card>
                     </Col>
                 </Row>
                  <Row className="mb-4"> 
                      <Col md={12}>
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0 app-title-heading">Top Companies by User Count</h5>
                                    <p className="text-muted mb-0">Companies ranked by total user count</p>
                                </div>
                                <Button
                                    variant="primary"
                                    className="app-button"
                                    size="sm"
                                    onClick={() => handleExpandChart({
                                        title: "Top Companies by User Count",
                                        description: "Companies ranked by total user count",
                                        type: "bar",
                                        options: {
                                            chart: {
                                                height: 600,
                                                type: "bar",
                                                toolbar: {
                                                    show: false
                                                }
                                            },
                                            plotOptions: {
                                                bar: {
                                                    horizontal: false,
                                                    columnWidth: "55%",
                                                },
                                            },
                                            dataLabels: {
                                                enabled: false,
                                            },
                                            colors: ["#1DE9B6"],
                                            stroke: {
                                                show: true,
                                                width: 2,
                                                colors: ["transparent"],
                                            },
                                            xaxis: {
                                                categories: topCompaniesChartData.categories.map(category => toTitleCase(category)),
                                            },
                                            fill: {
                                                opacity: 1,
                                            },
                                            tooltip: {
                                                y: {
                                                    formatter: function (val: any) {
                                                        return val + " users";
                                                    },
                                                },
                                            },
                                            legend: {
                                                position: "bottom",
                                                horizontalAlign: "center",
                                            },
                                        },
                                        series: topCompaniesChartData.series
                                    })}
                                >
                                    <FiMaximize2 className="me-1" />
                                    Expand
                                </Button>
                            </Card.Header>
                             <Card.Body>
                                 {topCompaniesChartData.categories.length > 0 ? (
                                     <ReactApexChart
                                         options={{
                                             chart: {
                                                 height: 400,
                                                 type: "bar",
                                                 toolbar: {
                                                     show: false
                                                 }
                                             },
                                             plotOptions: {
                                                 bar: {
                                                     horizontal: false,
                                                     columnWidth: "55%",
                                                 },
                                             },
                                             dataLabels: {
                                                 enabled: false,
                                             },
                                             colors: ["#9C27B0"],
                                             stroke: {
                                                 show: true,
                                                 width: 2,
                                                 colors: ["transparent"],
                                             },
                                             xaxis: {
                                                 categories: topCompaniesChartData.categories.map(category => toTitleCase(category)),
                                             },
                                             yaxis: {
                                                 title: {
                                                     text: "User Count",
                                                 },
                                             },
                                             fill: {
                                                 opacity: 1,
                                             },
                                             tooltip: {
                                                 y: {
                                                     formatter: function (val: any) {
                                                         return val + " users";
                                                     },
                                                 },
                                             },
                                             legend: {
                                                 show: true,
                                                 position: "bottom",
                                                 horizontalAlign: "center",
                                             },
                                         }}
                                         series={topCompaniesChartData.series}
                                         type="bar"
                                         height={350}
                                     />
                                 ) : (
                                     <div className="text-center py-4">
                                         <p className="text-muted">No top companies data available</p>
                                     </div>
                                 )}
                             </Card.Body>
                         </Card>
                      </Col>
                  </Row>


                   <Row className="mb-4">
                      <Col md={12}>
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0 app-title-heading">Recent Activity Summary (Last {selectedDay} Days)</h5>
                                    <p className="text-muted mb-0">Create, Update, and Delete actions by company</p>
                                </div>
                                <Button
                                    variant="primary"
                                    className="app-button"
                                    size="sm"
                                    onClick={() => handleExpandChart({
                                        title: `Recent Activity Summary (Last ${selectedDay} Days)`,
                                        description: "Create, Update, and Delete actions by company",
                                        type: "bar",
                                        options: {
                                            chart: {
                                                height: 600,
                                                type: "bar",
                                                toolbar: {
                                                    show: false
                                                }
                                            },
                                            plotOptions: {
                                                bar: {
                                                    horizontal: false,
                                                    columnWidth: "55%",
                                                },
                                            },
                                            dataLabels: {
                                                enabled: false,
                                            },
                                            colors: ["#1DE9B6", "#04A9F5", "#3EBFEA"],
                                            stroke: {
                                                show: true,
                                                width: 2,
                                                colors: ["transparent"],
                                            },
                                            xaxis: {
                                                categories: auditLogChartData.categories.map(category => toTitleCase(category)),
                                            },
                                            fill: {
                                                opacity: 1,
                                            },
                                            tooltip: {
                                                y: {
                                                    formatter: function (val: any) {
                                                        return val + " actions";
                                                    },
                                                },
                                            },
                                            legend: {
                                                position: "bottom",
                                                horizontalAlign: "center",
                                            },
                                        },
                                        series: auditLogChartData.series
                                    })}
                                >
                                    <FiMaximize2 className="me-1" />
                                    Expand
                                </Button>
                            </Card.Header>
                             <Card.Body>
                                 {auditLogChartData.categories.length > 0 ? (
                                     <ReactApexChart
                                         options={{
                                             chart: {
                                                 height: 400,
                                                 type: "bar",
                                                 toolbar: {
                                                     show: false
                                                 }
                                             },
                                             plotOptions: {
                                                 bar: {
                                                     horizontal: false,
                                                     columnWidth: "55%",
                                                 },
                                             },
                                             dataLabels: {
                                                 enabled: false,
                                             },
                                             colors: ["#1DE9B6", "#04A9F5", "#F44236"],
                                             stroke: {
                                                 show: true,
                                                 width: 2,
                                                 colors: ["transparent"],
                                             },
                                             xaxis: {
                                                 categories: auditLogChartData.categories.map(category => toTitleCase(category)),
                                             },
                                             yaxis: {
                                                 title: {
                                                     text: "Action Count",
                                                 },
                                             },
                                             fill: {
                                                 opacity: 1,
                                             },
                                             tooltip: {
                                                 y: {
                                                     formatter: function (val: any) {
                                                         return val + " actions";
                                                     },
                                                 },
                                             },
                                             legend: {
                                                 position: "bottom",
                                                 horizontalAlign: "center",
                                             },
                                         }}
                                         series={auditLogChartData.series}
                                         type="bar"
                                         height={350}
                                     />
                                 ) : (
                                     <div className="text-center py-4">
                                         <p className="text-muted">No audit log data available</p>
                                     </div>
                                 )}
                             </Card.Body>
                         </Card>
                        
                      </Col>
                   </Row> */}
                  
                
                </>
            )}

            {error && (
                <Row className="mb-4">
                    <Col md={12}>
                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    </Col>
                </Row>
            )}

            {/* Chart Expansion Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalChart?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted mb-3">{modalChart?.description}</p>
                    {modalChart && (
                        <ReactApexChart
                            options={modalChart.options}
                            series={modalChart.series}
                            type={modalChart.type}
                            height={600}
                        />
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

        </React.Fragment>
    );
});

TmsDashboardOverview.displayName = 'TmsDashboardOverview';

export default TmsDashboardOverview;
