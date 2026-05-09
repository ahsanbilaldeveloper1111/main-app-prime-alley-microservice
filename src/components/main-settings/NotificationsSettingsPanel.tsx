import React from 'react'
import { NOTIFICATIONS_BASE_FONT } from './notificationsSettingsConstants'
import { NotificationsSettingsHowSection } from './NotificationsSettingsHowSection'
import { NotificationsSettingsTopicsSection } from './NotificationsSettingsTopicsSection'
import { useNotificationsSettingsState } from './useNotificationsSettingsState'

export const NotificationsSettingsNew: React.FC = () => {
  const baseFont = NOTIFICATIONS_BASE_FONT
  const {
    filteredTopics,
    expandedTopics,
    toggleTopicExpanded,
    bannerVisible,
    setBannerVisible,
    browserNotifGranted,
    setBrowserNotifGranted,
    searchQuery,
    setSearchQuery,
    channelEnabled,
    toggleChannelEnabled,
    selectedChime,
    setSelectedChime,
    allExpanded,
    toggleExpandAll,
    turnOffAll,
    handleTopicCheckboxChange,
    handleSubtopicCheckboxChange,
    notifChannels,
    tableChannels,
    colWidth,
    getParentState,
  } = useNotificationsSettingsState()

  return (
    <div style={{ fontFamily: baseFont, color: '#141414', padding: '32px 40px' }}>
      <NotificationsSettingsHowSection
        baseFont={baseFont}
        bannerVisible={bannerVisible}
        onDismissBanner={() => setBannerVisible(false)}
        browserNotifGranted={browserNotifGranted}
        onAllowBrowser={() => setBrowserNotifGranted(true)}
        notifChannels={notifChannels}
        channelEnabled={channelEnabled}
        toggleChannelEnabled={toggleChannelEnabled}
        selectedChime={selectedChime}
        setSelectedChime={setSelectedChime}
      />
      <NotificationsSettingsTopicsSection
        baseFont={baseFont}
        colWidth={colWidth}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredTopics={filteredTopics}
        expandedTopics={expandedTopics}
        toggleTopicExpanded={toggleTopicExpanded}
        tableChannels={tableChannels}
        allExpanded={allExpanded}
        toggleExpandAll={toggleExpandAll}
        turnOffAll={turnOffAll}
        getParentState={getParentState}
        handleTopicCheckboxChange={handleTopicCheckboxChange}
        handleSubtopicCheckboxChange={handleSubtopicCheckboxChange}
      />
    </div>
  )
}
