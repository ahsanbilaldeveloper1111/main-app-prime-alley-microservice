import React from 'react'
import type { Tab } from '../types'
import {
  settingsSectionNoPermissionStyle,
  settingsSectionShellStyle,
  settingsSectionTabButtonStyle,
  settingsSectionTabRowStyle,
  settingsSectionTitleStyle,
} from './settingsSectionPageStyles'

export type SettingsSectionTabShellProps = Readonly<{
  title: string
  allowedTabs: Tab[]
  activeTab: string
  onSelectTab: (tabId: string) => void
  children: React.ReactNode
}>

export const SettingsSectionTabShell: React.FC<SettingsSectionTabShellProps> = ({
  title,
  allowedTabs,
  activeTab,
  onSelectTab,
  children,
}) => (
  <div style={settingsSectionShellStyle}>
    <h1 style={settingsSectionTitleStyle}>{title}</h1>
    <div style={settingsSectionTabRowStyle}>
      {allowedTabs.map((tab, index) => {
        const isActive = activeTab === tab.id
        const isLast = index === allowedTabs.length - 1
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            style={settingsSectionTabButtonStyle(isActive, isLast)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
    <div>
      {allowedTabs.length === 0 ? (
        <div style={settingsSectionNoPermissionStyle}>You don&apos;t have permission to view this section.</div>
      ) : (
        children
      )}
    </div>
  </div>
)
