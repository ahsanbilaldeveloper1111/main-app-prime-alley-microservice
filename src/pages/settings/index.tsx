import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Col, Row, Tab, Tabs, Card } from "react-bootstrap";
import { useSession } from 'next-auth/react';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

// Import ControlHub components
import Users from "@pages/controlhub/users";
import Teams from "@pages/controlhub/teams";
import Groups from "@pages/controlhub/groups";
import Ranks from "@pages/controlhub/ranks";

// Import CRM components
import Campaigns from "@pages/crm/campaigns";
import Products from "@pages/crm/products";
import Stages from "@pages/crm/stages";

// Import Telco Gateway components
import GsmAssign from "@pages/gsm/assign";
import GsmSync from "@pages/gsm/sync";
import CompanyPO from "@pages/gsm/company/po";

// Import Billing components
import PaymentMethods from "@pages/accounting/customer/payment-methods";

// Import NetOps components
import Devices from "@pages/netops/devices";
import Services from "@pages/netops/services";
import Alerts from "@pages/netops/alerts";

// Import Tickets components
import TicketStatuses from "@pages/tickets/statuses";
import TicketModules from "@pages/tickets/modules";
import ModuleCategories from "@pages/tickets/modules/categories";
import ModuleSubCategories from "@pages/tickets/modules/sub-categories";
import TicketTypes from "@pages/tickets/types";
import { HEADER_CONSTANTS} from "@constants/headerConstants";

// Destructure constants for easier use
const { MENU_LABELS, ICONS, PERMISSIONS, MENU_COLORS,BASE_URL } = HEADER_CONSTANTS;


