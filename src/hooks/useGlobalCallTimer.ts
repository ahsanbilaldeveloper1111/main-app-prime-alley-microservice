import { useState, useEffect, useRef } from 'react'

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

  startTimer(dn: string, callback: (time: string) => void) {
    const startTime = new Date()
    this.timers.set(dn, { dn, startTime, isActive: true })
    this.callbacks.set(dn, callback)

    // Start the global interval if not already running
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.updateAllTimers()
      }, 1000)
    }

    // Update immediately
    this.updateTimer(dn)
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
      const now = new Date()
      const diff = now.getTime() - timer.startTime.getTime()
      const totalSeconds = Math.floor(diff / 1000)
      
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      callback(formattedTime)
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

export const useGlobalCallTimer = (dn: string, isActive: boolean) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [isRunning, setIsRunning] = useState(false)
  const timerManager = GlobalCallTimerManager.getInstance()

  useEffect(() => {
    if (isActive) {
      console.log(`Starting timer for DN: ${dn}`)
      setIsRunning(true)
      timerManager.startTimer(dn, (time) => {
        setElapsedTime(time)
      })
    } else {
      console.log(`Stopping timer for DN: ${dn}`)
      setIsRunning(false)
      setElapsedTime('00:00:00')
      timerManager.stopTimer(dn)
    }

    // Cleanup function
    return () => {
      timerManager.stopTimer(dn)
    }
  }, [dn, isActive])

  return {
    elapsedTime,
    isRunning
  }
}

export default useGlobalCallTimer
