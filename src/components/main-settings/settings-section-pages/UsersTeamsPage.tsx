import { HEADER_CONSTANTS } from '@constants/headerConstants'
import UsersDirectory from '@page-modules/controlhub/users/UsersDirectory'
import TeamsPanel from '@page-modules/controlhub/teams/TeamsPanel'
import GroupsPanel from '@page-modules/controlhub/groups/GroupsPanel'
import RanksPanel from '@page-modules/controlhub/ranks/RanksPanel'
import React from 'react'
import type { ControlledTabsProps, Tab } from '../types'
import { SettingsSectionTabShell } from './SettingsSectionTabShell'
import { useSettingsSectionTabs } from './useSettingsSectionTabs'

const { PERMISSIONS } = HEADER_CONSTANTS

const usersTeamsTabs: Tab[] = [
  { id: 'user-directory', label: 'User Directory', permission: PERMISSIONS.VIEW_USERS_CONTROLHUB },
  { id: 'supervisor-teams', label: 'Supervisor Teams', permission: PERMISSIONS.VIEW_TEAMS_CONTROLHUB },
  { id: 'management-groups', label: 'Management Groups', permission: PERMISSIONS.VIEW_GROUPS_CONTROLHUB },
  { id: 'ranks-and-permissions', label: 'Ranks and Permissions', permission: PERMISSIONS.VIEW_RANKS_CONTROLHUB },
]

function UsersTeamsTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  // User Directory: debounced search in `UsersList`. Teams / Groups / Ranks: `useDebouncedValue` on main table search (400ms).
  switch (activeTab) {
    case 'user-directory':
      return <UsersDirectory />
    case 'supervisor-teams':
      return <TeamsPanel />
    case 'management-groups':
      return <GroupsPanel />
    case 'ranks-and-permissions':
      return <RanksPanel />
    default:
      return null
  }
}

export const UsersTeamsPage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, selectTab } = useSettingsSectionTabs(
    routeActiveTab,
    onTabChange,
    usersTeamsTabs,
    'user-directory'
  )

  return (
    <SettingsSectionTabShell title="Users & Teams" allowedTabs={allowedTabs} activeTab={activeTab} onSelectTab={selectTab}>
      <UsersTeamsTabPanel activeTab={activeTab} />
    </SettingsSectionTabShell>
  )
}
