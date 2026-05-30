import React from 'react'
import type { Tab } from '../types'
import { MainSettingsOverflowTabBar } from '../MainSettingsOverflowTabBar'
import './settingsSectionTabShell.scss'

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
    className={[
      'settings-section-shell',
      dense ? 'settings-section-shell--dense' : '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <h1 className="settings-section-shell__title">{title}</h1>
    <MainSettingsOverflowTabBar
      tabs={allowedTabs}
      activeTabId={activeTab}
      onSelect={onSelectTab}
    />
    <div className="settings-section-shell__content">
      {allowedTabs.length === 0 ? (
        <div className="settings-section-shell__no-permission">
          You don&apos;t have permission to view this section.
        </div>
      ) : (
        children
      )}
    </div>
  </div>
)
