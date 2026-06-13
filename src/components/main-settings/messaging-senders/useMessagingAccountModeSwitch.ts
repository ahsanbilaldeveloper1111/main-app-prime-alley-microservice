import { parseMessagingApiError } from '@services/messagingSendersApi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

export type MessagingSetupMode = 'platform' | 'byo'

type SenderWithSource = { id: number; source?: string }

type UseMessagingAccountModeSwitchParams<T extends SenderWithSource> = {
  tenantMode: string | null
  platformTenantMode: string
  byoTenantMode: string
  senders: readonly T[]
  hasConfig: boolean
  removeSender: (id: number) => Promise<void>
  removeConfig: () => Promise<void>
  invalidateAll: () => Promise<void>
  channelLabel: string
  providerName: string
}

function inferModeFromSenders(
  senders: readonly SenderWithSource[],
  byoTenantMode: string,
): MessagingSetupMode | null {
  if (senders.length === 0) return null
  const firstSource = senders[0]?.source
  if (firstSource === byoTenantMode || firstSource?.includes('byo')) return 'byo'
  return 'platform'
}

export function useMessagingAccountModeSwitch<T extends SenderWithSource>({
  tenantMode,
  platformTenantMode,
  byoTenantMode,
  senders,
  hasConfig,
  removeSender,
  removeConfig,
  invalidateAll,
  channelLabel,
  providerName,
}: UseMessagingAccountModeSwitchParams<T>) {
  const [setupMode, setSetupMode] = useState<MessagingSetupMode>('platform')
  const [switchPanelOpen, setSwitchPanelOpen] = useState(false)
  const [targetMode, setTargetMode] = useState<MessagingSetupMode | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  const isByoTenant = tenantMode === byoTenantMode
  const isPlatformTenant = tenantMode === platformTenantMode

  useEffect(() => {
    if (isByoTenant) {
      setSetupMode('byo')
    } else if (isPlatformTenant) {
      setSetupMode('platform')
    }
  }, [isByoTenant, isPlatformTenant])

  const currentMode: MessagingSetupMode | null = useMemo(() => {
    if (isByoTenant || hasConfig) return 'byo'
    if (isPlatformTenant) return 'platform'
    return inferModeFromSenders(senders, byoTenantMode)
  }, [isByoTenant, isPlatformTenant, hasConfig, senders, byoTenantMode])

  const effectiveSetupMode = targetMode ?? setupMode
  const isReadyToSwitch = senders.length === 0 && !hasConfig

  const cleanupSteps = useMemo(() => {
    const steps: string[] = []
    if (senders.length > 0) {
      steps.push(
        `Remove ${senders.length} registered ${channelLabel} sender${senders.length === 1 ? '' : 's'}`,
      )
    }
    if (hasConfig) {
      steps.push(`Remove ${providerName} configuration`)
    }
    return steps
  }, [senders.length, hasConfig, channelLabel, providerName])

  const needsCleanupForSwitch = Boolean(targetMode && !isReadyToSwitch)

  const isSwitchInProgress = Boolean(targetMode && needsCleanupForSwitch)

  const openSwitchPanel = useCallback(() => {
    setSwitchPanelOpen(true)
    const opposite: MessagingSetupMode = currentMode === 'byo' ? 'platform' : 'byo'
    setTargetMode(opposite)
  }, [currentMode])

  const cancelSwitch = useCallback(() => {
    setSwitchPanelOpen(false)
    setTargetMode(null)
    setIsCleaningUp(false)
  }, [])

  const applyTargetMode = useCallback(() => {
    if (!targetMode) return
    setSetupMode(targetMode)
    setSwitchPanelOpen(false)
    setTargetMode(null)
    toast.success(
      `Ready to set up ${targetMode === 'byo' ? providerName : 'platform'} ${channelLabel} sending.`,
    )
  }, [targetMode, providerName, channelLabel])

  const runCleanupAndSwitch = useCallback(async () => {
    if (!targetMode) return
    setIsCleaningUp(true)
    try {
      for (const sender of senders) {
        await removeSender(sender.id)
      }
      if (hasConfig) {
        await removeConfig()
      }
      await invalidateAll()
      setSetupMode(targetMode)
      setSwitchPanelOpen(false)
      setTargetMode(null)
      toast.success(
        `Switched to ${targetMode === 'byo' ? providerName : 'platform'} ${channelLabel} mode. Complete setup below.`,
      )
    } catch (error: unknown) {
      toast.error(parseMessagingApiError(error, `Failed to prepare ${channelLabel} mode switch.`))
    } finally {
      setIsCleaningUp(false)
    }
  }, [
    targetMode,
    senders,
    hasConfig,
    removeSender,
    removeConfig,
    invalidateAll,
    channelLabel,
    providerName,
  ])

  const confirmSwitch = useCallback(() => {
    if (!targetMode) return
    if (needsCleanupForSwitch) {
      const parts = [
        `This will remove all ${channelLabel} senders`,
        hasConfig ? `and your ${providerName} configuration` : null,
        `so you can switch to ${targetMode === 'byo' ? providerName : 'platform'} mode.`,
        'Continue?',
      ].filter((part): part is string => Boolean(part))
      if (!globalThis.confirm(parts.join(' '))) return
      runCleanupAndSwitch().catch(() => undefined)
      return
    }
    applyTargetMode()
  }, [
    targetMode,
    needsCleanupForSwitch,
    channelLabel,
    hasConfig,
    providerName,
    runCleanupAndSwitch,
    applyTargetMode,
  ])

  const canPickInitialMode = !tenantMode && senders.length === 0 && !hasConfig && !switchPanelOpen

  return {
    setupMode: effectiveSetupMode,
    setSetupMode,
    currentMode,
    switchPanelOpen,
    targetMode,
    setTargetMode,
    openSwitchPanel,
    cancelSwitch,
    confirmSwitch,
    isCleaningUp,
    cleanupSteps,
    needsCleanupForSwitch,
    isReadyToSwitch,
    isSwitchInProgress,
    canPickInitialMode,
    showPlatformSetup: !isSwitchInProgress && effectiveSetupMode === 'platform',
    showByoSetup: !isSwitchInProgress && effectiveSetupMode === 'byo',
  }
}
