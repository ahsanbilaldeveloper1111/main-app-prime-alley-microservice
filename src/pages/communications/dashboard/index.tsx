import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useEffect, useState, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { ListCallLogs } from "@utils/calls";
import { Button, Modal, Row, Form, Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import EmptyState from "@components/EmptyState";
import { ModuleSlug } from "@utils/Helper";
import "@assets/scss/common.scss";

import "@assets/scss/report-style.scss";
import "@assets/scss/tabs.scss";
import moment from "moment";
import Link from "next/link";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
} from "lucide-react";
import StatsCards from "@components/GenericStatsCards";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface GeneralStats {
  totalCalls: number;
  totalInbound: number;
  totalOutbound: number;
  totalMissedIncoming: number;
  totalMissedOutgoing: number;
  totalAvgRingTime: number;
  totalAvgDuration: number;
  totalAvgCost: number;
}

interface TrendByCountry {
  CallDate: string;
  StartHour: string;
  Country: string;
  IsCountryTotal: string;
  Calls: string;
  Unanswered: string;
  Answered: string;
  AvgRingTime: string;
  MaxRingTime: string;
  TotalDuration: string;
  AvgDuration: string;
  Duration: string;
  Cost: string;
  AvgCost: string;
}

const DATETIME_LOCAL_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const xaxisLabelsStyle = { show: true as const, style: { fontSize: "11px", colors: "#666" } };

const DEFAULT_COUNTRY_CHART_OPTIONS: ApexOptions = {
  chart: { type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { borderRadius: 4, borderRadiusApplication: "end", horizontal: true } },
  legend: { show: true, position: "bottom" },
  dataLabels: { enabled: false },
  tooltip: {},
  xaxis: { categories: [], labels: xaxisLabelsStyle },
  yaxis: { title: { text: "", style: { fontSize: "12px", fontWeight: "bold", color: "#263238" } } },
};

const DEFAULT_DEPARTMENT_CHART_OPTIONS: ApexOptions = {
  ...DEFAULT_COUNTRY_CHART_OPTIONS,
  yaxis: { title: { text: "Call Count", style: { fontSize: "12px", fontWeight: "bold", color: "#263238" } }, labels: xaxisLabelsStyle },
  fill: { opacity: 1 },
};

const DEFAULT_EXTENSION_CHART_OPTIONS: ApexOptions = {
  chart: { type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, dataLabels: { position: "top" } } },
  dataLabels: { enabled: false },
  stroke: { width: 1, colors: ["#fff"] },
  tooltip: { shared: false, intersect: false },
  xaxis: { categories: [], labels: xaxisLabelsStyle },
  yaxis: { title: { text: "" } },
  legend: { position: "bottom", horizontalAlign: "center", offsetX: 40 },
};

function mapChartDataFromApi(items: { label?: string; value?: unknown }[]) {
  return {
    labels: items.map((item) => item.label || "Unknown"),
    values: items.map((item) => (item.value ? Number.parseInt(String(item.value), 10) : 0)),
  };
}

type ChartSeries = { name: string; data: number[] }[];

interface ChartCardProps {
  readonly title: string;
  readonly emptyTitle: string;
  readonly dataLength: number;
  readonly options: ApexOptions;
  readonly series: ChartSeries;
  readonly onExpand: () => void;
  readonly show: boolean;
}

function ChartCard({ title, emptyTitle, dataLength, options, series, onExpand, show }: ChartCardProps) {
  if (!show) return null;
  return (
    <Col md={4}>
      <div className="card">
        <div className="card-body">
          {dataLength === 0 ? (
            <EmptyState title={emptyTitle} description="Chart data will appear here when available." className="table-empty-state" />
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 app-title-heading">{title}</h5>
                <button type="button" className="btn btn-sm btn-light" onClick={onExpand} aria-label={`Expand ${title}`}>
                  <i className="material-icons-two-tone">open_in_full</i>
                </button>
              </div>
              <ReactApexChart options={options} series={series} type="bar" height={200} />
            </>
          )}
        </div>
      </div>
    </Col>
  );
}

interface ChartModalProps {
  readonly show: boolean;
  readonly onHide: () => void;
  readonly title: string;
  readonly options: ApexOptions;
  readonly series: ChartSeries;
}

