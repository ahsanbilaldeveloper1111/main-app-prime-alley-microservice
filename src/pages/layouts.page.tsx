import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Row, Col, Button, Badge } from "react-bootstrap";
import { FiGrid, FiSidebar, FiLayout, FiMonitor } from "react-icons/fi";
import Link from "next/link";
import styles from "../app/single-page.module.css";

const Layouts = () => {
  const layouts = [
    {
      title: "Compact Layout",
      description: "Condensed sidebar with optimized content area for better space utilization",
      icon: FiGrid,
      color: "primary",
      route: "/",
      features: ["Compact sidebar", "Optimized spacing", "Quick actions", "Efficient navigation"]
    },
    {
      title: "Single Page App",
      description: "Comprehensive dashboard with tabbed interface and multiple sections",
      icon: FiLayout,
      color: "success",
      route: "/single-page",
      features: ["Tabbed interface", "Multiple sections", "Rich components", "Full dashboard"]
    },
    {
      title: "Vertical Layout",
      description: "Traditional sidebar layout with full navigation menu",
      icon: FiSidebar,
      color: "info",
      route: "/dashboard",
      features: ["Full sidebar", "Complete navigation", "Traditional layout", "Standard dashboard"]
    },
    {
      title: "Horizontal Layout",
      description: "Top navigation bar layout for modern web applications",
      icon: FiMonitor,
      color: "warning",
      route: "/live-preview",
      features: ["Top navigation", "Modern design", "Horizontal menu", "Contemporary layout"]
    }
  ];

  return (
    <>
      <BreadcrumbItem mainTitle="Layout Options" mainLink="/layouts" subTitle="Choose Your Layout" />
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5 className="card-title mb-0">Available Layouts</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-0">
                Choose from different layout options to suit your application needs. Each layout is optimized 
                for different use cases and user preferences.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        {layouts.map((layout, index) => (
          <Col key={index} lg={6} xl={3} className="mb-4">
            <Card className={`${styles.card} h-100`}>
              <Card.Body className="text-center">
                <div className={`${styles.statIcon} bg-${layout.color} bg-opacity-10 text-${layout.color} mx-auto mb-3`}>
                  <layout.icon size={32} />
                </div>
                <h5 className="card-title">{layout.title}</h5>
                <p className="text-muted small mb-3">{layout.description}</p>
                
                <div className="mb-3">
                  <h6 className="small text-muted mb-2">Features:</h6>
                  <ul className="list-unstyled small">
                    {layout.features.map((feature, idx) => (
                      <li key={idx} className="mb-1">
                        <FiGrid size={12} className="text-success me-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link href={layout.route} passHref>
                  <Button variant={layout.color} className={`w-100 ${styles.btn}`}>
                    View Layout
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-4">
        <Col lg={12}>
          <Card className={styles.card}>
            <Card.Header>
              <h6 className="mb-0">Layout Comparison</h6>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Compact</th>
                      <th>Single Page</th>
                      <th>Vertical</th>
                      <th>Horizontal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Sidebar Width</td>
                      <td><Badge bg="success">Compact</Badge></td>
                      <td><Badge bg="primary">Standard</Badge></td>
                      <td><Badge bg="primary">Standard</Badge></td>
                      <td><Badge bg="warning">None</Badge></td>
                    </tr>
                    <tr>
                      <td>Content Area</td>
                      <td><Badge bg="success">Optimized</Badge></td>
                      <td><Badge bg="primary">Full</Badge></td>
                      <td><Badge bg="primary">Standard</Badge></td>
                      <td><Badge bg="success">Maximum</Badge></td>
                    </tr>
                    <tr>
                      <td>Navigation</td>
                      <td><Badge bg="info">Icons Only</Badge></td>
                      <td><Badge bg="primary">Tabbed</Badge></td>
                      <td><Badge bg="primary">Full Menu</Badge></td>
                      <td><Badge bg="warning">Top Bar</Badge></td>
                    </tr>
                    <tr>
                      <td>Best For</td>
                      <td>Data-heavy apps</td>
                      <td>Admin dashboards</td>
                      <td>Traditional apps</td>
                      <td>Modern web apps</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

Layouts.getLayout = (page: ReactElement) => {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default Layouts; 