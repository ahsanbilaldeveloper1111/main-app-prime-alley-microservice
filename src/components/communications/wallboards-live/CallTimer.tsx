import React from 'react'
import useGlobalCallTimer, {
  hasUsableCallTimerStart,
} from '@hooks/useGlobalCallTimer'

interface CallTimerProps {
  dn: string
  isActive: boolean
  startTime?: Date | string
  callId?: string
}

const CallTimer: React.FC<CallTimerProps> = ({ dn, isActive, startTime, callId }) => {
  const timerKey = callId ? `${dn}_${callId}` : dn
  const hasStart = hasUsableCallTimerStart(startTime)
  const runElapsed = isActive && hasStart
  const { elapsedTime, isRunning } = useGlobalCallTimer(timerKey, runElapsed, startTime)

  if (!isActive) {
    return null
  }
  if (!hasStart) {
    return null
  }

  return (
    <p style={{ margin: '0px',fontSize: '0.55rem',lineHeight: 'normal' }} className={`call-timer ${isRunning ? 'running' : ''}`}>{elapsedTime}</p>
  )
}

export default CallTimer

