import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React, { type ChangeEventHandler, type CSSProperties } from 'react'
import { ChevronIcon } from './AccountDefaultsTabPanels'
import { NotificationsTopicCheckbox } from './NotificationsTopicCheckbox'
import type { ChannelKey, NotificationTopic } from './notificationsSettingsTypes'
import './notificationsSettingsTopics.scss'

function TopicChannelHeaderIcon({ channelKey }: Readonly<{ channelKey: ChannelKey }>) {
  if (channelKey === 'popup') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    )
  }
  if (channelKey === 'browser') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    )
  }
  if (channelKey === 'bell') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
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
}) => {
  const tableStyle = {
    '--notif-channel-col-width': `${colWidth}px`,
  } as CSSProperties

  return (
  <div
    className="notifications-topics-table"
    style={tableStyle}
  >
    <div style={{ fontSize: MAIN_SETTINGS_FONT_SIZE.lg, fontWeight: 600, color: '#141414', marginBottom: '4px', fontFamily: baseFont }}>
      What you get notified about
    </div>
    <div style={{ fontSize: MAIN_SETTINGS_FONT_SIZE.sm, fontWeight: 400, color: '#6c757d', marginBottom: '20px', fontFamily: baseFont }}>
      Choose what topics matter to you and how you get notified about them.
    </div>

    <div style={{ background: '#f5f5f5', borderRadius: '6px', padding: '16px 20px', marginBottom: '20px' }}>
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search for notification topics"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="notifications-topics-table__search-input"
          style={{
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingTop: '8px',
            paddingBottom: '8px',
            fontSize: MAIN_SETTINGS_FONT_SIZE.md,
            height: '40px',
            fontWeight: 400,
            color: '#141414',
            border: '1px solid #8a8a8a',
            borderRadius: '20px',
            background: '#fff',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#86b7fe'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#b8b8b8'
          }}
        />
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6c757d"
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

    <div className="notifications-topics-table__scroll">
      <div className="notifications-topics-table__scroll-inner">
      <div className="notifications-topics-table__grid-row notifications-topics-table__toolbar-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', fontSize: MAIN_SETTINGS_FONT_SIZE.base, fontWeight: 400 }}>
          <button
            type="button"
            onClick={toggleExpandAll}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#0066CC',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontFamily: baseFont,
              fontWeight: 400,
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
              color: '#0066CC',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontFamily: baseFont,
              fontWeight: 400,
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
              border: '1.5px solid #6c757d',
              borderRadius: '50%',
              fontSize: MAIN_SETTINGS_FONT_SIZE.xs,
              color: '#6c757d',
              cursor: 'default',
            }}
            title="Turning off all topics disables all notifications"
          >
            ?
          </span>
        </div>

        <div aria-hidden="true" />

        {tableChannels.map((ch) => (
          <div
            key={ch.key}
            className="notifications-topics-table__channel-header"
            style={{ fontFamily: baseFont }}
          >
            <TopicChannelHeaderIcon channelKey={ch.key} />
            <span>{ch.label}</span>
          </div>
        ))}
      </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {filteredTopics.map((topic) => {
        const isExpanded = expandedTopics.has(topic.id)
        const hasSubtopics = topic.subtopics && topic.subtopics.length > 0

        return (
          <div
            key={topic.id}
            className="notifications-topics-table__topic-card"
          >
            <div className="notifications-topics-table__grid-row notifications-topics-table__parent-row">
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleTopicExpanded(topic.id)}
                className="notifications-topics-table__topic-toggle"
                style={{ fontFamily: baseFont }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                  <ChevronIcon expanded={isExpanded} />
                </span>
                <span style={{ fontSize: MAIN_SETTINGS_FONT_SIZE.md, fontWeight: 500, color: '#141414' }}>{topic.label}</span>
              </button>

              <div className="notifications-topics-table__actions-heading" style={{ fontFamily: baseFont }}>
                {isExpanded && hasSubtopics ? 'POP-UP SOUND' : null}
              </div>

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

            {isExpanded && hasSubtopics && (
              <div>
                {topic.subtopics!.map((sub) => (
                  <div
                    key={sub.id}
                    className="notifications-topics-table__grid-row notifications-topics-table__subtopic-row"
                  >
                    <div className="notifications-topics-table__subtopic-copy">
                      <div
                        style={{
                          fontSize: MAIN_SETTINGS_FONT_SIZE.base,
                          fontWeight: 500,
                          color: '#141414',
                          fontFamily: baseFont,
                          marginBottom: '2px',
                        }}
                      >
                        {sub.label}
                      </div>
                      {sub.description && (
                        <div style={{ fontSize: MAIN_SETTINGS_FONT_SIZE.sm, fontWeight: 400, color: '#6c757d', fontFamily: baseFont }}>
                          {sub.description}
                        </div>
                      )}
                    </div>

                    <div className="notifications-topics-table__subtopic-actions">
                      <button
                        type="button"
                        style={{
                          padding: '5px 14px',
                          fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
                          fontFamily: baseFont,
                          fontWeight: 400,
                          color: '#141414',
                          background: '#fff',
                          border: '1px solid #b8b8b8',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid #b8b8b8',
                          borderRadius: '8px',
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
                            borderRight: '1px solid #b8b8b8',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <svg width="8" height="10" viewBox="0 0 8 10" fill="#6c757d">
                            <path d="M0 0L8 5L0 10V0Z" />
                          </svg>
                        </button>
                        <select
                          style={
                            {
                              padding: '4px 22px 4px 8px',
                              fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
                              fontFamily: baseFont,
                              fontWeight: 400,
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
            color: '#6c757d',
            fontSize: MAIN_SETTINGS_FONT_SIZE.base,
            fontWeight: 400,
            padding: '40px',
            fontFamily: baseFont,
          }}
        >
          No topics found for &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
      </div>
    </div>
  </div>
  )
}
