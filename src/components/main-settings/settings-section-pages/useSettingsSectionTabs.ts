import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { filterTabsByPermission, getUserPermissions, resolveAllowedActiveTabId, type FilterSettingsTabsOptions } from '../settingsTabUtils'
import type { Tab } from '../types'

export type SettingsSectionTabSyncMode = 'default' | 'smartCrm'

export type UseSettingsSectionTabsOptions = Readonly<{
  syncMode?: SettingsSectionTabSyncMode
  filterOptions?: FilterSettingsTabsOptions
}>

export function useSettingsSectionTabs(
  routeActiveTab: string | undefined,
  onTabChange: ((id: string) => void) | undefined,
  sectionTabs: Tab[],
  initialTabId: string,
  options: UseSettingsSectionTabsOptions = {}
) {
  const { syncMode = 'default', filterOptions } = options
  const onTabChangeRef = useRef(onTabChange)
  onTabChangeRef.current = onTabChange

  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(
    () => filterTabsByPermission(sectionTabs, userPermissions, filterOptions),
    [sectionTabs, userPermissions, filterOptions],
  )
  const [activeTab, setActiveTab] = useState(initialTabId)

  useEffect(() => {
    if (allowedTabs.length === 0) return

    const next = resolveAllowedActiveTabId(routeActiveTab, activeTab, allowedTabs)
    const allowedIds = new Set(allowedTabs.map((t) => t.id))
    const routeTabDisallowed =
      Boolean(routeActiveTab) && !allowedIds.has(routeActiveTab ?? '')

    if (next !== activeTab) setActiveTab(next)
    const shouldSyncRoute =
      Boolean(next) &&
      (routeTabDisallowed || (syncMode === 'smartCrm' && next !== routeActiveTab))
    if (shouldSyncRoute) {
      onTabChangeRef.current?.(next)
    }
  }, [routeActiveTab, activeTab, allowedTabs, syncMode])

  const selectTab = useCallback((id: string) => {
    setActiveTab(id)
    onTabChangeRef.current?.(id)
  }, [])

  return { allowedTabs, activeTab, selectTab }
}
