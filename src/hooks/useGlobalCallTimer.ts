import { useState, useEffect, useRef } from 'react'
import moment from 'moment'

interface CallTimerData {
  dn: string
  startTime: Date
  isActive: boolean
}

type TimerProvidedStartTime = Date | string | null | undefined

/** Parses API / hook start time (UTC-first, then local, then native Date). */
function parseCallTimerStartTimeInput(value: Date | string): Date {
  if (value instanceof Date) {
    return value
  }
  let parsedMoment = moment.utc(value)
  if (parsedMoment.isValid()) {
    return parsedMoment.toDate()
  }
  parsedMoment = moment(value)
  if (parsedMoment.isValid()) {
    return parsedMoment.toDate()
  }
  return new Date(value)
}

class GlobalCallTimerManager {
  private static instance: GlobalCallTimerManager
  private readonly timers: Map<string, CallTimerData> = new Map()
  private interval: NodeJS.Timeout | null = null
  private readonly callbacks: Map<string, (time: string) => void> = new Map()

  static getInstance(): GlobalCallTimerManager {
    if (!GlobalCallTimerManager.instance) {
      GlobalCallTimerManager.instance = new GlobalCallTimerManager()
    }
    return GlobalCallTimerManager.instance
  }

  startTimer(dn: string, callback: (time: string) => void, providedStartTime?: TimerProvidedStartTime, forceNew?: boolean) {
    let startTime: Date
    const existingTimer = this.timers.get(dn)

    if (providedStartTime) {
      startTime = parseCallTimerStartTimeInput(providedStartTime)
    } else if (existingTimer && !forceNew && existingTimer.isActive) {
      startTime = existingTimer.startTime
    } else {
      return
    }
    
    // Update or create timer with the calculated startTime
    this.timers.set(dn, { dn, startTime, isActive: true })
    this.callbacks.set(dn, callback)

    this.interval ??= setInterval(() => {
      this.updateAllTimers()
    }, 1000)

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
      const startTime = parseCallTimerStartTimeInput(newStartTime)
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

export function hasUsableCallTimerStart(startTime?: Date | string | null): boolean {
  if (startTime == null) {
    return false
  }
  if (typeof startTime === 'string' && startTime.trim() === '') {
    return false
  }
  if (startTime instanceof Date) {
    return !Number.isNaN(startTime.getTime())
  }
  let parsedMoment = moment.utc(startTime)
  if (parsedMoment.isValid()) {
    return true
  }
  parsedMoment = moment(startTime)
  return parsedMoment.isValid()
}

export const useGlobalCallTimer = (dn: string, isActive: boolean, startTime?: Date | string | null) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [isRunning, setIsRunning] = useState(false)
  const timerManager = GlobalCallTimerManager.getInstance()
  const prevStartTimeRef = useRef<Date | string | null | undefined>(undefined)
  const prevIsActiveRef = useRef<boolean>(false)

  useEffect(() => {
    if (!isActive) {
      setIsRunning(false)
      setElapsedTime('00:00:00')
      timerManager.stopTimer(dn)
      prevStartTimeRef.current = undefined
      prevIsActiveRef.current = false
      return () => {
        timerManager.stopTimer(dn)
      }
    }

    const usableStart = hasUsableCallTimerStart(startTime)
    if (!usableStart) {
      setIsRunning(false)
      setElapsedTime('00:00:00')
      timerManager.stopTimer(dn)
      prevStartTimeRef.current = startTime
      prevIsActiveRef.current = true
      return () => {
        timerManager.stopTimer(dn)
      }
    }

    const resolvedStart: Date | string = startTime as Date | string

    setIsRunning(true)

    const isNewCall = !prevIsActiveRef.current
    const timerExists = timerManager.isTimerActive(dn)
    const prevUsable = hasUsableCallTimerStart(prevStartTimeRef.current)
    const shouldForceNew = isNewCall || (usableStart && !prevUsable)

    if (isNewCall) {
      timerManager.startTimer(dn, (time) => {
        setElapsedTime(time)
      }, resolvedStart, true)
    } else if (timerExists && resolvedStart !== prevStartTimeRef.current) {
      timerManager.updateStartTime(dn, resolvedStart)
      timerManager.startTimer(dn, (time) => {
        setElapsedTime(time)
      }, resolvedStart, false)
    } else {
      timerManager.startTimer(dn, (time) => {
        setElapsedTime(time)
      }, resolvedStart, shouldForceNew)
    }

    prevStartTimeRef.current = resolvedStart
    prevIsActiveRef.current = true

    return () => {
      timerManager.stopTimer(dn)
    }
  }, [dn, isActive, startTime, timerManager])

  return {
    elapsedTime,
    isRunning
  }
}

export default useGlobalCallTimer
