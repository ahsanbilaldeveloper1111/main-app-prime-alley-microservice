import { HEADER_CONSTANTS } from '@constants/headerConstants'
import TicketStatuses from '@pages/tickets/statuses'
import TicketModules from '@pages/tickets/modules'
import ModuleCategories from '@pages/tickets/modules/categories'
import ModuleSubCategories from '@pages/tickets/modules/sub-categories'
import TicketTypes from '@pages/tickets/types'
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
      return <TicketStatuses />
    case 'modules':
      return <TicketModules />
    case 'categories':
      return <ModuleCategories />
    case 'sub-categories':
      return <ModuleSubCategories />
    case 'types':
      return <TicketTypes />
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
