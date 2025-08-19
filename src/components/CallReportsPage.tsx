import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListCallLogs, ExportCallLogs } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row, Tab, Tabs } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import CallLogsFilters from '@components/filters/CallLogsFilters';
import AnimatedNumber from '@components/AnimatedNumber';
import ChartBar from '@components/ChartBar';
import ChartDonut from '@components/ChartDonut';
import StatCard from '@components/StatCard';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import { motion, AnimatePresence } from "framer-motion";
import { easeInOut, easeOut, easeIn } from "framer-motion";
import moment from 'moment';

interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration:number;
  avg_duration:number;
  avg_ring_time:number;
}

interface ChartData {
  country: string[];

  answered_calls: number[];
  unanswered_calls: number[];
  total_calls: number[];

  max_ring_time: number[];
  avg_ring_time: number[];
  min_ring_time: number[];

  min_cost: number[];
  avg_cost: number[];
  max_cost: number[];

  min_duration: number[];
  avg_duration: number[];
  max_duration: number[];
}

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export type ReportType = 'stats' | 'trend' | 'incoming';
export type GroupingType = 'extension' | 'department' | 'country';

interface CallReportsPageProps {
  reportType: ReportType;
  groupingType: GroupingType;
  listEndpoint: string;
  chartEndpoint: string;
  reportTypeParam: string;
  chartReportTypeParam: string;
  breadcrumbTitle: string;
}

