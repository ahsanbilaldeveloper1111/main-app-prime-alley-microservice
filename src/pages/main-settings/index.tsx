import React, { ReactElement, useState, useRef, useEffect } from 'react'
import { Search, ChevronLeft, Clock } from 'lucide-react'
import Layout from '@layout/index'
import Users from '@pages/controlhub/users'
import Teams from '@pages/controlhub/teams'
import Groups from '@pages/controlhub/groups'
import Ranks from '@pages/controlhub/ranks'
import Campaigns from '@pages/crm/campaigns'
import Industries from '@pages/crm/industries'
import Products from '@pages/crm/products'
import Stages from '@pages/crm/stages'
import DealTemplates from '@pages/crm/deal-templates'
import BusinessTypes from '@pages/crm/business-types'
import ManageExtensions from '@pages/ai-ml/manage-extensions'
import BackendOperations from '@pages/ai-ml/backend-operations'
import ManualAnalysis from '@pages/ai-ml/analysis'
import WorkPlannerStatuses from '@pages/planner/statuses'
import OutboundTrunkProfiles from '@pages/ai-agent/outbound/trunk-profiles'
import AIMLProfiles from '@pages/agents/outbound-agent'
import InboundTrunkProfiles from '@pages/ai-agent/inbound/trunk-profiles'
import InboundBotProfiles from '@pages/agents/inbound-agent'
import InboundFAQs from '@pages/ai-agent/inbound/faqs'
import Hosts from '@pages/pulse/hosts'
import HostGroups from '@pages/pulse/host-groups'
import Events from '@pages/pulse/events'
import RequestCategories from '@pages/workforce/request-categories'
import RequestSubCategories from '@pages/workforce/sub-categories'
import PaymentMethods from '@pages/billing/payment-methods'
import TicketStatuses from '@pages/tickets/statuses'
import TicketModules from '@pages/tickets/modules'
import ModuleCategories from '@pages/tickets/modules/categories'
import ModuleSubCategories from '@pages/tickets/modules/sub-categories'
import TicketTypes from '@pages/tickets/types'
import FAQModules from '@pages/faqs/modules'
import FAQTopics from '@pages/faqs/topics'
import FAQItems from '@pages/faqs/items'
import FAQTypes from '@pages/faqs/types'
import ToolProfiles from '@pages/chat/tools-profiles'
import FaqProfiles from '@pages/chat/faq-profiles'
import AIChatFAQsTenant from '@pages/chat/ai-faqs/tenant'
import AIChatFAQsGlobal from '@pages/chat/ai-faqs/global'
import GsmAssign from '@pages/gsm/assign'
import GsmSync from '@pages/gsm/sync'
import CompanyPO from '@pages/gsm/company/po'
// ─── Types ────────────────────────────────────────────────────────────────────
type SidebarItem = {
  id: string
  label: string
  badge?: string
  externalLink?: boolean
}

type SidebarGroup = {
  heading: string
  items: SidebarItem[]
}

// ─── Sidebar Data ─────────────────────────────────────────────────────────────
const sidebarGroups: SidebarGroup[] = [
  {
    heading: 'Your Preferences',
    items: [
      { id: 'general-prefs', label: 'General' },
      { id: 'notifications', label: 'Notifications' },
    ],
  },
  {
    heading: 'Services',
    items: [
      { id: 'account-defaults', label: 'Account Defaults' },

      { id: 'users-teams', label: 'Users & Teams' },
      { id: 'smart-crm', label: 'Smart CRM' },
      { id: 'communications', label: 'Communications' },
      { id: 'planner', label: 'Planner' },
      { id: 'virtual-agents', label: 'Virtual Agents' },
      { id: 'pulse', label: 'Pulse' },
      
      
      { id: 'compliance', label: 'Compliance', badge: 'Beta' },
      { id: 'workforce', label: 'Workforce' },
      { id: 'billing', label: 'Billing' },
      
      { id: 'tickets', label: 'Tickets' },
      { id: 'help-center', label: 'Help Center' },
      { id: 'ai-chat', label: 'AI Chat' },
     

      
      // { id: 'account-cleanup', label: 'Account Cleanup', badge: 'Beta' },
      // { id: 'audit-log', label: 'Audit Log' },
      // { id: 'product-updates', label: 'Product Updates', externalLink: true },
      // { id: 'integrations', label: 'Integrations' },
      // { id: 'marketplace', label: 'Marketplace Downloads' },
      // { id: 'tracking-analytics', label: 'Tracking & Analytics' },
      // { id: 'privacy-consent', label: 'Privacy & Consent' },
      // { id: 'sandboxes', label: 'Sandboxes' },
      // { id: 'security', label: 'Security' },
      // { id: 'approvals', label: 'Approvals' },
      // { id: 'ai', label: 'AI' },
      // { id: 'payments-account', label: 'Payments Account' },
    ],
  },
]

// ─── Tab Definitions ──────────────────────────────────────────────────────────
type Tab = {
  id: string
  label: string
}

const accountDefaultsTabs: Tab[] = [
  { id: 'general', label: 'General' },
  { id: 'user-defaults', label: 'User Defaults' },
  { id: 'notification-profiles', label: 'Notification Profiles' },
  { id: 'currency', label: 'Currency' },
  { id: 'data-hosting', label: 'Data Hosting' },
  { id: 'feature-releases', label: 'Feature Releases' },
]

// ─── Tab Content Components ───────────────────────────────────────────────────

const InputField: React.FC<{ label: string; value?: string; helpIcon?: boolean }> = ({
  label,
  value = '',
  helpIcon,
}) => (
  <div style={{ marginBottom: '24px' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        color: '#141414',
      }}
    >
      {label}
      {helpIcon && (
        <span
          title="Help"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '1.5px solid #888',
            fontSize: '10px',
            color: '#888',
            cursor: 'default',
            lineHeight: 1,
          }}
        >
          i
        </span>
      )}
    </div>
    <input
      type="text"
      defaultValue={value}
      style={{
        width: '340px',
        maxWidth: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        color: '#141414',
        border: '1px solid #d0d0d0',
        borderRadius: '4px',
        outline: 'none',
        background: '#fff',
        boxSizing: 'border-box',
      }}
      onFocus={e => (e.currentTarget.style.borderColor = '#0091ae')}
      onBlur={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
    />
  </div>
)

const SelectField: React.FC<{ label: string; value?: string; options: string[]; helpIcon?: boolean }> = ({
  label,
  value = '',
  options,
  helpIcon,
}) => (
  <div style={{ marginBottom: '24px' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        color: '#141414',
      }}
    >
      {label}
      {helpIcon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '1.5px solid #888',
            fontSize: '10px',
            color: '#888',
            cursor: 'default',
            lineHeight: 1,
          }}
        >
          i
        </span>
      )}
    </div>
    <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
      <select
        defaultValue={value}
        style={{
          width: '100%',
          padding: '8px 36px 8px 12px',
          fontSize: '14px',
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          color: '#141414',
          border: '1px solid #d0d0d0',
          borderRadius: '4px',
          outline: 'none',
          background: '#fff',
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#555',
          fontSize: '12px',
        }}
      >
        ▾
      </span>
    </div>
  </div>
)

const Divider = () => (
  <hr
    style={{
      border: 'none',
      borderTop: '1px solid #e8e8e8',
      margin: '28px 0',
    }}
  />
)

