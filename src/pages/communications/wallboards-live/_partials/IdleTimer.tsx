import React, { useEffect, useState } from 'react'

interface IdleTimerProps {
  dn: string
  isActive: boolean
  startTime?: Date | string | null
}

const IdleTimer: React.FC<IdleTimerProps> = ({ dn: _dn, isActive, startTime }) => {
  const [relativeTime, setRelativeTime] = useState('')

  // Format time difference as human-readable relative time
  const formatRelativeTime = (startMs: number): string => {
    const now = Date.now()
    const diffMs = now - startMs
    
    if (diffMs < 0) return 'just now'
    
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffYears > 0) {
      return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`
    }
    if (diffMonths > 0) {
      return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
    }
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    }
    if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    }
    if (diffMinutes > 0) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
    }
    return 'just now'
  }

  useEffect(() => {
    if (!isActive) {
      setRelativeTime('')
      return
    }

    const startMs = (() => {
      if (!startTime) return Date.now()
      if (startTime instanceof Date) return startTime.getTime()
      const parsed = new Date(startTime).getTime()
      return Number.isFinite(parsed) ? parsed : Date.now()
    })()

    const tick = () => {
      setRelativeTime(formatRelativeTime(startMs))
    }

    tick()
    // Update every 30 seconds for accurate relative time display
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [isActive, startTime])

  if (!isActive || !relativeTime) return null

  return (
    <p
      style={{ margin: '0px', fontSize: '0.55rem', lineHeight: 'normal', color: 'rgb(245, 158, 11)' }}
      className="idle-timer running"
    >
      {relativeTime}
    </p>
  )
}

export default IdleTimer

