import { HEADER_CONSTANTS } from '@constants/headerConstants'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { PoliciesAttendanceTabPanel } from './PoliciesAttendanceTabPanel'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const policiesAttendanceTabs: Tab[] = [
  {
    id: 'company-config',
    label: 'Company Config',
    permission: PERMISSIONS.STAFF_MANAGEMENT_SERVICES,
  },
  {
    id: 'shift-management',
    label: 'Shift Management',
    permission: PERMISSIONS.STAFF_MANAGEMENT_SERVICES,
  },
  {
    id: 'holiday-management',
    label: 'Holiday Management',
    permission: PERMISSIONS.STAFF_MANAGEMENT_SERVICES,
  },
]

export const PoliciesAttendancePage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(
    routeActiveTab,
    onTabChange,
    policiesAttendanceTabs,
    'company-config',
    { syncMode: 'smartCrm' },
  )

  return (
    <SettingsSectionTabShell
      title="Policies & Attendance"
      allowedTabs={allowedTabs}
      activeTab={activeTab}
      onSelectTab={selectTab}
      dense
    >
      <PoliciesAttendanceTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
