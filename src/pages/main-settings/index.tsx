import React, { ReactElement, useState } from 'react'
import { Search, ChevronLeft } from 'lucide-react'
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

const sectionPageMap: Record<string, React.ReactNode> = {
  'general-prefs': <GenericPage title="General" />,
  notifications: <GenericPage title="Notifications" />,
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
  const [activeSection, setActiveSection] = useState<string>('account-defaults')

  
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
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
          paddingTop: '24px',
          paddingBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflowY: 'auto',
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
          minHeight: '100vh',
        }}
      >
        {sectionPageMap[activeSection] ?? (
          <div style={{ padding: '32px 40px' }}>
            <p style={{ color: '#999', fontSize: '14px' }}>Select a section from the sidebar.</p>
          </div>
        )}
      </main>
    </div>
  )
}

SettingsPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SettingsPage
