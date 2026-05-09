import { HEADER_CONSTANTS } from '@constants/headerConstants'
import RequestCategories from '@pages/workforce/request-categories'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const workforceTabs: Tab[] = [
  { id: 'request-categories', label: 'Request Categories', permission: PERMISSIONS.VIEW_REQUEST_CATEGORIES_STAFF_MANAGEMENT },
]

function WorkforceTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  if (activeTab === 'request-categories') {
    return <RequestCategories />
  }
  return null
}
export const WorkforcePage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(
    routeActiveTab,
    onTabChange,
    workforceTabs,
    'request-categories'
  )

  return (
    <SettingsSectionTabShell title="Workforce" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <WorkforceTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
