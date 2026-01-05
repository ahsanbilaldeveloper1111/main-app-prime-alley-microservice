import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Col, Row, Card } from "react-bootstrap";
import { 
  Layers, 
  HelpCircle, 
  Tag 
} from 'lucide-react';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

// Import FAQ components
import FAQModules from "@pages/faqs/modules";
import FAQTopics from "@pages/faqs/topics";
import FAQItems from "@pages/faqs/items";
import FAQTypes from "@pages/faqs/types";

const FAQs = () => {
  const [activeTab, setActiveTab] = useState<string>("modules");
  
  // Track which tabs have been visited to prevent re-mounting
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["modules"]));

  // Handle main tab change
  const handleMainTabChange = (key: string = "modules") => {
    setActiveTab(key);
    setVisitedTabs(prev => new Set(prev).add(key));
  };

  // Check if a tab should render
  const shouldRenderTab = (tab: string) => {
    if (!visitedTabs.has(tab)) return false;
    if (activeTab !== tab) return false;
    return true;
  };

  // Define main tabs with icons and colors
  const mainTabs = [
    {
      key: "modules",
      title: "FAQ Modules",
      icon: Layers,
      color: "#0d6efd",
    },
    {
      key: "topics",
      title: "FAQ Topics",
      icon: Tag,
      color: "#ff9800",
    },
    {
      key: "items",
      title: "FAQ Items",
      icon: HelpCircle,
      color: "#198754",
    },
    {
      key: "types",
      title: "FAQ Types",
      icon: Tag,
      color: "#17a2b8",
    }
  ];

  return (
    <React.Fragment>
      <style>{`
        .faqs-filter-buttons {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 0;
          padding: 0;
          width: 100%;
        }

        .faqs-filter-button {
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

        .faqs-filter-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .faqs-filter-button.active {
          color: white;
        }

        .faqs-filter-button.active .filter-icon {
          color: white;
        }

        .faqs-filter-button:not(.active) .filter-icon {
          color: inherit;
        }

        .filter-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
      `}</style>
      <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="FAQ Management" />

      <PageHeader
        title="FAQ Management"
        showSearch={false}
      />

      <Row>
        <Col md={12}>
          <Card className="shadow-sm border-0">
            <Card.Body style={{ padding: 0 }}>
              {/* Main Filter Buttons - At the top */}
              <div>
                <div className="faqs-filter-buttons shadow px-3 py-3">
                  {mainTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        className={`faqs-filter-button ${isActive ? 'active' : ''}`}
                        onClick={() => handleMainTabChange(tab.key)}
                        type="button"
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
                {/* Modules Content */}
                {activeTab === "modules" && shouldRenderTab("modules") && (
                  <div>
                    <FAQModules />
                  </div>
                )}

                {/* Topics Content */}
                {activeTab === "topics" && shouldRenderTab("topics") && (
                  <div>
                    <FAQTopics />
                  </div>
                )}

                {/* Items Content */}
                {activeTab === "items" && shouldRenderTab("items") && (
                  <div>
                    <FAQItems />
                  </div>
                )}

                {/* Types Content */}
                {activeTab === "types" && shouldRenderTab("types") && (
                  <div>
                    <FAQTypes />
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

FAQs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQs;
