import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Col, Row, Card } from "react-bootstrap";
import { 
  Ticket,
  BookOpen,
  HelpCircle,
  FileText,
  MessageSquare
} from 'lucide-react';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

// Import Tickets component
import TicketsDashboard from "@pages/tickets/dashboard";

// Import Resources components
import Resources from "@pages/resources";
import FAQ from "@pages/resources/faq";
import HelpMaterials from "@pages/resources/help-materials";
import ContactSupport from "@pages/resources/contact-support";

const HelpCenter = () => {
  const [activeTab, setActiveTab] = useState<string>("tickets");

  // Define tabs with icons and colors
  const tabs = [
    {
      key: "tickets",
      title: "Tickets",
      icon: Ticket,
      color: "#2196f3"
    },
    {
      key: "resources",
      title: "Resources",
      icon: BookOpen,
      color: "#0d6efd"
    },
    {
      key: "faq",
      title: "FAQ",
      icon: HelpCircle,
      color: "#ff9800"
    },
    {
      key: "help-materials",
      title: "Help Materials",
      icon: FileText,
      color: "#198754"
    },
    {
      key: "contact-support",
      title: "Contact Support",
      icon: MessageSquare,
      color: "#9c27b0"
    }
  ];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <React.Fragment>
      <style>{`
        .help-center-filter-buttons {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 0;
          padding: 0;
          width: 100%;
        }

        .help-center-filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
          white-space: nowrap;
        }

        .help-center-filter-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .help-center-filter-button.active {
          color: white;
        }

        .help-center-filter-button.active .filter-icon {
          color: white;
        }

        .help-center-filter-button:not(.active) .filter-icon {
          color: inherit;
        }

        .filter-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Help Center" />

      <PageHeader
        title="Help Center"
        showSearch={false}
      />

      <Row>
        <Col md={12}>
          <Card className="shadow-sm border-0">
            <Card.Body style={{ padding: 0 }}>
              {/* Main Filter Buttons */}
              <div>
                <div className="help-center-filter-buttons shadow px-3 py-3">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        className={`help-center-filter-button ${isActive ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.key)}
                        style={{
                          backgroundColor: isActive ? tab.color : 'white',
                          borderColor: isActive ? tab.color : tab.color,
                          color: isActive ? 'white' : tab.color
                        }}
                      >
                        <IconComponent className="filter-icon" size={18} />
                        <span>{tab.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div style={{ padding: '24px' }}>
                {activeTab === "tickets" && (
                  <div>
                    <TicketsDashboard />
                  </div>
                )}

                {activeTab === "resources" && (
                  <div>
                    <Resources />
                  </div>
                )}

                {activeTab === "faq" && (
                  <div>
                    <FAQ />
                  </div>
                )}

                {activeTab === "help-materials" && (
                  <div>
                    <HelpMaterials />
                  </div>
                )}

                {activeTab === "contact-support" && (
                  <div>
                    <ContactSupport />
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

HelpCenter.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HelpCenter;
