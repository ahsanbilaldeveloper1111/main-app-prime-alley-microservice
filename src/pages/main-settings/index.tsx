import React, { ReactElement, useState, useRef, useMemo, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useRouter } from 'next/router'
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
import UserDefaults from '@components/UserDefaults'
import CurrencyTabContent from '@components/CurrencyTabContent'
import GeneralTabContent from '@components/GeneralTabContent'
import { HEADER_CONSTANTS } from '@constants/headerConstants'
import { useSession } from 'next-auth/react'
import { APP_FONT } from '../../styles/fonts'

const { PERMISSIONS } = HEADER_CONSTANTS
const BASE_FONT = APP_FONT

// ─── Tab Definitions ──────────────────────────────────────────────────────────
type Tab = {
  id: string
  label: string
  permission?: string
}

type ControlledTabsProps = {
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

function getUserPermissions(session: unknown): string[] {
  const perms = (session as { user?: { permissions?: unknown } } | null | undefined)?.user?.permissions
  if (Array.isArray(perms)) return perms.map(String)
  if (typeof perms === 'string') {
    return perms
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
  }
  return []
}

function filterTabsByPermission(tabs: Tab[], userPermissions: string[]): Tab[] {
  return tabs.filter((t) => !t.permission || userPermissions.includes(t.permission))
}

function resolveAllowedActiveTabId(routeActiveTab: string | undefined, activeTab: string, allowedTabs: Tab[]): string {
  const allowedIds = new Set(allowedTabs.map((t) => t.id))
  const requested = routeActiveTab
  return (
    (requested && allowedIds.has(requested) ? requested : null) ??
    (allowedIds.has(activeTab) ? activeTab : null) ??
    allowedTabs[0]?.id ??
    ''
  )
}

const accountDefaultsTabs: Tab[] = [
  { id: 'general', label: 'General', permission: PERMISSIONS.VIEW_ACCOUNT_DEFAULTS_GENERAL },
  { id: 'user-defaults', label: 'User Defaults', permission: PERMISSIONS.VIEW_ACCOUNT_USER_DEFAULT },
  { id: 'notification-profiles', label: 'Notification Profiles', permission: PERMISSIONS.VIEW_ACCOUNT_NOTIFICATION_PROFILES },
  { id: 'currency', label: 'Currency', permission: PERMISSIONS.VIEW_ACCOUNT_CURRENCY },
  { id: 'data-hosting', label: 'Data Hosting', permission: PERMISSIONS.VIEW_ACCOUNT_DATA_HOSTING },
  { id: 'feature-releases', label: 'Feature Releases', permission: PERMISSIONS.VIEW_ACCOUNT_FEATURE_RELEASE },
]

// ─── Tab Content Components ───────────────────────────────────────────────────

const HelpDot: React.FC = () => (
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
)

const FieldLabelRow: React.FC<{ label: string; helpIcon?: boolean }> = ({ label, helpIcon }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '8px',
      fontFamily: BASE_FONT,
      fontSize: '14px',
      fontWeight: 600,
      color: '#141414',
    }}
  >
    {label}
    {helpIcon ? <HelpDot /> : null}
  </div>
)

