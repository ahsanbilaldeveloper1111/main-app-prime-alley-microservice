import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users,
  ChevronDown,
  ChevronRight,
  FileText,
  
  Eye,
  ShoppingBag,
  Briefcase,
  PieChart,
  Link as LinkIcon,
  Target,
  Megaphone,
  Database,
  TrendingUp,
  XCircle,
  BarChart3,
  Phone,
  Languages,
  AudioLines,
  CassetteTape,
  PhoneCall,
  Ticket,
  List,
  Package,
  Layers,
  Tags,
  CreditCard,
  Building,
  MapPin,
  Settings,
  History,
  ChartNoAxesCombined,
  FileChartPie,
  Ban,
  RadioTower,
  Workflow,
  NotebookText,
  DollarSign,
  PhoneCallIcon
} from 'lucide-react';
import Link from 'next/link';

import { authAPI } from "@utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useTmsPermissions } from "../../hooks/useTmsPermissions";
import { HEADER_CONSTANTS} from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import Translate from '@pages/ai-ml/translate';

// Destructure constants for easier use
const { MENU_LABELS, ICONS, PERMISSIONS, MENU_COLORS,BASE_URL } = HEADER_CONSTANTS;

interface SubMenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
  permission?: string;
  url?: string;
}

interface MainMenuItem {
  id: string;
  key?: string;
  title: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  subItems?: SubMenuItem[];
  permission?: string;
  isMain?: boolean;
  url?: string;
  target?: string;
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const ApplicationSidebar: React.FC<SidebarProps> = ({ 
  sidebarOpen, 
  setSidebarOpen
}) => {
  //const [expandedModules, setExpandedModules] = useState<string[]>(['ticketing']);
  const [expandedModules, setExpandedModules] = useState<string[]>([ 'billing']);
  const [expandedSubModules, setExpandedSubModules] = useState<string[]>([]);
  
  // Get permissions hook for checking access
  const { hasPermission } = usePermissions();

  const mainMenuItems: MainMenuItem[] = [

    {
      id: 'dashboard',
      key: 'dashboard',
      permission: '',
      icon: <LayoutDashboard size={20} />,
      color: MENU_COLORS.DASHBOARD,
      title: MENU_LABELS.DASHBOARD,
      label: MENU_LABELS.DASHBOARD,
      url: '/dashboard',
    },
    
    {
      id: 'crm',
      key: 'crm',
      permission: PERMISSIONS.CRM_SERVICES,
      icon: <Briefcase size={20} />,
      color: MENU_COLORS.CRM,
      title: MENU_LABELS.CRM,
      label: MENU_LABELS.CRM,
      url: '',
      subItems: [
        {
          id: 'crm-dashboard',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.CRM_DASHBOARD,
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.VIEW_CRM_DASHBOARD,
          url: '/crm/dashboard'
        },
        {
          id: 'crm-leads',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.LEADS,
          icon: <Target size={16} />,
          permission: PERMISSIONS.VIEW_CRM_LEADS,
          url: '/crm/leads'
        },
        {
          id: 'crm-deals',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.DEALS,
          icon: <Target size={16} />,
          permission: PERMISSIONS.VIEW_CRM_LEADS,
          url: '/crm/deals'
        },
        {
          id: 'crm-orders',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.ORDERS,
          icon: <Target size={16} />,
          permission: PERMISSIONS.VIEW_CRM_LEADS,
          url: '/crm/orders'
        },
        {
          id: 'crm-opportunities',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.OPPORTUNITIES,
          icon: <TrendingUp size={16} />,
          permission: PERMISSIONS.VIEW_CRM_OPPORTUNITIES,
          url: '/crm/opportunities'
        },
        {
          id: 'crm-stages',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.STAGES,
          icon: <BarChart3 size={16} />,
          permission: PERMISSIONS.VIEW_CRM_STAGES,
          url: '/crm/stages'
        },
        {
          id: 'crm-lost-reasons',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.LOST_REASONS_CRM,
          icon: <XCircle size={16} />,
          permission: PERMISSIONS.VIEW_CRM_LOST_REASONS,
          url: '/crm/lost-reasons'
        },
        {
          id: 'crm-data-management',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.DATA_MANAGEMENT,
          icon: <Database size={16} />,
          permission: PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT,
          url: '/crm/data'
        },
        {
          id: 'crm-campaigns',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.CAMPAIGNS,
          icon: <Megaphone size={16} />,
          permission: PERMISSIONS.VIEW_CRM_CAMPAIGNS,
          url: '/crm/campaigns'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'live-calls',
      key: 'live-calls',
      permission: PERMISSIONS.CTI_SERVICES,
      icon: <PhoneCall size={20} />,
      color: MENU_COLORS.LIVE_CALLS,
      title: MENU_LABELS.LIVE_CALLS,
      label: MENU_LABELS.LIVE_CALLS,
      url: '',
      subItems: [
        {
          id: 'live-calls-dashboard',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.LIVE_VIEW,
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.VIEW_CTI,
          url: '/live-calls'
        },
        {
          id: 'live-calls-monitoring',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.CALL_MONITORING,
          icon: <Phone size={16} />,
          permission: PERMISSIONS.CTI_MONITORING,
          url: '/cti/monitoring'
        },
        {
          id: 'live-calls-dialer',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.DIALER,
          icon: <Phone size={16} />,
          permission: PERMISSIONS.DIAL_CALL_CTI,
          url: '/cti/dialer'
        }
      ]
    },

    {
      id: 'call-history',
      key: 'call-history',
      permission: PERMISSIONS.CALL_HISTORY_SERVICES,
      icon: <History size={20} />,
      color: MENU_COLORS.CALL_HISTORY,
      title: MENU_LABELS.CALL_HISTORY,
      label: MENU_LABELS.CALL_HISTORY,
      url: '',
      subItems: [
        {
          id: 'call-history-dashboard',
          title: HEADER_CONSTANTS.MENU_LABELS.CALL_DASHBOARD,
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.VIEW_CALL_DASHBOARD,
          url: '/call-logs/dashboard'
        },
        {
          id: 'call-history-logs',
          title: HEADER_CONSTANTS.MENU_LABELS.CALL_LOGS,
          icon: <Phone size={16} />,
          permission: PERMISSIONS.VIEW_CALL_LOGS,
          url: '/call-logs'
        },
        {
          id: 'call-history-recordings',
          title: HEADER_CONSTANTS.MENU_LABELS.CALL_RECORDINGS,
          icon: <Phone size={16} />,
          permission: PERMISSIONS.VIEW_CALL_RECORDINGS,
          url: '/call-recordings'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'call-reports',
      key: 'call-reports',
      permission: PERMISSIONS.REPORTS_SERVICES,
      icon: <ChartNoAxesCombined size={20} />,
      color: MENU_COLORS.REPORTS,
      title: MENU_LABELS.REPORTS,
      label: MENU_LABELS.REPORTS,
      url: '/reports',
    },

    {
      id: 'ai-ml',
      key: 'ai-ml',
      permission: PERMISSIONS.AI_ML_SERVICES,
      icon: <FileChartPie size={20} />,
      color: MENU_COLORS.AI_INSIGHTS,
      title: MENU_LABELS.AI_INSIGHTS,
      label: MENU_LABELS.AI_INSIGHTS,
      url: '',
      subItems: [
        {
          id: 'ai-ml-analysis',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.ANALYSIS,
          icon: <CassetteTape size={16} />,
          permission: PERMISSIONS.TRANSCRIPTION_ANALYSIS_AIML,
          url: '/ai-ml/analysis'
        },
        {
          id: 'ai-ml-analyze-recordings',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.ANALYZE_RECORDINGS,
          icon: <AudioLines size={16} />,
          permission: PERMISSIONS.TRANSCRIPTION_ANALYZE_RECORDINGS_AIML,
          url: '/ai-ml/analyze-recordings'
        },
        {
          id: 'ai-ml-translate',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.TRANSLATE,
          icon: <Languages size={16} />,
          permission: PERMISSIONS.TRANSLATE_AIML,
          url: '/ai-ml/translate'
        },
        {
          id: 'ai-ml-outbound-calls',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.OUTBOUND_CALLS,
          icon: <Phone size={16} />,
          permission: PERMISSIONS.OUTBOUND_CALLS_AIML,
          url: '/ai-ml/outbound-calls'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    {
      id: 'dncr',
      key: 'dncr',
      permission: PERMISSIONS.DNCR_SERVICES,
      icon: <Ban size={20} />,
      color: MENU_COLORS.DNCR,
      title: MENU_LABELS.DNCR,
      label: MENU_LABELS.DNCR,
      url: '',
      subItems: [
        {
          id: 'dncr-check-number',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.CHECK_NUMBER,
          icon: <PhoneCall size={16} />,
          permission: PERMISSIONS.CHECK_NUMBERS_DNCR,
          url: '/dncr/check-number'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'accounts',
      key: 'accounts',
      permission: PERMISSIONS.ACCOUNTS_SERVICES,
      icon: <CreditCard size={20} />,
      color: MENU_COLORS.BILLING,
      title: MENU_LABELS.BILLING,
      label: MENU_LABELS.BILLING,
      url: '',
      subItems: [
        // {
        //   id: 'customer-section',
        //   title: 'Customer',
        //   icon: <Users size={16} />,
        //   url: '',
        //   subItems: [
        //     { id: 'customer-dashboard', title: 'Customer Dashboard', icon: <LayoutDashboard size={16} />, url: '/accounting/customer/dashboard' },
        //     { id: 'account-overview', title: 'Account Overview', icon: <Eye size={16} />, url: '/accounting/customer/account-overview' },
        //     { id: 'product-details', title: 'Product Details', icon: <ShoppingBag size={16} />, url: '/accounting/customer/product-details' },
        //     { id: 'billing-history', title: 'Billing History', icon: <FileText size={16} />, url: '/accounting/customer/billing-history' },
        //     { id: 'payment-methods', title: 'Payment Methods', icon: <CreditCard size={16} />, url: '/accounting/customer/payment-methods' },
        //   ]
        // },

            { 
              id: 'customer-dashboard', 
              title: 'Customer Dashboard', 
              icon: <LayoutDashboard size={16} />, 
              url: '/accounting/customer/dashboard', 
              permission: PERMISSIONS.VIEW_CUSTOMER_DASHBOARD_BILLING 
            },
            { 
              id: 'account-overview', 
              title: 'Account Overview', 
              icon: <Eye size={16} />, 
              url: '/accounting/customer/account-overview', 
              permission: PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING 
            },

            { 
              id: 'product-details', 
              title: 'Product Details', 
              icon: <ShoppingBag size={16} />, 
              url: '/accounting/customer/product-details', 
              permission: PERMISSIONS.VIEW_PRODUCT_DETAILS_BILLING 
            },
            { 
              id: 'billing-invoices', 
              title: 'Invoices', 
              icon: <DollarSign size={16} />, 
              url: '/accounting/customer/invoices', 
              permission: PERMISSIONS.VIEW_INVOICES_BILLING 
            },
            { 
              id: 'billing-history', 
              title: 'Billing History', 
              icon: <FileText size={16} />, 
              url: '/accounting/customer/billing-history', permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING },
            
            { 
              id: 'payment-methods', 
              title: 'Payment Methods', 
              icon: <CreditCard size={16} />, 
              url: '/accounting/customer/payment-methods', 
              permission: PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING 
            },
            

        // {
        //   id: 'accounting',
        //   title: HEADER_CONSTANTS.MENU_LABELS.INVOICES_BILLING,
        //   icon: <List size={16} />,
        //   permission: PERMISSIONS.VIEW_INVOICES_BILLING,
        //   url: '/accounting/invoices'
        // },
        // {
        //   id: 'accounting-expenses',
        //   title: HEADER_CONSTANTS.MENU_LABELS.EXPENSES_BILLING,
        //   icon: <List size={16} />,
        //   permission: PERMISSIONS.VIEW_EXPENSES_BILLING,
        //   url: '/accounting/expenses'
        // },
        // {
        //   id: 'accounting-products',
        //   title: HEADER_CONSTANTS.MENU_LABELS.PRODUCTS_BILLING,
        //   icon: <List size={16} />,
        //   permission: PERMISSIONS.VIEW_PRODUCTS_BILLING,
        //   url: '/accounting/products'
        // },
        // {
        //   id: 'accounting-inventory',
        //   title: HEADER_CONSTANTS.MENU_LABELS.INVENTORY_BILLING,
        //   icon: <List size={16} />,
        //   permission: PERMISSIONS.VIEW_INVENTORY_BILLING,
        //   url: '/accounting/inventory'
        // },
        // {
        //   id: 'accounting-companies',
        //   title: HEADER_CONSTANTS.MENU_LABELS.COMPANIES_BILLING,
        //   icon: <Building size={16} />,
        //   permission: PERMISSIONS.VIEW_COMPANIES_BILLING,
        //   url: '/accounting/companies'
        // },
        // {
        //   id: 'accounting-resellers',
        //   title: HEADER_CONSTANTS.MENU_LABELS.RESSELLERS_BILLING,
        //   icon: <List size={16} />,
        //   permission: PERMISSIONS.VIEW_RESSELLERS_BILLING,
        //   url: '/accounting/resellers'
        // },
        // {
        //   id: 'accounting-locations',
        //   title: HEADER_CONSTANTS.MENU_LABELS.LOCATIONS_BILLING,
        //   icon: <MapPin size={16} />,
        //   permission: PERMISSIONS.VIEW_LOCATIONS_BILLING,
        //   url: '/accounting/locations'
        // },
        // {
        //   id: 'accounting-suppliers',
        //   title: HEADER_CONSTANTS.MENU_LABELS.SUPPLIERS_BILLING,
        //   icon: <List size={16} />,
        //   permission: PERMISSIONS.VIEW_SUPPLIERS_BILLING,
        //   url: '/accounting/suppliers'
        // }

      ]
      //.filter(item => !item.permission || hasPermission(item.permission))
    }, 
    
    {
      id: 'tickets',
      key: 'tickets',
      permission: PERMISSIONS.TICKETS_SERVICES,
      icon: <Ticket size={20} />,
      color: MENU_COLORS.TICKETS,
      title: MENU_LABELS.TICKETS,
      label: MENU_LABELS.TICKETS,
      url: '',
      subItems: [
        {
          id: 'tickets-dashboard',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.TICKETS_DASHBOARD,
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.VIEW_TICKETS_DASHBOARD,
          url: '/tickets/dashboard'
        },
        {
          id: 'tickets-list',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.TICKETS_LIST,
          icon: <Ticket size={16} />,
          permission: PERMISSIONS.VIEW_TICKETS_LIST,
          url: '/tickets/list'
        },
        {
          id: 'tickets-status',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.STATUS,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_TICKETS_STATUS,
          url: '/tickets/statuses'
        },
        {
          id: 'tickets-modules',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.MODULES,
          icon: <Layers size={16} />,
          permission: PERMISSIONS.VIEW_TICKETS_MODULES,
          url: '/tickets/modules'
        },
        {
          id: 'tickets-module-categories',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.TICKET_MODULE_CATEGORIES,
          icon: <Layers size={16} />,
          permission: PERMISSIONS.VIEW_TICKETS_CATEGORIES,
          url: '/tickets/modules/categories'
        },
        {
          id: 'tickets-module-subcategories',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.TICKET_MODULE_SUBCATEGORIES,
          icon: <Layers size={16} />,
          permission: PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES,
          url: '/tickets/modules/sub-categories'
        },

        {
          id: 'tickets-types',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.TYPES,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_TICKETS_TYPES,
          url: '/tickets/types'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'gsm',
      key: 'gsm',
      permission: PERMISSIONS.GSM_SERVICES,
      icon: <RadioTower size={20} />,
      color: MENU_COLORS.SIM_GATEWAY,
      title: MENU_LABELS.SIM_GATEWAY,
      label: MENU_LABELS.SIM_GATEWAY,
      url: '',
      subItems: [
        {
          id: 'gsm-dashboard',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.GSM_DASHBOARD,
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.VIEW_GSM_DASHBOARD,
          url: '/gsm/dashboard'
        },
        {
          id: 'gsm-list',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.GSM_LIST,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_GSM_MANAGEMENT,
          url: '/gsm/list'
        },
        {
          id: 'gsm-assign',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.COMPANY_ASSIGN,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_GSM_ASSIGNMENT,
          url: '/gsm/assign'
        },
        {
          id: 'gsm-ports',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.PORTS,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_GSM_PORTS,
          url: '/gsm/ports'
        },
        {
          id: 'gsm-inbox',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.INBOX,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_GSM_INBOX,
          url: '/gsm/inbox'
        },
        {
          id: 'gsm-sync',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.SYNC_GSM,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_GSM_SYNC,
          url: '/gsm/sync'
        },
        {
          id: 'gsm-company-po',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.COMPANY_PO,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING,
          url: '/gsm/company/po'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'tms',
      key: 'tms',
      permission: PERMISSIONS.TMS_SERVICES,
      icon: <Workflow size={20} />,
      color: MENU_COLORS.AUTOMATION,
      title: MENU_LABELS.AUTOMATION,
      label: MENU_LABELS.AUTOMATION,
      url: '/tms/verification'
    },

    {
      id: 'netops',
      key: 'netops',
      permission: PERMISSIONS.NETOPS_SERVICES,
      icon: <LayoutDashboard size={20} />,
      color: MENU_COLORS.NETOPS,
      title: MENU_LABELS.NETOPS,
      label: MENU_LABELS.NETOPS,
      url: '',
      subItems: [
        {
          id: 'netops-dashboard',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_DASHBOARD,
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_DASHBOARD,
          url: '/netops/dashboard'
        },
        {
          id: 'netops-devices',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_DEVICES,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_DEVICES,
          url: '/netops/devices'
        },
        {
          id: 'netops-services',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_SERVICES,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_SERVICES,
          url: '/netops/services'
        },
        {
          id: 'netops-alerts',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_ALERTS,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_ALERTS,
          url: '/netops/alerts'
        },
        {
          id: 'netops-uptime-sla',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_UPTIME_SLA,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_UPTIME_SLA,
          url: '/netops/uptime-sla'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'controlhub',
      key: 'controlhub',
      permission: PERMISSIONS.CONTROL_HUB_SERVICES,
      icon: <Settings size={20} />,
      color: MENU_COLORS.CONTROL_HUB,
      title: MENU_LABELS.CONTROL_HUB,
      label: MENU_LABELS.CONTROL_HUB,
      url: '',
      subItems: [
        {
          id: 'controlhub-users',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.USER_DIRECTORY,
          icon: <Users size={16} />,
          permission: PERMISSIONS.VIEW_USERS,
          url: '/controlhub/users'
        },
        {
          id: 'controlhub-ranks',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.RANKS,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_RANKS,
          url: '/controlhub/ranks'
        },
        {
          id: 'controlhub-groups',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.GROUPS,
          icon: <List size={16} />,
          permission: PERMISSIONS.VIEW_GROUPS,
          url: '/controlhub/groups'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'resources',
      key: 'resources',
      permission: '',
      icon: <NotebookText size={20} />,
      color: MENU_COLORS.RESOURCES,
      title: MENU_LABELS.RESOURCES,
      label: MENU_LABELS.RESOURCES,
      url: '',
      subItems: [
        {
          id: 'resources-faq',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.FAQ,
          icon: <List size={16} />,
          permission: '',
          url: '/resources/faq'
        },
        {
          id: 'resources-help-materials',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.HELP_MATERIALS,
          icon: <List size={16} />,
          permission: '',
          url: '/resources/help-materials'
        },
        {
          id: 'resources-contact-support',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.CONTACT_SUPPORT,
          icon: <List size={16} />,
          permission: '',
          url: '/resources/contact-support'
        }
      ]
    }

    


  ].filter(item => !item.permission || hasPermission(item.permission));

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );

  };

  const toggleSubModule = (subModuleId: string) => {
    setExpandedSubModules(prev => 
      prev.includes(subModuleId) 
        ? prev.filter(id => id !== subModuleId)
        : [...prev, subModuleId]
    );
  };

  const handleSubItemClick = (screenId: string) => {
   // setActiveScreen(screenId);
    //setSidebarOpen(false);
  };

  const customStyles = `
    .sidebar-card {
      min-height: 100vh;
      height: 100%;
      width: 280px;
      border-radius: 0;
      z-index: 1000;
      overflow-y: auto;
      box-shadow: 2px 0 10px rgba(0,0,0,0.05);
      border: none;
      background: white;
      flex-shrink: 0;
      position: fixed;
      left: 0;
      top: 85px;
      padding-bottom:100px;
      transition: all 0.3s ease-in-out;
    }
    
    .sidebar-card.collapsed {
      transform: translateX(-280px);
    }

    .sidebar-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: none;
    }

    .module-header {
      padding: 0.875rem 1.25rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 3px solid transparent;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      font-size: 0.9rem;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      color: #495057;
    }

    .module-header:hover {
      background-color: #f8f9fa;
    }

    .module-header.expanded {
      background-color: #f8f9fa;
    }

    .module-icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
    }

    .sub-item {
      padding: 0.75rem 1.25rem 0.75rem 3.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      display: flex;
      align-items: center;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      color: #6c757d;
      font-size: 0.875rem;
    }

    .sub-item:hover {
      background-color: #f8f9fa;
      padding-left: 3.75rem;
    }

    .sub-item.active {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
      border-left-color: #667eea;
      color: #667eea;
      font-weight: 600;
    }

    .sub-item-icon {
      margin-right: 0.75rem;
      opacity: 0.7;
    }

    .sub-item.active .sub-item-icon {
      opacity: 1;
    }

    .sub-module-header {
      padding: 0.75rem 1.25rem 0.75rem 3.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      color: #6c757d;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .sub-module-header:hover {
      background-color: #f8f9fa;
    }

    .sub-module-header.expanded {
      background-color: #f8f9fa;
      color: #495057;
      font-weight: 600;
    }

    .nested-sub-item {
      padding: 0.65rem 1.25rem 0.65rem 5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      display: flex;
      align-items: center;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      color: #6c757d;
      font-size: 0.8125rem;
    }

    .nested-sub-item:hover {
      background-color: #f8f9fa;
      padding-left: 5.25rem;
    }

    .nested-sub-item.active {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
      border-left-color: #667eea;
      color: #667eea;
      font-weight: 600;
    }

    .nested-sub-item-icon {
      margin-right: 0.75rem;
      opacity: 0.7;
    }

    .nested-sub-item.active .nested-sub-item-icon {
      opacity: 1;
    }

    .chevron-icon {
      transition: transform 0.3s ease;
    }

    .chevron-icon.expanded {
      transform: rotate(0deg);
    }

    .sidebar-scrollbar::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .sidebar-scrollbar::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 3px;
    }

    .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #999;
    }

    .module-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #dee2e6, transparent);
      margin: 0.5rem 0;
    }

    .collapse-enter {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-in-out;
    }

    .collapse-enter-active {
      max-height: 1000px;
    }

    .collapse-exit {
      max-height: 1000px;
      overflow: hidden;
      transition: max-height 0.3s ease-in-out;
    }

    .collapse-exit-active {
      max-height: 0;
    }

    /* Desktop: Sidebar toggles with collapse class */
    @media (min-width: 992px) {
      .sidebar-card.collapsed {
        transform: translateX(-280px);
      }
      
      .sidebar-backdrop {
        display: none !important;
      }
    }

    /* Mobile: Sidebar slides in from left with overlay */
    @media (max-width: 991px) {
      .sidebar-card {
        top: 0;
        z-index: 1050;
        max-width: 85vw;
      }

      .sidebar-card.collapsed {
        transform: translateX(-280px);
      }

      .sidebar-card:not(.collapsed) {
        transform: translateX(0);
      }

      .sidebar-header {
        display: block !important;
      }
    }

    .sidebar-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1040;
      display: none;
      transition: opacity 0.3s ease-in-out;
    }

    .sidebar-backdrop.show {
      display: block;
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      
      {/* Backdrop for mobile */}
      <div 
        className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      
      <div 
        className={`sidebar-card sidebar-scrollbar ${!sidebarOpen ? 'collapsed' : ''}`}
      >
        <div style={{ padding: 0 }}>
          {/* Header */}
          <div className="sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '0.75rem',
                  padding: '0.5rem',
                  marginRight: '1rem'
                }}
              >
                <Briefcase size={24} color="white" />
              </div>
              <div>
                <h5 style={{ marginBottom: 0, color: 'white', fontWeight: 'bold' }}>CRM Portal</h5>
                <small style={{ color: 'white', opacity: 0.75 }}>Management System</small>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '0.5rem 0' }}>
            {mainMenuItems.map((module, index) => (
              <div key={module.id}>
                {/* Module Header */}

                {module.url !== '' ? (
                  <Link href={(BASE_URL || '') + (module.url || '/')}>
                    <button
                      className={`module-header ${expandedModules.includes(module.id) ? 'expanded' : ''}`}
                      style={{
                        borderLeftColor: expandedModules.includes(module.id) ? module.color : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <div 
                          className="module-icon-wrapper"
                          style={{ backgroundColor: `${module.color}15` }}
                        >
                          {React.cloneElement(module.icon as React.ReactElement, { 
                            style: { color: module.color }
                          } as any)}
                        </div>
                        <span>{module.title}
                        </span>
                      </div>

                      {module.subItems && module.subItems.length > 0 && (
                      <span className={`chevron-icon ${expandedModules.includes(module.id) ? 'expanded' : ''}`}>
                        {expandedModules.includes(module.id) ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </span>
                      )}
                    </button>
                  </Link>
                ) : (
                  <button
                    className={`module-header ${expandedModules.includes(module.id) ? 'expanded' : ''}`}
                    style={{
                      borderLeftColor: expandedModules.includes(module.id) ? module.color : 'transparent'
                    }}
                    onClick={() => toggleModule(module.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <div 
                        className="module-icon-wrapper"
                        style={{ backgroundColor: `${module.color}15` }}
                      >
                        {React.cloneElement(module.icon as React.ReactElement, { 
                          style: { color: module.color }
                        } as any)}
                      </div>
                      <span>{module.title}</span>
                    </div>
                    <span className={`chevron-icon ${expandedModules.includes(module.id) ? 'expanded' : ''}`}>
                      {expandedModules.includes(module.id) ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </span>
                  </button>
                )}
                {/* Sub Items */}
                {expandedModules.includes(module.id) && module.subItems && (
                  <div>
                    {module.subItems.map((subItem: SubMenuItem) => (
                      <div key={subItem.id}>
                        {subItem.subItems && subItem.subItems.length > 0 ? (
                          // This is a nested sub-module with children
                          <>

                          {subItem.url !== '' ? (
                            <Link href={subItem.url || '/'}>
                              <button
                                className={`sub-module-header ${expandedSubModules.includes(subItem.id) ? 'expanded' : ''}`}
                                onClick={() => toggleSubModule(subItem.id)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                                  <span className="sub-item-icon">{subItem.icon}</span>
                                  <span>{subItem.title}</span>
                                </div>
                                <span className={`chevron-icon ${expandedSubModules.includes(subItem.id) ? 'expanded' : ''}`}>
                                  {expandedSubModules.includes(subItem.id) ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </span>
                              </button>
                            </Link>
                          ) : (
                            <button
                              className={`sub-module-header ${expandedSubModules.includes(subItem.id) ? 'expanded' : ''}`}
                              onClick={() => toggleSubModule(subItem.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                                <span className="sub-item-icon">{subItem.icon}</span>
                                <span>{subItem.title}</span>
                              </div>

                              {subItem.subItems && subItem.subItems.length > 0 && (
                              <span className={`chevron-icon ${expandedSubModules.includes(subItem.id) ? 'expanded' : ''}`}>
                                {expandedSubModules.includes(subItem.id) ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </span>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        // Regular sub-item without children
                        <>
                        {subItem.url !== '' ? (
                          <Link href={subItem.url || '/'}>
                            <button
                              className={`sub-item ${expandedSubModules.includes(subItem.id) ? 'expanded' : ''}`}
                              onClick={() => toggleSubModule(subItem.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                                <span className="sub-item-icon">{subItem.icon}</span>
                                <span>{subItem.title}</span>
                              </div>

                              {subItem.subItems && subItem.subItems.length > 0 && (
                              <span className={`chevron-icon ${expandedSubModules.includes(subItem.id) ? 'expanded' : ''}`}>
                                {expandedSubModules.includes(subItem.id) ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </span>
                              )}
                            </button>
                          </Link>
                        ) : (
                          <button
                            className={`sub-module-header ${expandedSubModules.includes(subItem.id) ? 'expanded' : ''}`}
                            onClick={() => toggleSubModule(subItem.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                              <span className="sub-item-icon">{subItem.icon}</span>
                              <span>{subItem.title}</span>
                            </div>
                            {subItem.subItems && subItem.subItems.length > 0 && (
                            <span className={`chevron-icon ${expandedSubModules.includes(subItem.id) ? 'expanded' : ''}`}>
                              {expandedSubModules.includes(subItem.id) ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </span>
                            )}
                          </button>
                        )}
                      </>
                    )}
                            {/* Nested Sub Items */}
                            {subItem.subItems && subItem.subItems.length > 0 && expandedSubModules.includes(subItem.id) && (
                              <div>
                                {subItem.subItems.map((nestedItem: SubMenuItem) => (
                                  <Link key={nestedItem.id} href={nestedItem.url || '/'}>
                                    <button
                                      className={`nested-sub-item`}
                                      onClick={() => handleSubItemClick(nestedItem.id)}
                                    >
                                      <span className="nested-sub-item-icon">{nestedItem.icon}</span>
                                      <span>{nestedItem.title}</span>
                                    </button>
                                  </Link>
                                ))}
                              </div>
                            )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider between modules */}
                {index < mainMenuItems.length - 1 && (
                  <div className="module-divider" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationSidebar;
