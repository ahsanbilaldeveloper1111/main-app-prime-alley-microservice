import React, { useCallback } from 'react'
import CurrencyTabPanel from './CurrencyTabPanel'
import GeneralTabPanel from './GeneralTabPanel'
import UserDefaultsTabPanel from './UserDefaultsTabPanel'
import { AccountDefaultsTabBar } from './AccountDefaultsTabBar'
import {
  DataHostingTabContent,
  FeatureReleasesTabContent,
  NotificationProfilesTabContent,
} from './AccountDefaultsTabPanels'
import {
  accountDefaultsPageShellStyle,
  accountDefaultsPageTitleStyle,
} from './accountDefaultsPageStyles'
import type { ControlledTabsProps } from './types'
import { useAccountDefaultsTabs } from './useAccountDefaultsTabs'

function renderAccountDefaultsTabContent(tabId: string): React.ReactNode {
  switch (tabId) {
    case 'general':
      return <GeneralTabPanel />
    case 'user-defaults':
      return <UserDefaultsTabPanel />
    case 'notification-profiles':
      return <NotificationProfilesTabContent />
    case 'currency':
      return <CurrencyTabPanel />
    case 'data-hosting':
      return <DataHostingTabContent />
    case 'feature-releases':
      return <FeatureReleasesTabContent />
    default:
      return null
  }
}

export const AccountDefaultsPage: React.FC<ControlledTabsProps> = ({
  activeTab: routeActiveTab,
  onTabChange,
}: Readonly<ControlledTabsProps>) => {
  const { allowedTabs, activeTab, setActiveTab } = useAccountDefaultsTabs(routeActiveTab)

  const handleSelectTab = useCallback(
    (tabId: string) => {
      setActiveTab(tabId)
      onTabChange?.(tabId)
    },
    [onTabChange, setActiveTab]
  )

  return (
    <div style={accountDefaultsPageShellStyle}>
      <h1 style={accountDefaultsPageTitleStyle}>Account Defaults</h1>

      <AccountDefaultsTabBar tabs={allowedTabs} activeTabId={activeTab} onSelect={handleSelectTab} />

      <div>
        {allowedTabs.length === 0 ? (
          <div style={{ color: '#6b7280' }}>You don&apos;t have permission to view this section.</div>
        ) : (
          renderAccountDefaultsTabContent(activeTab)
        )}
      </div>
    </div>
  )
}
