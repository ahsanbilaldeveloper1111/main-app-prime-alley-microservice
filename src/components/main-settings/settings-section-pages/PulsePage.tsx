import { HEADER_CONSTANTS } from '@constants/headerConstants'
import GsmAssign from '@pages/gsm/assign'
import GsmSync from '@pages/gsm/sync'
import CompanyPO from '@pages/gsm/company/po'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const pulseTabs: Tab[] = [
  { id: 'assign-devices', label: 'Assign Devices', permission: PERMISSIONS.VIEW_GSM_ASSIGNMENT },
  { id: 'sync-gsm', label: 'Sync GSM', permission: PERMISSIONS.VIEW_GSM_SYNC },
  { id: 'company-profiling', label: 'Company Profiling', permission: PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING },
]

function PulseTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  switch (activeTab) {
    case 'assign-devices':
      return <GsmAssign />
    case 'sync-gsm':
      return <GsmSync />
    case 'company-profiling':
      return <CompanyPO />
    default:
      return null
  }
}

export const PulsePage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(
    routeActiveTab,
    onTabChange,
    pulseTabs,
    'assign-devices'
  )

  return (
    <SettingsSectionTabShell title="Pulse" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <PulseTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
