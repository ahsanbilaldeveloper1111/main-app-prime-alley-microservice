import { AI_CHAT_SETTINGS_TAB_PERMISSIONS } from '@config/aiChatPermissions'
import ToolProfiles from '@pages/chat/tools-profiles'
import FaqProfiles from '@pages/chat/faq-profiles'
import AIChatFAQsTenant from '@pages/chat/ai-faqs/tenant'
import AIChatFAQsGlobal from '@pages/chat/ai-faqs/global'
import React from 'react'
import { AIChatbotSettings } from '../ai-chatbot-settings/AIChatbotSettings'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const aiChatTabs: Tab[] = [
  {
    id: 'tools-profiles',
    label: 'Tools Profiles',
    permission: AI_CHAT_SETTINGS_TAB_PERMISSIONS.toolsProfiles,
  },
  {
    id: 'faq-profiles',
    label: 'FAQ Profiles',
    permission: AI_CHAT_SETTINGS_TAB_PERMISSIONS.faqProfiles,
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
  {
    id: 'ai-chatbot-settings',
    label: 'AI Chatbot Settings',
    permission: AI_CHAT_SETTINGS_TAB_PERMISSIONS.chatbotSettings,
  },
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
    case 'ai-chatbot-settings':
      return <AIChatbotSettings />
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
