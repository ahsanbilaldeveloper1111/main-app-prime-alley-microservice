import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Target,
  FileText,
  Activity,
  BarChart3,
  Phone,
  Headphones,
  Globe,
  ChevronDown,
  ChevronRight,
  Star,
  Search,
  Menu,
  X,
  Home,
  Settings,
  NotebookText
} from 'lucide-react';

// Types
interface SubMenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  path: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubMenuItem[];
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Favorites - directly under search
const favoritesItem: MenuItem = {
  id: 'favorites',
  title: 'Favorites',
  icon: <Star size={20} />,
  path: '/favorites'
};

// Dashboard section - single item
const dashboardItem: MenuItem = {
  id: 'dashboard',
  title: 'Dashboard',
  icon: <LayoutDashboard size={20} />,
  path: '/dashboard'
};

// Services section - all service menu items (collapsed by default)
const servicesItems: MenuItem[] = [
  {
    id: 'crm',
    title: 'CRM & Sales',
    icon: <Briefcase size={20} />,
    subItems: [
      { id: 'prospects', title: 'Prospects', icon: <Users size={18} />, path: '/crm/prospects' },
      { id: 'leads', title: 'Leads', icon: <Target size={18} />, path: '/crm/leads' },
      { id: 'deals', title: 'Deals', icon: <FileText size={18} />, path: '/crm/deals' },
      { id: 'orders', title: 'Orders', icon: <FileText size={18} />, path: '/crm/orders' },
      { id: 'activity', title: 'Activity', icon: <Activity size={18} />, path: '/crm/activity' }
    ]
  },
  {
    id: 'live-wallboards',
    title: 'Live Wallboards',
    icon: <BarChart3 size={20} />,
    subItems: [
      { id: 'overview', title: 'Overview', icon: <Home size={18} />, path: '/wallboards/overview' },
      { id: 'call-logs', title: 'Call Logs', icon: <Phone size={18} />, path: '/wallboards/call-logs' },
      { id: 'recordings', title: 'Call Recordings', icon: <Headphones size={18} />, path: '/wallboards/recordings' }
    ]
  },
  {
    id: 'call-details',
    title: 'Call Details',
    icon: <Phone size={20} />,
    subItems: [
      { id: 'call-overview', title: 'Overview', icon: <Home size={18} />, path: '/calls/overview' }
    ]
  },
  {
    id: 'carrier-gateway',
    title: 'Carrier Gateway',
    icon: <Globe size={20} />,
    subItems: [
      { id: 'gateway-overview', title: 'Overview', icon: <Home size={18} />, path: '/gateway/overview' },
      { id: 'gateway-logs', title: 'Call Logs', icon: <Phone size={18} />, path: '/gateway/call-logs' },
      { id: 'gateway-recordings', title: 'Call Recordings', icon: <Headphones size={18} />, path: '/gateway/recordings' }
    ]
  }
];

// System section - always visible at bottom
const systemItems: MenuItem[] = [
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings size={20} />,
    path: '/settings'
  },
  {
    id: 'resources',
    title: 'Resources',
    icon: <NotebookText size={20} />,
    path: '/resources'
  }
];

const ModernSidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<string>('leads');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (itemId: string, hasSubItems: boolean) => {
    if (hasSubItems) {
      toggleItem(itemId);
    } else {
      setActiveItem(itemId);
      // Close sidebar on mobile when item is clicked
      if (typeof window !== 'undefined' && window.innerWidth < 1200) {
        setSidebarOpen(false);
      }
    }
  };

  const filteredServicesItems = servicesItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subItems?.some(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
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
          z-index: 9999 !important;
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

        .favorites-section {
          padding: 8px;
          border-bottom: 1px solid #e8e8e8;
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
          font-size: 15px;
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
          padding: 10px 12px 10px 50px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          text-align: left;
          position: relative;
          border-radius: 8px;
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
          background: #e3f2fd;
        }

        .submenu-item-button.active::before {
          background: #1976d2;
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
          font-size: 15px;
          color: #555;
          font-weight: 400;
        }

        .submenu-item-button.active .submenu-item-text {
          color: #1976d2;
          font-weight: 500;
        }

        @media (max-width: 1199px) {
          .mobile-menu-btn {
            display: block;
          }

          .sidebar-container {
            z-index: 9999;
          }
        }
      `}</style>

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
        <div className="sidebar-search">
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
        </div>

        {/* Menu Items */}
        <div className="sidebar-menu">
          {/* Favorites - Directly under search */}
          <div className="favorites-section">
            <ul className="menu-nav">
              <li className="menu-item">
                <button
                  onClick={() => handleItemClick(favoritesItem.id, false)}
                  className={`menu-item-button ${activeItem === favoritesItem.id ? 'active' : ''}`}
                >
                  <div className="menu-item-content">
                    <div className="menu-item-icon">
                      {favoritesItem.icon}
                    </div>
                    <span className="menu-item-text">{favoritesItem.title}</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          {/* Dashboard Section */}
          <div className="sidebar-section">
            <div className="section-heading">Dashboard</div>
            <ul className="menu-nav">
              <li className="menu-item">
                <button
                  onClick={() => handleItemClick(dashboardItem.id, false)}
                  className={`menu-item-button ${activeItem === dashboardItem.id ? 'active' : ''}`}
                >
                  <div className="menu-item-content">
                    <div className="menu-item-icon">
                      {dashboardItem.icon}
                    </div>
                    <span className="menu-item-text">{dashboardItem.title}</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          {/* Services Section */}
          <div className="sidebar-section">
            <div className="section-heading">Services</div>
            <ul className="menu-nav">
              {filteredServicesItems.map((item) => (
                <li key={item.id} className="menu-item">
                  {/* Main Menu Item */}
                  <button
                    onClick={() => handleItemClick(item.id, !!item.subItems)}
                    className={`menu-item-button ${!item.subItems && activeItem === item.id ? 'active' : ''}`}
                  >
                    <div className="menu-item-content">
                      <div className="menu-item-icon">
                        {item.icon}
                      </div>
                      <span className="menu-item-text">{item.title}</span>
                    </div>
                    {item.subItems && (
                      <div className={`menu-item-chevron ${expandedItems.includes(item.id) ? 'expanded' : 'collapsed'}`}>
                        <ChevronDown size={18} />
                      </div>
                    )}
                  </button>

                  {/* Sub Menu Items */}
                  {item.subItems && expandedItems.includes(item.id) && (
                    <ul className="submenu">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.id} className="submenu-item">
                          <button
                            onClick={() => {
                              setActiveItem(subItem.id);
                              // Close sidebar on mobile when sub-item is clicked
                              if (typeof window !== 'undefined' && window.innerWidth < 1200) {
                                setSidebarOpen(false);
                              }
                            }}
                            className={`submenu-item-button ${activeItem === subItem.id ? 'active' : ''}`}
                          >
                            <div className="submenu-item-icon">
                              {subItem.icon}
                            </div>
                            <span className="submenu-item-text">{subItem.title}</span>
                          </button>
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
            <div className="section-heading">System</div>
            <ul className="menu-nav">
              {systemItems.map((item) => (
                <li key={item.id} className="menu-item">
                  <button
                    onClick={() => handleItemClick(item.id, false)}
                    className={`menu-item-button ${activeItem === item.id ? 'active' : ''}`}
                  >
                    <div className="menu-item-content">
                      <div className="menu-item-icon">
                        {item.icon}
                      </div>
                      <span className="menu-item-text">{item.title}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernSidebar;