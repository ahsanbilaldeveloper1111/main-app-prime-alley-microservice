import React from 'react'
import type { Tab } from './types'
import {
  accountDefaultsTabRowStyle,
  getAccountDefaultsTabButtonStyle,
} from './accountDefaultsPageStyles'

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
  <div style={accountDefaultsTabRowStyle}>
    {tabs.map((tab: Tab, index: number) => {
      const isActive = activeTabId === tab.id
      const isLast = index === tabs.length - 1
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          style={getAccountDefaultsTabButtonStyle(isActive, isLast)}
        >
          {tab.label}
        </button>
      )
    })}
  </div>
)