const CallReportsPage: React.FC<CallReportsPageProps> = ({
  reportType,
  groupingType,
  listEndpoint,
  chartEndpoint,
  reportTypeParam,
  chartReportTypeParam,
  breadcrumbTitle
}) => {
    const { data:session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('calls_chart');

    // Animation variants for tab transitions
    const tabVariants = {
        hidden: { 
            opacity: 0, 
            x: 20,
            scale: 0.95
        },
        visible: { 
            opacity: 1, 
            x: 0,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: easeOut
            }
        },
        exit: { 
            opacity: 0, 
            x: -20,
            scale: 0.95,
            transition: {
                duration: 0.2,
                ease: easeIn
            }
        }
    };

    const columns: Column[] = [
        { key: 'Answered', name: 'Answered', selector: (row: any) => row.Answered, sortable: true },
        { key: 'AvgCost', name: 'Avg Cost', selector: (row: any) => row.AvgCost, sortable: true },
        { key: 'AvgDuration', name: 'Avg Duration', selector: (row: any) => row.AvgDuration, sortable: true },
        { key: 'AvgRingTime', name: 'Avg Ring Time', selector: (row: any) => row.AvgRingTime, sortable: true },
        { key: 'Calls', name: 'Calls', selector: (row: any) => row.Calls, sortable: true },
        { key: 'Cost', name: 'Cost', selector: (row: any) => row.Cost, sortable: true },
        { key: 'Duration', name: 'Duration', selector: (row: any) => row.Duration, sortable: true },
        { key: 'Missed', name: 'Missed', selector: (row: any) => row.Missed, sortable: true },
        { key: 'RingTime', name: 'Ring Time', selector: (row: any) => row.RingTime, sortable: true },
        { key: 'Unanswered', name: 'Unanswered', selector: (row: any) => row.Unanswered, sortable: true },
    ];

    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
    const [filtersReady, setFiltersReady] = useState(false);
    const [summary, setSummary] = useState<Summary>({
        total_calls: 0,
        answered_calls: 0,
        unanswered_calls: 0,
        total_cost: 0,
        total_duration: 0,
        avg_duration: 0,
        avg_ring_time: 0
    });

    const [chartData, setChartData] = useState<ChartData>({
        country: [],
        answered_calls: [],
        unanswered_calls: [],
        total_calls: [],
        max_ring_time: [],
        avg_ring_time: [],
        min_ring_time: [],
        min_cost: [],
        avg_cost: [],
        max_cost: [],
        min_duration: [],
        avg_duration: [],
        max_duration: []
    });

    const [showChartModal, setShowChartModal] = useState(false);
    const [modalChartData, setModalChartData] = useState<{ series: any[]; categories: string[] } | null>(null);
    const [modalTitle, setModalTitle] = useState('');
    const [modalDataType, setModalDataType] = useState<'calls' | 'time' | 'cost' | 'custom'>('calls');

    const handleFiltersChange = (filters: any) => {
        setCurrentFilters(filters);
        // Mark filters as ready when they are first set
        if (!filtersReady) {
            setFiltersReady(true);
        }
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
        try {
            setLoading(true);
            const response = await ExportCallLogs({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
            
            if (response.success) {
                const blob = new Blob([(response as any).data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${reportType}_${groupingType}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.${exportType}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Export successful!');
            } else {
                toast.error('Export failed!');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed!');
        } finally {
            setLoading(false);
        }
    };

    const fetchData = useCallback(async (page: number, perPage: number, search: string) => {
        // Only fetch if filters are ready
        if (!filtersReady) {
            return { data: [], totalRows: 0, summary };
        }
        
        try {
            setLoading(true);
            const response = await ListCallLogs({ page, perPage, search, filters: currentFilters, reportType: reportTypeParam }, listEndpoint);
            
            if (response.success) {
                return {
                    data: response.data.data,
                    totalRows: response.data.total,
                    summary: response.data.summary || summary
                };
            } else {
                toast.error('Failed to fetch data');
                return { data: [], totalRows: 0, summary };
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to fetch data');
            return { data: [], totalRows: 0, summary };
        } finally {
            setLoading(false);
        }
    }, [currentFilters, reportTypeParam, listEndpoint, summary, filtersReady]);

    useEffect(() => {
        const fetchCharts = async () => {
            // Only fetch charts when filters are ready
            if (!filtersReady) {
                return;
            }
            
            try {
                setLoading(true);
                const response = await ListCallLogs({ page: 1, perPage: 15, search: "", filters: currentFilters, reportType: chartReportTypeParam }, chartEndpoint);
                
                if (response.success && response.data) {
                    const data = response.data;
                    
                    setChartData({
                        country: data.country || [],
                        answered_calls: data.answered_calls || [],
                        unanswered_calls: data.unanswered_calls || [],
                        total_calls: data.total_calls || [],
                        max_ring_time: data.max_ring_time || [],
                        avg_ring_time: data.avg_ring_time || [],
                        min_ring_time: data.min_ring_time || [],
                        min_cost: data.min_cost || [],
                        avg_cost: data.avg_cost || [],
                        max_cost: data.max_cost || [],
                        min_duration: data.min_duration || [],
                        avg_duration: data.avg_duration || [],
                        max_duration: data.max_duration || []
                    });

                    if (data.summary) {
                        setSummary(data.summary);
                    }
                }
            } catch (error) {
                console.error('Chart fetch error:', error);
                toast.error('Failed to fetch chart data');
            } finally {
                setLoading(false);
            }
        };

        fetchCharts();
    }, [currentFilters, chartReportTypeParam, chartEndpoint, filtersReady]);

    const handleOpenChartModal = (chartData: { series: any[]; categories: string[] } | null, title: string, dataType: 'calls' | 'time' | 'cost' | 'custom') => {
        setModalChartData(chartData);
        setModalTitle(title);
        setModalDataType(dataType);
        setShowChartModal(true);
    };

    const handleTabChange = (key: string | null) => {
        if (key) {
            setActiveTab(key);
        }
    };

    useEffect(() => {
        const fetchHierarchyData = async () => {
            try {
                await GetHierarchyData();
            } catch (error) {
                console.error('Hierarchy fetch error:', error);
            }
        };

        if (status === 'authenticated') {
            fetchHierarchyData();
        }
    }, [status]);

    const callsChartOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: chartData.country,
        },
        yaxis: {
            title: {
                text: 'Number of Calls'
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " calls"
                }
            }
        }
    };

    const timeChartOptions: ApexOptions = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: {
                show: false
            }
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        xaxis: {
            categories: chartData.country,
        },
        yaxis: {
            title: {
                text: 'Time (seconds)'
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " seconds"
                }
            }
        }
    };

    const costChartOptions: ApexOptions = {
        chart: {
            type: 'area',
            height: 350,
            toolbar: {
                show: false
            }
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: chartData.country,
        },
        yaxis: {
            title: {
                text: 'Cost'
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return "$" + val.toFixed(2)
                }
            }
        }
    };

    const callsSeries = [
        {
            name: 'Answered Calls',
            data: chartData.answered_calls
        },
        {
            name: 'Unanswered Calls',
            data: chartData.unanswered_calls
        }
    ];

    const timeSeries = [
        {
            name: 'Average Ring Time',
            data: chartData.avg_ring_time
        },
        {
            name: 'Average Duration',
            data: chartData.avg_duration
        }
    ];

    const costSeries = [
        {
            name: 'Average Cost',
            data: chartData.avg_cost
        },
        {
            name: 'Total Cost',
            data: chartData.max_cost
        }
    ];

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    return (
        <Layout>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle={breadcrumbTitle} />
            
            <div className="container-fluid">
                <Row>
                    <Col lg={3} md={6}>
                        <StatCard
                            title="Total Calls"
                            value={summary.total_calls}
                            icon={imgStatus1}
                        />
                    </Col>
                    <Col lg={3} md={6}>
                        <StatCard
                            title="Answered Calls"
                            value={summary.answered_calls}
                            icon={imgStatus2}
                        />
                    </Col>
                    <Col lg={3} md={6}>
                        <StatCard
                            title="Unanswered Calls"
                            value={summary.unanswered_calls}
                            icon={imgStatus3}
                        />
                    </Col>
                    <Col lg={3} md={6}>
                        <StatCard
                            title="Total Cost"
                            value={summary.total_cost}
                            icon={imgStatus4}
                        />
                    </Col>
                </Row>

                <Row className="mt-4">
                    <Col lg={12}>
                        <div className="card">
                            <div className="card-header">
                                <h4 className="card-title mb-0">Call Reports</h4>
                            </div>
                            <div className="card-body">
                                <Tabs
                                    activeKey={activeTab}
                                    onSelect={handleTabChange}
                                    className="nav-tabs-custom"
                                >
                                    <Tab eventKey="calls_chart" title="Calls Chart">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key="calls_chart"
                                                variants={tabVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h5>Calls Overview</h5>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleOpenChartModal(
                                                            { series: callsSeries, categories: chartData.country },
                                                            'Calls Overview',
                                                            'calls'
                                                        )}
                                                    >
                                                        View Full Screen
                                                    </Button>
                                                </div>
                                                <ReactApexChart
                                                    options={callsChartOptions}
                                                    series={callsSeries}
                                                    type="bar"
                                                    height={350}
                                                />
                                            </motion.div>
                                        </AnimatePresence>
                                    </Tab>
                                    
                                    <Tab eventKey="time_chart" title="Time Chart">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key="time_chart"
                                                variants={tabVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h5>Time Analysis</h5>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleOpenChartModal(
                                                            { series: timeSeries, categories: chartData.country },
                                                            'Time Analysis',
                                                            'time'
                                                        )}
                                                    >
                                                        View Full Screen
                                                    </Button>
                                                </div>
                                                <ReactApexChart
                                                    options={timeChartOptions}
                                                    series={timeSeries}
                                                    type="line"
                                                    height={350}
                                                />
                                            </motion.div>
                                        </AnimatePresence>
                                    </Tab>
                                    
                                    <Tab eventKey="cost_chart" title="Cost Chart">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key="cost_chart"
                                                variants={tabVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h5>Cost Analysis</h5>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleOpenChartModal(
                                                            { series: costSeries, categories: chartData.country },
                                                            'Cost Analysis',
                                                            'cost'
                                                        )}
                                                    >
                                                        View Full Screen
                                                    </Button>
                                                </div>
                                                <ReactApexChart
                                                    options={costChartOptions}
                                                    series={costSeries}
                                                    type="area"
                                                    height={350}
                                                />
                                            </motion.div>
                                        </AnimatePresence>
                                    </Tab>
                                    
                                    <Tab eventKey="data_table" title="Data Table">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key="data_table"
                                                variants={tabVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                            >
                                                <GenericListPage
                                                    title="Call Reports Data"
                                                    columns={columns}
                                                    fetchData={fetchData}
                                                />
                                            </motion.div>
                                        </AnimatePresence>
                                    </Tab>
                                </Tabs>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Chart Modal */}
            <Modal
                show={showChartModal}
                onHide={() => setShowChartModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalChartData && (
                        <ReactApexChart
                            options={
                                modalDataType === 'calls' ? callsChartOptions :
                                modalDataType === 'time' ? timeChartOptions :
                                modalDataType === 'cost' ? costChartOptions :
                                callsChartOptions
                            }
                            series={modalChartData.series}
                            type={
                                modalDataType === 'calls' ? 'bar' :
                                modalDataType === 'time' ? 'line' :
                                modalDataType === 'cost' ? 'area' :
                                'bar'
                            }
                            height={400}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </Layout>
    );
};

export default CallReportsPage; 