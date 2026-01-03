import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Row, Col, Card } from 'react-bootstrap';
import Link from 'next/link';
import { Layers, HelpCircle, Tag } from 'lucide-react';
import '@assets/scss/common.scss';

const FAQs = () => {
  const sections = [
    {
      id: 'modules',
      title: 'FAQ Modules',
      description: 'Manage FAQ modules - categories that group related FAQs together',
      icon: <Layers size={48} className="text-primary" />,
      link: '/faqs/modules',
      color: 'primary'
    },
    {
      id: 'items',
      title: 'FAQ Items',
      description: 'Manage individual FAQ questions and answers within modules',
      icon: <HelpCircle size={48} className="text-success" />,
      link: '/faqs/items',
      color: 'success'
    },
    {
      id: 'types',
      title: 'FAQ Types',
      description: 'View and manage FAQ types used across all FAQ items',
      icon: <Tag size={48} className="text-info" />,
      link: '/faqs/types',
      color: 'info'
    }
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="FAQ Management" />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <h2 className="mb-0">FAQ Management</h2>
            <p className="text-muted">Manage your FAQ modules, items, and types</p>
          </div>
        </Col>
      </Row>

      <Row>
        {sections.map((section) => (
          <Col md={4} key={section.id} className="mb-4">
            <Link href={section.link} style={{ textDecoration: 'none' }}>
              <Card className="h-100 shadow-sm hover-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                <Card.Body className="text-center p-4">
                  <div className="mb-3">
                    {section.icon}
                  </div>
                  <h4 className="mb-2">{section.title}</h4>
                  <p className="text-muted mb-0">{section.description}</p>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </React.Fragment>
  );
};

FAQs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQs;
