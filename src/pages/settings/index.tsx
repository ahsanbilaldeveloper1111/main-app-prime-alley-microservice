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
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<string>("user-management");
  const [activeUserManagementTab, setActiveUserManagementTab] = useState<string>("user-directory");
  const [activeCrmTab, setActiveCrmTab] = useState<string>("campaigns");
  const [activeTicketsTab, setActiveTicketsTab] = useState<string>("statuses");
  const [activeTelcoTab, setActiveTelcoTab] = useState<string>("assign-devices");
  const [activeNetopsTab, setActiveNetopsTab] = useState<string>("devices-list");

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
                onSelect={(k) => setActiveTab(k || "user-management")}
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
                      onSelect={(k) => setActiveUserManagementTab(k || "user-directory")}
                      id="user-management-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >
                     
                     {session?.user?.permissions?.includes(PERMISSIONS.VIEW_USERS) && (
                  <Tab eventKey="user-directory" title="User Directory">
                        <div style={{ marginTop: '20px' }}>
                          <Users />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TEAMS) && (
                      <Tab eventKey="supervisor-teams" title="Supervisor Teams">
                        <div style={{ marginTop: '20px' }}>
                          <Teams />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_GROUPS) && (
                      
                      <Tab eventKey="management-groups" title="Management Groups">
                        <div style={{ marginTop: '20px' }}>
                          <Groups />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_RANKS) && (
                      <Tab eventKey="ranks-and-permissions" title="Ranks and Permissions">
                        <div style={{ marginTop: '20px' }}>
                          <Ranks />
                        </div>
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
                      onSelect={(k) => setActiveCrmTab(k || "campaigns")}
                      id="crm-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_CAMPAIGNS) && (
                      <Tab eventKey="campaigns" title="Campaigns">
                        <div style={{ marginTop: '20px' }}>
                          <Campaigns />
                        </div>
                      </Tab>
                      )}
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_PRODUCTS) && (
                      <Tab eventKey="products" title="Products">
                        <div style={{ marginTop: '20px' }}>
                          <Products />
                        </div>
                      </Tab>
                      )}
                      
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_STAGES) && (
                      <Tab eventKey="stages" title="Stages">
                        <div style={{ marginTop: '20px' }}>
                          <Stages />
                          </div>
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
                      onSelect={(k) => setActiveTelcoTab(k || "assign-devices")}
                      id="telco-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >
                      
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_GSM_ASSIGNMENT) && (
                      <Tab eventKey="assign-devices" title="Assign Devices">
                        <div style={{ marginTop: '20px' }}>
                          <GsmAssign />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_GSM_SYNC) && (
                      <Tab eventKey="sync-gsm" title="Sync GSM">
                        <div style={{ marginTop: '20px' }}>
                          <GsmSync />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING) && (

                      <Tab eventKey="company-profiling" title="Company Profiling">
                        <div style={{ marginTop: '20px' }}>
                          <CompanyPO />
                        </div>
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
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING) && (
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
                      onSelect={(k) => setActiveNetopsTab(k || "devices-list")}
                      id="netops-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >

{session?.user?.permissions?.includes(PERMISSIONS.VIEW_NETOPS_DEVICES) && (
                      <Tab eventKey="devices-list" title="Devices List">
                        <div style={{ marginTop: '20px' }}>
                          <Devices />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_SERVICES_NETOPS) && (
                      <Tab eventKey="services" title="Services">
                        <div style={{ marginTop: '20px' }}>
                          <Services />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_NETOPS_ALERTS) && (
                      <Tab eventKey="alerts" title="Alerts">
                        <div style={{ marginTop: '20px' }}>
                          <Alerts />
                        </div>
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
                      onSelect={(k) => setActiveTicketsTab(k || "statuses")}
                      id="tickets-sub-tabs"
                      className="settings-sub-tabs"
                      style={{
                        borderBottom: '2px solid #dee2e6',
                        marginBottom: '20px'
                      }}
                    >
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_STATUS) && (
                      <Tab eventKey="statuses" title="Statuses">
                        <div style={{ marginTop: '20px' }}>
                          <TicketStatuses />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_MODULES) && (

                      <Tab eventKey="modules" title="Modules">
                        <div style={{ marginTop: '20px' }}>
                          <TicketModules />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_CATEGORIES) && (
                      <Tab eventKey="categories" title="Categories">
                        <div style={{ marginTop: '20px' }}>
                          <ModuleCategories />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES) && (
                      <Tab eventKey="sub-categories" title="Sub Categories">
                        <div style={{ marginTop: '20px' }}>
                          <ModuleSubCategories />
                        </div>
                      </Tab>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TICKETS_TYPES) && (
                      <Tab eventKey="types" title="Types">
                        <div style={{ marginTop: '20px' }}>
                          <TicketTypes />
                        </div>
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
