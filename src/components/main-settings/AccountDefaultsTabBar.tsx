import React from 'react'
import type { Tab } from './types'
import {
  accountDefaultsTabBarStyle,
  accountDefaultsTabRowStyle,
  getAccountDefaultsTabButtonStyle,
} from './accountDefaultsPageStyles'
import { MainSettingsOverflowTabBar } from './MainSettingsOverflowTabBar'

export type AccountDefaultsTabBarProps = {
  tabs: readonly Tab[]
  activeTabId: string
  onSelect: (tabId: string) => void
}

export const AccountDefaultsTabBar: React.FC<AccountDefaultsTabBarProps> = ({
  tabs,
  activeTabId,
  onSelect,
}) => (
  <MainSettingsOverflowTabBar
    tabs={tabs}
    activeTabId={activeTabId}
    onSelect={onSelect}
    tabBarStyle={accountDefaultsTabBarStyle}
    tabRowStyle={accountDefaultsTabRowStyle}
    getTabButtonStyle={getAccountDefaultsTabButtonStyle}
  />
)
