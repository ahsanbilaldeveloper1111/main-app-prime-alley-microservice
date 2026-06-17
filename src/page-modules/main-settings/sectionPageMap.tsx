import React from 'react'
import type { SectionRenderer } from '@components/main-settings/types'
import dynamic from 'next/dynamic'
import { SettingsSectionFallback } from '@components/main-settings/SettingsSectionFallback'

const GeneralSettings = dynamic(
  () => import('@components/main-settings/GeneralSettingsPanel').then((m) => m.GeneralSettings),
  { loading: () => <SettingsSectionFallback /> }
)

const NotificationsSettingsNew = dynamic(
  () => import('@components/main-settings/NotificationsSettingsPanel').then((m) => m.NotificationsSettingsNew),
  { loading: () => <SettingsSectionFallback /> }
)

const AccountDefaultsPage = dynamic(
  () => import('@components/main-settings/AccountDefaultsPage').then((m) => m.AccountDefaultsPage),
  { loading: () => <SettingsSectionFallback /> }
)

const UsersTeamsPage = dynamic(
  () =>
    import('@components/main-settings/settings-section-pages/UsersTeamsPage').then((m) => m.UsersTeamsPage),
  { loading: () => <SettingsSectionFallback /> }
)

const SmartCrmPage = dynamic(
  () => import('@components/main-settings/settings-section-pages/SmartCrmPage').then((m) => m.SmartCrmPage),
  { loading: () => <SettingsSectionFallback /> }
)

const CommunicationsPage = dynamic(
  () =>
    import('@components/main-settings/settings-section-pages/CommunicationsPage').then((m) => m.CommunicationsPage),
  { loading: () => <SettingsSectionFallback /> }
)

const PlannerPage = dynamic(
  () => import('@components/main-settings/settings-section-pages/PlannerPage').then((m) => m.PlannerPage),
  { loading: () => <SettingsSectionFallback /> }
)

const WorkforcePage = dynamic(
  () => import('@components/main-settings/settings-section-pages/WorkforcePage').then((m) => m.WorkforcePage),
  { loading: () => <SettingsSectionFallback /> }
)

const BillingPage = dynamic(
  () => import('@components/main-settings/settings-section-pages/BillingPage').then((m) => m.BillingPage),
  { loading: () => <SettingsSectionFallback /> }
)

const TicketsPage = dynamic(
  () => import('@components/main-settings/settings-section-pages/TicketsPage').then((m) => m.TicketsPage),
  { loading: () => <SettingsSectionFallback /> }
)

const HelpCenterPage = dynamic(
  () => import('@components/main-settings/settings-section-pages/HelpCenterPage').then((m) => m.HelpCenterPage),
  { loading: () => <SettingsSectionFallback /> }
)

const AIChatPage = dynamic(
  () => import('@components/main-settings/settings-section-pages/AIChatPage').then((m) => m.AIChatPage),
  { loading: () => <SettingsSectionFallback /> }
)

const PulsePage = dynamic(
  () => import('@components/main-settings/settings-section-pages/PulsePage').then((m) => m.PulsePage),
  { loading: () => <SettingsSectionFallback /> }
)

const PoliciesAttendancePage = dynamic(
  () =>
    import('@components/main-settings/settings-section-pages/PoliciesAttendancePage').then(
      (m) => m.PoliciesAttendancePage,
    ),
  { loading: () => <SettingsSectionFallback /> }
)

const GenericPage = dynamic(
  () => import('@components/main-settings/settings-section-pages/GenericPage').then((m) => m.GenericPage),
  { loading: () => <SettingsSectionFallback /> }
)

export type { SectionRenderer } from '@components/main-settings/types'

export const sectionPageMap: Record<string, SectionRenderer> = {
  'general-prefs': ({ subTab, onSubTabChange }) => (
    <GeneralSettings
      activeTab={subTab === 'profile' || subTab === 'tasks' ? subTab : undefined}
      onTabChange={(tabId) => onSubTabChange?.(tabId)}
    />
  ),
  notifications: () => <NotificationsSettingsNew />,
  'account-defaults': ({ subTab, onSubTabChange }) => (
    <AccountDefaultsPage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  'account-cleanup': () => <GenericPage title="Account Cleanup" />,
  'audit-log': () => <GenericPage title="Audit Log" />,
  'users-teams': ({ subTab, onSubTabChange }) => (
    <UsersTeamsPage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  'smart-crm': ({ subTab, onSubTabChange }) => (
    <SmartCrmPage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  communications: ({ subTab, onSubTabChange }) => (
    <CommunicationsPage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  planner: ({ subTab, onSubTabChange }) => (
    <PlannerPage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  workforce: ({ subTab, onSubTabChange }) => (
    <WorkforcePage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  'policies-attendance': ({ subTab, onSubTabChange }) => (
    <PoliciesAttendancePage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  billing: ({ subTab, onSubTabChange }) => (
    <BillingPage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  tickets: ({ subTab, onSubTabChange }) => (
    <TicketsPage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  'help-center': ({ subTab, onSubTabChange }) => (
    <HelpCenterPage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  'ai-chat': ({ subTab, onSubTabChange }) => (
    <AIChatPage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
  pulse: ({ subTab, onSubTabChange }) => (
    <PulsePage activeTab={subTab} onTabChange={onSubTabChange} />
  ),
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
