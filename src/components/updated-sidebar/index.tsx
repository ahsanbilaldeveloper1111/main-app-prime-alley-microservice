import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Ticket, 
  Package, 
  Layers, 
  FolderTree, 
  List, 
  Tags,
  Users,
  UserCheck,
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  ShoppingCart,
  DollarSign,
  BarChart3,
  CreditCard,
  TrendingUp,
  Warehouse,
  Truck,
  Eye,
  ShoppingBag,
  Briefcase,
  PieChart, 
  Target,
  Handshake,
  Megaphone,
  CheckCircle,
  GitBranch,
  Activity,
} from 'lucide-react';

interface SubMenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
  href?: string;
}

interface MainMenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  subItems: SubMenuItem[];
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
}

const ExpandableSidebar: React.FC<SidebarProps> = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeScreen, 
  setActiveScreen 
}) => {
  const router = useRouter();
  //const [expandedModules, setExpandedModules] = useState<string[]>(['ticketing']);
  const [expandedModules, setExpandedModules] = useState<string[]>([ 'crm']);
  const [expandedSubModules, setExpandedSubModules] = useState<string[]>([]);

  const mainMenuItems: MainMenuItem[] = [
    {
      id: 'dashboards',
      title: 'Dashboards',
      icon: <LayoutDashboard size={20} />,
      color: '#20c997',
      subItems: [
        { id: 'dashboards-manager', title: 'Manager Dashboard', icon: <LayoutDashboard size={16} />, href: '/dashboards/manager' },
        { id: 'dashboards-agent', title: 'Agent Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'dashboards-supervisor', title: 'Supervisor Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'dashboards-account', title: 'Account Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'dashboards-tech', title: 'Tech Team Dashboard', icon: <LayoutDashboard size={16} /> },
      ]
    },
    {
      id: 'crm',
      title: 'CRM System',
      icon: <Briefcase size={20} />,
      color: '#0d6efd',
      subItems: [
        { id: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/crm-new' },
        { id: 'prospects', title: 'Prospects', icon: <Users size={16} /> },
        { id: 'leads', title: 'Leads', icon: <Target size={16} /> },
        { id: 'deals', title: 'Deals', icon: <Handshake size={16} /> },
        { id: 'orders', title: 'Orders', icon: <ShoppingBag size={16} /> },
        { id: 'campaigns', title: 'Campaigns', icon: <Megaphone size={16} /> },
        { id: 'tasks', title: 'Task Management', icon: <CheckCircle size={16} /> },
        { id: 'stages', title: 'Stages Management', icon: <GitBranch size={16} /> },
        { id: 'activities', title: 'Activity Tracker', icon: <Activity size={16} /> },
        { id: 'reports', title: 'Reports', icon: <BarChart3 size={16} /> },
      ]
    },
    {
      id: 'ticketing',
      title: 'Ticketing System',
      icon: <Ticket size={20} />,
      color: '#6f42c1',
      subItems: [
        { id: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/tickets/dashboard' },
        { id: 'tickets', title: 'All Tickets', icon: <Ticket size={16} /> },
        { id: 'modules', title: 'Ticket Modules', icon: <Package size={16} /> },
        { id: 'categories', title: 'Categories', icon: <Layers size={16} /> },
        { id: 'subcategories', title: 'Sub Categories', icon: <FolderTree size={16} /> },
        { id: 'types', title: 'Ticket Types', icon: <List size={16} /> },
        { id: 'status', title: 'Ticket Status', icon: <Tags size={16} /> },
      ]
    },
    {
      id: 'billing',
      title: 'Billing',
      icon: <CreditCard size={20} />,
      color: '#dc3545',
      subItems: [
        {
          id: 'customer-section',
          title: 'Customer',
          icon: <Users size={16} />,
          subItems: [
                { id: 'customer-dashboard', title: 'Customer Dashboard', icon: <LayoutDashboard size={16} />, href: '/accounting/customer/dashboard' },
            { id: 'account-overview', title: 'Account Overview', icon: <Eye size={16} /> },
            { id: 'product-details', title: 'Product Details', icon: <ShoppingBag size={16} /> },
            { id: 'billing-history', title: 'Billing History', icon: <FileText size={16} /> },
            { id: 'payment-method', title: 'Payment Method', icon: <CreditCard size={16} /> },
            // { id: 'expenses-reports', title: 'Expenses & Reports', icon: <BarChart3 size={16} /> },
          ]
        },
        {
          id: 'reseller-section',
          title: 'Reseller Portal',
          icon: <UserCheck size={16} />,
          subItems: [
                { id: 'reseller-dashboard', title: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/reseller' },
            { id: 'customer-management', title: 'Customer Management', icon: <Users size={16} /> },
            { id: 'sales-orders', title: 'Sales & Orders', icon: <ShoppingCart size={16} /> },
            { id: 'commission-payouts', title: 'Commission & Payouts', icon: <DollarSign size={16} /> },
            { id: 'products-pricing', title: 'Products & Pricing', icon: <Tags size={16} /> },
            { id: 'reseller-reports', title: 'Reports & Analytics', icon: <PieChart size={16} /> },
            { id: 'invoicing-billing', title: 'Invoicing & Billing', icon: <FileText size={16} /> },
          ]
        },
        {
          id: 'vendor-section',
          title: 'Vendor Portal',
          icon: <Building2 size={16} />,
          subItems: [
                { id: 'vendor-dashboard', title: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/vendor' },
            { id: 'product-management', title: 'Product Management', icon: <Package size={16} /> },
            { id: 'reseller-management', title: 'Reseller Management', icon: <UserCheck size={16} /> },
            { id: 'order-management', title: 'Order Management', icon: <ShoppingCart size={16} /> },
            { id: 'revenue-commission', title: 'Revenue & Commission', icon: <TrendingUp size={16} /> },
            { id: 'vendor-customer-management', title: 'Customer Management', icon: <Users size={16} /> },
            { id: 'inventory-management', title: 'Inventory Management', icon: <Warehouse size={16} /> },
            { id: 'supplier-management', title: 'Supplier Management', icon: <Truck size={16} /> },
            { id: 'vendor-reports', title: 'Reports & Analytics', icon: <BarChart3 size={16} /> },
          ]
        }
      ]
    }
  ];

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

  const handleSubItemClick = (screenId: string, href?: string) => {
    setActiveScreen(screenId);
    if (href) {
      router.push(href);
    }
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
      top: 94px;
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
                <button
                  className={`module-header ${expandedModules.includes(module.id) ? 'expanded' : ''}`}
                  onClick={() => toggleModule(module.id)}
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

                {/* Sub Items */}
                {expandedModules.includes(module.id) && (
                  <div>
                    {module.subItems.map((subItem: SubMenuItem) => (
                      <div key={subItem.id}>
                        {subItem.subItems && subItem.subItems.length > 0 ? (
                          // This is a nested sub-module with children
                          <>
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
                            
                            {/* Nested Sub Items */}
                            {expandedSubModules.includes(subItem.id) && (
                              <div>
                                {subItem.subItems.map((nestedItem: SubMenuItem) => (
                                  <button
                                    key={nestedItem.id}
                                    className={`nested-sub-item ${activeScreen === nestedItem.id ? 'active' : ''}`}
                                    onClick={() => handleSubItemClick(nestedItem.id, nestedItem.href)}
                                  >
                                    <span className="nested-sub-item-icon">{nestedItem.icon}</span>
                                    <span>{nestedItem.title}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          // Regular sub-item without children
                          <button
                            className={`sub-item ${activeScreen === subItem.id ? 'active' : ''}`}
                            onClick={() => handleSubItemClick(subItem.id, subItem.href)}
                          >
                            <span className="sub-item-icon">{subItem.icon}</span>
                            <span>{subItem.title}</span>
                          </button>
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

export default ExpandableSidebar;
