import { HEADER_CONSTANTS } from '@constants/headerConstants'
import WorkPlannerStatuses from '@pages/planner/statuses'
import React from 'react'
import { PlannerGeneralSettings } from '../PlannerGeneralSettings'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const plannerTabs: Tab[] = [
  { id: 'general', label: 'General' },
  { id: 'statuses', label: 'Statuses', permission: PERMISSIONS.VIEW_STATUSES_WORK_PLANNER },
]

function PlannerTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  switch (activeTab) {
    case 'general':
      return <PlannerGeneralSettings />
    case 'statuses':
      return <WorkPlannerStatuses />
    default:
      return null
  }
}

export const PlannerPage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(routeActiveTab, onTabChange, plannerTabs, 'general')

  return (
    <SettingsSectionTabShell title="Planner" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <PlannerTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
