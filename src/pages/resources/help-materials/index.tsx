import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Modal, Row, Card, Tab, Tabs } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { FiDownload, FiPlay, FiExternalLink, FiBookOpen, FiFileText, FiVideo, FiCode, FiGraduationCap } from "react-icons/fi";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

const HelpMaterials = () => {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("documents");

  const documentMaterials = [
    {
      id: 1,
      title: "User Manual v2.1",
      description: "Complete user guide covering all features and functionality",
      type: "PDF",
      size: "2.4 MB",
      lastUpdated: "2024-01-15",
      icon: FiFileText,
      color: "danger"
    },
    {
      id: 2,
      title: "Quick Start Guide",
      description: "Get up and running in 5 minutes with this quick reference",
      type: "PDF",
      size: "850 KB",
      lastUpdated: "2024-01-10",
      icon: FiBookOpen,
      color: "primary"
    },
    {
      id: 3,
      title: "API Reference",
      description: "Complete API documentation for developers",
      type: "PDF",
      size: "5.2 MB",
      lastUpdated: "2024-01-12",
      icon: FiCode,
      color: "warning"
    },
    {
      id: 4,
      title: "Security Best Practices",
      description: "Guidelines for maintaining security and data protection",
      type: "PDF",
      size: "1.1 MB",
      lastUpdated: "2024-01-08",
      icon: FiFileText,
      color: "success"
    }
  ];

  const videoMaterials = [
    {
      id: 1,
      title: "Platform Overview",
      description: "Complete walkthrough of the platform features",
      duration: "12:30",
      views: "2.3K",
      thumbnail: "/api/placeholder/300/200",
      icon: FiPlay,
      color: "primary"
    },
    {
      id: 2,
      title: "Setting Up Your Account",
      description: "Step-by-step account setup and configuration",
      duration: "8:45",
      views: "1.8K",
      thumbnail: "/api/placeholder/300/200",
      icon: FiPlay,
      color: "info"
    },
    {
      id: 3,
      title: "Advanced Features",
      description: "Learn about advanced features and customization",
      duration: "15:20",
      views: "956",
      thumbnail: "/api/placeholder/300/200",
      icon: FiPlay,
      color: "success"
    },
    {
      id: 4,
      title: "Troubleshooting Common Issues",
      description: "Solutions to frequently encountered problems",
      duration: "6:15",
      views: "1.2K",
      thumbnail: "/api/placeholder/300/200",
      icon: FiPlay,
      color: "warning"
    }
  ];

  const courseMaterials = [
    {
      id: 1,
      title: "Platform Fundamentals",
      description: "Complete course covering basic platform usage",
      duration: "2 hours",
      lessons: 12,
      progress: 0,
      icon: FiGraduationCap,
      color: "primary"
    },
    {
      id: 2,
      title: "Advanced Configuration",
      description: "Learn advanced configuration and customization",
      duration: "3 hours",
      lessons: 18,
      progress: 0,
      icon: FiGraduationCap,
      color: "success"
    },
    {
      id: 3,
      title: "API Integration",
      description: "Developer course for API integration",
      duration: "4 hours",
      lessons: 24,
      progress: 0,
      icon: FiGraduationCap,
      color: "warning"
    }
  ];

  const handleDownload = (material: any) => {
    // Implement download functionality
    console.log("Downloading:", material.title);
  };

  const handleWatch = (material: any) => {
    // Implement video watching functionality
    console.log("Watching:", material.title);
  };

  const handleStartCourse = (material: any) => {
    // Implement course starting functionality
    console.log("Starting course:", material.title);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Resources"
        mainLink="/resources"
        subTitle="Help Materials"
      />

      <PageHeader
        title="Help Materials" leftGrid={12}
      />

      <Row className="mt-4">
        <Col lg={12}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h4 className="mb-0 text-white">
                <i className="fas fa-book me-2"></i>
                Learning Resources
              </h4>
            </Card.Header>
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || "documents")}
                className="mb-4"
              >
                <Tab eventKey="documents" title="Documents">
                  <Row>
                    {documentMaterials.map((material) => (
                      <Col md={6} lg={4} key={material.id} className="mb-4">
                        <Card className="h-100">
                          <Card.Body>
                            <div className="d-flex align-items-start mb-3">
                              <div className="flex-shrink-0">
                                <material.icon className={`text-${material.color} fs-3`} />
                              </div>
                              <div className="flex-grow-1 ms-3">
                                <h6 className="mb-1">{material.title}</h6>
                                <p className="text-muted small mb-2">{material.description}</p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge bg-light text-dark">{material.type}</span>
                                  <small className="text-muted">{material.size}</small>
                                </div>
                                <small className="text-muted d-block mt-1">
                                  Updated: {material.lastUpdated}
                                </small>
                              </div>
                            </div>
                            <Button
                              variant={material.color}
                              size="sm"
                              className="w-100"
                              onClick={() => handleDownload(material)}
                            >
                              <FiDownload className="me-2" />
                              Download
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Tab>

                <Tab eventKey="videos" title="Video Tutorials">
                  <Row>
                    {videoMaterials.map((material) => (
                      <Col md={6} lg={4} key={material.id} className="mb-4">
                        <Card className="h-100">
                          <div className="position-relative">
                            <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '150px'}}>
                              <material.icon className={`text-${material.color} fs-1`} />
                            </div>
                            <div className="position-absolute top-0 end-0 m-2">
                              <span className="badge bg-dark">{material.duration}</span>
                            </div>
                          </div>
                          <Card.Body>
                            <h6 className="mb-2">{material.title}</h6>
                            <p className="text-muted small mb-3">{material.description}</p>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <small className="text-muted">
                                <i className="fas fa-eye me-1"></i>
                                {material.views} views
                              </small>
                            </div>
                            <Button
                              variant={material.color}
                              size="sm"
                              className="w-100"
                              onClick={() => handleWatch(material)}
                            >
                              <FiPlay className="me-2" />
                              Watch Now
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Tab>

                <Tab eventKey="courses" title="Training Courses">
                  <Row>
                    {courseMaterials.map((material) => (
                      <Col md={6} lg={4} key={material.id} className="mb-4">
                        <Card className="h-100">
                          <Card.Body>
                            <div className="d-flex align-items-start mb-3">
                              <div className="flex-shrink-0">
                                <material.icon className={`text-${material.color} fs-3`} />
                              </div>
                              <div className="flex-grow-1 ms-3">
                                <h6 className="mb-1">{material.title}</h6>
                                <p className="text-muted small mb-2">{material.description}</p>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <small className="text-muted">
                                    <i className="fas fa-clock me-1"></i>
                                    {material.duration}
                                  </small>
                                  <small className="text-muted">
                                    <i className="fas fa-list me-1"></i>
                                    {material.lessons} lessons
                                  </small>
                                </div>
                                <div className="progress mb-3" style={{height: '4px'}}>
                                  <div 
                                    className={`progress-bar bg-${material.color}`}
                                    style={{width: `${material.progress}%`}}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant={material.color}
                              size="sm"
                              className="w-100"
                              onClick={() => handleStartCourse(material)}
                            >
                              <FiBookOpen className="me-2" />
                              {material.progress > 0 ? 'Continue' : 'Start Course'}
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      

    </React.Fragment>
  );
};

HelpMaterials.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HelpMaterials;
