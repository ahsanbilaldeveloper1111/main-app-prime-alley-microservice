import type { Tab } from './types'

export function getUserPermissions(session: unknown): string[] {
  const perms = (session as { user?: { permissions?: unknown } } | null | undefined)?.user?.permissions
  if (Array.isArray(perms)) return perms.map(String)
  if (typeof perms === 'string') {
    return perms
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
  }
  return []
}

export function filterTabsByPermission(tabs: Tab[], userPermissions: string[]): Tab[] {
  return tabs.filter((t) => !t.permission || userPermissions.includes(t.permission))
}

export function resolveAllowedActiveTabId(
  routeActiveTab: string | undefined,
  activeTab: string,
  allowedTabs: Tab[]
): string {
  const allowedIds = new Set(allowedTabs.map((t) => t.id))
  const requested = routeActiveTab
  return (
    (requested && allowedIds.has(requested) ? requested : null) ??
    (allowedIds.has(activeTab) ? activeTab : null) ??
    allowedTabs[0]?.id ??
    ''
  )
}
