import React, { ReactElement, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Row, Col, Button, Badge, ProgressBar, Table, Modal, Form, Dropdown } from "react-bootstrap";
import { 
  FiUser, 
  FiSettings,
  FiPlus,
  FiEdit,
  FiEye,
  FiDownload,
  FiUpload,
  FiGrid,
  FiFileText,
  FiShoppingCart,
  FiUsers,
  FiPieChart,
  FiTrendingUp,
  FiDollarSign,
  FiPackage
} from "react-icons/fi";
import styles from "../app/single-page.module.css";

const CompactLayout = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const statsData = [
    { title: "Total Sales", value: "$45,231", change: "+8.2%", icon: FiDollarSign, color: "success", trend: "up" },
    { title: "Total Orders", value: "1,234", change: "+15.3%", icon: FiShoppingCart, color: "primary", trend: "up" },
    { title: "Total Users", value: "2,451", change: "+12.5%", icon: FiUsers, color: "info", trend: "up" },
    { title: "Total Products", value: "856", change: "+5.7%", icon: FiPackage, color: "warning", trend: "up" }
  ];

  const recentOrders = [
    { id: "#1234", customer: "John Doe", product: "Product A", amount: "$120", status: "Completed", date: "2024-01-15" },
    { id: "#1235", customer: "Jane Smith", product: "Product B", amount: "$85", status: "Pending", date: "2024-01-14" },
    { id: "#1236", customer: "Bob Johnson", product: "Product C", amount: "$200", status: "Processing", date: "2024-01-13" },
    { id: "#1237", customer: "Alice Brown", product: "Product D", amount: "$150", status: "Completed", date: "2024-01-12" },
    { id: "#1238", customer: "Charlie Wilson", product: "Product E", amount: "$95", status: "Pending", date: "2024-01-11" }
  ];

  const notifications = [
    { message: "New order received", time: "2 min ago", type: "success", icon: FiShoppingCart },
    { message: "Payment processed", time: "5 min ago", type: "info", icon: FiDollarSign },
    { message: "Product shipped", time: "10 min ago", type: "warning", icon: FiPackage },
    { message: "User registered", time: "1 hour ago", type: "primary", icon: FiUsers }
  ];

  const quickActions = [
    { title: "Add Product", icon: FiPlus, color: "primary", action: () => console.log("Add Product") },
    { title: "New Order", icon: FiShoppingCart, color: "success", action: handleShowModal },
    { title: "Add User", icon: FiUser, color: "info", action: () => console.log("Add User") },
    { title: "Generate Report", icon: FiFileText, color: "warning", action: () => console.log("Generate Report") }
  ];

  return (
    <>
      <BreadcrumbItem mainTitle="Compact Layout" mainLink="/compact-layout" subTitle="Dashboard" />
      
      {/* Quick Stats Cards - Compact Style */}
      <Row className="mb-4">
        {statsData.map((stat, index) => (
          <Col key={index} xl={3} lg={6} md={6} sm={12}>
            <Card className={`${styles.statCard} h-100`}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className={`${styles.statIcon} bg-${stat.color} bg-opacity-10 text-${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="mb-1 text-muted small">{stat.title}</h6>
                    <h5 className="mb-0 fw-bold">{stat.value}</h5>
                    <small className={`text-${stat.trend === 'up' ? 'success' : 'danger'}`}>
                      {stat.change} from last month
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className={styles.card}>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Quick Actions</h6>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  <FiGrid className="me-1" />
                  More
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item><FiSettings className="me-2" />Settings</Dropdown.Item>
                  <Dropdown.Item><FiDownload className="me-2" />Export</Dropdown.Item>
                  <Dropdown.Item><FiUpload className="me-2" />Import</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Card.Header>
            <Card.Body className="p-3">
              <Row>
                {quickActions.map((action, index) => (
                  <Col key={index} lg={3} md={6} sm={6}>
                    <Button 
                      variant={`outline-${action.color}`} 
                      className={`w-100 mb-2 ${styles.btn}`}
                      onClick={action.action}
                    >
                      <action.icon className="me-2" />
                      {action.title}
                    </Button>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Area */}
      <Row>
        <Col lg={8}>
          {/* Recent Orders Table */}
          <Card className={styles.card}>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Recent Orders</h6>
              <Button variant="primary" size="sm" className={styles.btn}>
                <FiPlus className="me-1" />
                View All
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className={`${styles.table} mb-0`}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={index}>
                      <td className="fw-bold">{order.id}</td>
                      <td>{order.customer}</td>
                      <td className="fw-bold">{order.amount}</td>
                      <td>
                        <Badge bg={order.status === 'Completed' ? 'success' : order.status === 'Pending' ? 'warning' : 'info'} className={styles.badge}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="text-muted small">{order.date}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Button size="sm" variant="outline-primary" className={styles.btn}>
                            <FiEye size={12} />
                          </Button>
                          <Button size="sm" variant="outline-warning" className={styles.btn}>
                            <FiEdit size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Notifications Panel */}
          <Card className={styles.card}>
            <Card.Header>
              <h6 className="mb-0">Recent Notifications</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div className={styles.notificationList}>
                {notifications.map((notification, index) => (
                  <div key={index} className="p-3 border-bottom">
                    <div className="d-flex align-items-center">
                      <div className={`${styles.statIcon} bg-${notification.type} bg-opacity-10 text-${notification.type} me-3`}>
                        <notification.icon size={16} />
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1 small">{notification.message}</p>
                        <small className="text-muted">{notification.time}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Progress Overview */}
          <Card className={`${styles.card} mt-3`}>
            <Card.Header>
              <h6 className="mb-0">Progress Overview</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small">Sales Target</span>
                  <span className="small fw-bold">75%</span>
                </div>
                <ProgressBar now={75} variant="success" className={styles.progressBar} />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small">Customer Satisfaction</span>
                  <span className="small fw-bold">90%</span>
                </div>
                <ProgressBar now={90} variant="info" className={styles.progressBar} />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small">Order Completion</span>
                  <span className="small fw-bold">85%</span>
                </div>
                <ProgressBar now={85} variant="warning" className={styles.progressBar} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row className="mt-4">
        <Col lg={6}>
          <Card className={styles.card}>
            <Card.Header>
              <h6 className="mb-0">Sales Overview</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                <div className="text-center">
                  <FiTrendingUp size={48} className="text-success mb-3" />
                  <h4 className="mb-1">$45,231</h4>
                  <p className="text-muted mb-0">Total Sales This Month</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className={styles.card}>
            <Card.Header>
              <h6 className="mb-0">User Activity</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                <div className="text-center">
                  <FiPieChart size={48} className="text-primary mb-3" />
                  <h4 className="mb-1">2,451</h4>
                  <p className="text-muted mb-0">Active Users</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal for Add Order */}
      <Modal show={showModal} onHide={handleCloseModal} className={styles.modal} size="sm">
        <Modal.Header closeButton className={styles.modalHeader}>
          <Modal.Title>Add New Order</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Customer Name</Form.Label>
              <Form.Control type="text" placeholder="Enter customer name" className={styles.formControl} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product</Form.Label>
              <Form.Select className={styles.formSelect}>
                <option>Select product</option>
                <option>Product A</option>
                <option>Product B</option>
                <option>Product C</option>
                <option>Product D</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control type="number" placeholder="Enter amount" className={styles.formControl} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select className={styles.formSelect}>
                <option>Pending</option>
                <option>Processing</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className={styles.modalFooter}>
          <Button variant="secondary" onClick={handleCloseModal} className={styles.btn}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCloseModal} className={styles.btn}>
            Add Order
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

CompactLayout.getLayout = (page: ReactElement) => {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default CompactLayout; 