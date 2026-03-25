import { useEffect, useMemo, useState } from 'react'
import { lookupUserDataExtensionByDn } from './userCardHelpers'

function asUserDataExtensionMap(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') {
    return raw as Record<string, unknown>
  }
  return {}
}

/**
 * Extension row lookup + cross-tab retry for wallboard UserCard (cloned tabs).
 */
export function useUserCardExtensionData(
  dn: string | number,
  getUserDataExtensions: (() => unknown) | undefined
): unknown {
  const [dataCheckCounter, setDataCheckCounter] = useState(0)
  const [forceUpdate, setForceUpdate] = useState(0)

  const extensionData = useMemo(() => {
    try {
      if (!getUserDataExtensions) {
        console.warn(`[UserCard ${dn}] getUserDataExtensions function not available`)
        return null
      }

      const userDataExtensions = asUserDataExtensionMap(getUserDataExtensions())
      const data = lookupUserDataExtensionByDn(userDataExtensions, dn)

      if (!data && dataCheckCounter === 0) {
        console.warn(
          `[UserCard ${dn}] No extension data found. Tried keys: ${dn}, ${String(dn)}, ${Number(dn)}. Available keys:`,
          Object.keys(userDataExtensions).slice(0, 10)
        )
      }

      return data
    } catch (error) {
      console.error(`[UserCard ${dn}] Error getting extension data:`, error)
      return null
    }
  }, [dn, getUserDataExtensions, dataCheckCounter, forceUpdate])

  useEffect(() => {
    if (extensionData || !getUserDataExtensions) {
      return
    }

    const maxRetries = 30
    let retryCount = 0

    const retryInterval = setInterval(() => {
      if (!getUserDataExtensions) {
        clearInterval(retryInterval)
        return
      }

      const userDataExtensions = asUserDataExtensionMap(getUserDataExtensions())
      const data = lookupUserDataExtensionByDn(userDataExtensions, dn)

      if (data) {
        setDataCheckCounter((prev) => prev + 1)
        setForceUpdate((prev) => prev + 1)
        clearInterval(retryInterval)
      } else {
        retryCount += 1
        if (retryCount % 5 === 0) {
          setForceUpdate((prev) => prev + 1)
        }
        if (retryCount >= maxRetries) {
          clearInterval(retryInterval)
        }
      }
    }, 300)

    return () => {
      clearInterval(retryInterval)
    }
  }, [extensionData, dn, getUserDataExtensions])

  useEffect(() => {
    if (extensionData || !getUserDataExtensions) {
      return
    }

    const handleStorageChange = (_event: StorageEvent) => {
      if (!getUserDataExtensions) {
        return
      }
      const userDataExtensions = asUserDataExtensionMap(getUserDataExtensions())
      const data = lookupUserDataExtensionByDn(userDataExtensions, dn)
      if (data) {
        setDataCheckCounter((prev) => prev + 1)
      }
    }

    const g = globalThis as Window & typeof globalThis
    if (typeof g.addEventListener === 'function') {
      g.addEventListener('storage', handleStorageChange)
      return () => {
        g.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [extensionData, dn, getUserDataExtensions])

  useEffect(() => {
    if (extensionData) {
      return
    }

    const g = globalThis as Window & typeof globalThis
    if (typeof g.BroadcastChannel !== 'function') {
      return
    }

    try {
      const channel = new g.BroadcastChannel('cti-broadcast-channel')
      const message = {
        type: 'cti_event',
        data: {
          type: 'request_user_data_extensions',
          data: null,
        },
        timestamp: Date.now(),
        tabId: `tab-${Date.now()}`,
      }
      channel.postMessage(message)
      setTimeout(() => {
        channel.close()
      }, 100)
    } catch (error) {
      console.warn(`[UserCard ${dn}] Failed to request userDataExtensions via BroadcastChannel:`, error)
    }
  }, [extensionData, dn])

  return extensionData
}
