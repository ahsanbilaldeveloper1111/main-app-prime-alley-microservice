import React, { useEffect, useState } from 'react'

interface IdleTimerProps {
  dn: string
  isActive: boolean
  startTime?: Date | string | null
}

const IdleTimer: React.FC<IdleTimerProps> = ({ dn: _dn, isActive, startTime }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00')

  useEffect(() => {
    if (!isActive) {
      setElapsedTime('00:00:00')
      return
    }

    const startMs = (() => {
      if (!startTime) return Date.now()
      if (startTime instanceof Date) return startTime.getTime()
      const parsed = new Date(startTime).getTime()
      return Number.isFinite(parsed) ? parsed : Date.now()
    })()

    const format = (diffMs: number) => {
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`
    }

    const tick = () => {
      setElapsedTime(format(Date.now() - startMs))
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isActive, startTime])

  if (!isActive) return null

  return (
    <p
      style={{ margin: '0px', fontSize: '0.55rem', lineHeight: 'normal', color: 'rgb(245, 158, 11)' }}
      className="idle-timer running"
    >
      {elapsedTime}
    </p>
  )
}

export default IdleTimer

