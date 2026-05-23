import { HEADER_CONSTANTS } from '@constants/headerConstants'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { SmartCrmTabPanel } from './SmartCrmTabPanel'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const smartCrmTabs: Tab[] = [
  { id: 'stages', label: 'Stages', permission: PERMISSIONS.VIEW_CRM_STAGES },
  { id: 'industries', label: 'Product Groups', permission: PERMISSIONS.VIEW_CRM_INDUSTRIES },
  { id: 'products', label: 'Products', permission: PERMISSIONS.VIEW_CRM_PRODUCTS },
  { id: 'deal-templates', label: 'Deal Templates', permission: PERMISSIONS.VIEW_CRM_DEAL_TEMPLATES },
  { id: 'business-types', label: 'Business Types', permission: PERMISSIONS.VIEW_CRM_BUSINESS_TYPES },
  { id: 'campaigns', label: 'Campaigns', permission: PERMISSIONS.VIEW_CRM_CAMPAIGNS },
]

export const SmartCrmPage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(
    routeActiveTab,
    onTabChange,
    smartCrmTabs,
    'stages',
    { syncMode: 'smartCrm' },
  )

  return (
    <SettingsSectionTabShell title="Smart CRM" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <SmartCrmTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
