import { HEADER_CONSTANTS } from '@constants/headerConstants'
import ToolProfiles from '@pages/chat/tools-profiles'
import FaqProfiles from '@pages/chat/faq-profiles'
import AIChatFAQsTenant from '@pages/chat/ai-faqs/tenant'
import AIChatFAQsGlobal from '@pages/chat/ai-faqs/global'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const aiChatTabs: Tab[] = [
  { id: 'tools-profiles', label: 'Tools Profiles', permission: PERMISSIONS.VIEW_AI_CHAT },
  { id: 'faq-profiles', label: 'FAQ Profiles', permission: PERMISSIONS.VIEW_AI_CHAT },
  { id: 'tenant-profile', label: 'Tenant Profile', permission: PERMISSIONS.VIEW_AI_CHAT },
  { id: 'global-faqs', label: 'Global FAQs', permission: PERMISSIONS.VIEW_AI_CHAT },
]

function AIChatTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  switch (activeTab) {
    case 'tools-profiles':
      return <ToolProfiles />
    case 'faq-profiles':
      return <FaqProfiles />
    case 'tenant-profile':
      return <AIChatFAQsTenant />
    case 'global-faqs':
      return <AIChatFAQsGlobal />
    default:
      return null
  }
}

export const AIChatPage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(
    routeActiveTab,
    onTabChange,
    aiChatTabs,
    'tools-profiles'
  )

  return (
    <SettingsSectionTabShell title="AI Chat" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <AIChatTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
