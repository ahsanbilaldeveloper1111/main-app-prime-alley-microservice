import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { ListCallLogs, DownloadCallsExport } from "@utils/calls";
import { Column } from "@components/CustomDataTable";
import { Modal, Row, Tab, Tabs, Form, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import BarFilters from "@components/BarFilters";
import SelectBox from "@components/SelectBox";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import ChartBar from "@components/ChartBar";
import ChartDonut from "@components/ChartDonut";
import PageSummaryGrid from "@components/PageSummaryGrid";
import "@assets/scss/report-style.scss";
import "@assets/scss/tabs.scss";
import { motion, AnimatePresence, easeOut, easeIn } from "framer-motion";
import moment from "moment";

import "@assets/scss/common.scss";

interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration: number;
  avg_duration: number;
  avg_ring_time: number;
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

import {
  formatMinutesAndSeconds,
  ModuleSlug,
  GlobalDateTimeFormat,
  formatDateTimeToLocal,
  getAutoTimezone,
} from "@utils/Helper";

/** Convert start/end datetime from local to UTC and assign back to filters */
function applyUtcDatetimeFilters(formattedFilters: Record<string, any>): void {
  if (formattedFilters.start_datetime) {
    let startMoment = moment(formattedFilters.start_datetime);
    if (
      formattedFilters.start_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    ) {
      startMoment = moment(formattedFilters.start_datetime + ":00");
    } else if (!formattedFilters.start_datetime.includes("T")) {
      startMoment = moment(formattedFilters.start_datetime).startOf("day");
    }
    formattedFilters.start_datetime =
      startMoment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
  }
  if (formattedFilters.end_datetime) {
    let endMoment = moment(formattedFilters.end_datetime);
    if (
      formattedFilters.end_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    ) {
      const timePart = formattedFilters.end_datetime.split("T")[1];
      endMoment =
        timePart === "23:59"
          ? moment(formattedFilters.end_datetime + ":59")
          : moment(formattedFilters.end_datetime + ":00");
    } else if (!formattedFilters.end_datetime.includes("T")) {
      endMoment = moment(formattedFilters.end_datetime).endOf("day");
    }
    formattedFilters.end_datetime =
      endMoment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
  }
}

const CallIncomingDepartment = () => {
  const { data: session } = useSession();

  const [showDateRange, setShowDateRange] = useState(false);
  const [startDateTime, setStartDateTime] = useState<string>("");
  const [endDateTime, setEndDateTime] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("calls_chart");

  // Animation variants for tab transitions
  const tabVariants = {
    hidden: {
      opacity: 0,
      x: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: easeOut,
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: easeIn,
      },
    },
  };

  const columns: Column[] = [
    {
      key: "DepartmentName",
      name: "DepartmentName",
      selector: (row: any) => row.DepartmentName,
      sortable: true,
    },
    {
      key: "Calls",
      name: "Total Calls",
      selector: (row: any) => row.Calls,
      sortable: true,
    },
    {
      key: "Answered",
      name: "Answered",
      selector: (row: any) => row.Answered,
      sortable: true,
    },
    {
      key: "Unanswered",
      name: "Un Answered",
      selector: (row: any) => row.Unanswered,
      sortable: true,
    },

    {
      key: "AvgRingTime",
      name: "Avg Ring Time",
      selector: (row: any) => row.AvgRingTime,
      sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.AvgRingTime),
    },
    {
      key: "MaxRingTime",
      name: "Max Ring Time",
      selector: (row: any) => row.MaxRingTime,
      sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.MaxRingTime),
    },

    {
      key: "Duration",
      name: "Total Duration",
      selector: (row: any) => row.Duration,
      sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.Duration),
    },
    {
      key: "AvgDuration",
      name: "Avg Duration",
      selector: (row: any) => row.AvgDuration,
      sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.AvgDuration),
    },

    // { key: 'Cost', name: 'Total Cost', selector: (row: any) => row.Cost, sortable: true,
    //   cell: (row: any) => formatCurrency(row.Cost)
    //  },
    // { key: 'AvgCost', name: 'Avg Cost', selector: (row: any) => row['Avg Cost'], sortable: true,
    //   cell: (row: any) => formatCurrency(Number(row['Avg Cost']))
    //  },
  ];

  // Initialize filters with default values immediately to prevent first API call without dates
  const getDefaultFilters = () => {
    const now = moment();
    const startDateInput = now
      .clone()
      .startOf("day")
      .format("YYYY-MM-DDTHH:mm");
    const endDateInput = now.clone().endOf("day").format("YYYY-MM-DDTHH:mm");
    const startDateUTC =
      now.clone().startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    const endDateUTC =
      now.clone().endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    return {
      pending: {
        start_datetime: startDateInput,
        end_datetime: endDateInput,
        is_incoming_only: "true",
      },
      current: {
        start_datetime: startDateUTC,
        end_datetime: endDateUTC,
        is_incoming_only: "true",
      },
    };
  };

  const defaultFilters = getDefaultFilters();

  const [refreshKey, setRefreshKey] = useState<number>(1); // Start at 1 to ensure initial fetch
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(
    defaultFilters.current,
  );
  const [pendingFilters, setPendingFilters] = useState<Record<string, any>>(
    defaultFilters.pending,
  );
  const [dataLoaded, setDataLoaded] = useState(false);
  const filtersReady = true; // Always ready since filters are initialized immediately

  // Use ref to track if initial fetch has been done
  const initialFetchDone = React.useRef(false);
  // Use ref to track last filters used for charts to prevent unnecessary refetches
  const lastChartFilters = React.useRef<string>("");

  // Refs to prevent duplicate API calls
  const currentFiltersRef = useRef<Record<string, any>>(defaultFilters.current);
  const isFetchingRef = useRef(false);

  const {
    hierarchyDataExtensions,
    hierarchyDataDepartments,
    loading: hierarchyLoading,
  } = useHierarchyData(ModuleSlug.CALL_REPORTS);
  const [summary, setSummary] = useState<Summary>({
    total_calls: 0,
    answered_calls: 0,
    unanswered_calls: 0,
    total_cost: 0,
    total_duration: 0,
    avg_duration: 0,
    avg_ring_time: 0,
  });

  const [showPageLoader, setShowPageLoader] = useState(false);
  const fetchCallLogs = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      if (!filtersReady) return;
      setLoading(true);
      setShowPageLoader(true);

      try {
        const response = await ListCallLogs(
          {
            page,
            perPage,
            search,
            filters: currentFiltersRef.current,
            reportType: "incomingStatsDepartment",
            moduleSlug: ModuleSlug.CALL_REPORTS,
          },
          "call-logs/statsIncomingByDepartment",
        );

        if (response?.summary) {
          setShowDateRange(true);
          const dataFilters = response?.filters;
          setStartDateTime(dataFilters?.start_datetime);
          setEndDateTime(dataFilters?.end_datetime);

          setSummary(response.summary);
          setDataLoaded(true);
        } else {
          setDataLoaded(true);
        }

        setLoading(false);
        return response;
      } catch {
        setLoading(false);
        setDataLoaded(true);
        toast.error("Failed to fetch call data");
        return null;
      } finally {
        setShowPageLoader(false);
        isFetchingRef.current = false;
      }
    },
    [],
  );

  const [simpleDonut, setSimpleDonut] = React.useState<{
    series: number[];
    labels: string[];
  } | null>(null);

  useEffect(() => {
    if (summary && dataLoaded) {
      const answeredCalls = Number(summary.answered_calls) || 0;
      const unansweredCalls = Number(summary.unanswered_calls) || 0;

      // Check if both values are 0, if so don't set chart data (will show empty state)
      if (answeredCalls === 0 && unansweredCalls === 0) {
        setSimpleDonut(null);
      } else {
        // Set chart data only when there's actual data
        setSimpleDonut({
          series: [answeredCalls, unansweredCalls],
          labels: ["Answered Calls", "Unanswered Calls"],
        });
      }
    }
  }, [summary, dataLoaded]);

  // Trigger initial data fetch when filters become ready
  // Ensure initial fetch happens when session is ready
  useEffect(() => {
    if (session?.user?.permissions?.includes("list-call-logs")) {
      initialFetchDone.current = true;
    }
  }, [session]);

  const handleFiltersChange = (filters: any) => {
    const formattedFilters: any = { ...filters };
    applyUtcDatetimeFilters(formattedFilters);

    const filtersChanged =
      JSON.stringify(currentFilters) !== JSON.stringify(formattedFilters);
    const isCompletelyCleared =
      Object.keys(formattedFilters).length === 0 ||
      (Object.keys(formattedFilters).length === 1 &&
        Object.prototype.hasOwnProperty.call(
          formattedFilters,
          "is_incoming_only",
        ));

    setCurrentFilters(formattedFilters);
    currentFiltersRef.current = formattedFilters;

    if ((filtersChanged && filtersReady) || isCompletelyCleared) {
      setDataLoaded(false);
      setSummary({
        total_calls: 0,
        answered_calls: 0,
        unanswered_calls: 0,
        total_cost: 0,
        total_duration: 0,
        avg_duration: 0,
        avg_ring_time: 0,
      });
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportPayload = {
        ...currentFilters,
        timezone: getAutoTimezone(),
      };
      await DownloadCallsExport(
        exportPayload,
        "call-logs/report/department/download",
      );
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const [chartCalls, setChartCalls] = useState<{
    series: any[];
    categories: string[];
  } | null>(null);
  const [chartRingTime, setChartRingTime] = useState<{
    series: any[];
    categories: string[];
  } | null>(null);
  const [chartDuration, setChartDuration] = useState<{
    series: any[];
    categories: string[];
  } | null>(null);

  const [chartLoading, setChartLoading] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<{
    series: any[];
    categories: string[];
  } | null>(null);
  const [currentChartTitle, setCurrentChartTitle] = useState("");

  useEffect(() => {
    // Check if filters have actually changed
    const currentFiltersString = JSON.stringify(currentFilters);
    const filtersChanged = lastChartFilters.current !== currentFiltersString;

    if (
      session &&
      filtersChanged &&
      currentFilters &&
      Object.keys(currentFilters).length > 0
    ) {
      lastChartFilters.current = currentFiltersString;
      const fetchCharts = async () => {
        setChartLoading(true);
        try {
          const response = await ListCallLogs(
            {
              page: 1,
              perPage: 15,
              search: "",
              filters: currentFilters,
              reportType: "chartIncomingDepartment",
              moduleSlug: ModuleSlug.CALL_REPORTS,
            },
            "call-logs/stats/department/chart",
          );

          const chartData = response?.chart_data;

          if (chartData && Array.isArray(chartData) && chartData.length > 0) {
            const newChartData: ChartData = {
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
              max_duration: [],
            };

            chartData.forEach((item: any, _index: number) => {
              if (item?.label) {
                newChartData.country.push(item.label);
                newChartData.answered_calls.push(
                  Number(item.answered_calls) || 0,
                );
                newChartData.unanswered_calls.push(
                  Number(item.unanswered_calls) || 0,
                );
                newChartData.total_calls.push(Number(item.total_calls) || 0);
                newChartData.max_ring_time.push(
                  Number(item.max_ring_time) || 0,
                );
                newChartData.avg_ring_time.push(
                  Number(item.avg_ring_time) || 0,
                );
                newChartData.min_ring_time.push(
                  Number(item.min_ring_time) || 0,
                );
                newChartData.min_cost.push(Number(item.min_cost) || 0);
                newChartData.avg_cost.push(Number(item.avg_cost) || 0);
                newChartData.max_cost.push(Number(item.max_cost) || 0);
                newChartData.min_duration.push(Number(item.min_duration) || 0);
                newChartData.avg_duration.push(Number(item.avg_duration) || 0);
                newChartData.max_duration.push(Number(item.max_duration) || 0);
              }
            });

            const dataLength = newChartData.country.length;

            if (
              dataLength > 0 &&
              newChartData.answered_calls.length === dataLength &&
              newChartData.unanswered_calls.length === dataLength &&
              newChartData.total_calls.length === dataLength
            ) {
              // Calls Chart
              setChartCalls({
                series: [
                  { name: "Total", data: newChartData.total_calls },
                  { name: "Answered", data: newChartData.answered_calls },
                  { name: "Unanswered", data: newChartData.unanswered_calls },
                ],
                categories: newChartData.country,
              });

              // Ring Time Chart
              setChartRingTime({
                series: [
                  { name: "Max Ring Time", data: newChartData.max_ring_time },
                  { name: "Avg Ring Time", data: newChartData.avg_ring_time },
                  { name: "Min Ring Time", data: newChartData.min_ring_time },
                ],
                categories: newChartData.country,
              });

              // Duration Chart
              setChartDuration({
                series: [
                  { name: "Max Duration", data: newChartData.max_duration },
                  { name: "Avg Duration", data: newChartData.avg_duration },
                  { name: "Min Duration", data: newChartData.min_duration },
                ],
                categories: newChartData.country,
              });
            } else {
              console.error(
                "Chart data arrays have different lengths or no data",
              );
              setChartCalls(null);
              setChartRingTime(null);
              setChartDuration(null);
            }
          } else {
            setChartCalls(null);
            setChartRingTime(null);
            setChartDuration(null);
          }
        } catch {
          setChartCalls(null);
          setChartRingTime(null);
          setChartDuration(null);
        } finally {
          setChartLoading(false);
        }
      };

      fetchCharts();
    } else {
      // Reset chart when filters are not ready
      setChartCalls(null);
      setChartRingTime(null);
      setChartDuration(null);
      setChartLoading(false);
    }
  }, [currentFilters, session]);

  const [currentChartDataType, setCurrentChartDataType] = useState<
    "calls" | "time" | "cost" | "custom"
  >("custom");

  const handleOpenChartModal = (
    chartData: { series: any[]; categories: string[] } | null,
    title: string,
    dataType: "calls" | "time" | "cost" | "custom",
  ) => {
    if (chartData) {
      setCurrentChartData(chartData);
      setCurrentChartTitle(title);
      setShowChartModal(true);
      setCurrentChartDataType(dataType);
    }
  };

  const handleTabChange = (key: string | null) => {
    if (key) {
      setActiveTab(key);
    }
  };

  const renderDonutContent = () => {
    if (loading || !dataLoaded || !filtersReady) {
      return (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "180px" }}
        >
          <div className="spinner-border text-primary">
            <output className="visually-hidden">Loading...</output>
          </div>
        </div>
      );
    }
    if (
      summary.answered_calls === 0 &&
      summary.unanswered_calls === 0 &&
      summary.total_duration === 0
    ) {
      return (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "180px" }}
        >
          <p className="text-muted mb-0">No data available</p>
        </div>
      );
    }
    if (simpleDonut) {
      return (
        <ChartDonut
          series={simpleDonut.series}
          labels={simpleDonut.labels}
          dataType="calls"
          height={200}
          width={500}
          showDataLabels={true}
          dataLabelsFormatter={(value) => `${value.toFixed(0)}%`}
        />
      );
    }
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: "180px" }}
      >
        <p className="text-muted mb-0">Loading chart...</p>
      </div>
    );
  };

  const renderChartTabContent = (
    isLoading: boolean,
    chartData: { series: any[]; categories: string[] } | null,
    title: string,
    dataType: "calls" | "time" | "cost",
  ) => {
    if (isLoading || !filtersReady) {
      return (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "300px" }}
        >
          <div className="spinner-border text-primary">
            <output className="visually-hidden">Loading chart...</output>
          </div>
        </div>
      );
    }
    if (chartData) {
      return (
        <ChartBar
          series={chartData.series}
          categories={chartData.categories}
          dataType={dataType}
          height={300}
          maxDisplayedItems={5}
          showViewAllButton={true}
          viewAllButtonText="View All"
          showFullScreenButton={true}
          onFullScreenClick={() =>
            handleOpenChartModal(chartData, title, dataType)
          }
        />
      );
    }
    return <div className="" />;
  };

  return (
    <>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Incoming Calls By Department"
        showPageLoader={showPageLoader}
      />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5}>
                <h2 className="mb-0">Incoming Calls By Department</h2>
              </Col>
              <Col md={7} className="d-flex justify-content-end">
                <div className="action-buttons">
                  {showDateRange && (
                    <p className="mb-0">
                      Date Range:{" "}
                      <span className="status-badge primary">
                        {formatDateTimeToLocal(
                          startDateTime,
                          GlobalDateTimeFormat,
                        )}
                      </span>{" "}
                      to{" "}
                      <span className="status-badge primary">
                        {formatDateTimeToLocal(
                          endDateTime,
                          GlobalDateTimeFormat,
                        )}
                      </span>
                    </p>
                  )}
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => handleExport()}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            aria-hidden="true"
                          />
                          <output>Exporting...</output>
                        </>
                      ) : (
                        "Export"
                      )}
                    </button>
                  </div>
                  {/* )} */}
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Row>
            <PageSummaryGrid
              gridColumns={2}
              cards={[
                {
                  id: "total-calls",
                  title: "Total Calls",
                  value: summary.total_calls,
                  description: "Number of calls received",
                  valueType: "number",
                  delay: 0.1,
                  animationDuration: 1000,
                  fontStyle: "style-2",
                },
                {
                  id: "avg-ring-time",
                  title: "Avg Ring Time",
                  value: summary.avg_ring_time,
                  description: "Average time before answer",
                  valueType: "seconds",
                  delay: 0.3,
                  animationDuration: 1000,
                  fontStyle: "style-2",
                },
                {
                  id: "avg-duration",
                  title: "Avg Duration",
                  value: summary.avg_duration,
                  description: "Average call duration",
                  valueType: "seconds",
                  delay: 0.5,
                  animationDuration: 1000,
                  fontStyle: "style-2",
                },
                {
                  id: "total-duration",
                  title: "Duration",
                  value: summary.total_duration,
                  description: "Total call duration",
                  valueType: "seconds",
                  delay: 0.7,
                  animationDuration: 1000,
                  fontStyle: "style-2",
                },
              ]}
            />
          </Row>
        </Col>

        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * 0 }}
          >
            <div className="report-grid ">
              <p className="text-muted mb-0">Total Calls</p>
              <div className="chart-one ">{renderDonutContent()}</div>
            </div>
          </motion.div>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <h4 className="">Core Metrics</h4>
        </Col>

        <Col md={12}>
          <Tabs
            defaultActiveKey="calls_chart"
            id="system-tabs"
            className="mb-3"
            activeKey={activeTab}
            onSelect={handleTabChange}
          >
            <Tab eventKey="calls_chart" title="Calls by Department">
              <AnimatePresence mode="wait">
                {activeTab === "calls_chart" && (
                  <motion.div
                    key="calls_chart"
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Row>
                      <Col md={12}>
                        <div className="card report-shadow">
                          <div className="card-body">
                            {renderChartTabContent(
                              chartLoading,
                              chartCalls,
                              "Calls by Department",
                              "calls",
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tab>

            <Tab eventKey="duration_chart" title="Duration by Department">
              <AnimatePresence mode="wait">
                {activeTab === "duration_chart" && (
                  <motion.div
                    key="duration_chart"
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Row>
                      <Col md={12}>
                        <div className="card report-shadow">
                          <div className="card-body">
                            {renderChartTabContent(
                              chartLoading,
                              chartDuration,
                              "Duration by Department",
                              "time",
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tab>

            <Tab eventKey="ring_chart" title="Ring Time by Department">
              <AnimatePresence mode="wait">
                {activeTab === "ring_chart" && (
                  <motion.div
                    key="ring_chart"
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Row>
                      <Col md={12}>
                        <div className="card report-shadow">
                          <div className="card-body">
                            {renderChartTabContent(
                              chartLoading,
                              chartRingTime,
                              "Ring Time by Department",
                              "time",
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tab>

            {/* <Tab eventKey="cost_chart" title="Cost by Department">
                           <AnimatePresence mode="wait">
                             {activeTab === 'cost_chart' && (
                               <motion.div
                                 key="cost_chart"
                                 variants={tabVariants}
                                 initial="hidden"
                                 animate="visible"
                                 exit="exit"
                               >
                                 <Row>
                                  <Col md={12}>
                                      <div className="card report-shadow">
                                          <div className="card-body">
                                          
                                          {chartLoading || !filtersReady ? (
                                              <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                                  <div className="spinner-border text-primary" role="status">
                                                      <span className="visually-hidden">Loading chart...</span>
                                                  </div>
                                              </div>
                                          ) : chartCost ? (
                                              <ChartBar 
                                                  series={chartCost.series}
                                                  categories={chartCost.categories}
                                                  dataType="cost"
                                                  height={300}
                                                  maxDisplayedItems={5}
                                                  showViewAllButton={true}
                                                  viewAllButtonText="View All"
                                                  showFullScreenButton={true}
                                                  onFullScreenClick={() => handleOpenChartModal(chartCost, 'Cost by Department', 'cost')}
                                              />
                                          ) : (
                                            <div className=""></div>
                                          )}
                                          </div>
                                      </div>
                                  </Col>
                                 </Row>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </Tab> */}
          </Tabs>
        </Col>
      </Row>

      {session?.user?.permissions?.includes("list-call-logs") && (
        <>
          <BarFilters
            leftContent={
              <>
                {showDateRange && (
                  <p className="mb-0">
                    Date Range:{" "}
                    <span className="status-badge primary">
                      {formatDateTimeToLocal(
                        startDateTime,
                        GlobalDateTimeFormat,
                      )}
                    </span>{" "}
                    to{" "}
                    <span className="status-badge primary">
                      {formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}
                    </span>
                  </p>
                )}
              </>
            }
            searchValue=""
            onSearchChange={() => {}}
            onSearch={() => {}}
            searchPlaceholder="Search call stats..."
            showSearch={false}
            filters={pendingFilters}
            onSubmit={() => {
              // Convert and apply filters, then trigger all APIs
              const filtersToApply = {
                ...pendingFilters,
                is_incoming_only: "true",
              };
              handleFiltersChange(filtersToApply);
              // fetchCallLogs will be triggered by refreshKey change
              // Chart data will be triggered by useEffect watching currentFilters
            }}
            onReset={() => {
              // Preserve current date filters, clear all other filters
              const resetPendingFilters: Record<string, any> = {
                start_datetime:
                  (pendingFilters as any)?.start_datetime ||
                  defaultFilters.pending.start_datetime,
                end_datetime:
                  (pendingFilters as any)?.end_datetime ||
                  defaultFilters.pending.end_datetime,
                is_incoming_only: "true",
              };
              const resetCurrentFilters: Record<string, any> = {
                start_datetime:
                  (currentFilters as any)?.start_datetime ||
                  defaultFilters.current.start_datetime,
                end_datetime:
                  (currentFilters as any)?.end_datetime ||
                  defaultFilters.current.end_datetime,
                is_incoming_only: "true",
              };
              setPendingFilters(resetPendingFilters);
              setCurrentFilters(resetCurrentFilters);
              currentFiltersRef.current = resetCurrentFilters;
              handleFiltersChange(resetPendingFilters);
            }}
            filterContent={
              <>
                {/* Call Status */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Call Status</Form.Label>
                    <SelectBox
                      isSearchable={false}
                      value={(pendingFilters as any)?.call_status || null}
                      onChange={(value) => {
                        setPendingFilters({
                          ...pendingFilters,
                          call_status: (value as string) || "",
                        });
                      }}
                      options={[
                        { value: "Answered", label: "Answered" },
                        { value: "Not Answered", label: "Not Answered" },
                        { value: "Both", label: "Both" },
                      ]}
                      placeholder="Select call status"
                    />
                  </Form.Group>
                </Col>

                {/* Called Numbers */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Called Numbers</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter called numbers (comma separated)"
                      value={(
                        (pendingFilters as any)?.called_numbers || []
                      ).join(", ")}
                      onChange={(e) => {
                        const values = e.target.value
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean);
                        setPendingFilters({
                          ...pendingFilters,
                          called_numbers: values,
                        });
                      }}
                    />
                  </Form.Group>
                </Col>

                {/* Extension */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Extension</Form.Label>
                    <SelectBox
                      isMulti
                      isSearchable={true}
                      isDisabled={hierarchyLoading}
                      value={
                        (pendingFilters as any)?.extension_number?.length > 0
                          ? (pendingFilters as any)?.extension_number
                          : null
                      }
                      onChange={(value) => {
                        setPendingFilters({
                          ...pendingFilters,
                          extension_number: value ? (value as string[]) : [],
                        });
                      }}
                      options={
                        (hierarchyDataExtensions as any)?.map((ext: any) => ({
                          value: ext.id,
                          label: ext.name,
                        })) || []
                      }
                      placeholder="Select extensions"
                    />
                  </Form.Group>
                </Col>

                {/* Traffic Type */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Traffic Type</Form.Label>
                    <SelectBox
                      isSearchable={false}
                      value={(pendingFilters as any)?.traffic_type || null}
                      onChange={(value) => {
                        setPendingFilters({
                          ...pendingFilters,
                          traffic_type: (value as string) || "",
                        });
                      }}
                      options={[
                        { value: "", label: "All" },
                        { value: "internal", label: "Internal" },
                        { value: "external", label: "External" },
                      ]}
                      placeholder="Select traffic type"
                    />
                  </Form.Group>
                </Col>

                {/* Destination Type */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Destination Type</Form.Label>
                    <SelectBox
                      isSearchable={false}
                      value={(pendingFilters as any)?.destination_type || null}
                      onChange={(value) => {
                        setPendingFilters({
                          ...pendingFilters,
                          destination_type: (value as string) || "",
                        });
                      }}
                      options={[
                        { value: "", label: "All" },
                        { value: "local", label: "Local" },
                        { value: "national", label: "National" },
                        { value: "international", label: "International" },
                      ]}
                      placeholder="Select destination type"
                    />
                  </Form.Group>
                </Col>

                {/* Departments */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Departments</Form.Label>
                    <SelectBox
                      isMulti
                      isSearchable={true}
                      isDisabled={hierarchyLoading}
                      value={
                        (pendingFilters as any)?.department?.length > 0
                          ? (pendingFilters as any)?.department
                          : null
                      }
                      onChange={(value) => {
                        setPendingFilters({
                          ...pendingFilters,
                          department: value ? (value as string[]) : [],
                        });
                      }}
                      options={
                        (hierarchyDataDepartments as any)?.map((dept: any) => ({
                          value: dept.id,
                          label: dept.name,
                        })) || []
                      }
                      placeholder="Select departments"
                    />
                  </Form.Group>
                </Col>

                {/* Date Range - Start */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Start Date & Time</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={(pendingFilters as any)?.start_datetime || ""}
                      max={moment().format("YYYY-MM-DDTHH:mm")}
                      onChange={(e) => {
                        const datetimeValue = e.target.value;
                        const endDate =
                          (pendingFilters as any)?.end_datetime || "";

                        // If start date is greater than end date, adjust end date to start date
                        let updatedFilters: any = {
                          ...pendingFilters,
                          start_datetime: datetimeValue,
                        };

                        if (
                          datetimeValue &&
                          endDate &&
                          moment(datetimeValue).isAfter(moment(endDate))
                        ) {
                          updatedFilters.end_datetime = datetimeValue;
                        }

                        setPendingFilters(updatedFilters);
                      }}
                    />
                  </Form.Group>
                </Col>

                {/* Date Range - End */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>End Date & Time</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={(pendingFilters as any)?.end_datetime || ""}
                      min={(pendingFilters as any)?.start_datetime || ""}
                      max={moment().format("YYYY-MM-DDTHH:mm")}
                      onChange={(e) => {
                        const datetimeValue = e.target.value;
                        const startDate =
                          (pendingFilters as any)?.start_datetime || "";

                        // If end date is less than start date, adjust start date to end date
                        let updatedFilters: any = {
                          ...pendingFilters,
                          end_datetime: datetimeValue,
                        };

                        if (
                          datetimeValue &&
                          startDate &&
                          moment(datetimeValue).isBefore(moment(startDate))
                        ) {
                          updatedFilters.start_datetime = datetimeValue;
                        }

                        setPendingFilters(updatedFilters);
                      }}
                    />
                  </Form.Group>
                </Col>
              </>
            }
          />

          <GenericListPage
            columns={columns}
            fetchData={fetchCallLogs}
            title="Call Logs"
            searchPlaceholder="Search call stats..."
            defaultPageSize={15}
            filters={currentFilters}
            refreshKey={refreshKey}
            tableStyle="table-style-2"
            search={false}
          />
        </>
      )}

      {/* Chart Modal */}
      <Modal
        show={showChartModal}
        onHide={() => setShowChartModal(false)}
        size="xl"
        centered
        className="chart-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{currentChartTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentChartData ? (
            <div className="chart-container" style={{ minHeight: "500px" }}>
              <ChartBar
                series={currentChartData.series}
                categories={currentChartData.categories}
                height={500}
                dataType={currentChartDataType}
              />
            </div>
          ) : (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ height: "500px" }}
            >
              <p className="text-muted mb-0">No chart data available</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

CallIncomingDepartment.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallIncomingDepartment;
