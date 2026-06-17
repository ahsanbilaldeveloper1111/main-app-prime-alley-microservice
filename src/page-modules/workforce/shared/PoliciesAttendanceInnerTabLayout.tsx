import { MainSettingsOverflowTabBar } from '@components/main-settings/MainSettingsOverflowTabBar'
import type { MainSettingsOverflowTabItem } from '@components/main-settings/MainSettingsOverflowTabBar'
import React from 'react'

export type PoliciesAttendanceInnerTabLayoutProps = Readonly<{
  tabs: readonly MainSettingsOverflowTabItem[]
  activeTabId: string
  onSelectTab: (tabId: string) => void
  children: React.ReactNode
}>

export function PoliciesAttendanceInnerTabLayout({
  tabs,
  activeTabId,
  onSelectTab,
  children,
}: PoliciesAttendanceInnerTabLayoutProps) {
  return (
    <div className="workforce-settings-panel">
      <div className="settings-embedded-page policies-attendance-inner-tab-layout">
        <MainSettingsOverflowTabBar tabs={tabs} activeTabId={activeTabId} onSelect={onSelectTab} />
        <div className="policies-attendance-inner-tab-layout__content">{children}</div>
      </div>
    </div>
  )
}
