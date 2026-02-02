import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users,
  ChevronDown,
  FileText,
  Eye,
  ShoppingBag,
  Briefcase,
  Target,
  Megaphone,
  Database,
  BarChart3,
  Phone,
  Languages,
  AudioLines,
  CassetteTape,
  PhoneCall,
  List,
  CreditCard,
  Settings,
  History,
  ChartNoAxesCombined,
  FileChartPie,
  Ban,
  RadioTower,
  Workflow,
  NotebookText,
  DollarSign,
  MonitorSpeaker,
  Monitor,
  Server,
  Search,
  Menu,
  X,
  UserSearch,
  Handshake,
  Scroll,
  Layers,
  ReceiptText,
  Activity,
  Contact,
  Voicemail,
  Inbox,
  Wifi,
  ClipboardCheck,
  ClipboardList,
  MonitorCheck,
  User,
  VoicemailIcon,
  Bot,
  Calendar,
  Bell,
  Clock,
  MessageCircle,
  Shield,
  Folder,
  UserPlus,
  CheckCheck,
  Layers2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { HEADER_CONSTANTS} from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";

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

const ApplicationCustomerSidebar: React.FC<SidebarProps> = ({ 
  sidebarOpen, 
  setSidebarOpen
}) => {
  const [expandedModules, setExpandedModules] = useState<string[]>(['billing']);
  const [expandedSubModules, setExpandedSubModules] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const prevPathnameRef = useRef<string>('');
  
  // Get permissions hook for checking access
  const { hasPermission } = usePermissions();

  const mainMenuItems: MainMenuItem[] = [

    {
      id: 'dashboard',
      key: 'dashboard',
      permission: '',
      icon: <LayoutDashboard size={20} />,
      color: MENU_COLORS.DASHBOARD,
      title: "Overview",
      label: "Overview",
      url: '/dashboard',
    },
    {
      id: 'dashboard-unified-workspace',
      key: 'dashboard-unified-workspace',
      icon: <LayoutDashboard size={20} />,
      color: MENU_COLORS.DASHBOARD,
      permission: PERMISSIONS.VIEW_UNIFIED_WORKSPACE,
      title: "Unified Workspace",
      label: "Unified Workspace",
      url: '/unified-workspace',
    },
    
    {
      id: 'crm',
      key: 'crm',
      permission: PERMISSIONS.CRM_SERVICES,
      icon: <Briefcase size={20} />,
      color: MENU_COLORS.CRM,
      title: "CRM Workspace",
      label: "CRM Workspace",
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
          id: 'crm-data-management',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.DATA_MANAGEMENT,
          icon: <UserSearch size={16} />,
          permission: PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT,
          url: '/crm/data'
        },
        {
          id: 'crm-leads',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.LEADS,
          icon: <Contact size={16} />,
          permission: PERMISSIONS.VIEW_CRM_LEADS,
          url: '/crm/leads'
        },
        {
          id: 'crm-deals',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.DEALS,
          icon: <Handshake size={16} />,
          permission: PERMISSIONS.VIEW_CRM_DEALS,
          url: '/crm/deals'
        },
        {
          id: 'crm-deals',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.DEALS_APPROVAL,
          icon: <Handshake size={16} />,
          permission: PERMISSIONS.VIEW_CRM_DEALS,
          url: '/crm/deals-approval'
        },
        {
          id: 'crm-orders',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.ORDERS,
          icon: <ReceiptText size={16} />,
          permission: PERMISSIONS.VIEW_CRM_ORDERS,
          url: '/crm/orders'
        },
        {
          id: 'crm-history',
          title: 'Activity Tracker',
          icon: <Activity size={16} />,
          permission: PERMISSIONS.VIEW_CRM_HISTORY,
          url: '/crm/history'
        },
        // {
        //   id:'crm-approvals',
        //   title: 'Quotes & Approvals',
        //   icon: <FileText size={16} />,
        //   permission: PERMISSIONS.VIEW_CRM_HISTORY,
        //   url: '/crm/approvals'
        // }
       
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'live-calls',
      key: 'live-calls',
      permission: PERMISSIONS.VIEW_CTI,
      icon: <MonitorCheck size={20} />,
      color: MENU_COLORS.LIVE_CALLS,
      title: "Live Wallboards",
      label: "Live Wallboards",
      url: '/live-calls'
      // subItems: [
      //   {
      //     id: 'live-calls-dashboard',
      //     title: HEADER_CONSTANTS.SUBMENU_LABELS.LIVE_VIEW,
      //     icon: <LayoutDashboard size={16} />,
      //     permission: PERMISSIONS.VIEW_CTI,
      //     url: '/live-calls'
      //   },
      //   {
      //     id: 'live-calls-dashboard-new',
      //     title: 'Live Call New',
      //     icon: <LayoutDashboard size={16} />,
      //     permission: PERMISSIONS.VIEW_CTI,
      //     url: '/live-calls/new'
      //   },
      //   {
      //     id: 'live-calls-monitoring',
      //     title: HEADER_CONSTANTS.SUBMENU_LABELS.CALL_MONITORING,
      //     icon: <Phone size={16} />,
      //     permission: PERMISSIONS.CTI_MONITORING,
      //     url: '/cti/monitoring'
      //   },
        // {
        //   id: 'live-calls-dialer',
        //   title: HEADER_CONSTANTS.SUBMENU_LABELS.DIALER,
        //   icon: <Phone size={16} />,
        //   permission: PERMISSIONS.DIAL_CALL_CTI,
        //   url: '/cti/dialer'
        // }
      //].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'call-history',
      key: 'call-history',
      permission: PERMISSIONS.CALL_HISTORY_SERVICES,
      icon: <Phone size={20} />,
      color: MENU_COLORS.CALL_HISTORY,
      title: 'Call Details',
      label: 'Call Details',
      url: '',
      subItems: [
        {
          id: 'call-history-dashboard',
          title: 'Dashboard',
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
          icon: <Voicemail size={16} />,
          permission: PERMISSIONS.VIEW_CALL_RECORDINGS,
          url: '/call-recordings'
        },
        
        // {
        //   id: 'call-reports',
        //   key: 'call-reports',
        //   permission: PERMISSIONS.VIEW_CALL_REPORTS,
        //   icon: <ChartNoAxesCombined size={20} />,
        //   title: MENU_LABELS.CALL_REPORTS,
        //   url: '/call-reports',
        // }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    // {
    //   id: 'call-reports',
    //   key: 'call-reports',
    //   permission: PERMISSIONS.REPORTS_SERVICES,
    //   icon: <ChartNoAxesCombined size={20} />,
    //   color: MENU_COLORS.REPORTS,
    //   title: MENU_LABELS.REPORTS,
    //   label: MENU_LABELS.REPORTS,
    //   url: '/reports',
    // },

    {
      id: 'ai-bot-and-analytics',
      key: 'ai-bot-and-analytics',
      permission: PERMISSIONS.OUTBOUND_CALLS_AIML,
      icon: <Workflow size={20} />,
      color: MENU_COLORS.AUTOMATION,
      title: "AI Virtual Agent",
      label: "AI Virtual Agent",
      url: '',
      subItems: [
        {
          id: 'ai-bot-trunk-profiles',
          title: 'Trunk Profiles',
          icon: <Bot size={16} />,
          permission: PERMISSIONS.OUTBOUND_CALLS_AIML,
          url: '/ai-ml/trunk-profiles'
        },
        {
          id: 'ai-bot-profile',
          title: 'Voice Bot Profiles',
          icon: <Bot size={16} />,
          permission: PERMISSIONS.OUTBOUND_CALLS_AIML,
          url: '/ai-ml/profiles'
        },
        
        {
          id: 'ai-bot-campaigns',
          title: 'Campaigns',
          icon: <User size={16} />,
          permission: PERMISSIONS.OUTBOUND_CALLS_AIML,
          url: '/ai-ml/campaigns'
        },
        {
          id: 'ai-bot-live-monitoring',
          title: 'Live Monitoring',
          icon: <MonitorCheck size={16} />,
          permission: PERMISSIONS.OUTBOUND_CALLS_AIML,
          url: '/ai-ml/live-monitoring'
        },
        {
          id: 'ai-bot-campaign-reports',
          title: 'Campaign Reports',
          icon: <BarChart3 size={16} />,
          permission: PERMISSIONS.OUTBOUND_CALLS_AIML,
          url: '/ai-ml/campaign-reports'
        }
        
      ]
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
          title: "Devices List",
          icon: <ClipboardList size={16} />,
          permission: PERMISSIONS.VIEW_GSM_MANAGEMENT,
          url: '/gsm/list'
        },
        {
          id: 'gsm-assign',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.COMPANY_ASSIGN,
          icon: <ClipboardCheck size={16} />,
          permission: PERMISSIONS.VIEW_GSM_ASSIGNMENT,
          url: '/gsm/assign'
        },
        {
          id: 'gsm-ports',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.PORTS,
          icon: <Wifi size={16} />,
          permission: PERMISSIONS.VIEW_GSM_PORTS,
          url: '/gsm/ports'
        },
        {
          id: 'gsm-inbox',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.INBOX,
          icon: <Inbox size={16} />,
          permission: PERMISSIONS.VIEW_GSM_INBOX,
          url: '/gsm/inbox'
        },
        // {
        //   id: 'gsm-sync',
        //   title: HEADER_CONSTANTS.SUBMENU_LABELS.SYNC_GSM,
        //   icon: <List size={16} />,
        //   permission: PERMISSIONS.VIEW_GSM_SYNC,
        //   url: '/gsm/sync'
        // },
        // {
        //   id: 'gsm-company-po',
        //   title: HEADER_CONSTANTS.SUBMENU_LABELS.COMPANY_PO,
        //   icon: <List size={16} />,
        //   permission: PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING,
        //   url: '/gsm/company/po'
        // }
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
      url: '',
      subItems: [
        // {
        //   id: 'tms-dashboard',
        //   title: HEADER_CONSTANTS.SUBMENU_LABELS.TMS_DASHBOARD,
        //   icon: <LayoutDashboard size={16} />,
        //   permission: PERMISSIONS.TMS_SERVICES,
        //   url: '/tms/dashboard'
        // },
        // {
        //   id: 'tms-user-management',
        //   title: 'Users',
        //   icon: <Users size={16} />,
        //   permission: PERMISSIONS.TMS_SERVICES,
        //   url: '/tms/management/users'
        // },
        // {
        //   id: 'tms-user-create',
        //   title: 'Create User',
        //   icon: <Users size={16} />,
        //   permission: PERMISSIONS.TMS_SERVICES,
        //   url: '/tms/profiling/user/create'
        // },
        // {
        //   id: 'tms-audit-logs',
        //   title: 'Audit Logs',
        //   icon: <FileText size={16} />,
        //   permission: PERMISSIONS.TMS_SERVICES,
        //   url: '/tms/audit-logs'
        // },
        {
          id: 'live-calls-campaigns-management',
          title: 'Campaigns Management',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.TMS_SERVICES,
          url: '/live-calls/management/campaigns'
        },
        {
          id: 'live-calls-agent-management',
          title: 'Agent Management',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.TMS_SERVICES,
          url: '/live-calls/management/agents'
        },
        {
          id: 'ai-chat-faqs-management',
          title: 'AI Chat FAQs',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.TMS_SERVICES,
          url: '/chat/ai-faqs'
        },
        {
          id: 'ai-bot-faqs-management',
          title: 'AI Bot FAQs',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.TMS_SERVICES,
          url: '/chat/ai-bot-faqs'
        }
      ]
      .filter(item => !item.permission || hasPermission(item.permission))
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
          icon: <MonitorSpeaker size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_DEVICES,
          url: '/netops/devices'
        },
        {
          id: 'netops-services',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_SERVICES,
          icon: <Server size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_SERVICES,
          url: '/netops/services'
        },
        {
          id: 'netops-alerts',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_ALERTS,
          icon: <Megaphone size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_ALERTS,
          url: '/netops/alerts'
        },
        {
          id: 'netops-uptime-sla',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_UPTIME_SLA,
          icon: <Monitor size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_UPTIME_SLA,
          url: '/netops/uptime-sla'
        },
        {
          id: 'netops-select-server',
          title: 'Select Server',
          icon: <Server size={16} />,
          permission: PERMISSIONS.NETOPS_SERVICES,
          url: '/netops/select-server'
        },
        {
          id: 'netops-application-monitoring',
          title: 'Application Monitoring',
          icon: <Monitor size={16} />,
          permission: PERMISSIONS.NETOPS_SERVICES,
          url: '/netops/application-monitoring'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
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
          id: 'call-ai-analysis',
          title: 'Calls AI Analysis',
          icon: <ChartNoAxesCombined size={16} />,
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
        // {
        //   id: 'ai-ml-outbound-calls',
        //   title: HEADER_CONSTANTS.SUBMENU_LABELS.OUTBOUND_CALLS,
        //   icon: <Phone size={16} />,
        //   permission: PERMISSIONS.OUTBOUND_CALLS_AIML,
        //   url: '/ai-ml/outbound-calls'
        // }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    {
      id: 'dncr',
      key: 'dncr',
      permission: PERMISSIONS.DNCR_SERVICES,
      icon: <Ban size={20} />,
      color: MENU_COLORS.DNCR,
      title: MENU_LABELS.COMPLIANCES,
      label: MENU_LABELS.COMPLIANCES,
      url: '',
      subItems: [
        // {
        //   id: 'dncr-check-number',
        //   title: HEADER_CONSTANTS.SUBMENU_LABELS.DNCR,
        //   icon: <PhoneCall size={16} />,
        //   permission: PERMISSIONS.CHECK_NUMBERS_DNCR,
        //   url: '/dncr/check-number'
        // },
        {
          id: 'dncr-api-number-check',
          title: "API Number Check",
          icon: <PhoneCall size={16} />,
          permission: PERMISSIONS.CHECK_NUMBERS_DNCR,
          url: '/dncr/api-number-check'
        },
        {
          id: 'dncr-cdr-records',
          title: "CDR Records",
          icon: <FileText size={16} />,
          permission: PERMISSIONS.VIEW_CDR_DNCR,
          url: '/dncr/cdr-records'
        },
        {
          id: 'dncr-local-dnd-call-block',
          title: "Add Records",
          icon: <PhoneCall size={16} />,
          permission: PERMISSIONS.VIEW_LOCAL_DND_CALL_BLOCK_DNCR,
          url: '/dncr/add-records'
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

            { 
              id: 'customer-dashboard', 
              title: 'Dashboard', 
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
              title: 'Subscriptions', 
              icon: <ShoppingBag size={16} />, 
              url: '/accounting/customer/product-details', 
              permission: PERMISSIONS.VIEW_PRODUCT_DETAILS_BILLING 
            },
            { 
              id: 'orders-billing', 
              title: 'Orders', 
              icon: <ShoppingBag size={16} />, 
              url: '/accounting/customer/orders', 
              permission: PERMISSIONS.VIEW_INVOICES_BILLING 
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
              title: 'Payment History', 
              icon: <FileText size={16} />, 
              url: '/accounting/customer/billing-history', permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING },
            
            // { 
            //   id: 'payment-methods', 
            //   title: 'Payment Methods', 
            //   icon: <CreditCard size={16} />, 
            //   url: '/accounting/customer/payment-methods', 
            //   permission: PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING 
            // },
            

      ]
      .filter(item => !item.permission || hasPermission(item.permission))
    }, 

    {
      id: 'work-planner',
      key: 'work-planner',
      permission: PERMISSIONS.WORK_PLANNER_SERVICES,
      icon: <Calendar size={20} />,
      color: MENU_COLORS.BILLING,
      title: "Work Planner",
      label: "Work Planner",
      url: '',
      subItems: [
          { 
              id: 'work-planner-orders', 
              title: 'Orders', 
              icon: <ReceiptText size={16} />, 
              url: '/work-planner/orders', 
              permission: PERMISSIONS.VIEW_RECURRING_REMINDERS_WORK_PLANNER 
            },

            { 
              id: 'work-planner-recurring-reminders', 
              title: 'Recurring Reminders', 
              icon: <Bell size={16} />, 
              url: '/work-planner/recurring-reminders', 
              permission: PERMISSIONS.VIEW_RECURRING_REMINDERS_WORK_PLANNER 
            },
            { 
              id: 'work-planner-todo-list', 
              title: 'To Do List', 
              icon: <Clock size={16} />, 
              url: '/work-planner/todo', 
              permission: PERMISSIONS.VIEW_DIAL_TODO_WORK_PLANNER 
            },
            {
              id: 'work-planner-call-time',
              title: 'Tasks List',
              icon: <Clock size={16} />,
              url: '/work-planner/tasks-list',
              permission: PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER 
            },
            {
              id: 'work-planner-projects-dashboard',
              title: 'Projects Dashboard',
              icon: <Folder size={16} />,
              url: '/work-planner/projects/dashboard',
              permission: PERMISSIONS.WORK_PLANNER_SERVICES 
            },
            {
              id: 'work-planner-projects',
              title: 'Projects',
              icon: <Folder size={16} />,
              url: '/work-planner/projects',
              permission: PERMISSIONS.WORK_PLANNER_SERVICES 
            },
            {
              id: 'work-planner-statuses',
              title: 'Statuses',
              icon: <List size={16} />,
              url: '/work-planner/statuses',
              permission: PERMISSIONS.WORK_PLANNER_SERVICES 
            },
           
            // {
            //   id: 'work-planner-saved-views',
            //   title: 'Saved Views',
            //   icon: <Folder size={16} />,
            //   url: '/work-planner/saved-views',
            //   permission: PERMISSIONS.WORK_PLANNER_SERVICES 
            // },
            // {
            //   id: 'work-planner-roles-settings',
            //   title: 'Roles Settings',
            //   icon: <Shield size={16} />,
            //   url: '/work-planner/roles-settings',
            //   permission: PERMISSIONS.WORK_PLANNER_SERVICES 
            // }
            
      ]
      .filter(item => !item.permission || hasPermission(item.permission))
    }, 

    {
      id: 'staff-management',
      key: 'staff-management',
      permission: PERMISSIONS.STAFF_MANAGEMENT_SERVICES,
      icon: <Users size={20} />,
      color: MENU_COLORS.BILLING,
      title: "Staff Management",
      label: "Staff Management",
      url: '',
      subItems: [
          { 
            id: 'staff-management-employees-dashboard', 
            title: 'Employees Dashboard', 
            icon: <LayoutDashboard size={16} />, 
            url: '/staff-management/employees/dashboard', 
            permission: PERMISSIONS.VIEW_EMPLOYEES_DASHBOARD_STAFF_MANAGEMENT 
          },
          {
            id: 'staff-management-employees',
            title: 'Employees',
            icon: <Users size={16} />,
            url: '/staff-management/employees',
            permission: PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT 
          },
          
          { 
            id: 'staff-management-employees-onboarding', 
            title: 'Employees Onboarding', 
            icon: <UserPlus size={16} />, 
            url: '/staff-management/employees/onboarding', 
            permission: PERMISSIONS.VIEW_EMPLOYEES_ONBOARDING_STAFF_MANAGEMENT 
          },
          
          { 
            id: 'staff-management-employees-approval-request', 
            title: 'Approval Request', 
            icon: <CheckCheck size={16} />, 
            url: '/staff-management/approval-request', 
            permission: PERMISSIONS.VIEW_EMPLOYEES_APPROVAL_REQUEST_STAFF_MANAGEMENT 
          },
          
          { 
            id: 'staff-management-employees-organizational-chart', 
            title: 'Organizational Chart', 
            icon: <Layers2 size={16} />, 
            url: '/staff-management/organizational-chart', 
            permission: PERMISSIONS.VIEW_EMPLOYEES_ORGANIZATIONAL_CHART_STAFF_MANAGEMENT 
          },
          
      ]
      .filter(item => !item.permission || hasPermission(item.permission))
    }, 
    
    // {
    //   id: 'tickets',
    //   key: 'tickets',
    //   permission: PERMISSIONS.TICKETS_SERVICES,
    //   icon: <Ticket size={20} />,
    //   color: MENU_COLORS.TICKETS,
    //   title: MENU_LABELS.TICKETS,
    //   label: MENU_LABELS.TICKETS,
    //   url: '',
    //   subItems: [
    //     {
    //       id: 'tickets-dashboard',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.TICKETS_DASHBOARD,
    //       icon: <LayoutDashboard size={16} />,
    //       permission: PERMISSIONS.VIEW_TICKETS_DASHBOARD,
    //       url: '/tickets/dashboard'
    //     },
    //     {
    //       id: 'tickets-list',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.TICKETS_LIST,
    //       icon: <Ticket size={16} />,
    //       permission: PERMISSIONS.VIEW_TICKETS_LIST,
    //       url: '/tickets/list'
    //     },
    //     {
    //       id: 'tickets-status',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.STATUS,
    //       icon: <List size={16} />,
    //       permission: PERMISSIONS.VIEW_TICKETS_STATUS,
    //       url: '/tickets/statuses'
    //     },
    //     {
    //       id: 'tickets-modules',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.MODULES,
    //       icon: <Layers size={16} />,
    //       permission: PERMISSIONS.VIEW_TICKETS_MODULES,
    //       url: '/tickets/modules'
    //     },
    //     {
    //       id: 'tickets-module-categories',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.TICKET_MODULE_CATEGORIES,
    //       icon: <Layers size={16} />,
    //       permission: PERMISSIONS.VIEW_TICKETS_CATEGORIES,
    //       url: '/tickets/modules/categories'
    //     },
    //     {
    //       id: 'tickets-module-subcategories',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.TICKET_MODULE_SUBCATEGORIES,
    //       icon: <Layers size={16} />,
    //       permission: PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES,
    //       url: '/tickets/modules/sub-categories'
    //     },

    //     {
    //       id: 'tickets-types',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.TYPES,
    //       icon: <List size={16} />,
    //       permission: PERMISSIONS.VIEW_TICKETS_TYPES,
    //       url: '/tickets/types'
    //     }
    //   ].filter(item => !item.permission || hasPermission(item.permission))
    // },

    

   

   

    // {
    //   id: 'controlhub',
    //   key: 'controlhub',
    //   permission: PERMISSIONS.CONTROL_HUB_SERVICES,
    //   icon: <Settings size={20} />,
    //   color: MENU_COLORS.CONTROL_HUB,
    //   title: MENU_LABELS.CONTROL_HUB,
    //   label: MENU_LABELS.CONTROL_HUB,
    //   url: '',
    //   subItems: [
    //     {
    //       id: 'controlhub-users',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.USER_DIRECTORY,
    //       icon: <Users size={16} />,
    //       permission: PERMISSIONS.VIEW_USERS,
    //       url: '/controlhub/users'
    //     },
    //     {
    //       id: 'controlhub-teams',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.TEAMS,
    //       icon: <Boxes size={16} />,
    //       permission: PERMISSIONS.VIEW_TEAMS,
    //       url: '/controlhub/teams'
    //     },
    //     {
    //       id: 'controlhub-groups',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.GROUPS,
    //       icon: <Group size={16} />,
    //       permission: PERMISSIONS.VIEW_GROUPS,
    //       url: '/controlhub/groups'
    //     },
    //     {
    //       id: 'controlhub-ranks',
    //       title: HEADER_CONSTANTS.SUBMENU_LABELS.RANKS,
    //       icon: <Shield size={16} />,
    //       permission: PERMISSIONS.VIEW_RANKS,
    //       url: '/controlhub/ranks'
    //     }
        
    //   ].filter(item => !item.permission || hasPermission(item.permission))
    // },

    {
      id: 'reports',
      key: 'reports',
      permission: PERMISSIONS.REPORTS_SERVICES,
      icon: <BarChart3 size={20} />,
      color: MENU_COLORS.REPORTS,
      title: MENU_LABELS.REPORTS,
      label: MENU_LABELS.REPORTS,
      url: '',
      subItems: [
        {
          id: 'crm-reports',
          title: 'CRM Insights',
          icon: <BarChart3 size={16} />,
          permission: PERMISSIONS.VIEW_CRM_REPORTS,
          url: '/crm/reports'
        },
        {
          id: 'call-reports',
          title: 'Call Analytics',
          icon: <BarChart3 size={16} />,
          permission: PERMISSIONS.VIEW_CALL_REPORTS,
          url: '/call-reports'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },

    {
      id: 'settings',
      key: 'settings',
      permission: '',
      icon: <Settings size={20} />,
      color: '#0d6efd',
      title: "Settings",
      label: "Settings",
      url: '/settings'
    },

    {
      id: 'resources',
      key: 'resources',
      permission: '',
      icon: <NotebookText size={20} />,
      color: MENU_COLORS.RESOURCES,
      title: MENU_LABELS.RESOURCES,
      label: MENU_LABELS.RESOURCES,
      url: '/help-center',
    }


  ].filter(item => !item.permission || hasPermission(item.permission));

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      // If the module is already open, close it
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      }
      // If opening a new module, close all others first (only one open at a time)
      return [moduleId];
    });
  };

  const toggleSubModule = (subModuleId: string) => {
    setExpandedSubModules(prev => 
      prev.includes(subModuleId) 
        ? prev.filter(id => id !== subModuleId)
        : [...prev, subModuleId]
    );
  };

  const handleSubItemClick = (screenId: string) => {
    // Navigation handled by Link component
  };

  // Filter menu items based on search query
  const filterMenuItems = (items: MainMenuItem[]): MainMenuItem[] => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      const matchesTitle = item.title.toLowerCase().includes(query);
      const matchesSubItems = item.subItems?.some(subItem => {
        const matchesSubTitle = subItem.title.toLowerCase().includes(query);
        const matchesNested = subItem.subItems?.some(nested => 
          nested.title.toLowerCase().includes(query)
        );
        return matchesSubTitle || matchesNested;
      });
      return matchesTitle || matchesSubItems;
    }).map(item => {
      if (!item.subItems) return item;
      
      const filteredSubItems = item.subItems.filter(subItem => {
        const matchesSubTitle = subItem.title.toLowerCase().includes(query);
        const matchesNested = subItem.subItems?.some(nested => 
          nested.title.toLowerCase().includes(query)
        );
        return matchesSubTitle || matchesNested;
      });
      
      return { ...item, subItems: filteredSubItems.length > 0 ? filteredSubItems : item.subItems };
    });
  };

  // Automatically expand modules and sub-modules when route changes
  useEffect(() => {
    // Only run when pathname actually changes (not on every render)
    if (prevPathnameRef.current === router.pathname) {
      return;
    }
    
    // Update the ref to the current pathname
    prevPathnameRef.current = router.pathname;
    
    // Check if a sub-item or any of its nested children matches the current route
    const isSubItemActive = (subItem: SubMenuItem): boolean => {
      if (subItem.url && router.pathname === subItem.url) {
        return true;
      }
      if (subItem.subItems && subItem.subItems.length > 0) {
        return subItem.subItems.some(nestedItem => isSubItemActive(nestedItem));
      }
      return false;
    };

    // Check if a module has any active child
    const hasActiveChild = (module: MainMenuItem): boolean => {
      // First check if the module itself matches the route (for direct URLs)
      if (module.url && router.pathname === module.url) {
        return true;
      }
      // Then check if any subItem matches
      if (!module.subItems || module.subItems.length === 0) {
        return false;
      }
      return module.subItems.some(subItem => isSubItemActive(subItem));
    };

    const modulesToExpand: string[] = [];
    const subModulesToExpand: string[] = [];

    mainMenuItems.forEach(module => {
      if (hasActiveChild(module)) {
        modulesToExpand.push(module.id);
        
        // Also expand sub-modules that have active children
        if (module.subItems) {
          module.subItems.forEach(subItem => {
            if (isSubItemActive(subItem)) {
              subModulesToExpand.push(subItem.id);
            }
          });
        }
      }
    });

    // Update expanded modules - collapse all that don't match, expand only the matching one
    setExpandedModules(prev => {
      // If there's a module to expand, only keep that one
      if (modulesToExpand.length > 0) {
        const moduleToOpen = modulesToExpand[0];
        // Only update if different from current state
        if (prev.length === 1 && prev[0] === moduleToOpen) {
          return prev; // No change needed
        }
        return [moduleToOpen];
      } else {
        // If no module matches, collapse all
        return [];
      }
    });

    // Update expanded sub-modules - only keep those that match
    setExpandedSubModules(prev => {
      if (subModulesToExpand.length > 0) {
        const newExpanded = Array.from(new Set(subModulesToExpand));
        // Only update state if there's an actual change to prevent infinite loops
        const hasChange = newExpanded.length !== prev.length || 
                         !newExpanded.every(id => prev.includes(id));
        return hasChange ? newExpanded : prev;
      } else {
        // If no sub-modules match, collapse all
        return [];
      }
    });
  }, [router.pathname, mainMenuItems]);

  const customStyles = `
    * {
      box-sizing: border-box;
    }

    .sidebar-container {
      position: fixed;
      top: 76px;
      left: 0;
      height: calc(100vh - 76px);
      width: 280px;
      background: #ffffff;
      border-right: 1px solid #e8e8e8;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      transition: transform 0.3s ease-in-out;
    }

    /* On desktop, hide sidebar only when sidebarOpen is false */
    @media (min-width: 1200px) {
      .sidebar-container.mobile-hidden {
        transform: translateX(-100%);
      }
    }

    /* On mobile, always hide by default */
    @media (max-width: 1199px) {
      .sidebar-container {
        transform: translateX(-100%);
        top: 0;
        height: 100vh;
        z-index: 1001;
      }
      .sidebar-container:not(.mobile-hidden) {
        transform: translateX(0);
      }
    }

    .mobile-menu-btn {
      display: none;
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1050;
      padding: 8px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .sidebar-backdrop {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }

    /* Only show backdrop on mobile */
    @media (max-width: 1199px) {
      .sidebar-backdrop.show {
        display: block;
      }
      .mobile-menu-btn {
        display: block;
      }
    }

    .sidebar-search {
      flex-shrink: 0;
      padding: 16px 16px 0 16px;
    }

    .search-wrapper {
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 10px 16px 10px 40px;
      background: #f5f5f5;
      border: 1px solid transparent;
      border-radius: 8px;
      font-size: 14px;
      color: #333;
      outline: none;
      transition: all 0.2s;
    }

    .search-input:focus {
      background: #efefef;
      border-color: #e0e0e0;
    }

    .search-input::placeholder {
      color: #999;
    }

    .sidebar-menu {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 24px;
      display: flex;
      flex-direction: column;
    }

    .sidebar-menu::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-menu::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-menu::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    .sidebar-menu::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    .sidebar-section {
      margin-bottom: 8px;
    }

    .sidebar-section.system-section {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid #e8e8e8;
    }

    .section-heading {
      padding: 12px 16px 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
    }

    .menu-nav {
      list-style: none;
      margin: 0;
      padding: 0 8px;
    }

    .menu-item {
      margin-bottom: 2px;
    }

    .menu-item-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
      text-align: left;
      position: relative;
      text-decoration: none;
    }

    .menu-item-button:hover {
      background: #fafafa;
    }

    .menu-item-button.active {
      background: #e3f2fd;
    }

    .menu-item-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .menu-item-icon {
      color: #666;
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }

    .menu-item-button.active .menu-item-icon {
      color: #1976d2;
    }

    .menu-item-text {
      font-size: 12px;
      font-weight: 500;
      color: #333;
    }

    .menu-item-button.active .menu-item-text {
      color: #1976d2;
    }

    .menu-item-chevron {
      color: #999;
      display: flex;
      align-items: center;
      transition: transform 0.2s;
    }

    .menu-item-chevron.expanded {
      transform: rotate(0deg);
    }

    .menu-item-chevron.collapsed {
      transform: rotate(-90deg);
    }

    .submenu {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .submenu-item {
      margin-bottom: 0;
      position: relative;
    }

    .submenu-item-button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 12px 6px 40px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      text-align: left;
      position: relative;
      border-radius: 8px;
      text-decoration: none;
    }

    .submenu-item-button::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: transparent;
      border-radius: 0 4px 4px 0;
      transition: background 0.15s;
    }

    .submenu-item-button:hover {
      background: #fafafa;
    }

    .submenu-item-button.active {
      background: transparent;
     
    }

    .submenu-item-button.active::before {
      background: #1976d2;
      display: none;
    }

    .submenu-item-icon {
      color: #999;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .submenu-item-button.active .submenu-item-icon {
      color: #1976d2;
    }

    .submenu-item-text {
      font-size: 12px;
      color: #555;
      font-weight: 400;
    }

    .submenu-item-button.active .submenu-item-text {
      color: #1976d2;
      font-weight: 500;
    }

    .nested-sub-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px 10px 70px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      text-align: left;
      position: relative;
      border-radius: 8px;
      text-decoration: none;
    }

    .nested-sub-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: transparent;
      border-radius: 0 4px 4px 0;
      transition: background 0.15s;
    }

    .nested-sub-item:hover {
      background: #fafafa;
    }

    .nested-sub-item.active {
      background: #e3f2fd;
    }

    .nested-sub-item.active::before {
      background: #1976d2;
    }

    .nested-sub-item-icon {
      color: #999;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .nested-sub-item.active .nested-sub-item-icon {
      color: #1976d2;
    }

    .sidebar-container a {
      text-decoration: none !important;
    }
  `;


  //const dashboardItems = filterMenuItems(mainMenuItems.slice(0, 2));
  const dashboardItems = filterMenuItems(
    hasPermission(PERMISSIONS.VIEW_UNIFIED_WORKSPACE) 
      ? mainMenuItems.slice(0, 2) 
      : mainMenuItems.slice(0, 1)
  );

  //const servicesItems = filterMenuItems(mainMenuItems.slice(1, -2));
  const servicesItems = filterMenuItems(
    hasPermission(PERMISSIONS.VIEW_UNIFIED_WORKSPACE) 
      ? mainMenuItems.slice(2, -2) 
      : mainMenuItems.slice(1, -2)
  );

  const systemItems = filterMenuItems(mainMenuItems.slice(-2));

  return (
    <>
      <style>{customStyles}</style>

      {/* Mobile Menu Button */}
      {/* <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button> */}

      {/* Backdrop for mobile */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar-container ${!sidebarOpen ? 'mobile-hidden' : ''}`}>
        {/* Search */}
        {/* <div className="sidebar-search">
          <div className="search-wrapper">
            <div className="search-icon">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div> */}

        {/* Menu Items */}
        <div className="sidebar-menu">
          {/* Dashboard Section */}
          <div className="sidebar-section">
            <div className="section-heading">Dashboard</div>
            <ul className="menu-nav">
              {dashboardItems.map((module) => (
                <li key={module.id} className="menu-item">
                  {module.url !== '' ? (
                    <Link href={(BASE_URL || '') + (module.url || '/')}>
                      <button
                        className={`menu-item-button ${router.pathname === module.url ? 'active' : ''}`}
                        onClick={() => {
                          if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <div className="menu-item-content">
                          <div className="menu-item-icon">
                            {module.icon}
                          </div>
                          <span className="menu-item-text">{module.title}</span>
                        </div>
                      </button>
                    </Link>
                  ) : (
                    <button
                      className={`menu-item-button ${expandedModules.includes(module.id) ? 'active' : ''}`}
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="menu-item-content">
                        <div className="menu-item-icon">
                          {module.icon}
                        </div>
                        <span className="menu-item-text">{module.title}</span>
                      </div>
                      {module.subItems && module.subItems.length > 0 && (
                        <div className={`menu-item-chevron ${expandedModules.includes(module.id) ? 'expanded' : 'collapsed'}`}>
                          <ChevronDown size={18} />
                        </div>
                      )}
                    </button>
                  )}

                  {/* Sub Items */}
                  {expandedModules.includes(module.id) && module.subItems && module.subItems.length > 0 && (
                    <ul className="submenu">
                      {module.subItems.map((subItem: SubMenuItem) => (
                        <li key={subItem.id} className="submenu-item">
                          {subItem.subItems && subItem.subItems.length > 0 ? (
                            <>
                              <button
                                className={`submenu-item-button ${expandedSubModules.includes(subItem.id) ? 'active' : ''}`}
                                onClick={() => toggleSubModule(subItem.id)}
                              >
                                <div className="submenu-item-icon">
                                  {subItem.icon}
                                </div>
                                <span className="submenu-item-text">{subItem.title}</span>
                                <div className={`menu-item-chevron ${expandedSubModules.includes(subItem.id) ? 'expanded' : 'collapsed'}`}>
                                  <ChevronDown size={16} />
                                </div>
                              </button>
                              {expandedSubModules.includes(subItem.id) && (
                                <ul className="submenu">
                                  {subItem.subItems.map((nestedItem: SubMenuItem) => (
                                    <li key={nestedItem.id} className="submenu-item">
                                      <Link href={nestedItem.url || '/'}>
                                        <button
                                          className={`nested-sub-item ${router.pathname === nestedItem.url ? 'active' : ''}`}
                                          onClick={() => {
                                            handleSubItemClick(nestedItem.id);
                                            if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                                              setSidebarOpen(false);
                                            }
                                          }}
                                        >
                                          <div className="nested-sub-item-icon">
                                            {nestedItem.icon}
                                          </div>
                                          <span className="submenu-item-text">{nestedItem.title}</span>
                                        </button>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          ) : (
                            <Link href={subItem.url || '/'}>
                              <button
                                className={`submenu-item-button ${router.pathname === subItem.url ? 'active' : ''}`}
                                onClick={() => {
                                  if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                                    setSidebarOpen(false);
                                  }
                                }}
                              >
                                <div className="submenu-item-icon">
                                  {subItem.icon}
                                </div>
                                <span className="submenu-item-text">{subItem.title}</span>
                              </button>
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Services Section */}
          <div className="sidebar-section">
            <div className="section-heading">Services</div>
            <ul className="menu-nav">
              {servicesItems.map((module) => (
                <li key={module.id} className="menu-item">
                  {module.url !== '' ? (
                    <Link href={(BASE_URL || '') + (module.url || '/')}>
                      <button
                        className={`menu-item-button ${router.pathname === module.url ? 'active' : ''}`}
                        onClick={() => {
                          if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <div className="menu-item-content">
                          <div className="menu-item-icon">
                            {module.icon}
                          </div>
                          <span className="menu-item-text">{module.title}</span>
                        </div>
                      </button>
                    </Link>
                  ) : (
                    <button
                      className={`menu-item-button ${expandedModules.includes(module.id) ? 'active' : ''}`}
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="menu-item-content">
                        <div className="menu-item-icon">
                          {module.icon}
                        </div>
                        <span className="menu-item-text">{module.title}</span>
                      </div>
                      {module.subItems && module.subItems.length > 0 && (
                        <div className={`menu-item-chevron ${expandedModules.includes(module.id) ? 'expanded' : 'collapsed'}`}>
                          <ChevronDown size={18} />
                        </div>
                      )}
                    </button>
                  )}

                  {/* Sub Items */}
                  {expandedModules.includes(module.id) && module.subItems && module.subItems.length > 0 && (
                    <ul className="submenu">
                      {module.subItems.map((subItem: SubMenuItem) => (
                        <li key={subItem.id} className="submenu-item">
                          {subItem.subItems && subItem.subItems.length > 0 ? (
                            <>
                              <button
                                className={`submenu-item-button ${expandedSubModules.includes(subItem.id) ? 'active' : ''}`}
                                onClick={() => toggleSubModule(subItem.id)}
                              >
                                <div className="submenu-item-icon">
                                  {subItem.icon}
                                </div>
                                <span className="submenu-item-text">{subItem.title}</span>
                                <div className={`menu-item-chevron ${expandedSubModules.includes(subItem.id) ? 'expanded' : 'collapsed'}`}>
                                  <ChevronDown size={16} />
                                </div>
                              </button>
                              {expandedSubModules.includes(subItem.id) && (
                                <ul className="submenu">
                                  {subItem.subItems.map((nestedItem: SubMenuItem) => (
                                    <li key={nestedItem.id} className="submenu-item">
                                      <Link href={nestedItem.url || '/'}>
                                        <button
                                          className={`nested-sub-item ${router.pathname === nestedItem.url ? 'active' : ''}`}
                                          onClick={() => {
                                            handleSubItemClick(nestedItem.id);
                                            if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                                              setSidebarOpen(false);
                                            }
                                          }}
                                        >
                                          <div className="nested-sub-item-icon">
                                            {nestedItem.icon}
                                          </div>
                                          <span className="submenu-item-text">{nestedItem.title}</span>
                                        </button>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          ) : (
                            <Link href={subItem.url || '/'}>
                              <button
                                className={`submenu-item-button ${router.pathname === subItem.url ? 'active' : ''}`}
                                onClick={() => {
                                  if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                                    setSidebarOpen(false);
                                  }
                                }}
                              >
                                <div className="submenu-item-icon">
                                  {subItem.icon}
                                </div>
                                <span className="submenu-item-text">{subItem.title}</span>
                              </button>
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* System Section - Always at bottom */}
          <div className="sidebar-section system-section">
            <div className="section-heading">Admin & Support</div>
            <ul className="menu-nav">
              {systemItems.map((module) => (
                <li key={module.id} className="menu-item">
                  {module.url !== '' ? (
                    <Link href={(BASE_URL || '') + (module.url || '/')}>
                      <button
                        className={`menu-item-button ${router.pathname === module.url ? 'active' : ''}`}
                        onClick={() => {
                          if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <div className="menu-item-content">
                          <div className="menu-item-icon">
                            {module.icon}
                          </div>
                          <span className="menu-item-text">{module.title}</span>
                        </div>
                      </button>
                    </Link>
                  ) : (
                    <button
                      className={`menu-item-button ${expandedModules.includes(module.id) ? 'active' : ''}`}
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="menu-item-content">
                        <div className="menu-item-icon">
                          {module.icon}
                        </div>
                        <span className="menu-item-text">{module.title}</span>
                      </div>
                      {module.subItems && module.subItems.length > 0 && (
                        <div className={`menu-item-chevron ${expandedModules.includes(module.id) ? 'expanded' : 'collapsed'}`}>
                          <ChevronDown size={18} />
                        </div>
                      )}
                    </button>
                  )}

                  {/* Sub Items */}
                  {expandedModules.includes(module.id) && module.subItems && module.subItems.length > 0 && (
                    <ul className="submenu">
                      {module.subItems.map((subItem: SubMenuItem) => (
                        <li key={subItem.id} className="submenu-item">
                          {subItem.subItems && subItem.subItems.length > 0 ? (
                            <>
                              <button
                                className={`submenu-item-button ${expandedSubModules.includes(subItem.id) ? 'active' : ''}`}
                                onClick={() => toggleSubModule(subItem.id)}
                              >
                                <div className="submenu-item-icon">
                                  {subItem.icon}
                                </div>
                                <span className="submenu-item-text">{subItem.title}</span>
                                <div className={`menu-item-chevron ${expandedSubModules.includes(subItem.id) ? 'expanded' : 'collapsed'}`}>
                                  <ChevronDown size={16} />
                                </div>
                              </button>
                              {expandedSubModules.includes(subItem.id) && (
                                <ul className="submenu">
                                  {subItem.subItems.map((nestedItem: SubMenuItem) => (
                                    <li key={nestedItem.id} className="submenu-item">
                                      <Link href={nestedItem.url || '/'}>
                                        <button
                                          className={`nested-sub-item ${router.pathname === nestedItem.url ? 'active' : ''}`}
                                          onClick={() => {
                                            handleSubItemClick(nestedItem.id);
                                            if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                                              setSidebarOpen(false);
                                            }
                                          }}
                                        >
                                          <div className="nested-sub-item-icon">
                                            {nestedItem.icon}
                                          </div>
                                          <span className="submenu-item-text">{nestedItem.title}</span>
                                        </button>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          ) : (
                            <Link href={subItem.url || '/'}>
                              <button
                                className={`submenu-item-button ${router.pathname === subItem.url ? 'active' : ''}`}
                                onClick={() => {
                                  if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                                    setSidebarOpen(false);
                                  }
                                }}
                              >
                                <div className="submenu-item-icon">
                                  {subItem.icon}
                                </div>
                                <span className="submenu-item-text">{subItem.title}</span>
                              </button>
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationCustomerSidebar;
