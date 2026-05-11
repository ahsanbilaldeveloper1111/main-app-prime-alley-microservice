import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { filterTabsByPermission, getUserPermissions, resolveAllowedActiveTabId } from '../settingsTabUtils'
import type { Tab } from '../types'

export type SettingsSectionTabSyncMode = 'default' | 'smartCrm'

export function useSettingsSectionTabs(
  routeActiveTab: string | undefined,
  onTabChange: ((id: string) => void) | undefined,
  sectionTabs: Tab[],
  initialTabId: string,
  syncMode: SettingsSectionTabSyncMode = 'default'
) {
  const onTabChangeRef = useRef(onTabChange)
  onTabChangeRef.current = onTabChange

  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(() => filterTabsByPermission(sectionTabs, userPermissions), [sectionTabs, userPermissions])
  const [activeTab, setActiveTab] = useState(initialTabId)

  useEffect(() => {
    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    if (next !== activeTab) setActiveTab(next)
    if (syncMode === 'smartCrm' && next && next !== routeActiveTab) {
      onTabChangeRef.current?.(next)
    }
  }, [routeActiveTab, activeTab, allowedTabs, syncMode])

  const selectTab = useCallback((id: string) => {
    setActiveTab(id)
    onTabChangeRef.current?.(id)
  }, [])

  return { allowedTabs, activeTab, selectTab }
}
