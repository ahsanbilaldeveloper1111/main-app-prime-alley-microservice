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
  /** Tighter tab row + content spacing (e.g. compact settings forms). */
  dense?: boolean
}>

export const SettingsSectionTabShell: React.FC<SettingsSectionTabShellProps> = ({
  title,
  allowedTabs,
  activeTab,
  onSelectTab,
  children,
  dense = false,
}) => (
  <div
    style={{
      ...settingsSectionShellStyle,
      ...(dense ? { padding: "20px 40px 24px" } : null),
    }}
  >
    <h1
      style={{
        ...settingsSectionTitleStyle,
        ...(dense ? { marginBottom: 12 } : null),
      }}
    >
      {title}
    </h1>
    <div
      style={{
        ...settingsSectionTabRowStyle,
        ...(dense ? { marginBottom: 16 } : null),
      }}
    >
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
