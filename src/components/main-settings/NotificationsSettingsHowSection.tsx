import React from 'react'
import type { ChannelKey } from './notificationsSettingsTypes'

export type NotificationsSettingsHowSectionProps = {
  baseFont: string
  bannerVisible: boolean
  onDismissBanner: () => void
  browserNotifGranted: boolean
  onAllowBrowser: () => void
  notifChannels: Array<{ key: ChannelKey; label: string; description: string }>
  channelEnabled: Record<ChannelKey, boolean>
  toggleChannelEnabled: (ch: ChannelKey) => void
  selectedChime: string
  setSelectedChime: (v: string) => void
}

export const NotificationsSettingsHowSection: React.FC<NotificationsSettingsHowSectionProps> = ({
  baseFont,
  bannerVisible,
  onDismissBanner,
  browserNotifGranted,
  onAllowBrowser,
  notifChannels,
  channelEnabled,
  toggleChannelEnabled,
  selectedChime,
  setSelectedChime,
}) => (
  <div style={{ marginBottom: '36px' }}>
    {bannerVisible && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#eaf4fb',
          border: '1px solid #b8dcf0',
          borderRadius: '4px',
          padding: '12px 20px',
          marginBottom: '28px',
          fontSize: '14px',
          fontWeight: 300,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ fontWeight: 600 }}>Want to create your own notification?</strong>
          <span style={{ color: '#555' }}>
            You can create custom notifications in{' '}
            <button
              type="button"
              onClick={() => null}
              style={{
                color: '#006162',
                textDecoration: 'underline',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              workflows.
            </button>
          </span>
          <button
            type="button"
            style={{
              marginLeft: '8px',
              padding: '5px 12px',
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
            Learn more
          </button>
        </div>
        <button
          type="button"
          onClick={onDismissBanner}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#888',
            fontSize: '18px',
            lineHeight: 1,
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>
    )}

    <div style={{ padding: '0 0 0 0' }}>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 300,
          color: '#141414',
          marginBottom: '6px',
          letterSpacing: 0,
          fontFamily: baseFont,
        }}
      >
        Notifications
      </h1>
      <p style={{ fontSize: '14px', fontWeight: 300, color: '#555', marginBottom: '24px' }}>
        These preferences will only be applied to you.
      </p>
    </div>

    <div style={{ fontSize: '20px', fontWeight: 600, color: '#141414', marginBottom: '4px', fontFamily: baseFont }}>
      How you get notified
    </div>
    <div style={{ fontSize: '13px', fontWeight: 300, color: '#555', marginBottom: '20px', fontFamily: baseFont }}>
      Choose where you want to see your notifications.
    </div>

    {!browserNotifGranted && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid #f0d080',
          borderRadius: '4px',
          background: '#fffbea',
          padding: '14px 20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ fontSize: '14px', fontWeight: 600, fontFamily: baseFont }}>Allow browser notifications</strong>
          <span style={{ fontSize: '13px', fontWeight: 300, color: '#555', fontFamily: baseFont }}>
            Give permission to send notifications to this browser
          </span>
        </div>
        <button
          type="button"
          onClick={onAllowBrowser}
          style={{
            padding: '7px 16px',
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
          Allow notifications
        </button>
      </div>
    )}

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {notifChannels.map((ch) => (
        <div key={ch.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <button
            type="button"
            aria-pressed={channelEnabled[ch.key]}
            onClick={() => toggleChannelEnabled(ch.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'stretch',
              width: '60px',
              height: '32px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: 'pointer',
              flexShrink: 0,
              userSelect: 'none',
              padding: 0,
              background: 'transparent',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '100%',
                background: channelEnabled[ch.key] ? '#141414' : '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.18s',
                borderRight: '1px solid #d0d0d0',
              }}
            />
            <div
              style={{
                width: '30px',
                height: '100%',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2 6.5L5 9.5L11 3.5"
                  stroke={channelEnabled[ch.key] ? '#141414' : '#d0d0d0'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#141414',
                fontFamily: baseFont,
                marginBottom: '2px',
              }}
            >
              {ch.label}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 300, color: '#555', fontFamily: baseFont }}>{ch.description}</div>

            {ch.key === 'popup' && (
              <div style={{ marginTop: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '10px',
                    fontSize: '13px',
                    fontWeight: 400,
                    color: '#555',
                    fontFamily: baseFont,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#555"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <strong style={{ fontWeight: 600, color: '#141414' }}>Only applicable to pop-ups</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={selectedChime}
                    onChange={(e) => setSelectedChime(e.target.value)}
                    style={
                      {
                        padding: '8px 32px 8px 12px',
                        fontSize: '13px',
                        fontFamily: baseFont,
                        fontWeight: 300,
                        color: '#141414',
                        border: '1px solid #d0d0d0',
                        borderRadius: '4px',
                        background: '#fff',
                        outline: 'none',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23555'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                      } as React.CSSProperties
                    }
                  >
                    <option>Chime (1 sec.)</option>
                    <option>Bell (2 sec.)</option>
                    <option>Ding (0.5 sec.)</option>
                    <option>None</option>
                  </select>
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
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
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="#141414">
                      <path d="M0 0L10 6L0 12V0Z" />
                    </svg>
                    Play
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)
