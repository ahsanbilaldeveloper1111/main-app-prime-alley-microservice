import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';
import { 
  FiUsers, 
  FiTarget, 
  FiCalendar, 
  FiSettings,
  FiTrendingUp,
  FiDollarSign,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe
} from 'react-icons/fi';

const CrmIndex = () => {
  const crmModules = [
    {
      title: 'Dashboard',
      description: 'Overview of CRM performance and key metrics',
      icon: FiUsers,
      color: 'primary',
      route: '/crm/dashboard',
      features: ['Key metrics', 'Performance charts', 'Recent activities', 'Quick insights']
    },
    {
      title: 'Leads',
      description: 'Manage and track your sales leads',
      icon: FiUsers,
      color: 'success',
      route: '/crm/leads',
      features: ['Lead management', 'Stage tracking', 'Conversion tools', 'Lead scoring']
    },
    {
      title: 'Opportunities',
      description: 'Track sales opportunities and deals',
      icon: FiTarget,
      color: 'info',
      route: '/crm/opportunities',
      features: ['Pipeline management', 'Deal tracking', 'Forecasting', 'Win probability']
    },
    {
      title: 'Meetings',
      description: 'Schedule and manage customer meetings',
      icon: FiCalendar,
      color: 'warning',
      route: '/crm/meetings',
      features: ['Meeting scheduling', 'Calendar integration', 'Follow-up tracking', 'Meeting notes']
    },
    {
      title: 'Stages',
      description: 'Configure sales pipeline stages',
      icon: FiTrendingUp,
      color: 'secondary',
      route: '/crm/stages',
      features: ['Pipeline configuration', 'Stage management', 'Workflow setup', 'Process optimization']
    },
    {
      title: 'Lost Reasons',
      description: 'Track and analyze lost opportunities',
      icon: FiDollarSign,
      color: 'danger',
      route: '/crm/lost-reasons',
      features: ['Loss analysis', 'Reason tracking', 'Improvement insights', 'Performance metrics']
    }
  ];

  const quickActions = [
    {
      title: 'Add New Lead',
      description: 'Create a new lead record',
      icon: FiUsers,
      color: 'success',
      route: '/crm/leads/create',
      action: 'Create'
    },
    {
      title: 'Schedule Meeting',
      description: 'Book a customer meeting',
      icon: FiCalendar,
      color: 'info',
      route: '/crm/meetings/create',
      action: 'Schedule'
    },
    {
      title: 'Create Opportunity',
      description: 'Convert lead to opportunity',
      icon: FiTarget,
      color: 'warning',
      route: '/crm/opportunities/create',
      action: 'Create'
    },
    {
      title: 'View Reports',
      description: 'Access CRM analytics',
      icon: FiUsers,
      color: 'primary',
      route: '/crm/reports',
      action: 'View'
    }
  ];

  const recentStats = [
    {
      title: 'Total Leads',
      value: '1,247',
      change: '+12%',
      changeType: 'positive',
      icon: FiUsers,
      color: 'primary'
    },
    {
      title: 'Active Opportunities',
      value: '89',
      change: '+5%',
      changeType: 'positive',
      icon: FiTarget,
      color: 'success'
    },
    {
      title: 'Pipeline Value',
      value: '$2.4M',
      change: '+18%',
      changeType: 'positive',
      icon: FiDollarSign,
      color: 'warning'
    },
    {
      title: 'Conversion Rate',
      value: '23%',
      change: '+2%',
      changeType: 'positive',
      icon: FiTrendingUp,
      color: 'info'
    }
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CRM" mainLink="/crm" subTitle="Customer Relationship Management" />
      
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div className="page-header-title">
            <h1 className="display-6 fw-bold text-dark mb-2">CRM Dashboard</h1>
            <p className="text-muted fs-5">Manage your customer relationships, track leads, and close more deals</p>
          </div>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mb-4">
        {recentStats.map((stat, index) => (
          <Col key={index} lg={3} md={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <div className={`bg-${stat.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '60px', height: '60px' }}>
                    <stat.icon className={`text-${stat.color}`} size={24} />
                  </div>
                </div>
                <h3 className="mb-1">{stat.value}</h3>
                <p className="text-muted mb-1">{stat.title}</p>
                <small className={`text-${stat.changeType === 'positive' ? 'success' : 'danger'}`}>
                  {stat.change} from last month
                </small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {quickActions.map((action, index) => (
                  <Col key={index} lg={3} md={6} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="text-center">
                        <div className={`bg-${action.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3`} style={{ width: '50px', height: '50px' }}>
                          <action.icon className={`text-${action.color}`} size={20} />
                        </div>
                        <h6 className="card-title">{action.title}</h6>
                        <p className="text-muted small mb-3">{action.description}</p>
                        <Link href={action.route} passHref>
                          <Button variant={action.color} size="sm" className="w-100">
                            {action.action}
                          </Button>
                        </Link>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CRM Modules */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0">
              <h5 className="mb-0">CRM Modules</h5>
              <p className="text-muted mb-0">Access different areas of your CRM system</p>
            </Card.Header>
            <Card.Body>
              <Row>
                {crmModules.map((module, index) => (
                  <Col key={index} lg={4} md={6} className="mb-4">
                    <Card className={`h-100 border-0 shadow-sm border-${module.color} border-opacity-25`}>
                      <Card.Body>
                        <div className="d-flex align-items-start mb-3">
                          <div className={`bg-${module.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3`} style={{ width: '50px', height: '50px' }}>
                            <module.icon className={`text-${module.color}`} size={20} />
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="card-title mb-1">{module.title}</h5>
                            <p className="text-muted small mb-2">{module.description}</p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <h6 className="small text-muted mb-2">Features:</h6>
                          <ul className="list-unstyled small">
                            {module.features.map((feature, idx) => (
                              <li key={idx} className="mb-1">
                                <FiMapPin size={12} className="text-success me-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <Link href={module.route} passHref>
                          <Button variant={module.color} className="w-100">
                            Access {module.title}
                          </Button>
                        </Link>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Getting Started Guide */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0">
              <h5 className="mb-0">Getting Started with CRM</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="mb-3">1. Set Up Your Pipeline</h6>
                  <p className="text-muted small mb-3">
                    Configure your sales stages and workflow to match your business process.
                  </p>
                  <Link href="/crm/stages" passHref>
                    <Button variant="outline-primary" size="sm">Configure Stages</Button>
                  </Link>
                </Col>
                <Col md={6}>
                  <h6 className="mb-3">2. Import Your Leads</h6>
                  <p className="text-muted small mb-3">
                    Start by importing your existing leads or create new ones manually.
                  </p>
                  <Link href="/crm/leads/create" passHref>
                    <Button variant="outline-success" size="sm">Add First Lead</Button>
                  </Link>
                </Col>
              </Row>
              
              <hr className="my-4" />
              
              <Row>
                <Col md={6}>
                  <h6 className="mb-3">3. Schedule Meetings</h6>
                  <p className="text-muted small mb-3">
                    Use the meeting scheduler to organize customer interactions and follow-ups.
                  </p>
                  <Link href="/crm/meetings/create" passHref>
                    <Button variant="outline-info" size="sm">Schedule Meeting</Button>
                  </Link>
                </Col>
                <Col md={6}>
                  <h6 className="mb-3">4. Track Performance</h6>
                  <p className="text-muted small mb-3">
                    Monitor your CRM metrics and performance through the dashboard.
                  </p>
                  <Link href="/crm/dashboard" passHref>
                    <Button variant="outline-warning" size="sm">View Dashboard</Button>
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Support & Help */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm bg-light">
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                  <FiSettings size={20} />
                </div>
                <h5 className="mb-0">Need Help?</h5>
              </div>
              <p className="text-muted mb-3">
                Get support and learn how to make the most of your CRM system
              </p>
              <div className="d-flex justify-content-center gap-2">
                <Button variant="outline-primary" size="sm">
                  <FiGlobe className="me-2" />
                  Documentation
                </Button>
                <Button variant="outline-secondary" size="sm">
                  <FiMail className="me-2" />
                  Contact Support
                </Button>
                <Button variant="outline-info" size="sm">
                  <FiPhone className="me-2" />
                  Training
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

CrmIndex.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmIndex;
