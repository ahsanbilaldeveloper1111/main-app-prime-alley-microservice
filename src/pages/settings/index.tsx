import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Col, Row, Card } from "react-bootstrap";
import { useSession } from 'next-auth/react';
import { 
  Users as UsersIcon, 
  Briefcase, 
  Phone, 
  CreditCard, 
  Network, 
  Ticket,
  Megaphone,
  Package,
  Layers,
  UserCheck,
  Building2,
  Shield,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  ArrowUp
} from 'lucide-react';

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

  // Define main tabs with icons and colors
  const mainTabs = [
    {
      key: "user-management",
      title: "User Management",
      icon: UsersIcon,
      color: "#6c757d",
      permission: PERMISSIONS.CONTROL_HUB_SERVICES
    },
    {
      key: "crm",
      title: "CRM Management",
      icon: Briefcase,
      color: "#0d6efd",
      permission: PERMISSIONS.CRM_SERVICES
    },
    {
      key: "telco-gateway",
      title: "Telco Gateway",
      icon: Phone,
      color: "#ff9800",
      permission: PERMISSIONS.GSM_SERVICES
    },
    {
      key: "billing",
      title: "Billing & Payments",
      icon: CreditCard,
      color: "#9c27b0",
      permission: PERMISSIONS.ACCOUNTS_SERVICES
    },
    {
      key: "devices-management",
      title: "Devices Management",
      icon: Network,
      color: "#f44336",
      permission: PERMISSIONS.NETOPS_SERVICES
    },
    {
      key: "tickets",
      title: "Tickets",
      icon: Ticket,
      color: "#2196f3",
      permission: PERMISSIONS.TICKETS_SERVICES
    }
  ];

  // Define sub-tabs for each main tab
  const subTabsConfig: Record<string, Array<{key: string, title: string, icon: any, color: string, permission: string}>> = {
    "user-management": [
      { key: "user-directory", title: "User Directory", icon: UsersIcon, color: "#6c757d", permission: PERMISSIONS.VIEW_USERS },
      { key: "supervisor-teams", title: "Supervisor Teams", icon: UserCheck, color: "#0d6efd", permission: PERMISSIONS.VIEW_TEAMS },
      { key: "management-groups", title: "Management Groups", icon: Building2, color: "#198754", permission: PERMISSIONS.VIEW_GROUPS },
      { key: "ranks-and-permissions", title: "Ranks and Permissions", icon: Shield, color: "#ff9800", permission: PERMISSIONS.VIEW_RANKS }
    ],
    "crm": [
      { key: "campaigns", title: "Campaigns", icon: Megaphone, color: "#0d6efd", permission: PERMISSIONS.VIEW_CRM_CAMPAIGNS },
      { key: "products", title: "Products", icon: Package, color: "#198754", permission: PERMISSIONS.VIEW_CRM_PRODUCTS },
      { key: "stages", title: "Stages", icon: Layers, color: "#ff9800", permission: PERMISSIONS.VIEW_CRM_STAGES }
    ],
    "telco-gateway": [
      { key: "assign-devices", title: "Assign Devices", icon: SettingsIcon, color: "#0d6efd", permission: PERMISSIONS.VIEW_GSM_ASSIGNMENT },
      { key: "sync-gsm", title: "Sync GSM", icon: ArrowUp, color: "#198754", permission: PERMISSIONS.VIEW_GSM_SYNC },
      { key: "company-profiling", title: "Company Profiling", icon: Building2, color: "#ff9800", permission: PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING }
    ],
    "devices-management": [
      { key: "devices-list", title: "Devices List", icon: Network, color: "#0d6efd", permission: PERMISSIONS.VIEW_NETOPS_DEVICES },
      { key: "services", title: "Services", icon: SettingsIcon, color: "#198754", permission: PERMISSIONS.VIEW_SERVICES_NETOPS },
      { key: "alerts", title: "Alerts", icon: AlertCircle, color: "#f44336", permission: PERMISSIONS.VIEW_NETOPS_ALERTS }
    ],
    "tickets": [
      { key: "statuses", title: "Statuses", icon: CheckCircle, color: "#0d6efd", permission: PERMISSIONS.VIEW_TICKETS_STATUS },
      { key: "modules", title: "Modules", icon: Layers, color: "#198754", permission: PERMISSIONS.VIEW_TICKETS_MODULES },
      { key: "categories", title: "Categories", icon: Package, color: "#ff9800", permission: PERMISSIONS.VIEW_TICKETS_CATEGORIES },
      { key: "sub-categories", title: "Sub Categories", icon: Layers, color: "#9c27b0", permission: PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES },
      { key: "types", title: "Types", icon: Ticket, color: "#2196f3", permission: PERMISSIONS.VIEW_TICKETS_TYPES }
    ]
  };

  const getActiveSubTab = (mainTab: string) => {
    switch(mainTab) {
      case "user-management": return activeUserManagementTab;
      case "crm": return activeCrmTab;
      case "tickets": return activeTicketsTab;
      case "telco-gateway": return activeTelcoTab;
      case "devices-management": return activeNetopsTab;
      default: return "";
    }
  };

  const handleSubTabClick = (mainTab: string, subTabKey: string) => {
    switch(mainTab) {
      case "user-management": handleUserManagementTabChange(subTabKey); break;
      case "crm": handleCrmTabChange(subTabKey); break;
      case "tickets": handleTicketsTabChange(subTabKey); break;
      case "telco-gateway": handleTelcoTabChange(subTabKey); break;
      case "devices-management": handleNetopsTabChange(subTabKey); break;
    }
  };

  return (
    <React.Fragment>
      <style>{`
        .settings-filter-buttons {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 0;
          padding: 0;
          width: 100%;
        }

        .settings-filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          border: 2px solid;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
          white-space: nowrap;
        }

        .settings-filter-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .settings-filter-button.active {
          background: #198754;
          color: white;
          border-color: #198754;
        }

        .settings-filter-button.active .filter-icon {
          color: white;
        }

        .settings-filter-button:not(.active) .filter-icon {
          color: inherit;
        }

        .settings-sub-filter-buttons {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 0;
          padding: 0;
          width: 100%;
        }

        .settings-sub-filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 2px solid;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
          white-space: nowrap;
        }

        .settings-sub-filter-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .settings-sub-filter-button.active {
          background: #198754;
          color: white;
          border-color: #198754;
        }

        .settings-sub-filter-button.active .filter-icon {
          color: white;
        }

        .settings-sub-filter-button:not(.active) .filter-icon {
          color: inherit;
        }

        .filter-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
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
            <Card.Body style={{ padding: 0 }}>
              {/* Main Filter Buttons - At the top */}
              <div >
                <div className="settings-filter-buttons shadow px-3 py-3">
                {mainTabs.map((tab) => {
                  if (!session?.user?.permissions?.includes(tab.permission)) return null;
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      className={`settings-filter-button ${isActive ? 'active' : ''}`}
                      onClick={() => handleMainTabChange(tab.key)}
                      style={{
                        borderColor: isActive ? '#198754' : tab.color,
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

              {/* Sub Filter Buttons */}
              {subTabsConfig[activeTab] && subTabsConfig[activeTab].length > 0 && (
                <div >
                  <div className="settings-sub-filter-buttons px-3 py-3 shadow">
                  {subTabsConfig[activeTab].map((subTab) => {
                    if (!session?.user?.permissions?.includes(subTab.permission)) return null;
                    const SubIconComponent = subTab.icon;
                    const isActive = getActiveSubTab(activeTab) === subTab.key;
                    return (
                      <button
                        key={subTab.key}
                        className={`settings-sub-filter-button ${isActive ? 'active' : ''}`}
                        onClick={() => handleSubTabClick(activeTab, subTab.key)}
                        style={{
                          borderColor: isActive ? '#198754' : subTab.color,
                          color: isActive ? 'white' : subTab.color
                        }}
                      >
                        <SubIconComponent className="filter-icon" size={16} />
                        <span>{subTab.title}</span>
                      </button>
                    );
                  })}
                  </div>
                </div>
              )}

              {/* Tab Content */}
              <div style={{ padding: '24px' }}>
                {/* User Management Content */}
                {activeTab === "user-management" && shouldRenderTab("user-management", activeUserManagementTab) && (
                  <div>
                    {activeUserManagementTab === "user-directory" && <Users />}
                    {activeUserManagementTab === "supervisor-teams" && <Teams />}
                    {activeUserManagementTab === "management-groups" && <Groups />}
                    {activeUserManagementTab === "ranks-and-permissions" && <Ranks />}
                  </div>
                )}
                {/* CRM Content */}
                {activeTab === "crm" && shouldRenderTab("crm", activeCrmTab) && (
                  <div>
                    {activeCrmTab === "campaigns" && <Campaigns />}
                    {activeCrmTab === "products" && <Products />}
                    {activeCrmTab === "stages" && <Stages />}
                  </div>
                )}

                {/* Telco Gateway Content */}
                {activeTab === "telco-gateway" && shouldRenderTab("telco-gateway", activeTelcoTab) && (
                  <div>
                    {activeTelcoTab === "assign-devices" && <GsmAssign />}
                    {activeTelcoTab === "sync-gsm" && <GsmSync />}
                    {activeTelcoTab === "company-profiling" && <CompanyPO />}
                  </div>
                )}

                {/* Billing Content */}
                {activeTab === "billing" && shouldRenderTab("billing") && session?.user?.permissions?.includes(PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING) && (
                  <div>
                    <PaymentMethods />
                  </div>
                )}

            

                {/* Devices Management Content */}
                {activeTab === "devices-management" && shouldRenderTab("devices-management", activeNetopsTab) && (
                  <div>
                    {activeNetopsTab === "devices-list" && <Devices />}
                    {activeNetopsTab === "services" && <Services />}
                    {activeNetopsTab === "alerts" && <Alerts />}
                  </div>
                )}

                {/* Tickets Content */}
                {activeTab === "tickets" && shouldRenderTab("tickets", activeTicketsTab) && (
                  <div>
                    {activeTicketsTab === "statuses" && <TicketStatuses />}
                    {activeTicketsTab === "modules" && <TicketModules />}
                    {activeTicketsTab === "categories" && <ModuleCategories />}
                    {activeTicketsTab === "sub-categories" && <ModuleSubCategories />}
                    {activeTicketsTab === "types" && <TicketTypes />}
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

Settings.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Settings;
