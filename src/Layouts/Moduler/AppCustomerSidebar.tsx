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
  Layers2,
  Map,
  ChevronRight,
  ChevronLeft,
  House,
  Building2,
  Book
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import logodark from '@assets/images/Prime-Alley-Logo.png';

import { HEADER_CONSTANTS} from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import { getCurrentUserCompanyImage } from "@utils/company";
import { useSession } from "next-auth/react";

// Destructure constants for easier use
const { MENU_LABELS, ICONS, PERMISSIONS, MENU_COLORS, BASE_URL } = HEADER_CONSTANTS;

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

const SIDEBAR_WIDTH_COLLAPSED = 65;
const SIDEBAR_WIDTH_EXPANDED = 235;

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** When provided, sidebar expand/collapse is controlled by parent (e.g. for topbar alignment) */
  isSidebarExpanded?: boolean;
  setSidebarExpanded?: (expanded: boolean) => void;
}

const ApplicationCustomerSidebar: React.FC<SidebarProps> = ({ 
  sidebarOpen, 
  setSidebarOpen,
  isSidebarExpanded: controlledExpanded,
  setSidebarExpanded: setControlledExpanded,
}) => {
  const { data: session, status } = useSession();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isSidebarExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setIsSidebarExpanded = setControlledExpanded ?? setInternalExpanded;
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [expandedSubModules, setExpandedSubModules] = useState<string[]>([]);
  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);
  const [hoveredItemRect, setHoveredItemRect] = useState<{ top: number; height: number } | null>(null);
  const [isFlyoutPinned, setIsFlyoutPinned] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const prevPathnameRef = useRef<string>('');
  const [currentUserCompanyImageUrl, setCurrentUserCompanyImageUrl] = useState<string | null>(null);
  const companyImageUrlRef = useRef<string | null>(null);

  const [userCompanyName, setUserCompanyName] = useState('');
  useEffect(() => {
		if (status !=="loading" && session) {
		  if (typeof window !== "undefined") {
		    setUserCompanyName(session.user.company_name || '');
		  }
		}
	}, [ status, session]);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserCompanyImage()
      .then((blob) => {
        if (cancelled) return;
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          companyImageUrlRef.current = url;
          setCurrentUserCompanyImageUrl(url);
        } else {
          setCurrentUserCompanyImageUrl(null);
        }
      })
      .catch(() => {
        if (!cancelled) setCurrentUserCompanyImageUrl(null);
      });
    return () => {
      cancelled = true;
      const url = companyImageUrlRef.current;
      if (url) {
        URL.revokeObjectURL(url);
        companyImageUrlRef.current = null;
      }
    };
  }, []);

  // Get permissions hook for checking access
  const { hasPermission } = usePermissions();

  // Only these modules are enabled; others are hidden (can re-enable by adding id to this list)
  const ENABLED_MODULE_IDS = [
    'dashboard',     
    'crm',          
    'communications',
    'planner',
    'pulse',
    'virtual-agents',
    'finance',
    'compliance',
    'workforce',
    'unified-reports',
    'audit-logs',
    // 'settings',
    'voicebot-inbound-platform',
    'voicebot-outbound-platform'
  ];

  const mainMenuItems: MainMenuItem[] = [
    {
      id: 'dashboard',
      key: 'dashboard',
      permission: '',
      icon: <House size={16} />,
      color: MENU_COLORS.DASHBOARD,
      title: "Overview",
      label: "Overview",
      url: '/dashboard',
    },
    {
      id: 'dashboard-unified-workspace',
      key: 'dashboard-unified-workspace',
      icon: <LayoutDashboard size={16} />,
      color: MENU_COLORS.DASHBOARD,
      permission: PERMISSIONS.VIEW_UNIFIED_WORKSPACE,
      title: "Unified Workspace",
      label: "Unified Workspace",
      url: '/unified-workspace',
    },

    //crm services start
    {
      id: 'crm',
      key: 'crm',
      permission: PERMISSIONS.CRM_SERVICES,
      icon: <Briefcase size={16} />,
      color: MENU_COLORS.CRM,
      title: "Smart CRM",
      label: "Smart CRM",
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
          id: 'crm-prospects-management',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.DATA_MANAGEMENT,
          icon: <UserSearch size={16} />,
          permission: PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT,
          url: '/crm/prospects',
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
          id: 'crm-orders',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.ORDERS,
          icon: <ReceiptText size={16} />,
          permission: PERMISSIONS.VIEW_CRM_ORDERS,
          url: '/crm/orders'
        },
        {
          id: 'crm-deals-approval',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.DEALS_APPROVAL,
          icon: <Handshake size={16} />,
          permission: PERMISSIONS.APPROVE_REJECT_CRM_DEALS,
          url: '/crm/approvals', 
        },
        {
          id: 'crm-separator-1',
          title: '---',
          icon: null,
          url: ''
        },
        {
          id: 'crm-company',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.CONTACTS,
          icon: <Book size={16} />,
          permission: PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT,
          url: '/crm/contacts'
        },
        {
          id: 'crm-company',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.COMPANY,
          icon: <ReceiptText size={16} />,
          permission: PERMISSIONS.VIEW_COMPANIES_CRM,
          url: '/crm/companies'
        },
        
        {
          id: 'crm-inbox',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.INBOX_CRM,
          icon: <ReceiptText size={16} />,
          permission: PERMISSIONS.VIEW_WHATSAPP_MESSAGES_CRM,
          url: '/crm/inbox'
        },
        {
          id: 'crm-activities',
          title: (HEADER_CONSTANTS.SUBMENU_LABELS as Record<string, string>).CRM_ACTIVITY ?? 'Activities',
          icon: <Activity size={16} />,
          permission: PERMISSIONS.VIEW_CRM_HISTORY,
          url: '/crm/activities'
        },
      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    //crm services end
    
    //communications services start
    {
      id: 'communications',
      key: 'communications',
      permission: PERMISSIONS.COMMUNICATIONS_SERVICES,
      icon: <Phone size={16} />,
      color: MENU_COLORS.CALL_HISTORY,
      title: 'Communications',
      label: 'Communications',
      url: '',
      subItems: [
        {
          id: 'call-history-dashboard',
          title: 'Dashboard',
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.VIEW_CALL_DASHBOARD,
          url: '/communications/dashboard'
        },
        {
          id: 'call-history-logs',
          title: HEADER_CONSTANTS.MENU_LABELS.CALL_LOGS,
          icon: <Phone size={16} />,
          permission: PERMISSIONS.VIEW_CALL_LOGS,
          url: '/communications/call-logs'
        },
        {
          id: 'call-history-recordings',
          title: HEADER_CONSTANTS.MENU_LABELS.CALL_RECORDINGS,
          icon: <Voicemail size={16} />,
          permission: PERMISSIONS.VIEW_CALL_RECORDINGS,
          url: '/communications/recordings'
        },
        {
          id: 'ai-ml-calls-analysis',
          title: 'Calls Analysis',
          icon: <FileChartPie size={16} />,
          permission: PERMISSIONS.TRANSCRIPTION_ANALYZE_RECORDINGS_AIML,
          url: '/communications/call-analysis'
        },
        {
          id: 'wallboards-live',
          title: "Wallboards (Live)",
          icon: <MonitorCheck size={16} />,
          permission: PERMISSIONS.VIEW_CTI,
          url: '/communications/wallboards-live'
        },
        {
          id: 'text-messages-communications',
          title: "Text Messages",
          icon: <MessageCircle size={16} />,
          permission: PERMISSIONS.VIEW_GSM_INBOX,
          url: '/communications/text-messages'
        },

        {
          id: 'live-calls-campaign-manager',
          title: 'Campaigns Manager',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.VIEW_LIVE_CALLS_CAMPAIGNS_MANAGEMENT,
          url: '/communications/campaign-manager'
        },
        {
          id: 'live-calls-campaign-console',
          title: 'Campaign Console',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.VIEW_LIVE_CALLS_AGENT_MANAGEMENT,
          url: '/communications/campaign-console'
        },


      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    //communications services end

    //planner services start
    {
      id: 'planner',
      key: 'planner',
      permission: PERMISSIONS.WORK_PLANNER_SERVICES,
      icon: <Calendar size={16} />,
      color: MENU_COLORS.BILLING,
      title: "Planner",
      label: "Planner",
      url: '',
      subItems: [

        {
          id: 'planner-dashboard',
          title: 'Dashboard',
          icon: <Folder size={16} />,
          url: '/planner/dashboard',
          permission: PERMISSIONS.VIEW_PROJECTS_DASHBOARD_WORK_PLANNER 
        },
        {
          id: 'planner-projects',
          title: 'Projects',
          icon: <Folder size={16} />,
          url: '/planner/projects',
          permission: PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER 
        },
        {
          id: 'planner-tasks',
          title: 'Tasks',
          icon: <Clock size={16} />,
          url: '/planner/tasks',
          permission: PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER 
        },
        {
          id: 'planner-calendar',
          title: 'Calendar',
          icon: <Calendar size={16} />,
          url: '/planner/calendar',
          permission: PERMISSIONS.VIEW_CALENDAR_WORK_PLANNER 
        },
        { 
          id: 'work-planner-orders', 
          title: 'Orders Delivery', 
          icon: <ReceiptText size={16} />, 
          url: '/planner/orders-delivery', 
          permission: PERMISSIONS.VIEW_ORDERS_DELIVERY_WORK_PLANNER 
        },
       
      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    //planner services end

    //virtual agent start
    {
      id: 'virtual-agents',
      key: 'virtual-agents',
      permission: PERMISSIONS.VIRTUAL_AGENTS_SERVICES,
      icon: <Workflow size={16} />,
      color: MENU_COLORS.AUTOMATION,
      title: "Virtual Agents",
      label: "Virtual Agents",
      url: '',
      subItems: [
        {
          id: 'virtual-agents-outbound-agent',
          title: 'Outbound Agent',
          icon: <User size={16} />,
          permission: PERMISSIONS.VIEW_OUTBOUND_CALLS_AIML,
          url: '/agents/outbound-agent'
        },
        {
          id: 'virtual-agents-inbound-agent',
          title: 'Inbound Agent',
          icon: <User size={16} />,
          permission: PERMISSIONS.VIEW_INBOUND_CALLS_AIML,
          url: '/agents/inbound-agent'
        },
        {
          id: 'virtual-agents-agent-campaigns',
          title: 'Agent Campaigns',
          icon: <User size={16} />,
          permission: PERMISSIONS.VIEW_AGENT_CAMPAIGNS_AIML,
          url: '/agents/agent-campaigns'
        },
        {
          id: 'virtual-agents-create-campaigns',
          title: 'Create Campaign',
          icon: <User size={16} />,
          permission: PERMISSIONS.CREATE_CAMPAIGN_AIML,
          url: '/agents/create-campaign'
        },
        {
          id: 'ai-agent-outbound-campaigns-pitch-deck',
          title: 'Pitch Deck',
          icon: <User size={16} />,
          permission: PERMISSIONS.VIEW_PITCH_DECK_AIML,
          url: '/agents/pitch-deck'
        },
        {
          id: 'virtual-agents-live-monitoring',
          title: 'Live Monitoring',
          icon: <MonitorCheck size={16} />,
          permission: PERMISSIONS.VIEW_LIVE_MONITORING_AIML,
          url: '/agents/live-monitoring'
        },
        {
          id: 'virtual-agents-analytics',
          title: 'Analytics',
          icon: <BarChart3 size={16} />,
          permission: PERMISSIONS.VIEW_ANALYTICS_AIML,
          url: '/agents/analytics'
        },
        {
          id: 'virtual-agents-usage-reports',
          title: 'Usage Reports',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.VIEW_USAGE_REPORTS_AIML,
          url: '/agents/usage-reports'
        }
      ]
    },
    //virtual agent end

   

    //netops services start
    {
      id: 'pulse',
      key: 'pulse',
      permission: PERMISSIONS.NETOPS_SERVICES,
      icon: <LayoutDashboard size={16} />,
      color: MENU_COLORS.NETOPS,
      title: "Pulse",
      label: "Pulse",
      url: '',
      subItems: [
        {
          id: 'pulse-dashboard',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_DASHBOARD,
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_DASHBOARD,
          url: '/pulse/dashboard'
        },
        {
          id: 'pulse-hosts',
          title: 'Hosts',
          icon: <Server size={16} />,
          permission: PERMISSIONS.VIEW_HOSTS_NETOPS,
          url: '/pulse/hosts'
        },
        {
          id: 'pulse-hosts-groups',
          title: 'Hosts Groups',
          icon: <Server size={16} />,
          permission: PERMISSIONS.VIEW_HOST_GROUPS_NETOPS,
          url: '/pulse/host-groups'
        },
        {
          id: 'pulse-hosts-alerts',
          title: 'Alerts',
          icon: <Server size={16} />,
          permission: PERMISSIONS.VIEW_ALERTS_NETOPS,
          url: '/pulse/alerts'
        },
        {
          id: 'pulse-templates',
          title: 'Templates',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.VIEW_TEMPLATES_NETOPS,
          url: '/pulse/templates'
        },
        {
          id: 'pulse-events',
          title: 'Events',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.VIEW_EVENTS_NETOPS,
          url: '/pulse/events'
        },
        {
          id: 'pulse-customers',
          title: 'Customers',
          icon: <Megaphone size={16} />,
          permission: PERMISSIONS.VIEW_CUSTOMERS_NETOPS,
          url: '/pulse/customers'
        },


        {
          id: 'pulse-uptime-sla',
          title: HEADER_CONSTANTS.SUBMENU_LABELS.NETOPS_UPTIME_SLA,
          icon: <Monitor size={16} />,
          permission: PERMISSIONS.VIEW_NETOPS_UPTIME_SLA,
          url: '/pulse/uptime-sla'
        },
        {
          id: 'pulse-select-server',
          title: 'Server Insights',
          icon: <Server size={16} />,
          permission: PERMISSIONS.VIEW_SERVER_INSIGHTS_NETOPS,
          url: '/pulse/server-insights'
        },
        {
          id: 'pulse-gateways',
          title: 'Gateways',
          icon: <Wifi size={16} />,
          permission: PERMISSIONS.VIEW_GSM_MANAGEMENT,
          url: '/pulse/gateways'
        },
        {
          id: 'pulse-gateway-ports',
          title: 'Gateway Ports',
          icon: <Wifi size={16} />,
          permission: PERMISSIONS.VIEW_GSM_PORTS,
          url: '/pulse/gateway-ports'
        },
       
      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    //netops services end

    //compliance services start
    {
      id: 'compliance',
      key: 'compliance',
      permission: PERMISSIONS.DNCR_SERVICES,
      icon: <Ban size={16} />,
      color: MENU_COLORS.DNCR,
      title: MENU_LABELS.COMPLIANCES,
      label: MENU_LABELS.COMPLIANCES,
      url: '',
      subItems: [
        {
          id: 'compliance-api-number-check',
          title: "API Number Check",
          icon: <PhoneCall size={16} />,
          permission: PERMISSIONS.CHECK_NUMBERS_DNCR,
          url: '/compliance/api-number-check'
        },
        {
          id: 'compliance-cdr-records',
          title: "CDR Records",
          icon: <FileText size={16} />,
          permission: PERMISSIONS.VIEW_CDR_DNCR,
          url: '/compliance/cdr-records'
        },
        {
          id: 'dncr-local-dnd-call-block',
          title: "Add Records",
          icon: <PhoneCall size={16} />,
          permission: PERMISSIONS.VIEW_LOCAL_DND_CALL_BLOCK_DNCR,
          url: '/compliance/add-records'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    //compliance services end

    //workforce services start
    {
      id: 'workforce',
      key: 'workforce',
      permission: PERMISSIONS.STAFF_MANAGEMENT_SERVICES,
      icon: <Users size={16} />,
      color: MENU_COLORS.BILLING,
      title: "Workforce",
      label: "Workforce",
      url: '',
      subItems: [
        { 
          id: 'workforce-dashboard', 
          title: 'Dashboard', 
          icon: <LayoutDashboard size={16} />, 
          url: '/workforce/dashboard', 
          permission: PERMISSIONS.VIEW_EMPLOYEES_DASHBOARD_STAFF_MANAGEMENT 
        },
        { 
          id: 'workforce-org-chart', 
          title: 'Org Chart', 
          icon: <Layers2 size={16} />, 
          url: '/workforce/org-chart', 
          permission: PERMISSIONS.VIEW_EMPLOYEES_ORGANIZATIONAL_CHART_STAFF_MANAGEMENT 
        },
        {
          id: 'workforce-employees',
          title: 'Employees',
          icon: <Users size={16} />,
          url: '/workforce/employees',
          permission: PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT 
        },
        {
          id: 'workforce-attendence',
          title: 'Attendance',
          icon: <Clock size={16} />,
          url: '/workforce/attendance',
          permission: PERMISSIONS.VIEW_ATTENDENCE_STAFF_MANAGEMENT 
        },
        { 
          id: 'workforce-journey', 
          title: 'Journey', 
          icon: <UserPlus size={16} />, 
          url: '/workforce/journey', 
          permission: PERMISSIONS.VIEW_EMPLOYEES_ONBOARDING_STAFF_MANAGEMENT 
        },
        { 
          id: 'workforce-approval-requests', 
          title: 'Approval Requests', 
          icon: <CheckCheck size={16} />, 
          url: '/workforce/approval-requests', 
          permission: PERMISSIONS.VIEW_EMPLOYEES_APPROVAL_REQUEST_STAFF_MANAGEMENT 
        },
      ].filter(item => !item.permission || hasPermission(item.permission))
    }, 
    //workforce services end

    //finance services start
    {
      id: 'finance',
      key: 'finance',
      permission: PERMISSIONS.ACCOUNTS_SERVICES,
      icon: <CreditCard size={16} />,
      color: MENU_COLORS.BILLING,
      title: 'Billing',
      label: 'Billing',
      url: '',
      subItems: [
        // { 
        //   id: 'finance-dashboard', 
        //   title: 'Dashboard', 
        //   icon: <LayoutDashboard size={16} />, 
        //   url: '/billing/dashboard', 
        //   permission: PERMISSIONS.VIEW_CUSTOMER_DASHBOARD_BILLING 
        // },
        // { 
        //   id: 'finance-account-overview', 
        //   title: 'Account Overview', 
        //   icon: <Eye size={16} />, 
        //   url: '/billing/account-overview', 
        //   permission: PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING 
        // },
        // { 
        //   id: 'finance-subscriptions', 
        //   title: 'Subscriptions', 
        //   icon: <ShoppingBag size={16} />, 
        //   url: '/billing/subscriptions', 
        //   permission: PERMISSIONS.VIEW_PRODUCT_DETAILS_BILLING 
        // },
        // { 
        //   id: 'finance-order-invoicing', 
        //   title: 'Order Invoicing', 
        //   icon: <ShoppingBag size={16} />, 
        //   url: '/billing/order-invoicing', 
        //   permission: PERMISSIONS.VIEW_ORDER_INVOICES_BILLING 
        // },
        
        // { 
        //   id: 'finance-payment-history', 
        //   title: 'Payment History', 
        //   icon: <FileText size={16} />, 
        //   url: '/billing/payment-history', 
        //   permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING 
        // },
        // {
        //   id: 'finance-separator-1',
        //   title: '---',
        //   icon: null,
        //   url: ''
        // },
        // { 
        //   id: 'finance-quotes', 
        //   title: 'Quotes', 
        //   icon: <Scroll size={16} />, 
        //   url: '/billing/quotes', 
        //   permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING 
        // },
        // { 
        //   id: 'finance-invoices', 
        //   title: 'Invoices', 
        //   icon: <DollarSign size={16} />, 
        //   url: '/billing/invoices', 
        //   permission: PERMISSIONS.VIEW_INVOICES_BILLING 
        // },
        // { 
        //   id: 'finance-products', 
        //   title: 'Products', 
        //   icon: <ShoppingBag size={16} />, 
        //   url: '/billing/products', 
        //   permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING 
        // },
        { 
          id: 'finance-account-overview', 
          title: 'Overview', 
          icon: <Eye size={16} />, 
          url: '/billing/account-overview', 
          permission: PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING 
        },
        
        { 
          id: 'finance-quotes', 
          title: 'Quotes', 
          icon: <Scroll size={16} />, 
          url: '/billing/quotes', 
          permission: PERMISSIONS.VIEW_CRM_QUOTES 
        },
        
        { 
          id: 'finance-products', 
          title: 'Products', 
          icon: <ShoppingBag size={16} />, 
          url: '/billing/products', 
          permission: PERMISSIONS.VIEW_PRODUCTS_BILLING 
        },
        
        { 
          id: 'finance-subscriptions', 
          title: 'Subscription', 
          icon: <ShoppingBag size={16} />, 
          url: '/billing/subscriptions', 
          permission: PERMISSIONS.VIEW_PRODUCT_DETAILS_BILLING 
        },
        
        { 
          id: 'finance-invoices', 
          title: 'Invoices', 
          icon: <DollarSign size={16} />, 
          url: '/billing/invoices', 
          permission: PERMISSIONS.VIEW_INVOICES_BILLING 
        },
        
        { 
          id: 'finance-payments', 
          title: 'Payments', 
          icon: <FileText size={16} />, 
          url: '/billing/payments', 
          permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING 
        },
        
        { 
          id: 'finance-transactions', 
          title: 'Transactions', 
          icon: <FileText size={16} />, 
          url: '', 
          permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING 
        },
      ].filter(item => !item.permission || hasPermission(item.permission))
    }, 
    //finance services end

    // voicebot inbound (platform) start
    {
      id: 'voicebot-inbound-platform',
      key: 'voicebot-inbound-platform',
      permission: PERMISSIONS.AI_ML_SERVICES,
      icon: <PhoneCall size={16} />,
      color: MENU_COLORS.AUTOMATION,
      title: 'Voicebot Inbound',
      label: 'Voicebot Inbound',
      url: '',
      subItems: [
        {
          id: 'voicebot-inbound-companies',
          title: 'Companies',
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.AI_ML_SERVICES,
          url: '/voicebot/inbound/companies'
        },
        {
          id: 'voicebot-inbound-bots',
          title: 'Bots',
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.AI_ML_SERVICES,
          url: '/voicebot/inbound/bots'
        },
        
        {
          id: 'voicebot-inbound-calls',
          title: 'Conversations',
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.AI_ML_SERVICES,
          url: '/voicebot/inbound/conversations'
        },
      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    // voicebot inbound (platform) end


    // voicebot inbound (platform) start
    {
      id: 'voicebot-outbound-platform',
      key: 'voicebot-outbound-platform',
      permission: PERMISSIONS.AI_ML_SERVICES,
      icon: <PhoneCall size={16} />,
      color: MENU_COLORS.AUTOMATION,
      title: 'Voicebot Outbound',
      label: 'Voicebot Outbound',
      url: '',
      subItems: [
        {
          id: 'voicebot-outbound-trunks',
          title: 'Trunks',
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.AI_ML_SERVICES,
          url: '/voicebot/outbound/trunks'
        },
        {
          id: 'voicebot-outbound-voicebots',
          title: 'Bots',
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.AI_ML_SERVICES,
          url: '/voicebot/outbound/voicebots'
        },
        
        {
          id: 'voicebot-outbound-campaigns',
          title: 'Campaigns',
          icon: <LayoutDashboard size={16} />,
          permission: PERMISSIONS.AI_ML_SERVICES,
          url: '/voicebot/outbound/campaigns'
        },
      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    // voicebot inbound (platform) end

    //reports and audit services start
    {
      id: 'unified-reports',
      key: 'unified-reports',
      permission: PERMISSIONS.REPORTS_SERVICES,
      icon: <BarChart3 size={16} />,
      color: MENU_COLORS.REPORTS,
      title: "Unified Reports",
      label: "Unified Reports",
      url: '',
      subItems: [
        {
          id: 'crm-reports',
          title: 'CRM Insights',
          icon: <BarChart3 size={16} />,
          permission: PERMISSIONS.VIEW_CRM_REPORTS,
          url: '/reports/crm-insights'
        },
        {
          id: 'call-reports',
          title: 'Call Analytics',
          icon: <BarChart3 size={16} />,
          permission: PERMISSIONS.VIEW_CALL_REPORTS,
          // url: '/call-reports'
          url:'/reports/call-analytics'
        },
        {
          id: 'ai-chat-usage-reports',
          title: 'Chat Usage',
          icon: <FileText size={16} />,
          permission: PERMISSIONS.CHAT_USAGE_REPORTS,
          url: '/reports/chat-usage'
        }
      ].filter(item => !item.permission || hasPermission(item.permission))
    },
    //reports and audit services end

    //audit logs services start
      {
        id: 'audit-logs',
        key: 'audit-logs',
        permission: PERMISSIONS.AUDIT_LOGS_SERVICES,
        icon: <History size={16} />,
        color: MENU_COLORS.REPORTS,
        title: 'Audit Logs',
        label: 'Audit Logs',
        url: '/audit-logs',
    },
    //audit logs services end
    //settings services start
    {
      id: 'settings',
      key: 'settings',
      permission: PERMISSIONS.VIEW_SETTINGS,
      icon: <Settings size={16} />,
      color: MENU_COLORS.REPORTS,
      title: 'Settings',
      label: 'Settings',
      url: '/main-settings',
    },
    //settings services end


     

  ].filter(item => ENABLED_MODULE_IDS.includes(item.id) && (!item.permission || hasPermission(item.permission)));

  const toggleSubModule = (subModuleId: string) => {
    setExpandedSubModules(prev => 
      prev.includes(subModuleId) 
        ? prev.filter(id => id !== subModuleId)
        : [...prev, subModuleId]
    );
  };

  const handleModuleClick = (module: MainMenuItem, ev?: React.MouseEvent<HTMLElement>) => {
    if (module.url && module.url !== '') {
      setActiveModule(null);
      return;
    }
    if (module.subItems && module.subItems.length > 0) {
      if (isSidebarExpanded && ev) {
        // Expanded: open same flyout as hover, pinned next to clicked item
        if (hoveredModuleId === module.id && isFlyoutPinned) {
          setHoveredModuleId(null);
          setHoveredItemRect(null);
          setIsFlyoutPinned(false);
        } else {
          const rect = ev.currentTarget.getBoundingClientRect();
          setHoveredModuleId(module.id);
          setHoveredItemRect({ top: rect.top, height: rect.height });
          setIsFlyoutPinned(true);
        }
        return;
      }
      setActiveModule(null);
    }
  };

  const handleCollapsedItemMouseEnter = (module: MainMenuItem, ev: React.MouseEvent<HTMLElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (module.subItems && module.subItems.length > 0) {
      const rect = ev.currentTarget.getBoundingClientRect();
      setHoveredModuleId(module.id);
      setHoveredItemRect({ top: rect.top, height: rect.height });
    }
  };

  const handleCollapsedItemMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredModuleId(null);
      setHoveredItemRect(null);
      hoverTimeoutRef.current = null;
    }, 150);
  };

  const handleExpandedItemMouseEnter = (module: MainMenuItem, ev: React.MouseEvent<HTMLElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // When hovering over a different item while one is pinned, show the hovered item's flyout
    if (isFlyoutPinned && module.subItems && module.subItems.length > 0) {
      const rect = ev.currentTarget.getBoundingClientRect();
      setHoveredModuleId(module.id);
      setHoveredItemRect({ top: rect.top, height: rect.height });
    }
  };

  const handleExpandedItemMouseLeave = () => {
    if (isFlyoutPinned) {
      hoverTimeoutRef.current = setTimeout(() => {
        // When mouse leaves, stay on the current hovered item briefly before reverting
        hoverTimeoutRef.current = null;
      }, 50);
    }
  };

  const handleFlyoutMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleFlyoutMouseLeave = () => {
    if (!isFlyoutPinned) {
      setHoveredModuleId(null);
      setHoveredItemRect(null);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Hide flyout when sidebar is collapsed
  useEffect(() => {
    if (!isSidebarExpanded && isFlyoutPinned) {
      setHoveredModuleId(null);
      setHoveredItemRect(null);
      setIsFlyoutPinned(false);
    }
  }, [isSidebarExpanded, isFlyoutPinned]);

  // Auto-detect active module based on current route
  useEffect(() => {
    if (prevPathnameRef.current === router.pathname) {
      return;
    }
    
    prevPathnameRef.current = router.pathname;
    
    const isSubItemActive = (subItem: SubMenuItem): boolean => {
      if (subItem.url && router.pathname === subItem.url) {
        return true;
      }
      if (subItem.subItems && subItem.subItems.length > 0) {
        return subItem.subItems.some(nestedItem => isSubItemActive(nestedItem));
      }
      return false;
    };

    const hasActiveChild = (module: MainMenuItem): boolean => {
      if (module.url && router.pathname === module.url) {
        return true;
      }
      if (!module.subItems || module.subItems.length === 0) {
        return false;
      }
      return module.subItems.some(subItem => isSubItemActive(subItem));
    };

    const subModulesToExpand: string[] = [];
    let foundActiveModule: string | null = null;

    mainMenuItems.forEach(module => {
      if (hasActiveChild(module)) {
        if (module.subItems && module.subItems.length > 0) {
          foundActiveModule = module.id;
        }
        
        if (module.subItems) {
          module.subItems.forEach(subItem => {
            if (isSubItemActive(subItem)) {
              subModulesToExpand.push(subItem.id);
            }
          });
        }
      }
    });

    setActiveModule(foundActiveModule);
    setExpandedSubModules(prev => {
      if (subModulesToExpand.length > 0) {
        const newExpanded = Array.from(new Set(subModulesToExpand));
        const hasChange = newExpanded.length !== prev.length || 
                         !newExpanded.every(id => prev.includes(id));
        return hasChange ? newExpanded : prev;
      }
      return [];
    });
  }, [router.pathname, mainMenuItems]);

  const customStyles = `
    * {
      box-sizing: border-box;
    }

    .sidebar-container {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: ${isSidebarExpanded ? `${SIDEBAR_WIDTH_EXPANDED}px` : `${SIDEBAR_WIDTH_COLLAPSED}px`};
      background: #00385d;
      border: none;
      display: flex;
      flex-direction: column;
      z-index: 9999;
      transition: width 0.3s ease-in-out;
      /* box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1); */
    }

    @media (max-width: 1199px) {
      .sidebar-container {
        transform: translateX(-100%);
        top: 0;
        height: 100vh;
        z-index: 1001;
        width: 235px;
      }
      .sidebar-container:not(.mobile-hidden) {
        transform: translateX(0);
      }
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

    @media (max-width: 1199px) {
      .sidebar-backdrop.show {
        display: block;
      }
    }

    .sidebar-header {
      flex-shrink: 0;
      padding: 15px 16px 6px 25px;
      display: flex;
      align-items: center;
      justify-content: ${isSidebarExpanded ? 'flex-start' : 'center'};
      /* border-bottom: 1px solid rgba(255, 255, 255, 0.1); */
    }

    .sidebar-logo {
      color: white;
      font-size: 18px;
      font-weight: 700;
      opacity: ${isSidebarExpanded ? '1' : '0'};
      transition: opacity 0.3s;
      white-space: nowrap;
      overflow: hidden;
    }

    .expand-toggle-btn {
     
      border-radius: 6px;
      padding: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.2s;
      background: transparent;
      border: none;
    }

    .expand-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .sidebar-footer {
      flex-shrink: 0;
      padding: 12px 16px;
      border-top: 0px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: ${isSidebarExpanded ? 'flex-end' : 'center'};
    }

    .sidebar-menu {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    .sidebar-menu::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-menu::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-menu::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    .sidebar-menu::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .menu-nav {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .menu-item {
      margin-bottom: 10px;
      position: relative;
    }

    .menu-item-tooltip {
      display: none;
      position: absolute;
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-left: 12px;
      padding: 8px 12px;
      background: #1e3a8a;
      color: white;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 1002;
      pointer-events: none;
    }

    .sidebar-container.collapsed .menu-item:hover .menu-item-tooltip {
      display: block;
    }

    .sidebar-container.collapsed .menu-item .menu-item-tooltip {
      animation: tooltipFade 0.15s ease;
    }

    @keyframes tooltipFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Submenu flyout - purple background, white text, 3px gap from sidebar */
    .submenu-flyout {
      position: fixed;
      top: 0;
      min-width: 200px;
      max-width: 220px;
      background: #00385d !important;
      border-radius: 0 8px 8px 0;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2), 0 4px 20px rgba(0, 0, 0, 0.12);
      z-index: 1010;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-left: none;
      animation: flyoutFade 0.15s ease;
      padding: 6px 10px
    }

    @keyframes flyoutFade {
      from { opacity: 0; transform: translateX(-4px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .submenu-flyout-header {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      /*background: rgba(0, 0, 0, 0.15);*/
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      flex-shrink: 0;
    }

    .submenu-flyout-content {
      padding: 8px 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    .submenu-flyout-content::-webkit-scrollbar {
      width: 6px;
    }

    .submenu-flyout-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .submenu-flyout-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .submenu-flyout-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      text-align: left;
      padding: 10px 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 300;
      color: rgba(255, 255, 255, 0.95);
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
      box-sizing: border-box;
    }

    .submenu-flyout-item:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    .submenu-flyout-item.active {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      font-weight: 400;
    }

    .submenu-flyout-item .flyout-item-icon {
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-shrink: 0;
      display:none !important;
    }

    .submenu-flyout-item.active .flyout-item-icon {
      color: #fff;
    }

    .submenu-flyout-item-label {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.85);
      cursor: default;
    }

    .submenu-flyout-item.separator {
      padding: 0;
      margin: 8px 0px;
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      pointer-events: none;
      cursor: default;
    }

    .submenu-flyout-item.separator:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .menu-item-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: ${isSidebarExpanded ? 'flex-start' : 'center'};
      padding: ${isSidebarExpanded ? '12px 16px' : '12px'};
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      text-align: left;
      position: relative;
      text-decoration: none;
      color: white;
      gap: 9px;
    }

    .menu-item-button:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .menu-item-button.active {
      background: rgba(255, 255, 255, 0.2);
    }



    .menu-item-icon {
      color: #dfdbdb;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color 0.2s;
      
    }

    .menu-item-text {
      font-size: 13px;
      font-weight: 300;
      color: white;
      opacity: ${isSidebarExpanded ? '1' : '0'};
      transition: opacity 0.3s;
      white-space: nowrap;
      overflow: hidden;
    }

    .menu-item-chevron {
      color: white;
      display: ${isSidebarExpanded ? 'flex' : 'none'};
      align-items: center;
      margin-left: auto;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .menu-item-button:hover .menu-item-chevron {
      opacity: 1;
    }

    /* Submenu Panel */
    .submenu-panel {
      position: fixed;
      left: ${isSidebarExpanded ? `${SIDEBAR_WIDTH_EXPANDED}px` : `${SIDEBAR_WIDTH_COLLAPSED}px`};
      top: 0;
      height: 100vh;
      width: 235px;
      background: white;
      border-right: 1px solid #e5e7eb;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
      transform: translateX(${activeModule ? '0' : '-100%'});
      transition: all 0.3s ease-in-out;
      z-index: 999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      display: none !important;

    }

    @media (max-width: 1199px) {
      .submenu-panel {
        left: 235px;
        top: 0;
        height: 100vh;
      }
    }

    .submenu-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f9fafb;
    }

    .submenu-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .submenu-close-btn {
      background: transparent;
      border: none;
      padding: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .submenu-close-btn:hover {
      background: #e5e7eb;
      color: #111827;
    }

    .submenu-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .submenu-content::-webkit-scrollbar {
      width: 6px;
    }

    .submenu-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .submenu-content::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    .submenu-content::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    .submenu-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .submenu-item {
      margin-bottom: 2px;
    }

    .submenu-item-button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      text-align: left;
      border-radius: 8px;
      text-decoration: none;
      position: relative;
    }

    .submenu-item-button::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      height: 0;
      width: 3px;
      background: #2563eb;
      border-radius: 0 3px 3px 0;
      transition: height 0.2s;
    }

    .submenu-item-button:hover {
      background: #f3f4f6;
    }

    .submenu-item-button.active {
      background: #eff6ff;
      color: #2563eb;
    }

    .submenu-item-button.active::before {
      height: 24px;
    }

    .submenu-item-icon {
      color: #6b7280;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .submenu-item-button.active .submenu-item-icon {
      color: #2563eb;
    }

    .submenu-item-text {
      font-size: 14px;
      color: #374151;
      font-weight: 500;
      flex: 1;
    }

    .submenu-item-button.active .submenu-item-text {
      color: #2563eb;
      font-weight: 600;
    }

    .submenu-item-chevron {
      color: #9ca3af;
      display: flex;
      align-items: center;
      transition: transform 0.2s;
    }

    .submenu-item-chevron.expanded {
      transform: rotate(90deg);
    }

    .nested-submenu {
      margin: 0;
      padding: 0;
      list-style: none;
      margin-left: 28px;
      margin-top: 4px;
    }

    .nested-sub-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      text-align: left;
      border-radius: 8px;
      text-decoration: none;
      margin-bottom: 2px;
    }

    .nested-sub-item:hover {
      background: #f3f4f6;
    }

    .nested-sub-item.active {
      background: #eff6ff;
    }

    .nested-sub-item-icon {
      color: #9ca3af;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .nested-sub-item.active .nested-sub-item-icon {
      color: #2563eb;
    }

    .nested-sub-item-text {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
    }

    .nested-sub-item.active .nested-sub-item-text {
      color: #2563eb;
      font-weight: 600;
    }

    .sidebar-container a {
      text-decoration: none !important;
    }

    .sidebar-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 8px 12px;
    }
  `;

  const dashboardItems = mainMenuItems.filter(item => 
    hasPermission(PERMISSIONS.VIEW_UNIFIED_WORKSPACE) 
      ? item.id === 'dashboard' || item.id === 'dashboard-unified-workspace'
      : item.id === 'dashboard'
  );

  const servicesItems = mainMenuItems.filter(item => 
    item.id !== 'dashboard' && 
    item.id !== 'dashboard-unified-workspace' && 
    item.id !== 'settings' && 
    item.id !== 'resources' &&
    item.id !== 'unified-reports' &&
    item.id !== 'audit-logs'
  );

  const systemItems = mainMenuItems.filter(item => 
    item.id === 'settings' || item.id === 'resources' || item.id === 'unified-reports' || item.id === 'audit-logs'
  );

  const activeModuleData = mainMenuItems.find(m => m.id === activeModule);

  return (
    <>
      <style>{customStyles}</style>

      {/* Backdrop for mobile and submenu */}
      <div
        className={`sidebar-backdrop ${(sidebarOpen || activeModule || isFlyoutPinned) ? 'show' : ''}`}
        onClick={() => {
          setSidebarOpen(false);
          setActiveModule(null);
          if (isFlyoutPinned) {
            setHoveredModuleId(null);
            setHoveredItemRect(null);
            setIsFlyoutPinned(false);
          }
        }}
      />

      {/* Main Sidebar */}
      <div className={`sidebar-container ${!sidebarOpen ? 'mobile-hidden' : ''} ${!isSidebarExpanded ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header" style={{ display: 'none' }}>
          {isSidebarExpanded && <div className="sidebar-logo menu-item-text">
            {userCompanyName}

            {/* {currentUserCompanyImageUrl ? (
              <img
                src={currentUserCompanyImageUrl}
                alt="Company logo"
                style={{
                  maxWidth: 160,
                  objectFit: "contain",
                  
                }}
              />
            ) : (
              <img src={logodark.src} alt="logo" className="img-fluid" />
            )} */}


          </div>}
        </div>

        {/* Menu Items */}
        <div className="sidebar-menu">
          <ul className="menu-nav">
            {/* Dashboard Items */}
            {dashboardItems.map((module) => (
              <li
                key={module.id}
                className="menu-item"
                onMouseEnter={module.subItems?.length ? (ev) => {
                  if (isSidebarExpanded && isFlyoutPinned) {
                    handleExpandedItemMouseEnter(module, ev);
                  } else if (!isSidebarExpanded) {
                    handleCollapsedItemMouseEnter(module, ev);
                  }
                } : undefined}
                onMouseLeave={module.subItems?.length ? (isSidebarExpanded && isFlyoutPinned ? handleExpandedItemMouseLeave : handleCollapsedItemMouseLeave) : undefined}
              >
                {!isSidebarExpanded && <span className="menu-item-tooltip">{module.title}</span>}
                {module.url !== '' ? (
                  <Link href={(BASE_URL || '') + (module.url || '/')}>
                    <button
                      type="button"
                      title={!isSidebarExpanded ? module.title : undefined}
                      className={`menu-item-button ${router.pathname === module.url ? 'active' : ''}`}
                      onClick={() => {
                        if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <div className="menu-item-icon">{module.icon}</div>
                      {isSidebarExpanded && <span className="menu-item-text">{module.title}</span>}
                    </button>
                  </Link>
                ) : (
                  <button
                    type="button"
                    title={!isSidebarExpanded ? module.title : undefined}
                    className={`menu-item-button ${activeModule === module.id ? 'active' : ''} ${hoveredModuleId === module.id && (isFlyoutPinned || !isSidebarExpanded) ? 'active' : ''}`}
                    onClick={(e) => handleModuleClick(module, e)}
                  >
                    <div className="menu-item-icon">{module.icon}</div>
                    {isSidebarExpanded && <span className="menu-item-text">{module.title}</span>}
                    {isSidebarExpanded && module.subItems && module.subItems.length > 0 && (
                      <div className="menu-item-chevron">
                        <ChevronRight size={18} />
                      </div>
                    )}
                  </button>
                )}
              </li>
            ))}

            <div className="sidebar-divider"></div>

            {/* Services Items */}
            {servicesItems.map((module) => (
              <li
                key={module.id}
                className="menu-item"
                onMouseEnter={module.subItems?.length ? (ev) => {
                  if (isSidebarExpanded && isFlyoutPinned) {
                    handleExpandedItemMouseEnter(module, ev);
                  } else if (!isSidebarExpanded) {
                    handleCollapsedItemMouseEnter(module, ev);
                  }
                } : undefined}
                onMouseLeave={module.subItems?.length ? (isSidebarExpanded && isFlyoutPinned ? handleExpandedItemMouseLeave : handleCollapsedItemMouseLeave) : undefined}
              >
                {!isSidebarExpanded && <span className="menu-item-tooltip">{module.title}</span>}
                {module.url !== '' ? (
                  <Link href={(BASE_URL || '') + (module.url || '/')}>
                    <button
                      type="button"
                      title={!isSidebarExpanded ? module.title : undefined}
                      className={`menu-item-button ${router.pathname === module.url ? 'active' : ''}`}
                      onClick={() => {
                        if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <div className="menu-item-icon">{module.icon}</div>
                      {isSidebarExpanded && <span className="menu-item-text">{module.title}</span>}
                    </button>
                  </Link>
                ) : (
                  <button
                    type="button"
                    title={!isSidebarExpanded ? module.title : undefined}
                    className={`menu-item-button ${activeModule === module.id ? 'active' : ''} ${hoveredModuleId === module.id && (isFlyoutPinned || !isSidebarExpanded) ? 'active' : ''}`}
                    onClick={(e) => handleModuleClick(module, e)}
                  >
                    <div className="menu-item-icon">{module.icon}</div>
                    {isSidebarExpanded && <span className="menu-item-text">{module.title}</span>}
                    {isSidebarExpanded && module.subItems && module.subItems.length > 0 && (
                      <div className="menu-item-chevron">
                        <ChevronRight size={18} />
                      </div>
                    )}
                  </button>
                )}
              </li>
            ))}

            <div className="sidebar-divider"></div>

            {/* System Items */}
            {systemItems.map((module) => (
              <li
                key={module.id}
                className="menu-item"
                onMouseEnter={module.subItems?.length ? (ev) => {
                  if (isSidebarExpanded && isFlyoutPinned) {
                    handleExpandedItemMouseEnter(module, ev);
                  } else if (!isSidebarExpanded) {
                    handleCollapsedItemMouseEnter(module, ev);
                  }
                } : undefined}
                onMouseLeave={module.subItems?.length ? (isSidebarExpanded && isFlyoutPinned ? handleExpandedItemMouseLeave : handleCollapsedItemMouseLeave) : undefined}
              >
                {!isSidebarExpanded && <span className="menu-item-tooltip">{module.title}</span>}
                {module.url !== '' ? (
                  <Link href={(BASE_URL || '') + (module.url || '/')}>
                    <button
                      type="button"
                      title={!isSidebarExpanded ? module.title : undefined}
                      className={`menu-item-button ${router.pathname === module.url ? 'active' : ''}`}
                      onClick={() => {
                        if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <div className="menu-item-icon">{module.icon}</div>
                      {isSidebarExpanded && <span className="menu-item-text">{module.title}</span>}
                    </button>
                  </Link>
                ) : (
                  <button
                    type="button"
                    title={!isSidebarExpanded ? module.title : undefined}
                    className={`menu-item-button ${activeModule === module.id ? 'active' : ''} ${hoveredModuleId === module.id && (isFlyoutPinned || !isSidebarExpanded) ? 'active' : ''}`}
                    onClick={(e) => handleModuleClick(module, e)}
                  >
                    <div className="menu-item-icon">{module.icon}</div>
                    {isSidebarExpanded && <span className="menu-item-text">{module.title}</span>}
                    {isSidebarExpanded && module.subItems && module.subItems.length > 0 && (
                      <div className="menu-item-chevron">
                        <ChevronRight size={18} />
                      </div>
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer with expand/collapse */}
        <div className="sidebar-footer">
          <button 
            className="expand-toggle-btn"
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          >
            {isSidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>

      {/* Collapsed sidebar: hover flyout for sub-items (above main content) */}
      {/* Submenu flyout: when collapsed on hover, when expanded on click (same style, above content) */}
      {hoveredModuleId && hoveredItemRect && (() => {
        const flyoutModule = mainMenuItems.find(m => m.id === hoveredModuleId);
        if (!flyoutModule?.subItems?.length) return null;
        return (
          <div
            className="submenu-flyout"
            style={{
              top: hoveredItemRect.top,
              left: (isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED) + 3,
            }}
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
          >
            <div className="submenu-flyout-header">{flyoutModule.title}</div>
            <div className="submenu-flyout-content">
              {flyoutModule.subItems.map((subItem: SubMenuItem) => {
                // Handle separator
                if (subItem.title === '---') {
                  return <div key={subItem.id} className="submenu-flyout-item separator" />;
                }
                
                return subItem.subItems && subItem.subItems.length > 0 ? (
                  <div key={subItem.id}>
                    <div className="submenu-flyout-item submenu-flyout-item-label">
                      <span className="flyout-item-icon">{subItem.icon}</span>
                      {subItem.title}
                    </div>
                    {subItem.subItems.map((nestedItem: SubMenuItem) => (
                      <Link
                        key={nestedItem.id}
                        href={(BASE_URL || '') + (nestedItem.url || '/')}
                        className={`submenu-flyout-item ${router.pathname === nestedItem.url ? 'active' : ''}`}
                        onClick={() => {
                          setHoveredModuleId(null);
                          setHoveredItemRect(null);
                          setIsFlyoutPinned(false);
                          if (globalThis.window?.innerWidth && globalThis.window.innerWidth < 1200) setSidebarOpen(false);
                        }}
                      >
                        <span className="flyout-item-icon">{nestedItem.icon}</span>
                        {nestedItem.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={subItem.id}
                    href={(BASE_URL || '') + (subItem.url || '/')}
                    className={`submenu-flyout-item ${router.pathname === subItem.url ? 'active' : ''}`}
                    onClick={() => {
                      setHoveredModuleId(null);
                      setHoveredItemRect(null);
                      setIsFlyoutPinned(false);
                      if (globalThis.window?.innerWidth && globalThis.window.innerWidth < 1200) setSidebarOpen(false);
                    }}
                  >
                    <span className="flyout-item-icon">{subItem.icon}</span>
                    {subItem.title}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Submenu Panel */}
      {activeModuleData && activeModuleData.subItems && (
        <div className="submenu-panel">
          <div className="submenu-header">
            <div className="submenu-title">{activeModuleData.title}</div>
            <button 
              className="submenu-close-btn"
              onClick={() => setActiveModule(null)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="submenu-content">
            <ul className="submenu-list">
              {activeModuleData.subItems.map((subItem: SubMenuItem) => (
                <li key={subItem.id} className="submenu-item">
                  {subItem.subItems && subItem.subItems.length > 0 ? (
                    <>
                      <button
                        className={`submenu-item-button ${expandedSubModules.includes(subItem.id) ? 'active' : ''}`}
                        onClick={() => toggleSubModule(subItem.id)}
                      >
                        <div className="submenu-item-icon">{subItem.icon}</div>
                        <span className="submenu-item-text">{subItem.title}</span>
                        <div className={`submenu-item-chevron ${expandedSubModules.includes(subItem.id) ? 'expanded' : ''}`}>
                          <ChevronRight size={16} />
                        </div>
                      </button>
                      {expandedSubModules.includes(subItem.id) && (
                        <ul className="nested-submenu">
                          {subItem.subItems.map((nestedItem: SubMenuItem) => (
                            <li key={nestedItem.id}>
                              <Link href={(BASE_URL || '') + (nestedItem.url || '/')}>
                                <button
                                  className={`nested-sub-item ${router.pathname === nestedItem.url ? 'active' : ''}`}
                                  onClick={() => {
                                    if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                                      setSidebarOpen(false);
                                      setActiveModule(null);
                                    }
                                  }}
                                >
                                  <div className="nested-sub-item-icon">{nestedItem.icon}</div>
                                  <span className="nested-sub-item-text">{nestedItem.title}</span>
                                </button>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link href={(BASE_URL || '') + (subItem.url || '/')}>
                      <button
                        className={`submenu-item-button ${router.pathname === subItem.url ? 'active' : ''}`}
                        onClick={() => {
                          if (globalThis.window !== undefined && globalThis.window.innerWidth < 1200) {
                            setSidebarOpen(false);
                            setActiveModule(null);
                          }
                        }}
                      >
                        <div className="submenu-item-icon">{subItem.icon}</div>
                        <span className="submenu-item-text">{subItem.title}</span>
                      </button>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED };
export default ApplicationCustomerSidebar;
