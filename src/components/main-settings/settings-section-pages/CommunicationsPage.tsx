import { HEADER_CONSTANTS } from '@constants/headerConstants'
import ManageExtensions from '@pages/ai-ml/manage-extensions'
import ManualAnalysis from '@pages/ai-ml/analysis'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const communicationsTabs: Tab[] = [
  { id: 'manage-extensions', label: 'Manage Analysis', permission: PERMISSIONS.MANAGE_EXTENSIONS_AIML },
  { id: 'manual-analysis', label: 'Manual Analysis', permission: PERMISSIONS.TRANSCRIPTION_ANALYSIS_AIML },
]

function CommunicationsTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  switch (activeTab) {
    case 'manage-extensions':
      return <ManageExtensions />
    case 'manual-analysis':
      return <ManualAnalysis />
    default:
      return null
  }
}

export const CommunicationsPage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(
    routeActiveTab,
    onTabChange,
    communicationsTabs,
    'manage-extensions'
  )

  return (
    <SettingsSectionTabShell title="Communications" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <CommunicationsTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
