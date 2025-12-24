import React from 'react'
import useGlobalCallTimer from '../../../hooks/useGlobalCallTimer'

interface CallTimerProps {
  dn: string
  isActive: boolean
}

const CallTimer: React.FC<CallTimerProps> = ({ dn, isActive }) => {
  const { elapsedTime, isRunning } = useGlobalCallTimer(dn, isActive)
  
  if (!isActive) {
    return null
  }

  return (
    <p style={{ margin: '0px',fontSize: '0.55rem',lineHeight: 'normal' }} className={`call-timer ${isRunning ? 'running' : ''}`}>{elapsedTime}</p>
  )
}

export default CallTimer