// ─── General Tab ──────────────────────────────────────────────────────────────
const GeneralTabContent: React.FC = () => (
  <div>
    <p
      style={{
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        color: '#555',
        marginBottom: '24px',
      }}
    >
      These defaults will be applied to the entire account.
    </p>
    <Divider />

    <InputField label="Account name" value="Prime Alley Technology" helpIcon />
    <SelectField
      label="Time zone"
      value="UTC +00:00 London"
      options={['UTC +00:00 London', 'UTC -05:00 New York', 'UTC +01:00 Paris', 'UTC +08:00 Singapore']}
      helpIcon
    />
    <SelectField
      label="Fiscal year"
      value="January - December"
      options={[
        'January - December',
        'April - March',
        'July - June',
        'October - September',
      ]}
      helpIcon
    />

    <Divider />

    <h2
      style={{
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        fontSize: '20px',
        fontWeight: 600,
        color: '#141414',
        marginBottom: '8px',
      }}
    >
      Company Information
    </h2>
    <p style={{ fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif', fontSize: '14px', color: '#555', marginBottom: '24px' }}>
      This information will be used as a default where needed. If you're looking to update your company information for billing, visit{' '}
      <a href="#" style={{ color: '#0091ae', textDecoration: 'none' }}>
        Account &amp; Billing
      </a>
      .
    </p>

    <InputField label="Company name" value="Prime Alley Technology" />
    <InputField label="Company domain" value="primealley.com" />
    <InputField label="Company address" value="office 2208" />
    <InputField label="Company address line 2" value="" />

    <SelectField
      label="Country"
      value="United Arab Emirates"
      options={['United Arab Emirates', 'United States', 'United Kingdom', 'Pakistan', 'Germany']}
    />
    <InputField label="City" value="Dubai" />
    <InputField label="State / Region" value="" />
    <InputField label="Postal code / ZIP" value="" />
    <InputField label="Phone" value="" helpIcon />
  </div>
)

// ─── Dummy tab content ────────────────────────────────────────────────────────
const DummyTabContent: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div>
    <p style={{ fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif', fontSize: '14px', color: '#555', marginBottom: '24px' }}>
      {description}
    </p>
    <Divider />
    <div
      style={{
        background: '#f8f8f8',
        border: '1px dashed #ccc',
        borderRadius: '6px',
        padding: '48px 32px',
        textAlign: 'center',
        color: '#999',
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        fontSize: '14px',
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚙️</div>
      <div style={{ fontWeight: 500, color: '#555', marginBottom: '6px' }}>{title}</div>
      <div>No configuration available yet.</div>
    </div>
  </div>
)

// ─── Right Panel Pages ────────────────────────────────────────────────────────
const AccountDefaultsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general')

  const tabContentMap: Record<string, React.ReactNode> = {
    general: <GeneralTabContent />,
    'user-defaults': <DummyTabContent title="User Defaults" description="Set default preferences for all users in your account." />,
    'notification-profiles': <DummyTabContent title="Notification Profiles" description="Manage notification profiles for your team." />,
    currency: <DummyTabContent title="Currency" description="Configure currency settings for your account." />,
    'data-hosting': <DummyTabContent title="Data Hosting" description="Choose where your data is hosted and stored." />,
    'feature-releases': <DummyTabContent title="Feature Releases" description="Control which feature releases are enabled for your account." />,
  }

  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#141414',
          marginBottom: '24px',
          letterSpacing: 0,
        }}
      >
        Account Defaults
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
         
          marginBottom: '32px',
         
          overflow: 'hidden',
        }}
      >
        {accountDefaultsTabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const isLast = index === accountDefaultsTabs.length - 1;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── Users & Teams (from settings: User Directory, Teams, Groups, Ranks) ────────
const usersTeamsTabs: Tab[] = [
  { id: 'user-directory', label: 'User Directory' },
  { id: 'supervisor-teams', label: 'Supervisor Teams' },
  { id: 'management-groups', label: 'Management Groups' },
  { id: 'ranks-and-permissions', label: 'Ranks and Permissions' },
]

const UsersTeamsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('user-directory')

  const tabContentMap: Record<string, React.ReactNode> = {
    'user-directory': <Users />,
    'supervisor-teams': <Teams />,
    'management-groups': <Groups />,
    'ranks-and-permissions': <Ranks />,
  }

  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#141414',
          marginBottom: '24px',
          letterSpacing: 0,
        }}
      >
        Users &amp; Teams
      </h1>

      <div
        style={{
          display: 'flex',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        {usersTeamsTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === usersTeamsTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── Smart CRM (from settings: Campaigns, Industries, Products, Stages, etc.) ───
const smartCrmTabs: Tab[] = [
  { id: 'stages', label: 'Stages' },
  { id: 'product-groups', label: 'Product Groups' },
  { id: 'products', label: 'Products' },
  { id: 'deal-templates', label: 'Deal Templates' },
  { id: 'business-types', label: 'Business Types' },
  { id: 'campaigns', label: 'Campaigns' },
]

const SmartCrmPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('stages')

  const tabContentMap: Record<string, React.ReactNode> = {
    stages: <Stages />,
    'product-groups': <Industries />,
    products: <Products />,
    'deal-templates': <DealTemplates />,
    'business-types': <BusinessTypes />,
    campaigns: <Campaigns />,
  }

  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#141414',
          marginBottom: '24px',
          letterSpacing: 0,
        }}
      >
        Smart CRM
      </h1>

      <div
        style={{
          display: 'flex',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        {smartCrmTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === smartCrmTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── Communications (from settings: Manage Extensions, Backend Operations, Manual Analysis) ───
const communicationsTabs: Tab[] = [
  { id: 'manage-extensions', label: 'Manage Analysis' },
  { id: 'manual-analysis', label: 'Manual Analysis' },
]

const CommunicationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('manage-extensions')

  const tabContentMap: Record<string, React.ReactNode> = {
    'manage-extensions': <ManageExtensions />,
    'manual-analysis': <ManualAnalysis />,
  }

  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#141414',
          marginBottom: '24px',
          letterSpacing: 0,
        }}
      >
        Communications
      </h1>

      <div
        style={{
          display: 'flex',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        {communicationsTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === communicationsTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── Planner (from settings: Work Planner Statuses) ───────────────────────────
const PlannerPage: React.FC = () => (
  <div style={{ padding: '32px 40px', flex: 1 }}>
    <h1
      style={{
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#141414',
        marginBottom: '24px',
        letterSpacing: 0,
      }}
    >
      Planner
    </h1>
    <WorkPlannerStatuses />
  </div>
)

// ─── Workforce (from settings: Request Categories, Sub Categories) ────────────
const workforceTabs: Tab[] = [
  { id: 'request-categories', label: 'Request Categories' },
  // { id: 'sub-categories', label: 'Sub Categories' },
]

const WorkforcePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('request-categories')

  const tabContentMap: Record<string, React.ReactNode> = {
    'request-categories': <RequestCategories />,
    // 'sub-categories': <RequestSubCategories />,
  }

  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#141414',
          marginBottom: '24px',
          letterSpacing: 0,
        }}
      >
        Workforce
      </h1>

      <div
        style={{
          display: 'flex',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        {workforceTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === workforceTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── Billing (from settings: Payment Methods) ───────────────────────────────────
const billingTabs: Tab[] = [
  { id: 'payment-methods', label: 'Payment Methods' },
]

const BillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('payment-methods')

  const tabContentMap: Record<string, React.ReactNode> = {
    'payment-methods': <PaymentMethods />,
  }

  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#141414',
          marginBottom: '24px',
          letterSpacing: 0,
        }}
      >
        Billing
      </h1>

      <div
        style={{
          display: 'flex',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        {billingTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === billingTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── Tickets (from settings: Statuses, Modules, Categories, Sub Categories, Types) ───
const ticketsTabs: Tab[] = [
  { id: 'statuses', label: 'Statuses' },
  { id: 'modules', label: 'Modules' },
  { id: 'categories', label: 'Categories' },
  { id: 'sub-categories', label: 'Sub Categories' },
  { id: 'types', label: 'Types' },
]

const TicketsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('statuses')
  const tabContentMap: Record<string, React.ReactNode> = {
    statuses: <TicketStatuses />,
    modules: <TicketModules />,
    categories: <ModuleCategories />,
    'sub-categories': <ModuleSubCategories />,
    types: <TicketTypes />,
  }
  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1 style={{ fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#141414', marginBottom: '24px', letterSpacing: 0 }}>Tickets</h1>
      <div style={{ display: 'flex', marginBottom: '32px', overflow: 'hidden' }}>
        {ticketsTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === ticketsTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── Help Center (from settings: FAQ Modules, Topics, Items, Types) ───────────
const helpCenterTabs: Tab[] = [
  { id: 'modules', label: 'FAQ Modules' },
  { id: 'topics', label: 'FAQ Topics' },
  { id: 'items', label: 'FAQ Items' },
  { id: 'types', label: 'FAQ Types' },
]

const HelpCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('modules')
  const tabContentMap: Record<string, React.ReactNode> = {
    modules: <FAQModules />,
    topics: <FAQTopics />,
    items: <FAQItems />,
    types: <FAQTypes />,
  }
  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1 style={{ fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#141414', marginBottom: '24px', letterSpacing: 0 }}>Help Center</h1>
      <div style={{ display: 'flex', marginBottom: '32px', overflow: 'hidden' }}>
        {helpCenterTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === helpCenterTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── AI Chat (from settings: Tools Profiles, FAQ Profiles, Tenant Profile, Global FAQs) ───
const aiChatTabs: Tab[] = [
  { id: 'tools-profiles', label: 'Tools Profiles' },
  { id: 'faq-profiles', label: 'FAQ Profiles' },
  { id: 'tenant-profile', label: 'Tenant Profile' },
  { id: 'global-faqs', label: 'Global FAQs' },
]

const AIChatPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tools-profiles')
  const tabContentMap: Record<string, React.ReactNode> = {
    'tools-profiles': <ToolProfiles />,
    'faq-profiles': <FaqProfiles />,
    'tenant-profile': <AIChatFAQsTenant />,
    'global-faqs': <AIChatFAQsGlobal />,
  }
  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1 style={{ fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#141414', marginBottom: '24px', letterSpacing: 0 }}>AI Chat</h1>
      <div style={{ display: 'flex', marginBottom: '32px', overflow: 'hidden' }}>
        {aiChatTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === aiChatTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── Virtual Agents (from settings: Outbound AI Agent – Trunk Profiles, Bot Profiles) ───
const virtualAgentsTabs: Tab[] = [
  { id: 'trunk-profiles', label: 'Outbound Trunks' },
  { id: 'bot-profiles', label: 'Outbound Bots' },

  { id: 'inbound-trunks', label: 'Inbound Trunks' },
  { id: 'inbound-bots', label: 'Inbound Bots' },
  { id: 'inbound-faqs', label: 'Inbound FAQs' },
]

const VirtualAgentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trunk-profiles')

  const tabContentMap: Record<string, React.ReactNode> = {
    'trunk-profiles': <OutboundTrunkProfiles />,
    'bot-profiles': <AIMLProfiles />,
    'inbound-trunks': <InboundTrunkProfiles />,
    'inbound-bots': <InboundBotProfiles />,
    'inbound-faqs': <InboundFAQs />,
  }

  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#141414',
          marginBottom: '24px',
          letterSpacing: 0,
        }}
      >
        Virtual Agents
      </h1>

      <div
        style={{
          display: 'flex',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        {virtualAgentsTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === virtualAgentsTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// ─── Pulse (Host Groups, Alerts) ───
const pulseTabs: Tab[] = [
  { id: 'hosts', label: 'Hosts' },
  { id: 'host-groups', label: 'Host Groups' },
  { id: 'events', label: 'Events' },
  { id: 'assign-devices', label: 'Assign Devices' },
  { id: 'sync-gsm', label: 'Sync GSM' },
  { id: 'company-profiling', label: 'Company Profiling' },
]

const PulsePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('host-groups')

  const tabContentMap: Record<string, React.ReactNode> = {
    'hosts': <Hosts />,
    'host-groups': <HostGroups />,
    events: <Events />,
    'assign-devices': <GsmAssign />,
    'sync-gsm': <GsmSync />,
    'company-profiling': <CompanyPO />,
  }

  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <h1
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#141414',
          marginBottom: '24px',
          letterSpacing: 0,
        }}
      >
        Pulse
      </h1>

      <div
        style={{
          display: 'flex',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        {pulseTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === pulseTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 28px',
                background: isActive ? '#ffffff' : 'whitesmoke',
                border: '1px solid #e0e0e0',
                borderRight: isLast ? '1px solid #e0e0e0' : 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
                cursor: 'pointer',
                fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
                position: 'relative',
                top: '1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>{tabContentMap[activeTab]}</div>
    </div>
  )
}

// Other section pages (dummy)
const GenericPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: '32px 40px', flex: 1 }}>
    <h1
      style={{
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#141414',
        marginBottom: '24px',
      }}
    >
      {title}
    </h1>
    <Divider />
    <div
      style={{
        background: '#f8f8f8',
        border: '1px dashed #ccc',
        borderRadius: '6px',
        padding: '64px 32px',
        textAlign: 'center',
        color: '#999',
        fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        fontSize: '14px',
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗂️</div>
      <div style={{ fontWeight: 500, color: '#555', marginBottom: '6px' }}>{title}</div>
      <div>Content for this section goes here.</div>
    </div>
  </div>
)

// ─── Notifications Settings ────────────────────────────────────────────────────
type ChannelKey = "popup" | "browser" | "bell" | "email";

interface NotificationTopic {
  id: string;
  label: string;
  channels: Record<ChannelKey, boolean | null>;
  subtopics?: Array<{
    id: string;
    label: string;
    description?: string;
    channels: Record<ChannelKey, boolean | null>;
  }>;
}

const defaultTopics: NotificationTopic[] = [
  {
    id: "account-defaults", label: "Account Defaults",
    channels: { popup: false, browser: false, bell: true, email: true },
    subtopics: [
      { id: "account-defaults-general", label: "General settings", description: "Get notified about changes to account defaults and general settings.", channels: { popup: false, browser: false, bell: true, email: true } },
      { id: "account-defaults-currency", label: "Currency updates", description: "Receive notifications about currency and fiscal year changes.", channels: { popup: false, browser: false, bell: false, email: true } },
    ],
  },
  {
    id: "users-teams", label: "Users & Teams",
    channels: { popup: false, browser: false, bell: true, email: true },
    subtopics: [
      { id: "users-added", label: "New users added", description: "Get notified when new users are added to your account.", channels: { popup: false, browser: false, bell: true, email: true } },
      { id: "team-changes", label: "Team changes", description: "Receive notifications about team structure and permission changes.", channels: { popup: false, browser: false, bell: true, email: false } },
    ],
  },
  {
    id: "smart-crm", label: "Smart CRM",
    channels: { popup: true, browser: true, bell: true, email: false },
    subtopics: [
      { id: "crm-deals", label: "Deal updates", description: "Get notified about deal stage changes and new opportunities.", channels: { popup: true, browser: true, bell: true, email: false } },
      { id: "crm-leads", label: "New leads", description: "Receive notifications when new leads are assigned to you.", channels: { popup: true, browser: false, bell: true, email: false } },
    ],
  },
  {
    id: "communications", label: "Communications",
    channels: { popup: true, browser: true, bell: true, email: false },
    subtopics: [
      { id: "comm-calls", label: "Incoming calls", description: "Get notified about incoming calls and missed calls.", channels: { popup: true, browser: true, bell: true, email: false } },
      { id: "comm-messages", label: "New messages", description: "Receive notifications for new SMS and chat messages.", channels: { popup: true, browser: true, bell: true, email: false } },
    ],
  },
  {
    id: "planner", label: "Planner",
    channels: { popup: false, browser: true, bell: true, email: true },
    subtopics: [
      { id: "planner-tasks", label: "Task reminders", description: "Get notified about upcoming tasks and deadlines.", channels: { popup: false, browser: true, bell: true, email: true } },
      { id: "planner-assignments", label: "New assignments", description: "Receive notifications when work items are assigned to you.", channels: { popup: false, browser: false, bell: true, email: false } },
    ],
  },
  {
    id: "virtual-agents", label: "Virtual Agents",
    channels: { popup: false, browser: false, bell: true, email: true },
    subtopics: [
      { id: "virtual-agents-outbound", label: "Outbound agent activity", description: "Get notified about outbound AI agent campaigns and results.", channels: { popup: false, browser: false, bell: true, email: true } },
      { id: "virtual-agents-inbound", label: "Inbound agent alerts", description: "Receive notifications about inbound bot interactions.", channels: { popup: false, browser: false, bell: false, email: true } },
    ],
  },
  {
    id: "pulse", label: "Pulse",
    channels: { popup: false, browser: false, bell: true, email: true },
    subtopics: [
      { id: "pulse-alerts", label: "System alerts", description: "Get notified about critical system events and host status.", channels: { popup: false, browser: false, bell: true, email: true } },
      { id: "pulse-monitoring", label: "Monitoring updates", description: "Receive notifications about monitoring threshold breaches.", channels: { popup: false, browser: false, bell: true, email: true } },
    ],
  },
  {
    id: "compliance", label: "Compliance (Beta)",
    channels: { popup: false, browser: false, bell: true, email: true },
    subtopics: [
      { id: "compliance-reports", label: "Compliance reports", description: "Get notified when compliance reports are generated.", channels: { popup: false, browser: false, bell: true, email: true } },
      { id: "compliance-violations", label: "Policy violations", description: "Receive immediate alerts about compliance violations.", channels: { popup: false, browser: false, bell: true, email: true } },
    ],
  },
  {
    id: "workforce", label: "Workforce",
    channels: { popup: false, browser: false, bell: true, email: false },
    subtopics: [
      { id: "workforce-requests", label: "New requests", description: "Get notified about new workforce requests and approvals.", channels: { popup: false, browser: false, bell: true, email: false } },
      { id: "workforce-timeoff", label: "Time-off updates", description: "Receive notifications about time-off request status changes.", channels: { popup: false, browser: false, bell: false, email: false } },
    ],
  },
  {
    id: "billing", label: "Billing",
    channels: { popup: false, browser: false, bell: false, email: true },
    subtopics: [
      { id: "billing-invoices", label: "New invoices", description: "Get notified when new invoices are generated.", channels: { popup: false, browser: false, bell: false, email: true } },
      { id: "billing-payments", label: "Payment confirmations", description: "Receive notifications about successful payments.", channels: { popup: false, browser: false, bell: false, email: true } },
    ],
  },
  {
    id: "tickets", label: "Tickets",
    channels: { popup: true, browser: true, bell: true, email: false },
    subtopics: [
      { id: "tickets-assigned", label: "Ticket assigned", description: "Get notified when a ticket is assigned to you.", channels: { popup: true, browser: true, bell: true, email: false } },
      { id: "tickets-updates", label: "Ticket updates", description: "Receive notifications about ticket status changes.", channels: { popup: false, browser: false, bell: true, email: false } },
    ],
  },
  {
    id: "help-center", label: "Help Center",
    channels: { popup: false, browser: false, bell: false, email: true },
    subtopics: [
      { id: "help-center-articles", label: "New articles", description: "Get notified when new help articles are published.", channels: { popup: false, browser: false, bell: false, email: true } },
      { id: "help-center-faqs", label: "FAQ updates", description: "Receive notifications about FAQ updates.", channels: { popup: false, browser: false, bell: false, email: false } },
    ],
  },
  {
    id: "ai-chat", label: "AI Chat",
    channels: { popup: true, browser: true, bell: true, email: false },
    subtopics: [
      { id: "ai-chat-mentions", label: "Chat mentions", description: "Get notified when you're mentioned in AI chat conversations.", channels: { popup: true, browser: true, bell: true, email: false } },
      { id: "ai-chat-responses", label: "AI responses", description: "Receive notifications about AI-generated responses.", channels: { popup: false, browser: false, bell: false, email: false } },
    ],
  },
];

const getParentState = (
  topic: NotificationTopic,
  channel: ChannelKey
): boolean | "indeterminate" | null => {
  if (!topic.subtopics || topic.subtopics.length === 0) {
    return topic.channels[channel] === null ? null : (topic.channels[channel] as boolean);
  }
  const vals = topic.subtopics.map((s) => s.channels[channel]);
  if (vals.every((v) => v === null)) return null;
  const filtered = vals.filter((v) => v !== null) as boolean[];
  if (filtered.every(Boolean)) return true;
  if (filtered.every((v) => !v)) return false;
  return "indeterminate";
};

const NotificationsSettingsNew: React.FC = () => {
  const [topics, setTopics] = React.useState<NotificationTopic[]>(defaultTopics);
  const [expandedTopics, setExpandedTopics] = React.useState<Set<string>>(new Set());
  const [bannerVisible, setBannerVisible] = React.useState(true);
  const [browserNotifGranted, setBrowserNotifGranted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Channel toggles (how you get notified)
  const [channelEnabled, setChannelEnabled] = React.useState<Record<ChannelKey, boolean>>({
    email: true,
    bell: true,
    browser: true,
    popup: true,
  });
  const [selectedChime, setSelectedChime] = React.useState("Chime (1 sec.)");

  const toggleChannelEnabled = (ch: ChannelKey) => {
    setChannelEnabled((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const allExpanded =
    topics.some((t) => t.subtopics && t.subtopics.length > 0) &&
    topics.filter((t) => t.subtopics && t.subtopics.length > 0).every((t) => expandedTopics.has(t.id));

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedTopics(new Set());
    } else {
      setExpandedTopics(new Set(topics.filter((t) => t.subtopics?.length).map((t) => t.id)));
    }
  };

  const turnOffAll = () => {
    setTopics((prev) =>
      prev.map((t) => ({
        ...t,
        channels: {
          popup: t.channels.popup === null ? null : false,
          browser: t.channels.browser === null ? null : false,
          bell: t.channels.bell === null ? null : false,
          email: t.channels.email === null ? null : false,
        },
        subtopics: t.subtopics?.map((s) => ({
          ...s,
          channels: {
            popup: s.channels.popup === null ? null : false,
            browser: s.channels.browser === null ? null : false,
            bell: s.channels.bell === null ? null : false,
            email: s.channels.email === null ? null : false,
          },
        })),
      }))
    );
  };

  const toggleTopicChannel = (topicId: string, channel: ChannelKey) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        if (t.channels[channel] === null) return t;
        const currentState = getParentState(t, channel);
        const newVal = currentState === true ? false : true;
        return {
          ...t,
          channels: { ...t.channels, [channel]: newVal },
          subtopics: t.subtopics?.map((s) => ({
            ...s,
            channels: { ...s.channels, [channel]: s.channels[channel] === null ? null : newVal },
          })),
        };
      })
    );
  };

  const toggleSubtopicChannel = (topicId: string, subtopicId: string, channel: ChannelKey) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const updatedSubs = t.subtopics?.map((s) => {
          if (s.id !== subtopicId) return s;
          if (s.channels[channel] === null) return s;
          return { ...s, channels: { ...s.channels, [channel]: !s.channels[channel] } };
        });
        const allTrue = updatedSubs?.every((s) => s.channels[channel] === null || s.channels[channel] === true);
        const parentVal = t.channels[channel] === null ? null : (allTrue ? true : false);
        return { ...t, channels: { ...t.channels, [channel]: parentVal }, subtopics: updatedSubs };
      })
    );
  };

  const notifChannels: Array<{ key: ChannelKey; label: string; description: string }> = [
    { key: "email", label: "Email", description: "Sent to your email address." },
    { key: "bell", label: "Bell", description: "Show up in the bell icon in the navigation bar. Click on the bell to see your most recent notifications." },
    { key: "browser", label: "Browser", description: "Appear in your screen when you're not active but the site is open in a browser tab." },
    { key: "popup", label: "Pop-up", description: "Appear on your screen for a few seconds when you're active. They'll play a sound based on your preferences." },
  ];

  const tableChannels: Array<{ key: ChannelKey; label: string }> = [
    { key: "popup", label: "Pop-up" },
    { key: "browser", label: "Browser" },
    { key: "bell", label: "Bell" },
    { key: "email", label: "Email" },
  ];

  const colWidth = 80;
  const baseFont = "Lexend Deca, Helvetica, Arial, sans-serif";

  const filteredTopics = searchQuery.trim()
    ? topics.filter((t) => t.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : topics;

  const renderTopicCheckbox = (
    value: boolean | "indeterminate" | null,
    onChange: () => void,
    id: string
  ) => {
    if (value === null) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: colWidth, color: "#bbb", fontSize: "13px" }}>
          --
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: colWidth }}>
        <input
          type="checkbox"
          id={id}
          checked={value === true}
          ref={(el) => { if (el) el.indeterminate = value === "indeterminate"; }}
          onChange={onChange}
          style={{ width: "17px", height: "17px", cursor: "pointer", accentColor: "#141414" }}
        />
      </span>
    );
  };

  return (
    <div style={{ fontFamily: baseFont, color: "#141414", padding: "32px 40px" }}>

      {/* ── Info Banner ── */}
      {bannerVisible && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#eaf4fb",
          border: "1px solid #b8dcf0",
          borderRadius: "4px",
          padding: "12px 20px",
          marginBottom: "28px",
          fontSize: "14px",
          fontWeight: 300,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ fontWeight: 600 }}>Want to create your own notification?</strong>
            <span style={{ color: "#555" }}>
              You can create custom notifications in{" "}
              <a href="#" style={{ color: "#006162", textDecoration: "underline" }}>workflows.</a>
            </span>
            <button style={{
              marginLeft: "8px",
              padding: "5px 12px",
              fontSize: "13px",
              fontFamily: baseFont,
              fontWeight: 300,
              color: "#141414",
              background: "#fff",
              border: "1px solid #d0d0d0",
              borderRadius: "4px",
              cursor: "pointer",
            }}>
              Learn more
            </button>
          </div>
          <button
            onClick={() => setBannerVisible(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "18px", lineHeight: 1, padding: "0 4px" }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Page title + subtitle ── */}
      <div style={{ padding: "0 0 0 0" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 300, color: "#141414", marginBottom: "6px", letterSpacing: 0, fontFamily: baseFont }}>
          Notifications
        </h1>
        <p style={{ fontSize: "14px", fontWeight: 300, color: "#555", marginBottom: "24px" }}>
          These preferences will only be applied to you.
        </p>
        {/* <hr style={{ border: "none", borderTop: "1px solid #e8e8e8", margin: "0 0 28px 0" }} /> */}
      </div>

      {/* ── How you get notified ── */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ fontSize: "20px", fontWeight: 600, color: "#141414", marginBottom: "4px", fontFamily: baseFont }}>
          How you get notified
        </div>
        <div style={{ fontSize: "13px", fontWeight: 300, color: "#555", marginBottom: "20px", fontFamily: baseFont }}>
          Choose where you want to see your notifications.
        </div>

        {/* Browser permission banner */}
        {!browserNotifGranted && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid #f0d080",
            borderRadius: "4px",
            background: "#fffbea",
            padding: "14px 20px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <strong style={{ fontSize: "14px", fontWeight: 600, fontFamily: baseFont }}>Allow browser notifications</strong>
              <span style={{ fontSize: "13px", fontWeight: 300, color: "#555", fontFamily: baseFont }}>
                Give permission to send notifications to this browser
              </span>
            </div>
            <button
              onClick={() => setBrowserNotifGranted(true)}
              style={{
                padding: "7px 16px",
                fontSize: "13px",
                fontFamily: baseFont,
                fontWeight: 300,
                color: "#141414",
                background: "#fff",
                border: "1px solid #d0d0d0",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Allow notifications
            </button>
          </div>
        )}

        {/* Channel toggles */}
        {/* Channel toggles */}
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
  {notifChannels.map((ch) => (
    <div key={ch.key} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
      {/* Switch toggle — left cell is knob, right cell shows checkmark */}
      <div
        onClick={() => toggleChannelEnabled(ch.key)}
        style={{
          display: "inline-flex",
          alignItems: "stretch",
          width: "60px",
          height: "32px",
          border: "1px solid #d0d0d0",
          borderRadius: "4px",
          overflow: "hidden",
          cursor: "pointer",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        {/* Left cell — knob (black when ON, light when OFF) */}
        <div style={{
          width: "30px",
          height: "100%",
          background: channelEnabled[ch.key] ? "#141414" : "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.18s",
          borderRight: "1px solid #d0d0d0",
        }} />
        {/* Right cell — checkmark (dark when ON, muted when OFF) */}
        <div style={{
          width: "30px",
          height: "100%",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M2 6.5L5 9.5L11 3.5"
              stroke={channelEnabled[ch.key] ? "#141414" : "#d0d0d0"}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#141414", fontFamily: baseFont, marginBottom: "2px" }}>
          {ch.label}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 300, color: "#555", fontFamily: baseFont }}>
          {ch.description}
        </div>

        {/* Sound selector — only for pop-up */}
        {ch.key === "popup" && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontSize: "13px", fontWeight: 400, color: "#555", fontFamily: baseFont }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              <strong style={{ fontWeight: 600, color: "#141414" }}>Only applicable to pop-ups</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <select
                value={selectedChime}
                onChange={(e) => setSelectedChime(e.target.value)}
                style={{
                  padding: "8px 32px 8px 12px",
                  fontSize: "13px",
                  fontFamily: baseFont,
                  fontWeight: 300,
                  color: "#141414",
                  border: "1px solid #d0d0d0",
                  borderRadius: "4px",
                  background: "#fff",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23555'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                } as React.CSSProperties}
              >
                <option>Chime (1 sec.)</option>
                <option>Bell (2 sec.)</option>
                <option>Ding (0.5 sec.)</option>
                <option>None</option>
              </select>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontFamily: baseFont,
                  fontWeight: 300,
                  color: "#141414",
                  background: "#fff",
                  border: "1px solid #d0d0d0",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <svg width="10" height="12" viewBox="0 0 10 12" fill="#141414">
                  <path d="M0 0L10 6L0 12V0Z"/>
                </svg>
                Play
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ))}
</div>
      </div>

      {/* ── What you get notified about ── */}
      <div>
        <div style={{ fontSize: "20px", fontWeight: 600, color: "#141414", marginBottom: "4px", fontFamily: baseFont }}>
          What you get notified about
        </div>
        <div style={{ fontSize: "13px", fontWeight: 300, color: "#555", marginBottom: "20px", fontFamily: baseFont }}>
          Choose what topics matter to you and how you get notified about them.
        </div>

        {/* Search bar */}
        <div style={{ background: "#f5f5f5", borderRadius: "6px", padding: "16px 20px", marginBottom: "20px" }}>
        {/* <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", zIndex: 1 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg> */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            
            <input
              type="text"
              placeholder="Search for notification topics"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: "20px",
                paddingRight: "20px",
                paddingTop: "8px",
                paddingBottom: "8px",
                width: '640px',

        fontSize: '16px',
        height: '40px',
        fontWeight: 300,
                color: "#141414",
                border: "1px solid #8a8a8a",
                borderRadius: "20px",
                background: "#fff",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#006162")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#d0d0d0")}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: "10px" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>

        {/* Controls row + column headers */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0", fontSize: "14px", fontWeight: 300 }}>
            <button
              onClick={toggleExpandAll}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#006162", fontSize: "14px", fontFamily: baseFont, fontWeight: 300, padding: 0, textDecoration: "underline" }}
            >
              {allExpanded ? "Collapse all topics" : "Expand all topics"}
            </button>
            <span style={{ margin: "0 8px", color: "#d0d0d0" }}>|</span>
            <button
              onClick={turnOffAll}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#006162", fontSize: "14px", fontFamily: baseFont, fontWeight: 300, padding: 0, textDecoration: "underline" }}
            >
              Turn off all topics
            </button>
            <span style={{ marginLeft: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "15px", height: "15px", border: "1.5px solid #888", borderRadius: "50%", fontSize: "10px", color: "#888", cursor: "default" }} title="Turning off all topics disables all notifications">
              ?
            </span>
          </div>

          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {tableChannels.map((ch) => (
              <div key={ch.key} style={{ width: colWidth, textAlign: "center", fontSize: "12px", fontWeight: 400, color: "#555", fontFamily: baseFont, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                {ch.key === "popup" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                )}
                {ch.key === "browser" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                )}
                {ch.key === "bell" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                )}
                {ch.key === "email" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                )}
                <span>{ch.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topic rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredTopics.map((topic) => {
            const isExpanded = expandedTopics.has(topic.id);
            const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

            const toggleThisTopic = () => {
              setExpandedTopics(prev => {
                const n = new Set(prev);
                n.has(topic.id) ? n.delete(topic.id) : n.add(topic.id);
                return n;
              });
            };

            // Chevron SVG — rotates from > (collapsed) to v (expanded)
            const ChevronIcon = () => (
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  transition: "transform 0.2s",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}
              >
                <polyline points="4,2 9,6 4,10" />
              </svg>
            );

            return (
              <div
                key={topic.id}
                style={{
                  border: "1px solid #8a8a8a",
                  borderRadius: "4px",
                  background: "#fff",
                  overflow: "hidden",
                }}
              >
                {/* Parent header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={toggleThisTopic}
                >
                  {/* Left: chevron + label */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                      <ChevronIcon />
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 500, color: "#141414", fontFamily: baseFont }}>
                      {topic.label}
                    </span>
                  </div>

                  {/* Middle: POP-UP SOUND label shown only when expanded */}
                  <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingRight: "16px" }}>
                    {isExpanded && hasSubtopics && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "0.8px", fontFamily: baseFont, textTransform: "uppercase" }}>
                        POP-UP SOUND
                      </span>
                    )}
                  </div>

                  {/* Right: channel checkboxes */}
                  <div style={{ display: "flex", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                    {tableChannels.map((ch) => {
                      const state = getParentState(topic, ch.key);
                      return renderTopicCheckbox(state, () => toggleTopicChannel(topic.id, ch.key), `${topic.id}-${ch.key}`);
                    })}
                  </div>
                </div>

                {/* Subtopics — inside the same card, separated by dividers */}
                {isExpanded && hasSubtopics && (
                  <div>
                    {topic.subtopics!.map((sub, subIdx) => (
                      <div
                        key={sub.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderTop: "1px solid #e8e8e8",
                          padding: "14px 20px 14px 42px",
                          background: "#fff",
                          gap: "12px",
                        }}
                      >
                        {/* Name + description */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 500, color: "#141414", fontFamily: baseFont, marginBottom: "2px" }}>
                            {sub.label}
                          </div>
                          {sub.description && (
                            <div style={{ fontSize: "12px", fontWeight: 300, color: "#888", fontFamily: baseFont }}>
                              {sub.description}
                            </div>
                          )}
                        </div>

                        {/* Edit button + sound control */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <button style={{
                            padding: "5px 14px",
                            fontSize: "13px",
                            fontFamily: baseFont,
                            fontWeight: 300,
                            color: "#141414",
                            background: "#fff",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}>
                            Edit
                          </button>
                          {/* Sound play + dropdown */}
                          <div style={{ display: "flex", alignItems: "center", border: "1px solid #d0d0d0", borderRadius: "4px", overflow: "hidden" }}>
                            <button style={{
                              display: "flex", alignItems: "center", justifyContent: "center",
                              width: "28px", height: "28px",
                              background: "#fff", border: "none", borderRight: "1px solid #d0d0d0",
                              cursor: "pointer", padding: 0,
                            }}>
                              <svg width="8" height="10" viewBox="0 0 8 10" fill="#555">
                                <path d="M0 0L8 5L0 10V0Z"/>
                              </svg>
                            </button>
                            <select style={{
                              padding: "4px 22px 4px 8px",
                              fontSize: "12px",
                              fontFamily: baseFont,
                              fontWeight: 300,
                              color: "#141414",
                              border: "none",
                              background: "#fff",
                              outline: "none",
                              cursor: "pointer",
                              appearance: "none",
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23555'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 6px center",
                            } as React.CSSProperties}>
                              <option>Off</option>
                              <option>Chime (1 sec.)</option>
                              <option>Bell (2 sec.)</option>
                              <option>Ding (0.5 sec.)</option>
                            </select>
                          </div>
                        </div>

                        {/* Channel checkboxes */}
                        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                          {tableChannels.map((ch) =>
                            renderTopicCheckbox(
                              sub.channels[ch.key] === null ? null : (sub.channels[ch.key] as boolean),
                              () => toggleSubtopicChannel(topic.id, sub.id, ch.key),
                              `${sub.id}-${ch.key}`
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {filteredTopics.length === 0 && (
            <div style={{ textAlign: "center", color: "#888", fontSize: "14px", fontWeight: 300, padding: "40px", fontFamily: baseFont }}>
              No topics found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// ─── End NotificationsSettings ─────────────────────────────────────────────────



// ─── General Settings (Profile + Tasks) ────────────────────────────────────────
const GeneralSettings = () => {
  const [activeGeneralTab, setActiveGeneralTab] = useState<"profile" | "tasks">("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [firstName, setFirstName] = useState("Rizwan");
  const [lastName, setLastName] = useState("Haider");
  const [language, setLanguage] = useState("English");
  const [dateFormat, setDateFormat] = useState("United Kingdom");
  const [phoneCountry, setPhoneCountry] = useState("GB");
  const [phoneNumber, setPhoneNumber] = useState("+44 783 150 5446");

  // Tasks state
  const [dueDate, setDueDate] = useState("In 3 business days");
  const [dueTime, setDueTime] = useState("08:00");
  const [reminder, setReminder] = useState("No reminder");
  const [followUpList, setFollowUpList] = useState(true);
  const [followUpDisqualify, setFollowUpDisqualify] = useState(true);

  const generalTabs: Array<{ key: "profile" | "tasks"; label: string }> = [
    { key: "profile", label: "Profile" },
    { key: "tasks", label: "Tasks" },
  ];

  const s: Record<string, React.CSSProperties> = {
    wrapper: {
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      color: "#141414",
      padding: "32px 40px",
    },
    pageTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#141414",
      marginBottom: "24px",
      letterSpacing: 0,
    },
    tabsWrapper: {
      display: "flex",
      marginBottom: "32px",
      overflow: "hidden",
    },
    notice: {
      fontSize: "14px",
      color: "#555",
      fontWeight: 300,
      marginBottom: "28px",
    },
    divider: {
      border: "none",
      borderTop: "1px solid #e8e8e8",
      margin: "28px 0",
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: 600,
      color: "#141414",
      marginBottom: "4px",
    },
    sectionSubtitle: {
      fontSize: "13px",
      fontWeight: 300,
      color: "#555",
      marginBottom: "24px",
    },
    fieldGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: 600,
      color: "#141414",
      marginBottom: "8px",
    },
    input: {
      width: "500px",
      padding: "8px 12px",
      fontSize: "16px",
      height: "40px",
      fontWeight: 300,
      color: "#141414",
      border: "1px solid #d0d0d0",
      borderRadius: "4px",
      background: "#fff",
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      outline: "none",
      display: "block",
    } as React.CSSProperties,
    select: {
      width: "500px",
      padding: "8px 36px 8px 12px",
      fontSize: "16px",
      fontWeight: 300,
      height: "40px",
      color: "#141414",
      border: "1px solid #d0d0d0",
      borderRadius: "4px",
      background: "#fff",
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      outline: "none",
      display: "block",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23555'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
    } as React.CSSProperties,
    helpText: {
      fontSize: "13px",
      color: "#555",
      fontWeight: 300,
      marginTop: "6px",
      lineHeight: "1.5",
    },
    link: {
      color: "#006162",
      textDecoration: "none",
    } as React.CSSProperties,
    saveButton: {
      marginTop: "32px",
      padding: "9px 22px",
      fontSize: "14px",
      fontWeight: 400,
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      color: "#fff",
      background: "#006162",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    } as React.CSSProperties,
    profileImageBox: {
      width: "72px",
      height: "72px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #0d6efd 0%, #198754 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "28px",
      fontWeight: 700,
      color: "#fff",
      cursor: "pointer",
      overflow: "hidden",
      border: "2px solid #e0e0e0",
    } as React.CSSProperties,
    changePhotoBtn: {
      marginTop: "10px",
      padding: "6px 14px",
      fontSize: "13px",
      fontWeight: 300,
      fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
      color: "#141414",
      background: "transparent",
      border: "1px solid #e0e0e0",
      borderRadius: "4px",
      cursor: "pointer",
      display: "block",
    } as React.CSSProperties,
    helpIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "16px",
      height: "16px",
      border: "1.5px solid #888",
      borderRadius: "50%",
      fontSize: "10px",
      color: "#888",
      verticalAlign: "middle",
      marginLeft: "4px",
      cursor: "default",
    } as React.CSSProperties,
    checkboxRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      marginBottom: "16px",
    },
    checkbox: {
      width: "16px",
      height: "16px",
      marginTop: "2px",
      accentColor: "#000000",
      cursor: "pointer",
      flexShrink: 0,
    } as React.CSSProperties,
    checkboxLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#141414",
      lineHeight: "1.5",
      cursor: "pointer",
    },
  };

  const getTab = (isActive: boolean, isLast: boolean): React.CSSProperties => ({
    padding: "12px 28px",
    background: isActive ? "#ffffff" : "whitesmoke",
    border: "1px solid #e0e0e0",
    borderRight: isLast ? "1px solid #e0e0e0" : "none",
    borderBottom: isActive ? "2px solid #ffffff" : "2px solid #e0e0e0",
    cursor: "pointer",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: "14px",
    fontWeight: 300,
    color: "#141414",
    whiteSpace: "nowrap",
    transition: "background 0.15s",
    position: "relative",
    top: "1px",
    outline: "none",
  });

  const getInitials = () =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const renderProfile = () => (
    <div>
      <p style={s.notice}>These preferences only apply to you.</p>
      {/* <hr style={s.divider} /> */}

      {/* Global */}
      <div style={s.sectionTitle}>Global</div>
      <div style={s.sectionSubtitle}>This applies across any accounts you have.</div>

      {/* Profile Image */}
      <div style={{ marginBottom: "24px" }}>
        <span style={s.label}>Profile Image</span>
        <div style={s.profileImageBox} onClick={() => fileInputRef.current?.click()}>
          {profileImage
            ? <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span>{getInitials()}</span>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => setProfileImage(ev.target?.result as string);
              reader.readAsDataURL(file);
            }
          }}
        />
        {/* <button style={s.changePhotoBtn} onClick={() => fileInputRef.current?.click()}>
          Change photo
        </button> */}
      </div>

      {/* First name */}
      <div style={s.fieldGroup}>
        <label style={s.label}>First name</label>
        <input
          style={s.input}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#006162")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#d0d0d0")}
        />
      </div>

      {/* Last name */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Last name</label>
        <input
          style={s.input}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#006162")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#d0d0d0")}
        />
      </div>

      {/* Language */}
      <div style={s.fieldGroup}>
        <label style={s.label}>
          Language <span style={s.helpIcon} title="Applies globally across all accounts">?</span>
        </label>
        <select style={s.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>English</option>
          <option>French</option>
          <option>Spanish</option>
          <option>German</option>
          <option>Arabic</option>
          <option>Urdu</option>
        </select>
      </div>

      {/* Date, time, and number format */}
      <div style={s.fieldGroup}>
        <label style={s.label}>
          Date, time, and number format <span style={s.helpIcon} title="Sets date/time/number format based on locale">?</span>
        </label>
        <div style={{ fontSize: "13px", color: "#555", fontWeight: 300, marginBottom: "8px" }}>
          Format: 2 March 2026, 02/03/2026, 19:41 GMT, and 1,234.56
        </div>
        <select style={s.select} value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
          <option>United Kingdom</option>
          <option>United States</option>
          <option>European Union</option>
          <option>Pakistan</option>
          <option>Australia</option>
        </select>
      </div>

      {/* Phone number */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Phone number</label>
        <div style={s.helpText}>
          We may use this phone number to contact you about security events. Please refer to our privacy policy for{" "}
          <a href="#" style={s.link}>more information ↗</a>
        </div>
        <div style={{ display: "flex", gap: "0px", marginTop: "10px" }}>
          <select
            value={phoneCountry}
            onChange={(e) => setPhoneCountry(e.target.value)}
            style={{ padding: "8px", fontSize: "14px", border: "1px solid #d0d0d0", borderRadius: "0px", background: "#fff", fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif", outline: "none", borderRight: "none" }}
          >
            <option value="GB">🇬🇧</option>
            <option value="US">🇺🇸</option>
            <option value="PK">🇵🇰</option>
            <option value="AU">🇦🇺</option>
          </select>
          <input
            style={{ width: "260px", padding: "8px 12px", fontSize: "14px", color: "#141414", border: "1px solid #d0d0d0", borderRadius: "4px", background: "#fff", fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif", outline: "none" }}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#006162")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#d0d0d0")}
          />
        </div>
      </div>

      {/* <hr style={s.divider} /> */}

      {/* Defaults */}
      <div style={s.sectionTitle}>Defaults</div>
      <div style={s.sectionSubtitle}>This only applies to this account.</div>
      <div style={s.fieldGroup}>
        <label style={s.label}>General working hours</label>
        <a href="#" style={{ ...s.link, fontSize: "14px", fontWeight: 300 }}>Edit working hours ↗</a>
      </div>

      {/* <button style={s.saveButton}>Save</button> */}
    </div>
  );

  const renderTasks = () => (
    <div>
      <p style={s.notice}>These preferences only apply to you.</p>
      {/* <hr style={s.divider} /> */}

      <div style={s.sectionTitle}>Defaults</div>
      <div style={s.sectionSubtitle}>Set preferences for task creation.</div>

      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px" }}>
        {/* Due date */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Due date</label>
          <select
            style={{ ...s.select, width: "240px", height: "40px", fontWeight: 300 }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          >
            <option>In 3 business days</option>
            <option>In 1 business day</option>
            <option>In 5 business days</option>
            <option>In 1 week</option>
            <option>In 2 weeks</option>
            <option>No due date</option>
          </select>
        </div>

        {/* Due time */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Due time</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "14px", pointerEvents: "none", zIndex: 1 }}><Clock size={14} /></span>
            <select
              style={{ width: "240px", padding: "8px 12px 8px 34px", fontSize: "16px", height: "40px", fontWeight: 300, color: "#141414", border: "1px solid #d0d0d0", borderRadius: "4px", background: "#fff", fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif", outline: "none", appearance: "none" } as React.CSSProperties}
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            >
              {Array.from({ length: 24 }).map((_, h) =>
                ["00", "30"].map((m) => {
                  const val = `${String(h).padStart(2, "0")}:${m}`;
                  return <option key={val} value={val}>{val}</option>;
                })
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Reminder */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Reminder</label>
        <select style={s.select} value={reminder} onChange={(e) => setReminder(e.target.value)}>
          <option>No reminder</option>
          <option>At time of task</option>
          <option>5 minutes before</option>
          <option>15 minutes before</option>
          <option>30 minutes before</option>
          <option>1 hour before</option>
          <option>1 day before</option>
        </select>
      </div>

      {/* <hr style={s.divider} /> */}

      <div style={s.sectionTitle}>Follow-up tasks</div>
      <div style={s.sectionSubtitle}>Set preferences for follow-up reminders.</div>

      <div style={s.checkboxRow}>
        <input
          type="checkbox"
          id="followUpList"
          style={s.checkbox}
          checked={followUpList}
          onChange={(e) => setFollowUpList(e.target.checked)}
        />
        <label htmlFor="followUpList" style={s.checkboxLabel}>
          Get prompted to create a follow up task every time you complete a task from a list view
        </label>
      </div>

      <div style={s.checkboxRow}>
        <input
          type="checkbox"
          id="followUpDisqualify"
          style={s.checkbox}
          checked={followUpDisqualify}
          onChange={(e) => setFollowUpDisqualify(e.target.checked)}
        />
        <label htmlFor="followUpDisqualify" style={s.checkboxLabel}>
          Get prompted to create a follow up task every time you disqualify a lead
        </label>
      </div>

      {/* <button style={s.saveButton}>Save</button> */}
    </div>
  );

  return (
    <div style={s.wrapper}>
      <h1 style={s.pageTitle}>General</h1>

      {/* Two tabs: Profile & Tasks */}
      <div style={s.tabsWrapper}>
        {generalTabs.map((tab, index) => {
          const isActive = activeGeneralTab === tab.key;
          const isLast = index === generalTabs.length - 1;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveGeneralTab(tab.key)}
              style={getTab(isActive, isLast)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeGeneralTab === "profile" && renderProfile()}
      {activeGeneralTab === "tasks" && renderTasks()}
    </div>
  );
};
// ─── End GeneralSettings ────────────────────────────────────────────────────────

const sectionPageMap: Record<string, React.ReactNode> = {
  'general-prefs': <GeneralSettings />,
  notifications: <NotificationsSettingsNew />,
  'account-defaults': <AccountDefaultsPage />,
  'account-cleanup': <GenericPage title="Account Cleanup" />,
  'audit-log': <GenericPage title="Audit Log" />,
  'users-teams': <UsersTeamsPage />,
  'smart-crm': <SmartCrmPage />,
  'communications': <CommunicationsPage />,
  'planner': <PlannerPage />,
  'workforce': <WorkforcePage />,
  'billing': <BillingPage />,
  'tickets': <TicketsPage />,
  'help-center': <HelpCenterPage />,
  'ai-chat': <AIChatPage />,
  'virtual-agents': <VirtualAgentsPage />,
  'pulse': <PulsePage />,
  'compliance': <GenericPage title="Compliance" />,
  'product-updates': <GenericPage title="Product Updates" />,
  integrations: <GenericPage title="Integrations" />,
  marketplace: <GenericPage title="Marketplace Downloads" />,
  'tracking-analytics': <GenericPage title="Tracking & Analytics" />,
  'privacy-consent': <GenericPage title="Privacy & Consent" />,
  sandboxes: <GenericPage title="Sandboxes" />,
  security: <GenericPage title="Security" />,
  approvals: <GenericPage title="Approvals" />,
  ai: <GenericPage title="AI" />,
  'payments-account': <GenericPage title="Payments Account" />,
}




// ─── Main Settings Page ───────────────────────────────────────────────────────
const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState<string>('general-prefs')

  
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .main-content-wrapper {
            overflow: hidden;
            height: calc(100vh - 50px);
          }
        `
      }} />
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          background: '#ffffff',
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
        }}
      >
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: '255px',
          minWidth: '255px',
          background: '#ffffff',
          borderRight: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          height: '100%',
          overflow: 'hidden',
          padding: "21px"
        }}
      >
        {/* Back to Dashboard */}
        <div style={{ paddingLeft: '20px', paddingRight: '20px', marginBottom: '20px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              padding: '10px 22px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
              color: '#141414',
              fontWeight: 300,
              position: 'relative',
              left: '-45px',
            }}
          >
            <span style={{ fontSize: '14px' }}><ChevronLeft size={18} /></span> Dashboard
          </button>
        </div>

        {/* Settings heading + search icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '20px',
            paddingRight: '20px',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontStyle: 'normal',
              fontWeight: 600,
              textTransform: 'none',
              fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
              letterSpacing: '0px',
              lineHeight: '24px',
              color: '#141414',
            }}
          >
            Settings
          </span>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#555',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Search settings"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Search Input */}
        {showSearch && (
          <div style={{ paddingLeft: '20px', paddingRight: '20px', marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#888',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  fontSize: '13px',
                  fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                  color: '#141414',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  outline: 'none',
                  background: '#fff',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#0091ae')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#d0d0d0')}
              />
            </div>
          </div>
        )}

        {/* Groups */}
        {sidebarGroups.map(group => {
          // Filter items based on search query
          const filteredItems = searchQuery.trim()
            ? group.items.filter(item =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : group.items

          // Skip group if no items match search
          if (filteredItems.length === 0) return null

          return (
            <div key={group.heading} style={{ marginBottom: '8px' }}>
              <div
                style={{
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '12px',
                  paddingBottom: '6px',
                  fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  color: '#141414',
                  lineHeight: '20px',
                }}
              >
                {group.heading}
              </div>
              {filteredItems.map(item => {
                const isActive = activeSection === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingLeft: '20px',
                      paddingRight: '16px',
                      paddingTop: '5px',
                      paddingBottom: '5px',
                      cursor: 'pointer',
                      background: isActive ? '#whitesmoke' : 'transparent',
                      borderLeft: isActive ? '3px solid #141414' : '3px solid transparent',
                      color: 'rgb(20, 20, 20)',
                      fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
                      fontSize: '14px',
                      fontWeight: isActive ? 400 : 300,
                      letterSpacing: '0px',
                      lineHeight: '24px',
                      transition: 'background 0.12s, border-color 0.12s',
                      userSelect: 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        ;(e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.badge && (
                        <span
                          style={{
                            background: '#7b5cf5',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.externalLink && (
                        <span style={{ fontSize: '11px', color: '#aaa' }}>↗</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          background: '#ffffff',
          overflowY: 'auto',
          height: '100%',
        }}
      >
        {sectionPageMap[activeSection] ?? (
          <div style={{ padding: '32px 40px' }}>
            <p style={{ color: '#999', fontSize: '14px' }}>Select a section from the sidebar.</p>
          </div>
        )}
      </main>
    </div>
    </>
  )
}

SettingsPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SettingsPage
