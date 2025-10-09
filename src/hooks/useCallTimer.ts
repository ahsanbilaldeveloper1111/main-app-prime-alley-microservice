import { useState, useEffect, useRef } from 'react'

interface UseCallTimerProps {
  startTime?: string | Date | null
  isActive?: boolean
}

interface UseCallTimerReturn {
  elapsedTime: string
  isRunning: boolean
}

export const useCallTimer = ({ startTime, isActive = true }: UseCallTimerProps): UseCallTimerReturn => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const stopwatchStartTimeRef = useRef<Date | null>(null)
  const isActiveRef = useRef(false)
  const hasStartedRef = useRef(false)
  const componentMountedRef = useRef(true)

  useEffect(() => {
    // Update the active state reference
    isActiveRef.current = isActive

    // If call becomes active and we haven't started yet, start the timer
    if (isActive && !hasStartedRef.current) {
      console.log('Starting timer for active call')
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Start the stopwatch
      stopwatchStartTimeRef.current = new Date()
      setIsRunning(true)
      setElapsedTime('00:00:00')
      hasStartedRef.current = true

      // Update immediately
      const updateStopwatch = () => {
        if (stopwatchStartTimeRef.current && isActiveRef.current && componentMountedRef.current) {
          const now = new Date()
          const diff = now.getTime() - stopwatchStartTimeRef.current.getTime()
          const totalSeconds = Math.floor(diff / 1000)
          
          const hours = Math.floor(totalSeconds / 3600)
          const minutes = Math.floor((totalSeconds % 3600) / 60)
          const seconds = totalSeconds % 60
          
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          setElapsedTime(formattedTime)
        }
      }

      // Update immediately
      updateStopwatch()

      // Set up interval to update every second
      intervalRef.current = setInterval(updateStopwatch, 1000)
    }

    // If call becomes inactive, stop the timer
    if (!isActive && hasStartedRef.current) {
      console.log('Stopping timer for inactive call')
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsRunning(false)
      setElapsedTime('00:00:00')
      hasStartedRef.current = false
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive])

  // Keep the timer running even if component re-renders
  useEffect(() => {
    if (isActive && hasStartedRef.current && !intervalRef.current && componentMountedRef.current) {
      console.log('Restarting timer after re-render')
      
      const updateStopwatch = () => {
        if (stopwatchStartTimeRef.current && isActiveRef.current && componentMountedRef.current) {
          const now = new Date()
          const diff = now.getTime() - stopwatchStartTimeRef.current.getTime()
          const totalSeconds = Math.floor(diff / 1000)
          
          const hours = Math.floor(totalSeconds / 3600)
          const minutes = Math.floor((totalSeconds % 3600) / 60)
          const seconds = totalSeconds % 60
          
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          setElapsedTime(formattedTime)
        }
      }

      // Update immediately
      updateStopwatch()

      // Set up interval to update every second
      intervalRef.current = setInterval(updateStopwatch, 1000)
    }
  })

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      componentMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return {
    elapsedTime,
    isRunning
  }
}

export default useCallTimer