function ChartModal({ show, onHide, title, options, series }: ChartModalProps) {
  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="chart-modal">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="chart-container" style={{ minHeight: "500px" }}>
          <ReactApexChart
            options={{ ...options, chart: { ...options.chart, height: 500, toolbar: { show: true } } }}
            series={series}
            type="bar"
            height={500}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
}

interface StatsTableCardProps {
  readonly show: boolean;
  readonly title: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly isEmpty: boolean;
  readonly viewAllHref: string;
  readonly children: React.ReactNode;
}

function StatsTableCard({ show, title, emptyTitle, emptyDescription, isEmpty, viewAllHref, children }: StatsTableCardProps) {
  if (!show) return null;
  return (
    <Col md={6}>
      <div className="card">
        <div className="card-body">
          {isEmpty ? (
            <EmptyState title={emptyTitle} description={emptyDescription} isTableRow colSpan={6} />
          ) : (
            <>
              <h5 className="mb-0 app-title-heading">{title}</h5>
              <div className="table-responsive">
                {children}
                <div className="d-flex justify-content-center">
                  <Link href={viewAllHref} className="link-primary">
                    View All
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Col>
  );
}

const CallDashboard = () => {
  useSession();
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [showCountryChartModal, setShowCountryChartModal] = useState(false);
  const [showDepartmentChartModal, setShowDepartmentChartModal] =
    useState(false);
  const [showExtensionChartModal, setShowExtensionChartModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);

  // Initialize with local time, then convert to UTC for API
  const getInitialFilters = () => {
    const now = moment();
    const startLocal = now.clone().startOf("day");
    const endLocal = now.clone();
    return {
      start_datetime: startLocal.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
      end_datetime: endLocal.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
    };
  };
  const [currentFilters, setCurrentFilters] = useState(getInitialFilters());
  const [generalStats, setGeneralStats] = useState<GeneralStats>({
    totalCalls: 0,
    totalInbound: 0,
    totalOutbound: 0,
    totalMissedIncoming: 0,
    totalMissedOutgoing: 0,
    totalAvgRingTime: 0,
    totalAvgDuration: 0,
    totalAvgCost: 0,
  });
  const statsCardsData = [
    {
      title: "Total Calls",
      value: generalStats.totalCalls,
      icon: Phone,
      iconColor: "#3B82F6",
      iconBgColor: "#DBEAFE",
      subtitle: "Total calls in the system",
    },
    {
      title: "Inbound",
      value: generalStats.totalInbound,
      icon: PhoneIncoming,
      iconColor: "#10B981",
      iconBgColor: "#D1FAE5",
      subtitle: "Inbound calls in the system",
    },
    {
      title: "Outbound",
      value: generalStats.totalOutbound,
      icon: PhoneOutgoing,
      iconColor: "#0EA5E9",
      iconBgColor: "#E0F2FE",
      subtitle: "Outbound calls in the system",
    },
    {
      title: "Missed Incoming",
      value: generalStats.totalMissedIncoming,
      icon: PhoneMissed,
      iconColor: "#F59E0B",
      iconBgColor: "#FEF3C7",
      subtitle: "Missed incoming calls in the system",
    },
    {
      title: "Missed Outgoing",
      value: generalStats.totalMissedOutgoing,
      icon: PhoneOff,
      iconColor: "#EF4444",
      iconBgColor: "#FEE2E2",
      subtitle: "Missed outgoing calls in the system",
    },
  ];

  const [perPage] = useState(5);
  const [page] = useState(1);

  const [showExtensionChart, setShowExtensionChart] = useState(true);
  const [showDepartmentChart, setShowDepartmentChart] = useState(true);
  const [showCountryChart, setShowCountryChart] = useState(true);

  const [countryChartData, setCountryChartData] = useState<any[]>([]);
  const [departmentChartData, setDepartmentChartData] = useState<any[]>([]);
  const [extensionChartData, setExtensionChartData] = useState<any[]>([]);

  const [pendingDateStart, setPendingDateStart] = useState<string>("");
  const [pendingDateEnd, setPendingDateEnd] = useState<string>("");

  useEffect(() => {
    fetchGeneralStats();
  }, []);

  useEffect(() => {
    if (currentFilters.start_datetime) {
      setPendingDateStart(
        moment.utc(currentFilters.start_datetime).local().format("YYYY-MM-DD"),
      );
    }
    if (currentFilters.end_datetime) {
      setPendingDateEnd(
        moment.utc(currentFilters.end_datetime).local().format("YYYY-MM-DD"),
      );
    }
  }, [currentFilters.start_datetime, currentFilters.end_datetime]);

  const fetchGeneralStats = async (overrideFilters?: typeof currentFilters) => {
    const filtersToUse = overrideFilters ?? currentFilters;
    setShowPageLoader(true);
    const response = await ListCallLogs(
      {
        page: page,
        perPage: perPage,
        search: "",
        filters: filtersToUse,
        reportType: "statsDashboard",
        moduleSlug: ModuleSlug.CALL_LOGS,
      },
      "call-logs/generalStats",
    ).finally(() => {
      setShowPageLoader(false);
    });

    if (response.success) {
      const responseData = response.data;
      setShowDateRange(true);

      setGeneralStats({
        totalCalls: responseData.total_calls,
        totalInbound: responseData.inbound_calls,
        totalOutbound: responseData.outbound_calls,
        totalMissedIncoming: responseData.missed_incoming_calls,
        totalMissedOutgoing: responseData.missed_outgoing_calls,
        totalAvgRingTime: responseData.avg_ring_time,
        totalAvgDuration: responseData.avg_duration,
        totalAvgCost: responseData.avg_cost,
      });

      // Extract and map chart data using shared helper and default options
      const chartExtension = responseData?.chart_data?.extension;
      if (chartExtension) {
        setShowExtensionChart(true);
        setExtensionChartData(chartExtension);
        const { labels, values } = mapChartDataFromApi(chartExtension);
        setExtensionChart({
          series: [{ name: "Call Count", data: values }],
          options: { ...DEFAULT_EXTENSION_CHART_OPTIONS, xaxis: { ...DEFAULT_EXTENSION_CHART_OPTIONS.xaxis, categories: labels } },
        });
      }

      const chartDepartment = responseData?.chart_data?.department;
      if (chartDepartment) {
        setShowDepartmentChart(true);
        setDepartmentChartData(chartDepartment);
        const { labels, values } = mapChartDataFromApi(chartDepartment);
        setDepartmentChart({
          series: [{ name: "Call Count", data: values }],
          options: { ...DEFAULT_DEPARTMENT_CHART_OPTIONS, xaxis: { ...DEFAULT_DEPARTMENT_CHART_OPTIONS.xaxis, categories: labels } },
        });
      }

      const chartCountry = responseData?.chart_data?.country;
      if (chartCountry) {
        setShowCountryChart(true);
        setCountryChartData(chartCountry);
        const { labels, values } = mapChartDataFromApi(chartCountry);
        setCountryChart({
          series: [{ name: "Call Count", data: values }],
          options: { ...DEFAULT_COUNTRY_CHART_OPTIONS, xaxis: { ...DEFAULT_COUNTRY_CHART_OPTIONS.xaxis, categories: labels } },
        });
      }
    }
  };

  const [countryChart, setCountryChart] = useState<{ series: ChartSeries; options: ApexOptions }>({
    series: [{ name: "", data: [] }],
    options: DEFAULT_COUNTRY_CHART_OPTIONS,
  });
  const [departmentChart, setDepartmentChart] = useState<{ series: ChartSeries; options: ApexOptions }>({
    series: [],
    options: DEFAULT_DEPARTMENT_CHART_OPTIONS,
  });
  const [extensionChart, setExtensionChart] = useState<{ series: ChartSeries; options: ApexOptions }>({
    series: [],
    options: DEFAULT_EXTENSION_CHART_OPTIONS,
  });

  const [showStatsByExtensionTable] = useState(true);
  const [trendByCountryData, setTrendByCountryData] = useState<
    TrendByCountry[]
  >([]);
  const [extensionData, setExtensionData] = useState<any[]>([]);
  useEffect(() => {
    fetchExtensionStats();
  }, []);
  const fetchExtensionStats = async (
    overrideFilters?: typeof currentFilters,
  ) => {
    const filtersToUse = overrideFilters ?? currentFilters;
    const response = await ListCallLogs(
      {
        page: page,
        perPage: perPage,
        search: "",
        filters: filtersToUse,
        reportType: "statsExtension",
        moduleSlug: ModuleSlug.CALL_LOGS,
      },
      "call-logs/statsByExtension",
    );
    if (response?.dataList?.length > 0) {
      setExtensionData(response?.dataList);
    } else {
      setExtensionData([]);
    }
  };

  const [showTrendByCountryTable] = useState(true);
  useEffect(() => {
    fetchTrendByCountryStats();
  }, []);

  const fetchTrendByCountryStats = async (
    overrideFilters?: typeof currentFilters,
  ) => {
    const filtersToUse = overrideFilters ?? currentFilters;
    const response = await ListCallLogs(
      {
        page: page,
        perPage: perPage,
        search: "",
        filters: filtersToUse,
        reportType: "statsCountry",
        moduleSlug: ModuleSlug.CALL_LOGS,
      },
      "call-logs/statsByCountry",
    );
    if (response?.dataList?.length > 0) {
      setTrendByCountryData(response?.dataList);
    }
  };

  const formatDateRangeToUtc = (
    startLocal: string,
    endLocal: string,
  ): { start_datetime: string; end_datetime: string } => {
    let startMoment;
    if (startLocal && DATETIME_LOCAL_REGEX.exec(startLocal)) {
      const dateTimeStr = startLocal + ":00";
      const [datePart, timePart] = dateTimeStr.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second] = timePart.split(":").map(Number);
      startMoment = moment([year, month - 1, day, hour, minute, second]);
    } else {
      startMoment = moment(startLocal || undefined).startOf("day");
    }
    let endMoment;
    if (endLocal && DATETIME_LOCAL_REGEX.exec(endLocal)) {
      const timePart = endLocal.split("T")[1];
      const seconds = timePart === "23:59" ? "59" : "00";
      const dateTimeStr = endLocal + ":" + seconds;
      const [datePart, timePartFull] = dateTimeStr.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second] = timePartFull.split(":").map(Number);
      endMoment = moment([year, month - 1, day, hour, minute, second]);
    } else {
      endMoment = moment(endLocal || undefined).endOf("day");
    }
    return {
      start_datetime: startMoment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
      end_datetime: endMoment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
    };
  };

  const refreshData = async (overrideFilters?: typeof currentFilters) => {
    setLoading(true);
    NProgress.start();
    const filtersToUse = overrideFilters ?? currentFilters;
    await fetchGeneralStats(filtersToUse);
    await fetchExtensionStats(filtersToUse);
    await fetchTrendByCountryStats(filtersToUse);
    if (overrideFilters) {
      setCurrentFilters(overrideFilters);
    }
    setLoading(false);
    NProgress.done();
  };

  const handleApplyDateRange = useCallback(() => {
    const formatted = formatDateRangeToUtc(pendingDateStart, pendingDateEnd);
    refreshData(formatted);
  }, [pendingDateStart, pendingDateEnd]);

  const formatDuration = (duration: number) => {
    if (!duration) return "00:00:00";
    const totalSeconds = Math.floor(Number(duration));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  };

  return (
    <React.Fragment>
      {/* Removed LoadingBar component */}
      <BreadcrumbItem
        mainTitle="Call Logs"
        mainLink="/call-logs/dashboard"
        subTitle="Call Dashboard"
        showPageLoader={showPageLoader}
      />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">Call Dashboard</h2>
              </Col>

              <Col md={8} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <div className="d-flex align-items-center gap-2">
                    {showDateRange && (
                      <>
                        {/* <p className="mb-0 d-flex align-items-center gap-2 flex-wrap">
                                Date Range:{' '}
                                <span className="status-badge primary">{startDateTime ? moment.utc(startDateTime).local().format('DD MMM YYYY hh:mm:ss A') : ''}</span>
                                {' '}to{' '}
                                <span className="status-badge primary">{endDateTime ? moment.utc(endDateTime).local().format('DD MMM YYYY hh:mm:ss A') : ''}</span>
                              </p> */}
                        Date Range:{" "}
                        <span className="status-badge primary">
                          <Form.Control
                            type="date"
                            value={pendingDateStart}
                            onChange={(e) =>
                              setPendingDateStart(e.target.value)
                            }
                            className="border-0 bg-transparent p-0 text-inherit"
                            style={{
                              fontSize: "inherit",
                              minWidth: "130px",
                              cursor: "pointer",
                            }}
                            aria-label="From date"
                            title="From date"
                          />
                        </span>{" "}
                        to{" "}
                        <span className="status-badge primary">
                          <Form.Control
                            type="date"
                            value={pendingDateEnd}
                            onChange={(e) => setPendingDateEnd(e.target.value)}
                            className="border-0 bg-transparent p-0 text-inherit"
                            style={{
                              fontSize: "inherit",
                              minWidth: "130px",
                              cursor: "pointer",
                            }}
                            aria-label="To date"
                            title="To date"
                          />
                        </span>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={handleApplyDateRange}
                          disabled={loading}
                        >
                          Apply
                        </Button>
                        <button
                          type="button"
                          className="btn-light p-0 border-0"
                          style={{ cursor: "pointer" }}
                          onClick={() => refreshData()}
                          title="Refresh"
                          aria-label="Refresh"
                        >
                          <i className="material-icons-two-tone">refresh</i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* <PageSummaryGrid 
              cards={summaryCards} 
            /> */}
      <div className="mb-4">
        <StatsCards data={statsCardsData} gridMinWidth="180px" />
      </div>
      <Row>
        <ChartCard
          show={showCountryChart}
          title="Calls by Country"
          emptyTitle="No Calls by Country Data"
          dataLength={countryChartData.length}
          options={countryChart.options}
          series={countryChart.series}
          onExpand={() => setShowCountryChartModal(true)}
        />
        <ChartCard
          show={showDepartmentChart}
          title="Call by Department"
          emptyTitle="No Calls by Department Data"
          dataLength={departmentChartData.length}
          options={departmentChart.options}
          series={departmentChart.series}
          onExpand={() => setShowDepartmentChartModal(true)}
        />
        <ChartCard
          show={showExtensionChart}
          title="Call by Extension"
          emptyTitle="No Calls by Extension Data"
          dataLength={extensionChartData.length}
          options={extensionChart.options}
          series={extensionChart.series}
          onExpand={() => setShowExtensionChartModal(true)}
        />
      </Row>

      <Row>
        <StatsTableCard
          show={showStatsByExtensionTable}
          title="Call by Extension"
          emptyTitle="No Call by Extension Data"
          emptyDescription="List of call by extension data will appear here."
          isEmpty={extensionData.length === 0}
          viewAllHref="/call-reports/stats/extension"
        >
          <table className="table table-bordered table-striped table-sm">
            <thead>
              <tr>
                <th>Extension</th>
                <th>Calls</th>
                <th>Answered</th>
                <th>Un Answered</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {extensionData.map((item) => (
                <tr key={`extension-${item.Extension}-${item.Calls}-${item.TotalDuration}`}>
                  <td>{item.Extension}</td>
                  <td>{item.Calls}</td>
                  <td>{item.Answered}</td>
                  <td>{item.Unanswered}</td>
                  <td>{formatDuration(Number(item.TotalDuration))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </StatsTableCard>

        <StatsTableCard
          show={showTrendByCountryTable}
          title="Call Stats by Country"
          emptyTitle="No Call Stats by Country Data"
          emptyDescription="List of call stats by country data will appear here."
          isEmpty={trendByCountryData.length === 0}
          viewAllHref="/call-reports/stats/country"
        >
          <table className="table table-bordered table-striped table-sm">
            <thead>
              <tr>
                <th>Country</th>
                <th>Calls</th>
                <th>Answered</th>
                <th>Un Answered</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {trendByCountryData.map((item) => (
                <tr key={`country-${item.Country}-${item.Calls}-${item.TotalDuration}`}>
                  <td>{item.Country}</td>
                  <td>{item.Calls}</td>
                  <td>{item.Answered}</td>
                  <td>{item.Unanswered}</td>
                  <td>{formatDuration(Number(item.TotalDuration))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </StatsTableCard>
      </Row>

      <ChartModal
        show={showCountryChartModal}
        onHide={() => setShowCountryChartModal(false)}
        title="Calls by Country"
        options={countryChart.options}
        series={countryChart.series}
      />
      <ChartModal
        show={showDepartmentChartModal}
        onHide={() => setShowDepartmentChartModal(false)}
        title="Calls by Department"
        options={departmentChart.options}
        series={departmentChart.series}
      />
      <ChartModal
        show={showExtensionChartModal}
        onHide={() => setShowExtensionChartModal(false)}
        title="Calls by Extension"
        options={extensionChart.options}
        series={extensionChart.series}
      />
    </React.Fragment>
  );
};

CallDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallDashboard;