const InputField: React.FC<{ label: string; value?: string; helpIcon?: boolean }> = ({
  label,
  value = '',
  helpIcon,
}) => (
  <div style={{ marginBottom: '24px' }}>
    <FieldLabelRow label={label} helpIcon={helpIcon} />
    <input
      type="text"
      defaultValue={value}
      style={{
        width: '340px',
        maxWidth: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        fontFamily: BASE_FONT,
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
    <FieldLabelRow label={label} helpIcon={helpIcon} />
    <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
      <select
        defaultValue={value}
        style={{
          width: '100%',
          padding: '8px 36px 8px 12px',
          fontSize: '14px',
          fontFamily: BASE_FONT,
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

const ExternalLinkIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 12 12"
    fill="none"
    style={{ flexShrink: 0, display: 'inline', marginLeft: '3px', verticalAlign: 'middle' }}
  >
    <path
      d="M3.5 1H11M11 1V8.5M11 1L1 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="#555"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.2s',
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      flexShrink: 0,
    }}
  >
    <polyline points="4,2 9,6 4,10" />
  </svg>
)

const DATA_HOSTING_LOCATIONS = [
  'United States',
  'European Union (Germany)',
  'Asia Pacific (Australia)',
  'Asia Pacific (Singapore)',
  'Canada',
  'United Kingdom',
] as const

const FeatureSectionHeading: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <h2 style={{ fontFamily: BASE_FONT, fontSize: '20px', fontWeight: 700, color: '#141414', marginBottom: '6px' }}>{title}</h2>
    <p style={{ fontFamily: BASE_FONT, fontSize: '14px', fontWeight: 300, color: '#141414', lineHeight: '1.6', margin: 0 }}>
      {children}
    </p>
  </div>
)


// ─── Notification Profiles Tab ────────────────────────────────────────────────
const NotificationProfilesTabContent: React.FC = () => {
  const [showModal, setShowModal] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>([])
  const nextProfileId = useRef(1)

  const removeProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id))
  }

  const handleCreate = () => {
    const name = profileName.trim()
    if (!name) return
    const id = String(nextProfileId.current++)
    setProfiles(prev => [...prev, { id, name }])
    setProfileName('')
    setShowModal(false)
  }
  const baseFont = BASE_FONT

  return (
    <div>
      {/* Intro */}
      <p style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: 300 }}>
        These defaults will be used for user defaults and presets.
      </p>

      <Divider />

      {/* Section heading */}
      <h2
        style={{
          fontFamily: baseFont,
          fontSize: '16px',
          fontWeight: 600,
          color: '#141414',
          marginBottom: '6px',
        }}
      >
        Notification Profiles
      </h2>
      <p style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', fontWeight: 300, marginBottom: '20px' }}>
        Set notification defaults for a group of users within a preset. To add or edit Presets go to{' '}
        <button
          type="button"
          onClick={() => null}
          style={{
            color: '#0091ae',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Presets
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M3.5 1H11M11 1V8.5M11 1L1 11" stroke="#0091ae" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </p>

      {/* Create button */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '9px 18px',
          fontSize: '14px',
          fontFamily: baseFont,
          fontWeight: 500,
          color: '#141414',
          background: '#fff',
          border: '1px solid #d0d0d0',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#141414')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
      >
        Create notification profile
      </button>

      {/* Existing profiles list */}
      {profiles.length > 0 && (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {profiles.map(({ id, name }) => (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontFamily: baseFont,
                fontSize: '14px',
                fontWeight: 400,
                color: '#141414',
                background: '#fff',
              }}
            >
              <span>{name}</span>
              <button
                onClick={() => removeProfile(id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#888',
                  fontSize: '18px',
                  lineHeight: 1,
                  padding: '0 4px',
                  fontFamily: baseFont,
                }}
                title="Remove profile"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            aria-label="Close modal"
            onClick={() => setShowModal(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: '6px',
              width: '480px',
              maxWidth: '95vw',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              fontFamily: baseFont,
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: baseFont, fontSize: '18px', fontWeight: 600, color: '#141414', margin: 0 }}>
                Create notification profile
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '22px', lineHeight: 1, padding: '0 4px' }}
              >
                ×
              </button>
            </div>

            {/* Profile name field */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="notification-profile-name"
                style={{
                  display: 'block',
                  fontFamily: baseFont,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#141414',
                  marginBottom: '8px',
                }}
              >
                Profile name
              </label>
              <input
                id="notification-profile-name"
                type="text"
                placeholder="e.g. Sales Team Default"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontFamily: baseFont,
                  fontWeight: 300,
                  color: '#141414',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  outline: 'none',
                  background: '#fff',
                  boxSizing: 'border-box',
                  height: '38px',
                } as React.CSSProperties}
                onFocus={e => (e.currentTarget.style.borderColor = '#0091ae')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
              />
            </div>

            {/* Modal actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => { setShowModal(false); setProfileName('') }}
                style={{
                  padding: '9px 20px',
                  fontSize: '14px',
                  fontFamily: baseFont,
                  fontWeight: 300,
                  color: '#141414',
                  background: '#fff',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!profileName.trim()}
                style={{
                  padding: '9px 20px',
                  fontSize: '14px',
                  fontFamily: baseFont,
                  fontWeight: 500,
                  color: '#fff',
                  background: profileName.trim() ? '#141414' : '#a0a0a0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: profileName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                }}
              >
                Create profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ─── Data Hosting Tab ─────────────────────────────────────────────────────────
const DataHostingTabContent: React.FC = () => {
  const currentLocation = 'European Union (Germany)'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('')

  const canSchedule = selectedLocation !== ''
  const baseFont = BASE_FONT
  return (
    <>
      {/* ── Main content ── */}
      <div>
        <p style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', fontWeight: 300, marginBottom: '8px' }}>
          View or change the data hosting location for your account.
        </p>

        <Divider />

        <h2 style={{ fontFamily: baseFont, fontSize: '20px', fontWeight: 600, color: '#141414', marginBottom: '20px' }}>
          Data Hosting
        </h2>

        {/* Your data hosting location */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: baseFont,
              fontSize: '14px',
              fontWeight: 600,
              color: '#141414',
              marginBottom: '10px',
            }}
          >
            Your data hosting location{' '}
            <span
              title="The region where your account data is stored and processed."
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
                flexShrink: 0,
              }}
            >
              i
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Location badge */}
            <div
              style={{
                padding: '8px 14px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontFamily: baseFont,
                fontSize: '14px',
                fontWeight: 300,
                color: '#141414',
                background: '#fff',
                whiteSpace: 'nowrap',
              }}
            >
              {currentLocation}
            </div>

            {/* Change link */}
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: baseFont,
                fontSize: '14px',
                fontWeight: 500,
                color: '#0091ae',
                padding: 0,
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* ── Overlay ── */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 99998,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        />
      )}

      {/* ── Slide-in Sidebar ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: sidebarOpen ? 0 : '-600px',
          width: '575px',
          height: '100vh',
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          zIndex: 99999,
          transition: 'right 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: baseFont,
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 32px 24px',
            borderBottom: '1px solid #e8e8e8',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontFamily: baseFont, fontSize: '20px', fontWeight: 700, color: '#141414', margin: 0 }}>
            Schedule a data migration
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#555',
              fontSize: '22px',
              lineHeight: 1,
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Sidebar body — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
          }}
        >
          {/* Intro paragraph */}
          <p style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 300, color: '#141414', marginBottom: '20px', lineHeight: '1.6' }}>
            To change where your data is hosted you'll need to schedule a data migration. Here's what you need to know:
          </p>

          {/* Bullet points */}
          <ul
            style={{
              margin: '0 0 28px 0',
              padding: '0 0 0 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {[
              {
                id: 'unavailable',
                content: (
                  <>
                    Your account will be <span style={{ color: '#0091ae' }}>unavailable during the migration</span>. Most finish
                    within 24 hours; some can take up to 36. Your public content will remain online.
                  </>
                ),
              },
              {
                id: 'post-migration',
                content: (
                  <>
                    After the migration completes, your data and settings will remain unchanged, but{' '}
                    <button
                      type="button"
                      onClick={() => null}
                      style={{
                        color: '#0091ae',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      some steps<ExternalLinkIcon />
                    </button>{' '}
                    may be needed to keep everything running smoothly.
                  </>
                ),
              },
              {
                id: 'sandboxes',
                content: (
                  <>
                    If you have active Sandboxes,{' '}
                    <span style={{ color: '#0091ae' }}>
                      they&apos;ll be selected too, but only eligible ones will be migrated
                    </span>—you may need to take action.
                  </>
                ),
              },
              {
                id: 'details',
                content: (
                  <>
                    For more details, check our{' '}
                    <button
                      type="button"
                      onClick={() => null}
                      style={{
                        color: '#0091ae',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      FAQ<ExternalLinkIcon />
                    </button>{' '}
                    or{' '}
                    <button
                      type="button"
                      onClick={() => null}
                      style={{
                        color: '#0091ae',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      contact support<ExternalLinkIcon />
                    </button>.
                  </>
                ),
              },
            ].map(({ id, content }) => (
              <li
                key={id}
                style={{
                  fontFamily: baseFont,
                  fontSize: '14px',
                  fontWeight: 300,
                  color: '#141414',
                  lineHeight: '1.6',
                  listStyleType: 'disc',
                }}
              >
                {content}
              </li>
            ))}
          </ul>

          {/* New location field */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: baseFont,
                fontSize: '14px',
                fontWeight: 600,
                color: '#141414',
                marginBottom: '10px',
              }}
            >
              New data hosting location{' '}
              <span style={{ color: '#cc3300', marginLeft: '2px' }}>*</span>
            </div>

            <div style={{ position: 'relative' }}>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  fontSize: '14px',
                  fontFamily: baseFont,
                  fontWeight: selectedLocation ? 400 : 300,
                  color: selectedLocation ? '#141414' : '#888',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  outline: 'none',
                  background: '#fff',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  height: '42px',
                } as React.CSSProperties}
                onFocus={e => (e.currentTarget.style.borderColor = '#0091ae')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
              >
                <option value="" disabled>Choose a location</option>
                {DATA_HOSTING_LOCATIONS
                  .filter(l => l !== currentLocation)
                  .map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#555',
                  fontSize: '13px',
                }}
              >
                ▾
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar footer */}
        <div
          style={{
            padding: '20px 32px',
            borderTop: '1px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            flexShrink: 0,
            background: '#fff',
          }}
        >
          <button
            disabled={!canSchedule}
            style={{
              padding: '9px 20px',
              fontSize: '14px',
              fontFamily: baseFont,
              fontWeight: 400,
              color: canSchedule ? '#141414' : '#aaa',
              background: '#fff',
              border: `1px solid ${canSchedule ? '#d0d0d0' : '#e0e0e0'}`,
              borderRadius: '4px',
              cursor: canSchedule ? 'pointer' : 'not-allowed',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { if (canSchedule) e.currentTarget.style.borderColor = '#141414' }}
            onMouseLeave={e => { if (canSchedule) e.currentTarget.style.borderColor = '#d0d0d0' }}
          >
            Schedule data migration
          </button>

          <button
            onClick={() => { setSidebarOpen(false); setSelectedLocation('') }}
            style={{
              padding: '9px 20px',
              fontSize: '14px',
              fontFamily: baseFont,
              fontWeight: 500,
              color: '#141414',
              background: '#fff',
              border: '1px solid #141414',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}


// ─── Feature Releases Tab ─────────────────────────────────────────────────────
const FeatureReleasesTabContent: React.FC = () => {
  const [gradualRelease, setGradualRelease] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const baseFont = BASE_FONT
  return (
    <div>
      {/* Intro */}
      <p style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', fontWeight: 300, marginBottom: '8px' }}>
        Set defaults related to Feature Releases.
      </p>

      <Divider />

      {/* ── Gradual Releases ── */}
      <FeatureSectionHeading title="Gradual Releases">
        When new features and tools are released, you can opt in to get them at the end of the gradual release. This will give more
        time to test changes and prepare users. Upcoming release dates can be found in the{' '}
        <a
          href="/main-settings/product-updates"
          style={{ color: '#0091ae', fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          Product Updates page
        </a>.
      </FeatureSectionHeading>

      {/* Gradual release checkbox */}
      <button
        type="button"
        aria-pressed={gradualRelease}
        onClick={() => setGradualRelease(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '32px',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            border: `1.5px solid ${gradualRelease ? '#141414' : '#aaa'}`,
            borderRadius: '3px',
            background: gradualRelease ? '#141414' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {gradualRelease && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <div style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 400, color: '#141414', lineHeight: '1.5' }}>
            Put this account at the end of gradual feature releases
          </div>
          <div style={{ fontFamily: baseFont, fontSize: '13px', fontWeight: 300, color: '#555', marginTop: '3px', lineHeight: '1.5' }}>
            Note: Opting into this setting will <strong style={{ fontWeight: 700 }}>only</strong> apply to all future releases. Changes to this preference apply to the entire account.
          </div>
        </div>
      </button>

      {/* ── Email Notifications ── */}
      <FeatureSectionHeading title="Email Notifications">
        Get weekly emails about the latest product updates. Changes to this preference will only apply to you.
      </FeatureSectionHeading>

      {/* Email notifications checkbox */}
      <button
        type="button"
        aria-pressed={emailNotifications}
        onClick={() => setEmailNotifications(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            border: `1.5px solid ${emailNotifications ? '#141414' : '#aaa'}`,
            borderRadius: '3px',
            background: emailNotifications ? '#141414' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {emailNotifications && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 400, color: '#141414' }}>
          Turn on email notifications
        </span>
      </button>
    </div>
  )
}



// ─── Right Panel Pages ────────────────────────────────────────────────────────
const AccountDefaultsPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(accountDefaultsTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs, onTabChange])

  const tabContentMap: Record<string, React.ReactNode> = {
    general: <GeneralTabContent />,
    'user-defaults': <UserDefaults />,
    'notification-profiles': <NotificationProfilesTabContent />,
    currency: <CurrencyTabContent />,
    'data-hosting': <DataHostingTabContent />,
    'feature-releases': <FeatureReleasesTabContent />,
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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const isLast = index === allowedTabs.length - 1;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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
      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Users & Teams (from settings: User Directory, Teams, Groups, Ranks) ────────
const usersTeamsTabs: Tab[] = [
  { id: 'user-directory', label: 'User Directory', permission: PERMISSIONS.VIEW_USERS_CONTROLHUB },
  { id: 'supervisor-teams', label: 'Supervisor Teams', permission: PERMISSIONS.VIEW_TEAMS_CONTROLHUB },
  { id: 'management-groups', label: 'Management Groups', permission: PERMISSIONS.VIEW_GROUPS_CONTROLHUB },
  { id: 'ranks-and-permissions', label: 'Ranks and Permissions', permission: PERMISSIONS.VIEW_RANKS_CONTROLHUB },
]

const UsersTeamsPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(usersTeamsTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('user-directory')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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

      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Smart CRM (from settings: Campaigns, Industries, Products, Stages, etc.) ───
const smartCrmTabs: Tab[] = [
  { id: 'stages', label: 'Stages', permission: PERMISSIONS.VIEW_CRM_STAGES },
  { id: 'product-groups', label: 'Product Groups',permission: PERMISSIONS.VIEW_CRM_INDUSTRIES },
  { id: 'products', label: 'Products', permission: PERMISSIONS.VIEW_CRM_PRODUCTS },
  { id: 'deal-templates', label: 'Deal Templates', permission: PERMISSIONS.VIEW_CRM_DEAL_TEMPLATES },
  { id: 'business-types', label: 'Business Types', permission: PERMISSIONS.VIEW_CRM_BUSINESS_TYPES },
  { id: 'campaigns', label: 'Campaigns', permission: PERMISSIONS.VIEW_CRM_CAMPAIGNS },
]

const SmartCrmPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(smartCrmTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('stages')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
    // If the URL requests an invalid / disallowed tab, correct the route to the resolved tab.
    if (next && next !== routeActiveTab) {
      onTabChange?.(next)
    }
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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

      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Communications (from settings: Manage Extensions, Backend Operations, Manual Analysis) ───
const communicationsTabs: Tab[] = [
  { id: 'manage-extensions', label: 'Manage Analysis', permission: PERMISSIONS.MANAGE_EXTENSIONS_AIML },
  { id: 'manual-analysis', label: 'Manual Analysis', permission: PERMISSIONS.TRANSCRIPTION_ANALYSIS_AIML },
]

const CommunicationsPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(communicationsTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('manage-extensions')

  useEffect(() => {
    const allowedIds = new Set(allowedTabs.map((t) => t.id))
    const requested = routeActiveTab
    const next =
      (requested && allowedIds.has(requested) ? requested : null) ??
      (allowedIds.has(activeTab) ? activeTab : null) ??
      allowedTabs[0]?.id ??
      ''
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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

      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Planner (from settings: Work Planner Statuses) ───────────────────────────
const plannerTabs: Tab[] = [
  { id: 'statuses', label: 'Statuses', permission: PERMISSIONS.VIEW_STATUSES_WORK_PLANNER },
]

const PlannerPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(plannerTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('statuses')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

  const tabContentMap: Record<string, React.ReactNode> = {
    statuses: <WorkPlannerStatuses />,
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
        Planner
      </h1>

      <div
        style={{
          display: 'flex',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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

      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Workforce (from settings: Request Categories, Sub Categories) ────────────
const workforceTabs: Tab[] = [
  { id: 'request-categories', label: 'Request Categories', permission: PERMISSIONS.VIEW_REQUEST_CATEGORIES_STAFF_MANAGEMENT },
  // { id: 'sub-categories', label: 'Sub Categories' },
]

const WorkforcePage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(workforceTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('request-categories')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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

      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Billing (from settings: Payment Methods) ───────────────────────────────────
const billingTabs: Tab[] = [
  { id: 'payment-methods', label: 'Payment Methods', permission: PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING },
]

const BillingPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(billingTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('payment-methods')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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

      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Tickets (from settings: Statuses, Modules, Categories, Sub Categories, Types) ───
const ticketsTabs: Tab[] = [
  { id: 'statuses', label: 'Statuses', permission: PERMISSIONS.VIEW_TICKETS_STATUS },
  { id: 'modules', label: 'Modules', permission: PERMISSIONS.VIEW_TICKETS_MODULES },
  { id: 'categories', label: 'Categories', permission: PERMISSIONS.VIEW_TICKETS_CATEGORIES },
  { id: 'sub-categories', label: 'Sub Categories', permission: PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES },
  { id: 'types', label: 'Types', permission: PERMISSIONS.VIEW_TICKETS_TYPES },
]

const TicketsPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(ticketsTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('statuses')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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
      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Help Center (from settings: FAQ Modules, Topics, Items, Types) ───────────
const helpCenterTabs: Tab[] = [
  { id: 'modules', label: 'FAQ Modules',permission: PERMISSIONS.MANAGE_HELP_CENTER },
  { id: 'topics', label: 'FAQ Topics',permission: PERMISSIONS.MANAGE_HELP_CENTER },
  { id: 'items', label: 'FAQ Items',permission: PERMISSIONS.MANAGE_HELP_CENTER },
  { id: 'types', label: 'FAQ Types',permission: PERMISSIONS.MANAGE_HELP_CENTER },
]

const HelpCenterPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(helpCenterTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('modules')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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
      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── AI Chat (from settings: Tools Profiles, FAQ Profiles, Tenant Profile, Global FAQs) ───
const aiChatTabs: Tab[] = [
  { id: 'tools-profiles', label: 'Tools Profiles',permission: PERMISSIONS.VIEW_AI_CHAT },
  { id: 'faq-profiles', label: 'FAQ Profiles',permission: PERMISSIONS.VIEW_AI_CHAT },
  { id: 'tenant-profile', label: 'Tenant Profile',permission: PERMISSIONS.VIEW_AI_CHAT },
  { id: 'global-faqs', label: 'Global FAQs',permission: PERMISSIONS.VIEW_AI_CHAT },
]

const AIChatPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(aiChatTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('tools-profiles')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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
      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Virtual Agents (from settings: Outbound AI Agent – Trunk Profiles, Bot Profiles) ───
const virtualAgentsTabs: Tab[] = [
  { id: 'trunk-profiles', label: 'Outbound Trunks',permission: PERMISSIONS.LIST_TRUNKS_AIML },
  { id: 'bot-profiles', label: 'Outbound Bots',permission: PERMISSIONS.VIEW_OUTBOUND_CALLS_AIML },

  { id: 'inbound-trunks', label: 'Inbound Trunks',permission: PERMISSIONS.VIEW_INBOUND_CALLS_AIML },
  { id: 'inbound-bots', label: 'Inbound Bots',permission: PERMISSIONS.VIEW_INBOUND_CALLS_AIML },
  { id: 'inbound-faqs', label: 'Inbound FAQs' , permission: PERMISSIONS.MANAGE_AI_BOT_FAQS},
]

const VirtualAgentsPage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(virtualAgentsTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('trunk-profiles')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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

      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
    </div>
  )
}

// ─── Pulse (Host Groups, Alerts) ───
const pulseTabs: Tab[] = [
  { id: 'hosts', label: 'Hosts',permission: PERMISSIONS.VIEW_HOSTS_NETOPS },
  { id: 'host-groups', label: 'Host Groups',permission: PERMISSIONS.VIEW_HOST_GROUPS_NETOPS },
  { id: 'events', label: 'Events',permission: PERMISSIONS.VIEW_EVENTS_NETOPS },
  { id: 'assign-devices', label: 'Assign Devices',permission: PERMISSIONS.VIEW_GSM_ASSIGNMENT },
  { id: 'sync-gsm', label: 'Sync GSM',permission: PERMISSIONS.VIEW_GSM_SYNC },
  { id: 'company-profiling', label: 'Company Profiling',permission: PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING },
]

const PulsePage: React.FC<ControlledTabsProps> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(pulseTabs, userPermissions), [userPermissions])
  const [activeTab, setActiveTab] = useState('host-groups')

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
  }, [routeActiveTab, activeTab, allowedTabs])

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
        {allowedTabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const isLast = index === allowedTabs.length - 1
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onTabChange?.(tab.id)
              }}
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

      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          tabContentMap[activeTab]
        )}
      </div>
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
      { id: "account-defaults-general", label: "General settingsss", description: "Get notified about changes to account defaults and general settings.", channels: { popup: false, browser: false, bell: true, email: true } },
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
    return topic.channels[channel];
  }
  const vals = topic.subtopics.map((s) => s.channels[channel]);
  if (vals.every((v) => v === null)) return null;
  const filtered = vals.filter((v): v is boolean => v !== null);
  if (filtered.every(Boolean)) return true;
  if (filtered.every((v) => !v)) return false;
  return "indeterminate";
};

const turnOffChannels = (channels: Record<ChannelKey, boolean | null>): Record<ChannelKey, boolean | null> => ({
  popup: channels.popup === null ? null : false,
  browser: channels.browser === null ? null : false,
  bell: channels.bell === null ? null : false,
  email: channels.email === null ? null : false,
})

function turnOffTopic(t: NotificationTopic): NotificationTopic {
  const next: NotificationTopic = { ...t, channels: turnOffChannels(t.channels) }
  if (!t.subtopics) return next

  const nextSubs: NonNullable<NotificationTopic['subtopics']> = []
  for (const s of t.subtopics) {
    nextSubs.push({ ...s, channels: turnOffChannels(s.channels) })
  }
  next.subtopics = nextSubs
  return next
}

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
    setTopics((prev) => prev.map(turnOffTopic));
  };

  const toggleTopicChannel = (topicId: string, channel: ChannelKey) => {
    setTopics((prev) => {
      const next: NotificationTopic[] = [];
      for (const t of prev) {
        if (t.id !== topicId || t.channels[channel] === null) {
          next.push(t);
          continue;
        }

        const newVal = getParentState(t, channel) !== true;
        const nextTopic: NotificationTopic = { ...t, channels: { ...t.channels, [channel]: newVal } };

        if (t.subtopics) {
          const nextSubs: NonNullable<NotificationTopic["subtopics"]> = [];
          for (const s of t.subtopics) {
            const cur = s.channels[channel];
            if (cur === null) {
              nextSubs.push(s);
            } else {
              nextSubs.push({ ...s, channels: { ...s.channels, [channel]: newVal } });
            }
          }
          nextTopic.subtopics = nextSubs;
        }

        next.push(nextTopic);
      }
      return next;
    });
  };

  const toggleSubtopicChannel = (topicId: string, subtopicId: string, channel: ChannelKey) => {
    setTopics((prev) => {
      const next: NotificationTopic[] = [];
      for (const t of prev) {
        if (t.id !== topicId || !t.subtopics) {
          next.push(t);
          continue;
        }

        const nextSubs: NonNullable<NotificationTopic["subtopics"]> = [];
        for (const s of t.subtopics) {
          if (s.id !== subtopicId || s.channels[channel] === null) {
            nextSubs.push(s);
            continue;
          }
          nextSubs.push({ ...s, channels: { ...s.channels, [channel]: !s.channels[channel] } });
        }

        const allTrue = nextSubs.every((s) => s.channels[channel] !== false);
        const parentVal = t.channels[channel] === null ? null : allTrue;
        next.push({ ...t, channels: { ...t.channels, [channel]: parentVal }, subtopics: nextSubs });
      }
      return next;
    });
  };

  const handleTopicCheckboxChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const topicId = e.currentTarget.dataset.topicId
    const channel = e.currentTarget.dataset.channel as ChannelKey | undefined
    if (!topicId || !channel) return
    toggleTopicChannel(topicId, channel)
  }

  const handleSubtopicCheckboxChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const topicId = e.currentTarget.dataset.topicId
    const subtopicId = e.currentTarget.dataset.subtopicId
    const channel = e.currentTarget.dataset.channel as ChannelKey | undefined
    if (!topicId || !subtopicId || !channel) return
    toggleSubtopicChannel(topicId, subtopicId, channel)
  }

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
    onChange: React.ChangeEventHandler<HTMLInputElement>,
    id: string,
    inputProps?: Record<string, string>
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
          {...(inputProps ?? {})}
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
              <button
                type="button"
                onClick={() => null}
                style={{ color: "#006162", textDecoration: "underline", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
              >
                workflows.
              </button>
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
      <button
        type="button"
        aria-pressed={channelEnabled[ch.key]}
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
          padding: 0,
          background: "transparent",
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
      </button>

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
                    userSelect: "none",
                  }}
                >
                  {/* Left: chevron + label */}
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={toggleThisTopic}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flex: 1,
                      minWidth: 0,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: baseFont,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                      <ChevronIcon expanded={isExpanded} />
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 500, color: "#141414" }}>{topic.label}</span>
                  </button>

                  {/* Middle: POP-UP SOUND label shown only when expanded */}
                  <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingRight: "16px" }}>
                    {isExpanded && hasSubtopics && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "0.8px", fontFamily: baseFont, textTransform: "uppercase" }}>
                        POP-UP SOUND
                      </span>
                    )}
                  </div>

                  {/* Right: channel checkboxes */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {tableChannels.map((ch) => {
                      const state = getParentState(topic, ch.key);
                      return renderTopicCheckbox(state, handleTopicCheckboxChange, `${topic.id}-${ch.key}`, {
                        'data-topic-id': topic.id,
                        'data-channel': ch.key,
                      });
                    })}
                  </div>
                </div>

                {/* Subtopics — inside the same card, separated by dividers */}
                {isExpanded && hasSubtopics && (
                  <div>
                    {topic.subtopics!.map((sub) => (
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
                            renderTopicCheckbox(sub.channels[ch.key], handleSubtopicCheckboxChange, `${sub.id}-${ch.key}`, {
                              'data-topic-id': topic.id,
                              'data-subtopic-id': sub.id,
                              'data-channel': ch.key,
                            })
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
const GeneralSettings: React.FC<{ activeTab?: 'profile' | 'tasks'; onTabChange?: (tabId: 'profile' | 'tasks') => void }> = ({
  activeTab: routeActiveTab,
  onTabChange,
}) => {

  const { data: session } = useSession();

  const [activeGeneralTab, setActiveGeneralTab] = useState<"profile" | "tasks">("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (routeActiveTab && routeActiveTab !== activeGeneralTab) setActiveGeneralTab(routeActiveTab)
  }, [routeActiveTab, activeGeneralTab])

  // Profile state
  const [userName, setUserName] = useState("");
  useEffect(() => {
    if (session?.user?.name) setUserName(session?.user?.name);
   
  }, [session?.user?.name]);


  const [language, setLanguage] = useState("");
  const [dateFormat, setDateFormat] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
    `${userName.charAt(0)}`.toUpperCase();

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
        <button
          type="button"
          aria-label="Change profile photo"
          style={{ ...s.profileImageBox, border: s.profileImageBox.border as string, padding: 0 }}
          onClick={() => fileInputRef.current?.click()}
        >
          {profileImage
            ? <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span>{getInitials()}</span>}
        </button>
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
        <label htmlFor="general-profile-name" style={s.label}>Name</label>
        <input
          id="general-profile-name"
          style={s.input}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#006162")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#d0d0d0")}
        />
      </div>

      

      {/* Language */}
      <div style={s.fieldGroup}>
        <label htmlFor="general-language" style={s.label}>
          Language <span style={s.helpIcon} title="Applies globally across all accounts">?</span>
        </label>
        <select id="general-language" style={s.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
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
        <label htmlFor="general-date-format" style={s.label}>
          Date, time, and number format <span style={s.helpIcon} title="Sets date/time/number format based on locale">?</span>
        </label>
        <div style={{ fontSize: "13px", color: "#555", fontWeight: 300, marginBottom: "8px" }}>
          Format: 2 March 2026, 02/03/2026, 19:41 GMT, and 1,234.56
        </div>
        <select id="general-date-format" style={s.select} value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
          <option>United Kingdom</option>
          <option>United States</option>
          <option>European Union</option>
          <option>Pakistan</option>
          <option>Australia</option>
        </select>
      </div>

      {/* Phone number */}
      <div style={s.fieldGroup}>
        <label htmlFor="general-phone-number" style={s.label}>Phone number</label>
        <div style={s.helpText}>
          We may use this phone number to contact you about security events. Please refer to our privacy policy for{" "}
          <button type="button" onClick={() => null} style={{ ...s.link, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
            more information ↗
          </button>
        </div>
        <div style={{ display: "flex", gap: "0px", marginTop: "10px" }}>
          <select
            aria-label="Phone country"
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
            id="general-phone-number"
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
        <div style={s.label}>General working hours</div>
        <button
          type="button"
          onClick={() => null}
          style={{ ...s.link, fontSize: "14px", fontWeight: 300, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
        >
          Edit working hours ↗
        </button>
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
          <label htmlFor="general-due-date" style={s.label}>Due date</label>
          <select
            id="general-due-date"
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
          <label htmlFor="general-due-time" style={s.label}>Due time</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "14px", pointerEvents: "none", zIndex: 1 }}><Clock size={14} /></span>
            <select
              id="general-due-time"
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
        <label htmlFor="general-reminder" style={s.label}>Reminder</label>
        <select id="general-reminder" style={s.select} value={reminder} onChange={(e) => setReminder(e.target.value)}>
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
              onClick={() => {
                setActiveGeneralTab(tab.key)
                onTabChange?.(tab.key)
              }}
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

export type SectionRenderer = (opts: { subTab?: string; onSubTabChange?: (tabId: string) => void }) => React.ReactNode

export const sectionPageMap: Record<string, SectionRenderer> = {
  'general-prefs': ({ subTab, onSubTabChange }) => (
    <GeneralSettings
      activeTab={subTab === 'profile' || subTab === 'tasks' ? subTab : undefined}
      onTabChange={tabId => onSubTabChange?.(tabId)}
    />
  ),
  notifications: () => <NotificationsSettingsNew />,
  'account-defaults': ({ subTab, onSubTabChange }) => <AccountDefaultsPage activeTab={subTab} onTabChange={onSubTabChange} />,
  'account-cleanup': () => <GenericPage title="Account Cleanup" />,
  'audit-log': () => <GenericPage title="Audit Log" />,
  'users-teams': ({ subTab, onSubTabChange }) => <UsersTeamsPage activeTab={subTab} onTabChange={onSubTabChange} />,
  'smart-crm': ({ subTab, onSubTabChange }) => <SmartCrmPage activeTab={subTab} onTabChange={onSubTabChange} />,
  communications: ({ subTab, onSubTabChange }) => <CommunicationsPage activeTab={subTab} onTabChange={onSubTabChange} />,
  planner: () => <PlannerPage />,
  workforce: ({ subTab, onSubTabChange }) => <WorkforcePage activeTab={subTab} onTabChange={onSubTabChange} />,
  billing: ({ subTab, onSubTabChange }) => <BillingPage activeTab={subTab} onTabChange={onSubTabChange} />,
  tickets: ({ subTab, onSubTabChange }) => <TicketsPage activeTab={subTab} onTabChange={onSubTabChange} />,
  'help-center': ({ subTab, onSubTabChange }) => <HelpCenterPage activeTab={subTab} onTabChange={onSubTabChange} />,
  'ai-chat': ({ subTab, onSubTabChange }) => <AIChatPage activeTab={subTab} onTabChange={onSubTabChange} />,
  'virtual-agents': ({ subTab, onSubTabChange }) => <VirtualAgentsPage activeTab={subTab} onTabChange={onSubTabChange} />,
  pulse: ({ subTab, onSubTabChange }) => <PulsePage activeTab={subTab} onTabChange={onSubTabChange} />,
  compliance: () => <GenericPage title="Compliance" />,
  'product-updates': () => <GenericPage title="Product Updates" />,
  integrations: () => <GenericPage title="Integrations" />,
  marketplace: () => <GenericPage title="Marketplace Downloads" />,
  'tracking-analytics': () => <GenericPage title="Tracking & Analytics" />,
  'privacy-consent': () => <GenericPage title="Privacy & Consent" />,
  sandboxes: () => <GenericPage title="Sandboxes" />,
  security: () => <GenericPage title="Security" />,
  approvals: () => <GenericPage title="Approvals" />,
  ai: () => <GenericPage title="AI" />,
  'payments-account': () => <GenericPage title="Payments Account" />,
}




// ─── Main Settings Index: redirect to default section ────────────────────────
const MainSettingsIndex = () => {
  const router = useRouter()
  useEffect(() => {
    router.replace('/main-settings/general-prefs')
  }, [router])
  return null
}

MainSettingsIndex.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default MainSettingsIndex
