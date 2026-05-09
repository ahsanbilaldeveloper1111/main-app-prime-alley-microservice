import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { accountDefaultsTabs } from './accountDefaultsConfig'
import { filterTabsByPermission, getUserPermissions, resolveAllowedActiveTabId } from './settingsTabUtils'
import type { Tab } from './types'

export function useAccountDefaultsTabs(routeActiveTab: string | undefined) {
  const { data: session } = useSession()
  const userPermissions = useMemo(() => getUserPermissions(session), [session])
  const allowedTabs = useMemo(
    (): Tab[] => filterTabsByPermission(accountDefaultsTabs, userPermissions),
    [userPermissions]
  )
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    setActiveTab((prev) => {
      const next = resolveAllowedActiveTabId(routeActiveTab, prev, allowedTabs)
      return next === prev ? prev : next
    })
  }, [routeActiveTab, allowedTabs])

  return { allowedTabs, activeTab, setActiveTab }
}
