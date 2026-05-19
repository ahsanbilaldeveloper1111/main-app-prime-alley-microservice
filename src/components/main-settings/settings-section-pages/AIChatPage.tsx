import { AI_CHAT_SETTINGS_TAB_PERMISSIONS } from '@config/aiChatPermissions'
import AIChatFAQsTenant from '@pages/chat/ai-faqs/tenant'
import AIChatFAQsGlobal from '@pages/chat/ai-faqs/global'
import React from 'react'
import { AIChatbotSettings } from '../ai-chatbot-settings/AIChatbotSettings'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const aiChatTabs: Tab[] = [
  {
    id: 'ai-chatbot-settings',
    label: 'AI Chatbot Settings',
    permission: AI_CHAT_SETTINGS_TAB_PERMISSIONS.chatbotSettings,
  },
  {
    id: 'tenant-profile',
    label: 'Tenant Profile',
    permission: AI_CHAT_SETTINGS_TAB_PERMISSIONS.tenantProfile,
  },
  {
    id: 'global-faqs',
    label: 'Global FAQs',
    permission: AI_CHAT_SETTINGS_TAB_PERMISSIONS.globalFaqs,
  },
]

function AIChatTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  switch (activeTab) {
    case 'ai-chatbot-settings':
      return <AIChatbotSettings />
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
    'ai-chatbot-settings'
  )

  return (
    <SettingsSectionTabShell
      title="AI Chat"
      allowedTabs={allowedTabs}
      activeTab={activeTab}
      onSelectTab={selectTab}
      dense={activeTab === 'ai-chatbot-settings'}
    >
      <AIChatTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
