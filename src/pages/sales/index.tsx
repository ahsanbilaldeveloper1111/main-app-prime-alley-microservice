import React, { ReactElement, useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, CardBody, Col, Row, Spinner, Alert } from "react-bootstrap";
import Link from "next/link";
import {
  FiShoppingCart,
  FiPackage,
  FiTrendingUp,
  FiSettings,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiBarChart2,
} from "react-icons/fi";
import {
  getSalesDashboardData,
  SalesDashboardData,
  getSalesAnalytics,
} from "@utils/sales";
import { toast } from "react-toastify";

const SalesDashboard = () => {
  const [dashboardData, setDashboardData] = useState<SalesDashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getSalesDashboardData();
      setDashboardData(data);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      setError(error?.message || "Failed to fetch dashboard data");
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const salesModules = [
    {
      title: "Orders",
      description:
        "Manage customer orders, track status, and process deliveries",
      icon: FiShoppingCart,
      color: "primary",
      link: "/sales/orders",
      count: dashboardData?.totalOrders || "0",
    },
    {
      title: "Products",
      description: "Manage product catalog, variants, and product inventory",
      icon: FiPackage,
      color: "success",
      link: "/sales/products",
      count: dashboardData?.totalProducts || "0",
    },
    {
      title: "Analytics",
      description:
        "View sales reports, revenue trends, and performance metrics",
      icon: FiTrendingUp,
      color: "info",
      link: "/sales/analytics",
      count: dashboardData?.analytics?.length || "0",
    },
    {
      title: "Stages",
      description: "Configure order stages and workflow management",
      icon: FiSettings,
      color: "warning",
      link: "/sales/stages",
      count: dashboardData?.totalStages || "0",
    },
    {
      title: "Lost Reasons",
      description: "Manage reasons for lost orders and track conversion",
      icon: FiUsers,
      color: "danger",
      link: "/sales/lost-reasons",
      count: "0",
    },
    {
      title: "Reports",
      description: "Generate detailed sales reports and export data",
      icon: FiFileText,
      color: "secondary",
      link: "/sales/reports",
      count: "0",
    },
  ];

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
        <button
          className="btn btn-outline-danger btn-sm ms-3"
          onClick={fetchDashboardData}
        >
          Retry
        </button>
      </Alert>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Dashboard"
        mainLink="/dashboard"
        subTitle="Sales"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0">Sales Management</h2>
            <p className="text-muted mb-0">
              Manage your sales operations and track performance
            </p>
          </div>
        </Col>
      </Row>

      {/* Key Metrics */}
      {dashboardData && (
        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center border-0 shadow-sm">
              <CardBody>
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FiShoppingCart className="text-primary me-2" size={24} />
                  <h4 className="mb-0">{dashboardData.totalOrders}</h4>
                </div>
                <h6 className="text-muted">Total Orders</h6>
              </CardBody>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center border-0 shadow-sm">
              <CardBody>
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FiPackage className="text-success me-2" size={24} />
                  <h4 className="mb-0">{dashboardData.totalProducts}</h4>
                </div>
                <h6 className="text-muted">Active Products</h6>
              </CardBody>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center border-0 shadow-sm">
              <CardBody>
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <FiSettings className="text-warning me-2" size={24} />
                  <h4 className="mb-0">{dashboardData.totalStages}</h4>
                </div>
                <h6 className="text-muted">Sales Stages</h6>
              </CardBody>
            </Card>
          </Col>
       
        </Row>
      )}

      <Row>
        <Col lg={12}>
          <div className="d-flex align-items-center mb-4">
            <h5 className="mb-0 me-3">Sales Modules</h5>
            <div className="text-muted">
              Access different areas of sales management
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        {salesModules.map((module, index) => (
          <Col key={index} lg={4} md={6} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <CardBody className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className={`bg-${module.color} bg-opacity-10 p-3 rounded me-3`}
                  >
                    <module.icon className={`text-${module.color}`} size={24} />
                  </div>
                  <div>
                    <h6 className="mb-1">{module.title}</h6>
                    <small className="text-muted">{module.count} items</small>
                  </div>
                </div>

                <p className="text-muted mb-3 small">{module.description}</p>

                <Link
                  href={module.link}
                  className={`btn btn-${module.color} btn-sm w-100`}
                >
                  Access {module.title}
                </Link>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>


      <Row className="mt-5">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <CardBody className="p-4">
              <h5 className="mb-3">Quick Actions</h5>
              <Row>
                <Col md={6}>
                  <div className="d-grid gap-2">
                    <Link
                      href="/sales/orders/create"
                      className="btn btn-primary"
                    >
                      <FiShoppingCart className="me-2" size={18} />
                      Create New Order
                    </Link>
                    <Link
                      href="/sales/products/manage"
                      className="btn btn-outline-success"
                    >
                      <FiPackage className="me-2" size={18} />
                      Add New Product
                    </Link>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-grid gap-2">
                    <Link
                      href="/sales/stages/manage"
                      className="btn btn-outline-warning"
                    >
                      <FiSettings className="me-2" size={18} />
                      Configure Stages
                    </Link>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

SalesDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SalesDashboard;
