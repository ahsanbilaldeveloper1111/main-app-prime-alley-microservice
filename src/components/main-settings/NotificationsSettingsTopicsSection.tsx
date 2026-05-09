import React, { type ChangeEventHandler } from 'react'
import { ChevronIcon } from './AccountDefaultsTabPanels'
import { NotificationsTopicCheckbox } from './NotificationsTopicCheckbox'
import type { ChannelKey, NotificationTopic } from './notificationsSettingsTypes'

function TopicChannelHeaderIcon({ channelKey }: Readonly<{ channelKey: ChannelKey }>) {
  if (channelKey === 'popup') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    )
  }
  if (channelKey === 'browser') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    )
  }
  if (channelKey === 'bell') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

export type NotificationsSettingsTopicsSectionProps = {
  baseFont: string
  colWidth: number
  searchQuery: string
  setSearchQuery: (v: string) => void
  filteredTopics: NotificationTopic[]
  expandedTopics: Set<string>
  toggleTopicExpanded: (topicId: string) => void
  tableChannels: Array<{ key: ChannelKey; label: string }>
  allExpanded: boolean
  toggleExpandAll: () => void
  turnOffAll: () => void
  getParentState: (topic: NotificationTopic, channel: ChannelKey) => boolean | 'indeterminate' | null
  handleTopicCheckboxChange: ChangeEventHandler<HTMLInputElement>
  handleSubtopicCheckboxChange: ChangeEventHandler<HTMLInputElement>
}

export const NotificationsSettingsTopicsSection: React.FC<NotificationsSettingsTopicsSectionProps> = ({
  baseFont,
  colWidth,
  searchQuery,
  setSearchQuery,
  filteredTopics,
  expandedTopics,
  toggleTopicExpanded,
  tableChannels,
  allExpanded,
  toggleExpandAll,
  turnOffAll,
  getParentState,
  handleTopicCheckboxChange,
  handleSubtopicCheckboxChange,
}) => (
  <div>
    <div style={{ fontSize: '20px', fontWeight: 600, color: '#141414', marginBottom: '4px', fontFamily: baseFont }}>
      What you get notified about
    </div>
    <div style={{ fontSize: '13px', fontWeight: 300, color: '#555', marginBottom: '20px', fontFamily: baseFont }}>
      Choose what topics matter to you and how you get notified about them.
    </div>

    <div style={{ background: '#f5f5f5', borderRadius: '6px', padding: '16px 20px', marginBottom: '20px' }}>
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search for notification topics"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingTop: '8px',
            paddingBottom: '8px',
            width: '640px',
            fontSize: '16px',
            height: '40px',
            fontWeight: 300,
            color: '#141414',
            border: '1px solid #8a8a8a',
            borderRadius: '20px',
            background: '#fff',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#006162'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#d0d0d0'
          }}
        />
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: 'absolute', right: '10px' }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', fontSize: '14px', fontWeight: 300 }}>
        <button
          type="button"
          onClick={toggleExpandAll}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#006162',
            fontSize: '14px',
            fontFamily: baseFont,
            fontWeight: 300,
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          {allExpanded ? 'Collapse all topics' : 'Expand all topics'}
        </button>
        <span style={{ margin: '0 8px', color: '#d0d0d0' }}>|</span>
        <button
          type="button"
          onClick={turnOffAll}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#006162',
            fontSize: '14px',
            fontFamily: baseFont,
            fontWeight: 300,
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          Turn off all topics
        </button>
        <span
          style={{
            marginLeft: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '15px',
            height: '15px',
            border: '1.5px solid #888',
            borderRadius: '50%',
            fontSize: '10px',
            color: '#888',
            cursor: 'default',
          }}
          title="Turning off all topics disables all notifications"
        >
          ?
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {tableChannels.map((ch) => (
          <div
            key={ch.key}
            style={{
              width: colWidth,
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 400,
              color: '#555',
              fontFamily: baseFont,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <TopicChannelHeaderIcon channelKey={ch.key} />
            <span>{ch.label}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {filteredTopics.map((topic) => {
        const isExpanded = expandedTopics.has(topic.id)
        const hasSubtopics = topic.subtopics && topic.subtopics.length > 0

        return (
          <div
            key={topic.id}
            style={{
              border: '1px solid #8a8a8a',
              borderRadius: '4px',
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                userSelect: 'none',
              }}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleTopicExpanded(topic.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flex: 1,
                  minWidth: 0,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: baseFont,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                  <ChevronIcon expanded={isExpanded} />
                </span>
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#141414' }}>{topic.label}</span>
              </button>

              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: '16px' }}>
                {isExpanded && hasSubtopics && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#555',
                      letterSpacing: '0.8px',
                      fontFamily: baseFont,
                      textTransform: 'uppercase',
                    }}
                  >
                    POP-UP SOUND
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                {tableChannels.map((ch) => {
                  const state = getParentState(topic, ch.key)
                  return (
                    <NotificationsTopicCheckbox
                      key={ch.key}
                      value={state}
                      onChange={handleTopicCheckboxChange}
                      id={`${topic.id}-${ch.key}`}
                      inputProps={{
                        'data-topic-id': topic.id,
                        'data-channel': ch.key,
                      }}
                      colWidth={colWidth}
                    />
                  )
                })}
              </div>
            </div>

            {isExpanded && hasSubtopics && (
              <div>
                {topic.subtopics!.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #e8e8e8',
                      padding: '14px 20px 14px 42px',
                      background: '#fff',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#141414',
                          fontFamily: baseFont,
                          marginBottom: '2px',
                        }}
                      >
                        {sub.label}
                      </div>
                      {sub.description && (
                        <div style={{ fontSize: '12px', fontWeight: 300, color: '#888', fontFamily: baseFont }}>
                          {sub.description}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        type="button"
                        style={{
                          padding: '5px 14px',
                          fontSize: '13px',
                          fontFamily: baseFont,
                          fontWeight: 300,
                          color: '#141414',
                          background: '#fff',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          type="button"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            background: '#fff',
                            border: 'none',
                            borderRight: '1px solid #d0d0d0',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <svg width="8" height="10" viewBox="0 0 8 10" fill="#555">
                            <path d="M0 0L8 5L0 10V0Z" />
                          </svg>
                        </button>
                        <select
                          style={
                            {
                              padding: '4px 22px 4px 8px',
                              fontSize: '12px',
                              fontFamily: baseFont,
                              fontWeight: 300,
                              color: '#141414',
                              border: 'none',
                              background: '#fff',
                              outline: 'none',
                              cursor: 'pointer',
                              appearance: 'none',
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23555'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 6px center',
                            } as React.CSSProperties
                          }
                        >
                          <option>Off</option>
                          <option>Chime (1 sec.)</option>
                          <option>Bell (2 sec.)</option>
                          <option>Ding (0.5 sec.)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {tableChannels.map((ch) => (
                        <NotificationsTopicCheckbox
                          key={ch.key}
                          value={sub.channels[ch.key]}
                          onChange={handleSubtopicCheckboxChange}
                          id={`${sub.id}-${ch.key}`}
                          inputProps={{
                            'data-topic-id': topic.id,
                            'data-subtopic-id': sub.id,
                            'data-channel': ch.key,
                          }}
                          colWidth={colWidth}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {filteredTopics.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: '#888',
            fontSize: '14px',
            fontWeight: 300,
            padding: '40px',
            fontFamily: baseFont,
          }}
        >
          No topics found for &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  </div>
)
