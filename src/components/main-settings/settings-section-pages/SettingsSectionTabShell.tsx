import React from 'react'
import type { Tab } from '../types'
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
    <div className="settings-section-shell__tab-row" role="tablist">
      {allowedTabs.map((tab, index) => {
        const isActive = activeTab === tab.id
        const isLast = index === allowedTabs.length - 1
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectTab(tab.id)}
            className={[
              'settings-section-shell__tab-btn',
              isActive ? 'settings-section-shell__tab-btn--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={isLast ? { borderRight: '1px solid #e0e0e0' } : undefined}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
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
