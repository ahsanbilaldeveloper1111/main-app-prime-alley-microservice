import React from 'react'
import { NOTIFICATIONS_BASE_FONT } from './notificationsSettingsConstants'
import { NotificationsSettingsHowSection } from './NotificationsSettingsHowSection'
import { NotificationsSettingsTopicsSection } from './NotificationsSettingsTopicsSection'
import { useNotificationsSettingsState } from './useNotificationsSettingsState'

function notificationSettingsStatusMessage(
  isGlobalLoading: boolean,
  isGlobalSaving: boolean,
  isSmartCrmLoading: boolean,
): string {
  if (isGlobalLoading) {
    return 'Loading notification delivery preferences…'
  }
  if (isGlobalSaving) {
    return 'Saving notification delivery preferences…'
  }
  if (isSmartCrmLoading) {
    return 'Loading Smart CRM notification preferences…'
  }
  return 'Saving Smart CRM notification preferences…'
}

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
    playSelectedChime,
    allExpanded,
    toggleExpandAll,
    turnOffAll,
    handleTopicCheckboxChange,
    handleSubtopicCheckboxChange,
    notifChannels,
    tableChannels,
    colWidth,
    getParentState,
    isSmartCrmLoading,
    isSmartCrmSaving,
    smartCrmLoadError,
    isGlobalLoading,
    isGlobalSaving,
    globalLoadError,
  } = useNotificationsSettingsState()

  return (
    <div style={{ fontFamily: baseFont, color: '#141414', padding: '32px 40px' }}>
      {globalLoadError ? (
        <div
          role="alert"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '4px',
            border: '1px solid #f0b4b4',
            background: '#fff5f5',
            fontSize: '13px',
            color: '#8a1f1f',
          }}
        >
          Could not load your notification delivery preferences. Showing defaults until the service is available.
        </div>
      ) : null}
      {smartCrmLoadError ? (
        <div
          role="alert"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '4px',
            border: '1px solid #f0b4b4',
            background: '#fff5f5',
            fontSize: '13px',
            color: '#8a1f1f',
          }}
        >
          Could not load Smart CRM notification settings. Showing defaults until the service is available.
        </div>
      ) : null}
      {(isGlobalLoading || isGlobalSaving || isSmartCrmLoading || isSmartCrmSaving) && (
        <div
          style={{
            marginBottom: '16px',
            fontSize: '13px',
            color: '#555',
          }}
        >
          {notificationSettingsStatusMessage(
            isGlobalLoading,
            isGlobalSaving,
            isSmartCrmLoading,
          )}
        </div>
      )}
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
        onPlaySelectedChime={playSelectedChime}
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