const Settings = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>("user-management");
  const [activeUserManagementTab, setActiveUserManagementTab] = useState<string>("user-directory");
  const [activeCrmTab, setActiveCrmTab] = useState<string>("campaigns");
  const [activeTicketsTab, setActiveTicketsTab] = useState<string>("statuses");
  const [activeTelcoTab, setActiveTelcoTab] = useState<string>("assign-devices");
  const [activeNetopsTab, setActiveNetopsTab] = useState<string>("devices-list");
  
  // Track which tabs have been visited to prevent re-mounting
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["user-management"]));
  const [visitedUserManagementTabs, setVisitedUserManagementTabs] = useState<Set<string>>(new Set(["user-directory"]));
  const [visitedCrmTabs, setVisitedCrmTabs] = useState<Set<string>>(new Set(["campaigns"]));
  const [visitedTicketsTabs, setVisitedTicketsTabs] = useState<Set<string>>(new Set(["statuses"]));
  const [visitedTelcoTabs, setVisitedTelcoTabs] = useState<Set<string>>(new Set(["assign-devices"]));
  const [visitedNetopsTabs, setVisitedNetopsTabs] = useState<Set<string>>(new Set(["devices-list"]));
  const [visitedBillingTab, setVisitedBillingTab] = useState<boolean>(false);

  // Handle main tab change
  const handleMainTabChange = (key: string | null) => {
    const tabKey = key || "user-management";
    setActiveTab(tabKey);
    setVisitedTabs(prev => new Set(prev).add(tabKey));
    // Track billing tab when it becomes active
    if (tabKey === "billing") {
      setVisitedBillingTab(true);
    }
  };

  // Handle sub-tab changes
  const handleUserManagementTabChange = (key: string | null) => {
    const tabKey = key || "user-directory";
    setActiveUserManagementTab(tabKey);
    setVisitedUserManagementTabs(prev => new Set(prev).add(tabKey));
  };

  const handleCrmTabChange = (key: string | null) => {
    const tabKey = key || "campaigns";
    setActiveCrmTab(tabKey);
    setVisitedCrmTabs(prev => new Set(prev).add(tabKey));
  };

  const handleTicketsTabChange = (key: string | null) => {
    const tabKey = key || "statuses";
    setActiveTicketsTab(tabKey);
    setVisitedTicketsTabs(prev => new Set(prev).add(tabKey));
  };

  const handleTelcoTabChange = (key: string | null) => {
    const tabKey = key || "assign-devices";
    setActiveTelcoTab(tabKey);
    setVisitedTelcoTabs(prev => new Set(prev).add(tabKey));
  };

  const handleNetopsTabChange = (key: string | null) => {
    const tabKey = key || "devices-list";
    setActiveNetopsTab(tabKey);
    setVisitedNetopsTabs(prev => new Set(prev).add(tabKey));
  };

  // Check if a tab should render
  const shouldRenderTab = (mainTab: string, subTab?: string) => {
    if (!visitedTabs.has(mainTab)) return false;
    if (activeTab !== mainTab) return false;
    
    if (subTab) {
      switch (mainTab) {
        case "user-management":
          return visitedUserManagementTabs.has(subTab) && activeUserManagementTab === subTab;
        case "crm":
          return visitedCrmTabs.has(subTab) && activeCrmTab === subTab;
        case "tickets":
          return visitedTicketsTabs.has(subTab) && activeTicketsTab === subTab;
        case "telco-gateway":
          return visitedTelcoTabs.has(subTab) && activeTelcoTab === subTab;
        case "devices-management":
          return visitedNetopsTabs.has(subTab) && activeNetopsTab === subTab;
        case "billing":
          return visitedBillingTab;
        default:
          return false;
      }
    }
    return true;
  };

  return (
    <React.Fragment>
      <style>{`
        #settings-tabs .nav-link {
          font-weight: 500;
          padding: 12px 24px;
          margin-right: 8px;
          border-radius: 8px 8px 0 0;
          transition: all 0.3s ease;
          color: #6c757d;
          border: none;
          background: transparent;
        }
        
        #settings-tabs .nav-link:hover {
          color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.05);
        }
        
        #settings-tabs .nav-link.active {
          color: #0d6efd;
          background-color: #fff;
          border-bottom: 3px solid #0d6efd;
          font-weight: 600;
        }
        
        .settings-sub-tabs .nav-link {
          font-weight: 500;
          padding: 10px 20px;
          margin-right: 6px;
          border-radius: 6px 6px 0 0;
          transition: all 0.3s ease;
          color: #6c757d;
          border: none;
          background: transparent;
          font-size: 0.95rem;
        }
        
        .settings-sub-tabs .nav-link:hover {
          color: #198754;
          background-color: rgba(25, 135, 84, 0.05);
        }
        
        .settings-sub-tabs .nav-link.active {
          color: #198754;
          background-color: #fff;
          border-bottom: 3px solid #198754;
          font-weight: 600;
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Settings" />

      <PageHeader
        title="Settings"
        showSearch={false}
      />

      <Row>
        <Col md={12}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Tabs
                activeKey={activeTab}
                onSelect={handleMainTabChange}
                id="settings-tabs"
                className="settings-main-tabs"
                style={{
                  borderBottom: '2px solid #e9ecef',
                  padding: '0 20px',
                  marginBottom: 0
                }}
              >
            
            {/* User Management Tab */}
            <Tab eventKey="user-management" title="User Management">
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                <Row>
                  <Col md={12}>
                    <Tabs
                      activeKey={activeUserManagementTab}
                      onSelect={handleUserManagementTabChange}
                      id="user-management-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >
                     
                     {session?.user?.permissions?.includes(PERMISSIONS.VIEW_USERS) && (
                  <Tab eventKey="user-directory" title="User Directory">
                        {shouldRenderTab("user-management", "user-directory") && (
                          <div style={{ marginTop: '20px' }}>
                            <Users />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TEAMS) && (
                      <Tab eventKey="supervisor-teams" title="Supervisor Teams">
                        {shouldRenderTab("user-management", "supervisor-teams") && (
                          <div style={{ marginTop: '20px' }}>
                            <Teams />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_GROUPS) && (
                      
                      <Tab eventKey="management-groups" title="Management Groups">
                        {shouldRenderTab("user-management", "management-groups") && (
                          <div style={{ marginTop: '20px' }}>
                            <Groups />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_RANKS) && (
                      <Tab eventKey="ranks-and-permissions" title="Ranks and Permissions">
                        {shouldRenderTab("user-management", "ranks-and-permissions") && (
                          <div style={{ marginTop: '20px' }}>
                            <Ranks />
                          </div>
                        )}
                      </Tab>
                      )}

                    </Tabs>
                  </Col>
                </Row>
              </div>
            </Tab>
            
            {/* CRM Tab */}
            <Tab eventKey="crm" title="CRM Management">
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                <Row>
                  <Col md={12}>
                    <Tabs
                      activeKey={activeCrmTab}
                      onSelect={handleCrmTabChange}
                      id="crm-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_CAMPAIGNS) && (
                      <Tab eventKey="campaigns" title="Campaigns">
                        {shouldRenderTab("crm", "campaigns") && (
                          <div style={{ marginTop: '20px' }}>
                            <Campaigns />
                          </div>
                        )}
                      </Tab>
                      )}
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_PRODUCTS) && (
                      <Tab eventKey="products" title="Products">
                        {shouldRenderTab("crm", "products") && (
                          <div style={{ marginTop: '20px' }}>
                            <Products />
                          </div>
                        )}
                      </Tab>
                      )}
                      
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_STAGES) && (
                      <Tab eventKey="stages" title="Stages">
                        {shouldRenderTab("crm", "stages") && (
                          <div style={{ marginTop: '20px' }}>
                            <Stages />
                          </div>
                        )}
                      </Tab>
                      )}

                    </Tabs>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Telco Gateway Tab */}
            <Tab eventKey="telco-gateway" title="Telco Gateway">
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                <Row>
                  <Col md={12}>
                    <Tabs
                      activeKey={activeTelcoTab}
                      onSelect={handleTelcoTabChange}
                      id="telco-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >
                      
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_GSM_ASSIGNMENT) && (
                      <Tab eventKey="assign-devices" title="Assign Devices">
                        {shouldRenderTab("telco-gateway", "assign-devices") && (
                          <div style={{ marginTop: '20px' }}>
                            <GsmAssign />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_GSM_SYNC) && (
                      <Tab eventKey="sync-gsm" title="Sync GSM">
                        {shouldRenderTab("telco-gateway", "sync-gsm") && (
                          <div style={{ marginTop: '20px' }}>
                            <GsmSync />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING) && (

                      <Tab eventKey="company-profiling" title="Company Profiling">
                        {shouldRenderTab("telco-gateway", "company-profiling") && (
                          <div style={{ marginTop: '20px' }}>
                            <CompanyPO />
                          </div>
                        )}
                      </Tab>
                      )}

                    </Tabs>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Billing Tab */}
            <Tab eventKey="billing" title="Billing & Payments">
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                <Row>
                  <Col md={12}>
                    <div style={{ marginTop: '20px' }}>
                      {shouldRenderTab("billing") && session?.user?.permissions?.includes(PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING) && (
                      <PaymentMethods />
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            </Tab>

            

            {/* Netops Tab */}
            <Tab eventKey="devices-management" title="Devices Management (NetOps)">
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                <Row>
                  <Col md={12}>
                    <Tabs
                      activeKey={activeNetopsTab}
                      onSelect={handleNetopsTabChange}
                      id="netops-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >

{session?.user?.permissions?.includes(PERMISSIONS.VIEW_NETOPS_DEVICES) && (
                      <Tab eventKey="devices-list" title="Devices List">
                        {shouldRenderTab("devices-management", "devices-list") && (
                          <div style={{ marginTop: '20px' }}>
                            <Devices />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_SERVICES_NETOPS) && (
                      <Tab eventKey="services" title="Services">
                        {shouldRenderTab("devices-management", "services") && (
                          <div style={{ marginTop: '20px' }}>
                            <Services />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_NETOPS_ALERTS) && (
                      <Tab eventKey="alerts" title="Alerts">
                        {shouldRenderTab("devices-management", "alerts") && (
                          <div style={{ marginTop: '20px' }}>
                            <Alerts />
                          </div>
                        )}
                      </Tab>
                      )}


                    </Tabs>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Tickets Tab */}
            <Tab eventKey="tickets" title="Tickets">
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                <Row>
                  <Col md={12}>
                    <Tabs
                      activeKey={activeTicketsTab}
                      onSelect={handleTicketsTabChange}
                      id="tickets-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_STATUS) && (
                      <Tab eventKey="statuses" title="Statuses">
                        {shouldRenderTab("tickets", "statuses") && (
                          <div style={{ marginTop: '20px' }}>
                            <TicketStatuses />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_MODULES) && (

                      <Tab eventKey="modules" title="Modules">
                        {shouldRenderTab("tickets", "modules") && (
                          <div style={{ marginTop: '20px' }}>
                            <TicketModules />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_CATEGORIES) && (
                      <Tab eventKey="categories" title="Categories">
                        {shouldRenderTab("tickets", "categories") && (
                          <div style={{ marginTop: '20px' }}>
                            <ModuleCategories />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES) && (
                      <Tab eventKey="sub-categories" title="Sub Categories">
                        {shouldRenderTab("tickets", "sub-categories") && (
                          <div style={{ marginTop: '20px' }}>
                            <ModuleSubCategories />
                          </div>
                        )}
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_TYPES) && (
                      <Tab eventKey="types" title="Types">
                        {shouldRenderTab("tickets", "types") && (
                          <div style={{ marginTop: '20px' }}>
                            <TicketTypes />
                          </div>
                        )}
                      </Tab>
                      )}

                    </Tabs>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

Settings.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Settings;
