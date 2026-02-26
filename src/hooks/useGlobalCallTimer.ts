import { useState, useEffect, useRef } from 'react'
import moment from 'moment'

interface CallTimerData {
  dn: string
  startTime: Date
  isActive: boolean
}

class GlobalCallTimerManager {
  private static instance: GlobalCallTimerManager
  private timers: Map<string, CallTimerData> = new Map()
  private interval: NodeJS.Timeout | null = null
  private callbacks: Map<string, (time: string) => void> = new Map()

  static getInstance(): GlobalCallTimerManager {
    if (!GlobalCallTimerManager.instance) {
      GlobalCallTimerManager.instance = new GlobalCallTimerManager()
    }
    return GlobalCallTimerManager.instance
  }

  startTimer(dn: string, callback: (time: string) => void, providedStartTime?: Date | string | null, forceNew?: boolean) {
    // Use provided startTime if available, otherwise use current time
    let startTime: Date
    const existingTimer = this.timers.get(dn)
    
    if (providedStartTime) {
      // If startTime is provided, parse it correctly handling timezone
      if (providedStartTime instanceof Date) {
        startTime = providedStartTime
      } else {
        // Parse the startTime string from API
        // Format: "2026-01-09T19:55:29.336815488" (ISO-like, typically UTC from server)
        // Parse as UTC first (most APIs send UTC), then we'll use it directly
        // JavaScript Date objects store time as UTC internally, so we just need to parse correctly
        let parsedMoment = moment.utc(providedStartTime)
        
        if (parsedMoment.isValid()) {
          // Create Date from UTC timestamp - this preserves the actual time
          // The Date object will represent this UTC time correctly
          startTime = parsedMoment.toDate()
        } else {
          // If UTC parsing fails, try as local time
          parsedMoment = moment(providedStartTime)
          if (parsedMoment.isValid()) {
            startTime = parsedMoment.toDate()
          } else {
            // Final fallback
            startTime = new Date(providedStartTime)
          }
        }
      }
    } else if (existingTimer && !forceNew && existingTimer.isActive) {
      // Only reuse existing startTime if timer is still active and we're not forcing new
      // This handles re-renders of the same active call
      startTime = existingTimer.startTime
    } else {
      // For new calls, when forcing new, or when timer is inactive, start from current time
      // (will be updated when API provides actual startTime)
      startTime = new Date()
    }
    
    // Update or create timer with the calculated startTime
    this.timers.set(dn, { dn, startTime, isActive: true })
    this.callbacks.set(dn, callback)

    // Start the global interval if not already running
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.updateAllTimers()
      }, 1000)
    }

    // Update immediately to show current elapsed time
    this.updateTimer(dn)
    
    // Also schedule an immediate update after a short delay to ensure it starts
    // This handles cases where startTime is very close to current time
    setTimeout(() => {
      this.updateTimer(dn)
    }, 100)
  }

  updateStartTime(dn: string, newStartTime: Date | string) {
    const timer = this.timers.get(dn)
    if (timer) {
      let startTime: Date
      if (newStartTime instanceof Date) {
        startTime = newStartTime
      } else {
        // Parse the startTime string from API
        // Parse as UTC first (most APIs send UTC)
        let parsedMoment = moment.utc(newStartTime)
        
        if (parsedMoment.isValid()) {
          // Create Date from UTC timestamp
          startTime = parsedMoment.toDate()
        } else {
          // If UTC parsing fails, try as local time
          parsedMoment = moment(newStartTime)
          if (parsedMoment.isValid()) {
            startTime = parsedMoment.toDate()
          } else {
            // Final fallback
            startTime = new Date(newStartTime)
          }
        }
      }
      this.timers.set(dn, { ...timer, startTime })
      // Update immediately with new startTime
      this.updateTimer(dn)
    }
  }

  stopTimer(dn: string) {
    this.timers.delete(dn)
    this.callbacks.delete(dn)

    // Stop global interval if no more timers
    if (this.timers.size === 0 && this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  updateTimer(dn: string) {
    const timer = this.timers.get(dn)
    const callback = this.callbacks.get(dn)
    
    if (timer && callback && timer.isActive) {
      try {
        const now = new Date()
        const startTimeDate = timer.startTime instanceof Date ? timer.startTime : new Date(timer.startTime)
        const diff = now.getTime() - startTimeDate.getTime()
        const totalSeconds = Math.max(0, Math.floor(diff / 1000)) // Ensure non-negative
        
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        callback(formattedTime)
      } catch (error) {
        console.error(`[Timer ${dn}] Error updating timer:`, error)
        // Fallback to 00:00:00 on error
        callback('00:00:00')
      }
    }
  }

  updateAllTimers() {
    this.timers.forEach((timer, dn) => {
      this.updateTimer(dn)
    })
  }

  isTimerActive(dn: string): boolean {
    return this.timers.has(dn)
  }
}

export const useGlobalCallTimer = (dn: string, isActive: boolean, startTime?: Date | string | null) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [isRunning, setIsRunning] = useState(false)
  const timerManager = GlobalCallTimerManager.getInstance()
  const prevStartTimeRef = useRef<Date | string | null | undefined>(undefined)
  const prevIsActiveRef = useRef<boolean>(false)

  useEffect(() => {
    if (isActive) {
      setIsRunning(true)
      
      // Check if this is a new call (was inactive, now active)
      const isNewCall = !prevIsActiveRef.current
      
      // Check if timer exists first
      const timerExists = timerManager.isTimerActive(dn)
      
      // Determine if we should force a new timer:
      // 1. If it's a new call (was inactive, now active) - ALWAYS start fresh
      // 2. If startTime is null/undefined and there's no previous startTime (new call without API data)
      // 3. If startTime changed from a value to null (call ended and new one started)
      const shouldForceNew: boolean = isNewCall || 
                                     (!startTime && !prevStartTimeRef.current) ||
                                     (!!prevStartTimeRef.current && !startTime)
      
      // For new calls, always start fresh to avoid inheriting old timer values
      if (isNewCall) {
        // New call - always start from provided startTime (converted to local) or current time
        // Force new to ensure we don't reuse an old timer's startTime
        timerManager.startTimer(dn, (time) => {
          setElapsedTime(time)
        }, startTime, true)
      } else if (startTime && timerExists && startTime !== prevStartTimeRef.current) {
        // Existing call but startTime changed - update it immediately
        // This handles the case when ANSWERED/CONNECTED event provides the actual startTime
        timerManager.updateStartTime(dn, startTime)
        // Also refresh the timer to ensure it's running
        timerManager.startTimer(dn, (time) => {
          setElapsedTime(time)
        }, startTime, false)
      } else {
        // Existing call with same startTime - just refresh to ensure it's running
        timerManager.startTimer(dn, (time) => {
          setElapsedTime(time)
        }, startTime, shouldForceNew)
      }
      
      prevStartTimeRef.current = startTime
      prevIsActiveRef.current = true
    } else {
      setIsRunning(false)
      setElapsedTime('00:00:00')
      // Always stop timer when call becomes inactive to ensure clean state for next call
      timerManager.stopTimer(dn)
      prevStartTimeRef.current = undefined
      prevIsActiveRef.current = false
    }

    // Cleanup function - only stop timer if component unmounts or becomes inactive
    return () => {
      if (!isActive) {
        timerManager.stopTimer(dn)
      }
    }
  }, [dn, isActive, startTime, timerManager])

  return {
    elapsedTime,
    isRunning
  }
}

export default useGlobalCallTimer
