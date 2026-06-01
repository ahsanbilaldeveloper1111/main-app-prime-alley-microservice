import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { generalSettingsStyles as s, getGeneralSettingsTabStyle } from './generalSettingsPanelStyles'
import { MainSettingsOverflowTabBar } from './MainSettingsOverflowTabBar'
import { SettingsSectionFallback } from './SettingsSectionFallback'

const GeneralSettingsProfileTab = dynamic(
  () => import('./GeneralSettingsProfileTab').then((m) => m.GeneralSettingsProfileTab),
  { loading: () => <SettingsSectionFallback /> }
)

const GeneralSettingsTasksTab = dynamic(
  () => import('./GeneralSettingsTasksTab').then((m) => m.GeneralSettingsTasksTab),
  { loading: () => <SettingsSectionFallback /> }
)

const generalTabs: Array<{ key: 'profile' | 'tasks'; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'tasks', label: 'Tasks' },
]

export const GeneralSettings: React.FC<
  Readonly<{
    activeTab?: 'profile' | 'tasks'
    onTabChange?: (tabId: 'profile' | 'tasks') => void
  }>
> = ({ activeTab: routeActiveTab, onTabChange }) => {
  const { data: session } = useSession()

  const [activeGeneralTab, setActiveGeneralTab] = useState<'profile' | 'tasks'>('profile')

  useEffect(() => {
    if (routeActiveTab === 'profile' || routeActiveTab === 'tasks') {
      setActiveGeneralTab(routeActiveTab)
    }
  }, [routeActiveTab])

  const [userName, setUserName] = useState('')
  useEffect(() => {
    if (session?.user?.name) setUserName(session.user.name)
  }, [session?.user?.name])

  const [language, setLanguage] = useState('')
  const [dateFormat, setDateFormat] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('GB')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [dueDate, setDueDate] = useState('In 3 business days')
  const [dueTime, setDueTime] = useState('08:00')
  const [reminder, setReminder] = useState('No reminder')
  const [followUpList, setFollowUpList] = useState(true)
  const [followUpDisqualify, setFollowUpDisqualify] = useState(true)

  return (
    <div style={s.wrapper} className="general-settings-panel settings-section-shell">
      <h1 style={s.pageTitle} className="settings-section-shell__title">General</h1>

      <MainSettingsOverflowTabBar
        tabs={generalTabs.map((tab) => ({ id: tab.key, label: tab.label }))}
        activeTabId={activeGeneralTab}
        onSelect={(tabId) => {
          const nextTab = tabId as 'profile' | 'tasks'
          setActiveGeneralTab(nextTab)
          onTabChange?.(nextTab)
        }}
        tabBarStyle={s.tabsBar}
        tabRowStyle={s.tabsWrapper}
        getTabButtonStyle={getGeneralSettingsTabStyle}
      />

      {activeGeneralTab === 'profile' && (
        <GeneralSettingsProfileTab
          userName={userName}
          setUserName={setUserName}
          language={language}
          setLanguage={setLanguage}
          dateFormat={dateFormat}
          setDateFormat={setDateFormat}
          phoneCountry={phoneCountry}
          setPhoneCountry={setPhoneCountry}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
        />
      )}
      {activeGeneralTab === 'tasks' && (
        <GeneralSettingsTasksTab
          dueDate={dueDate}
          setDueDate={setDueDate}
          dueTime={dueTime}
          setDueTime={setDueTime}
          reminder={reminder}
          setReminder={setReminder}
          followUpList={followUpList}
          setFollowUpList={setFollowUpList}
          followUpDisqualify={followUpDisqualify}
          setFollowUpDisqualify={setFollowUpDisqualify}
        />
      )}
    </div>
  )
}
