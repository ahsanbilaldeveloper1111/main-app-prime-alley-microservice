import { HEADER_CONSTANTS } from '@constants/headerConstants'
import FaqModulesPanel from '@page-modules/faqs/modules/FaqModulesPanel'
import FAQTopicsPanel from '@page-modules/faqs/topics/FAQTopicsPanel'
import FaqItemsPanel from '@page-modules/faqs/items/FaqItemsPanel'
import FAQTypesPanel from '@page-modules/faqs/types/FAQTypesPanel'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const helpCenterTabs: Tab[] = [
  { id: 'modules', label: 'FAQ Modules', permission: PERMISSIONS.MANAGE_HELP_CENTER },
  { id: 'topics', label: 'FAQ Topics', permission: PERMISSIONS.MANAGE_HELP_CENTER },
  { id: 'items', label: 'FAQ Items', permission: PERMISSIONS.MANAGE_HELP_CENTER },
  { id: 'types', label: 'FAQ Types', permission: PERMISSIONS.MANAGE_HELP_CENTER },
]

function HelpCenterTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  switch (activeTab) {
    case 'modules':
      return <FaqModulesPanel />
    case 'topics':
      return <FAQTopicsPanel />
    case 'items':
      return <FaqItemsPanel />
    case 'types':
      return <FAQTypesPanel />
    default:
      return null
  }
}

export const HelpCenterPage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(routeActiveTab, onTabChange, helpCenterTabs, 'modules')

  return (
    <SettingsSectionTabShell title="Help Center" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <HelpCenterTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
