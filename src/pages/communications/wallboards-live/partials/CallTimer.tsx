import React from 'react'
import useGlobalCallTimer from '../../../../hooks/useGlobalCallTimer'

interface CallTimerProps {
  dn: string
  isActive: boolean
  startTime?: Date | string
  callId?: string
}

const CallTimer: React.FC<CallTimerProps> = ({ dn, isActive, startTime, callId }) => {
  // Use callId if available, otherwise fall back to dn for unique timer key
  const timerKey = callId ? `${dn}_${callId}` : dn
  const { elapsedTime, isRunning } = useGlobalCallTimer(timerKey, isActive, startTime)
  
  if (!isActive) {
    return null
  }

  return (
    <p style={{ margin: '0px',fontSize: '0.55rem',lineHeight: 'normal' }} className={`call-timer ${isRunning ? 'running' : ''}`}>{elapsedTime}</p>
  )
}

export default CallTimer

