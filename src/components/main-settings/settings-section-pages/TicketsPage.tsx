import { HEADER_CONSTANTS } from '@constants/headerConstants'
import ModuleCategoriesPanel from '@page-modules/tickets/modules/categories/ModuleCategoriesPanel'
import ModuleSubCategoriesPanel from '@page-modules/tickets/modules/sub-categories/ModuleSubCategoriesPanel'
import TicketModulesPanel from '@page-modules/tickets/modules/TicketModulesPanel'
import TicketStatusesPanel from '@page-modules/tickets/statuses/TicketStatusesPanel'
import TicketTypesPanel from '@page-modules/tickets/types/TicketTypesPanel'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const ticketsTabs: Tab[] = [
  { id: 'statuses', label: 'Statuses', permission: PERMISSIONS.VIEW_TICKETS_STATUS },
  { id: 'modules', label: 'Modules', permission: PERMISSIONS.VIEW_TICKETS_MODULES },
  { id: 'categories', label: 'Categories', permission: PERMISSIONS.VIEW_TICKETS_CATEGORIES },
  { id: 'sub-categories', label: 'Sub Categories', permission: PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES },
  { id: 'types', label: 'Types', permission: PERMISSIONS.VIEW_TICKETS_TYPES },
]

function TicketsTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  switch (activeTab) {
    case 'statuses':
      return <TicketStatusesPanel />
    case 'modules':
      return <TicketModulesPanel />
    case 'categories':
      return <ModuleCategoriesPanel />
    case 'sub-categories':
      return <ModuleSubCategoriesPanel />
    case 'types':
      return <TicketTypesPanel />
    default:
      return null
  }
}

export const TicketsPage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(routeActiveTab, onTabChange, ticketsTabs, 'statuses')

  return (
    <SettingsSectionTabShell title="Tickets" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <TicketsTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
