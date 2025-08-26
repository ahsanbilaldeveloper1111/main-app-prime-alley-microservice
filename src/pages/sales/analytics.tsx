import React, { ReactElement, useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Card,
  CardBody,
  Col,
  Row,
  Form,
  Button,
  Alert,
  ProgressBar,
  Spinner,
} from "react-bootstrap";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiBarChart,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
import { getSalesAnalytics, SalesAnalyticsData } from "@utils/sales";
import { toast } from "react-toastify";

const SalesAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<SalesAnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    period: "monthly" as "daily" | "monthly" | "yearly",
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0], // today
  });

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSalesAnalytics(filters);
      setAnalyticsData(data);
    } catch (error: any) {
      console.error("Failed to load analytics:", error);
      setError(error?.message || "Failed to load analytics data");
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    loadAnalytics();
  };

  const handleExport = () => {
    toast.info("Export functionality would be implemented here");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getTotalRevenue = () => {
    return analyticsData.reduce((sum, item) => sum + item.total_revenue, 0);
  };

  const getTotalOrders = () => {
    return analyticsData.reduce((sum, item) => sum + item.total_orders, 0);
  };

  const getTotalProfit = () => {
    return analyticsData.reduce((sum, item) => sum + item.total_profit, 0);
  };

  const getAverageOrderValue = () => {
    const totalOrders = getTotalOrders();
    return totalOrders > 0 ? getTotalRevenue() / totalOrders : 0;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Sales"
        mainLink="/sales"
        subTitle="Analytics Dashboard"
      />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0">Sales Analytics</h2>
            <p className="text-muted mb-0">Track your sales performance and insights</p>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <Form.Label className="mb-0">Period:</Form.Label>
                  <Form.Select
                    value={filters.period}
                    onChange={(e) => handleFilterChange("period", e.target.value)}
                    style={{ width: "auto" }}
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Form.Select>
                  <Form.Label className="mb-0">From:</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange("start_date", e.target.value)}
                  />
                  <Form.Label className="mb-0">To:</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange("end_date", e.target.value)}
                  />
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" onClick={handleRefresh}>
                    <FiRefreshCw className="me-2" />
                    Refresh
                  </Button>
                  <Button variant="outline-primary" onClick={handleExport}>
                    <FiDownload className="me-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="outline-danger" size="sm" className="ms-3" onClick={loadAnalytics}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <FiDollarSign className="text-success me-2" size={24} />
                <h4 className="mb-0">{formatCurrency(getTotalRevenue())}</h4>
              </div>
              <h6 className="text-muted">Total Revenue</h6>
              <small className="text-muted">
                {filters.period} period
              </small>
            </CardBody>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <FiShoppingCart className="text-primary me-2" size={24} />
                <h4 className="mb-0">{formatNumber(getTotalOrders())}</h4>
              </div>
              <h6 className="text-muted">Total Orders</h6>
              <small className="text-muted">
                {filters.period} period
              </small>
            </CardBody>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <FiTrendingUp className="text-info me-2" size={24} />
                <h4 className="mb-0">{formatCurrency(getAverageOrderValue())}</h4>
              </div>
              <h6 className="text-muted">Average Order Value</h6>
              <small className="text-muted">
                Per order
              </small>
            </CardBody>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center">
            <CardBody>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <FiPackage className="text-warning me-2" size={24} />
                <h4 className="mb-0">{formatCurrency(getTotalProfit())}</h4>
              </div>
              <h6 className="text-muted">Total Profit</h6>
              <small className="text-muted">
                {filters.period} period
              </small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Analytics Chart */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card>
            <CardBody>
              <h5 className="mb-3">
                {filters.period.charAt(0).toUpperCase() + filters.period.slice(1)} Revenue Trend
              </h5>
              {analyticsData.length > 0 ? (
                <div className="chart-container" style={{ height: "300px" }}>
                  <div className="d-flex align-items-end justify-content-between h-100">
                    {analyticsData.map((item, index) => {
                      const maxRevenue = Math.max(...analyticsData.map(d => d.total_revenue));
                      const height = maxRevenue > 0 ? (item.total_revenue / maxRevenue) * 100 : 0;
                      const label = item.date || item.month || item.year?.toString() || `Period ${index + 1}`;
                      
                      return (
                        <div key={index} className="text-center">
                          <div className="d-flex flex-column align-items-center">
                            <div
                              className="chart-bar rounded-top"
                              style={{
                                width: "40px",
                                height: `${height}%`,
                                backgroundColor: "#007bff",
                                minHeight: "20px",
                              }}
                            />
                            <small className="text-muted mt-1">{label}</small>
                            <small className="fw-medium">{formatCurrency(item.total_revenue)}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                                 <div className="text-center py-4">
                   <FiBarChart className="text-muted mb-3" size={48} />
                   <h6>No Data Available</h6>
                   <p className="text-muted">
                     No analytics data found for the selected period and date range.
                   </p>
                 </div>
              )}
            </CardBody>
          </Card>
        </Col>

        {/* Analytics Summary */}
        <Col lg={4} className="mb-4">
          <Card>
            <CardBody>
              <h5 className="mb-3">Analytics Summary</h5>
              {analyticsData.length > 0 ? (
                <div className="analytics-summary">
                  {analyticsData.map((item, index) => {
                    const label = item.date || item.month || item.year?.toString() || `Period ${index + 1}`;
                    return (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
                        <div>
                          <div className="fw-medium">{label}</div>
                          <small className="text-muted">
                            {item.total_orders} orders
                          </small>
                        </div>
                        <div className="text-end">
                          <div className="fw-medium">{formatCurrency(item.total_revenue)}</div>
                          <small className="text-success">
                            {formatCurrency(item.total_profit)} profit
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted">No data to display</p>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row>
        <Col lg={12} className="mb-4">
          <Card>
            <CardBody>
              <h5 className="mb-3">Performance Metrics</h5>
              <Row>
                <Col md={6}>
                  <h6>Revenue Growth</h6>
                  {analyticsData.length > 1 ? (
                    <div className="d-flex align-items-center">
                      <FiTrendingUp className="text-success me-2" />
                      <span className="text-success">
                        {((getTotalRevenue() / analyticsData.length) * 100).toFixed(1)}% average
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted">Insufficient data</span>
                  )}
                </Col>
                <Col md={6}>
                  <h6>Order Efficiency</h6>
                  <div className="d-flex align-items-center">
                    <FiShoppingCart className="text-primary me-2" />
                    <span>
                      {getTotalOrders()} orders in {analyticsData.length} {filters.period} periods
                    </span>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .chart-container {
          position: relative;
        }
        .chart-bar {
          transition: height 0.3s ease;
        }
        .analytics-summary {
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>
    </React.Fragment>
  );
};

export default SalesAnalytics;
