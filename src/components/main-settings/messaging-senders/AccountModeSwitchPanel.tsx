import React from 'react'
import type { MessagingSetupMode } from './useMessagingAccountModeSwitch'
import {
  ActionButton,
  formatTenantModeLabel,
  InlineAlert,
  Panel,
} from './messagingSendersUi'

type AccountModeSwitchPanelProps = Readonly<{
  channelLabel: string
  platformLabel: string
  byoLabel: string
  providerName: string
  currentMode: MessagingSetupMode | null
  tenantMode: string | null
  switchPanelOpen: boolean
  targetMode: MessagingSetupMode | null
  onOpenSwitch: () => void
  onCancelSwitch: () => void
  onTargetModeChange: (mode: MessagingSetupMode) => void
  onConfirmSwitch: () => void
  isCleaningUp: boolean
  cleanupSteps: string[]
  needsCleanupForSwitch: boolean
  canPickInitialMode: boolean
  setupMode: MessagingSetupMode
  onSetupModeChange: (mode: MessagingSetupMode) => void
}>

function resolveActiveLabel(
  tenantMode: string | null,
  currentMode: MessagingSetupMode | null,
  providerName: string,
): string {
  if (tenantMode) {
    return formatTenantModeLabel(tenantMode)
  }
  if (currentMode === 'byo') {
    return `Bring your own ${providerName}`
  }
  if (currentMode === 'platform') {
    return 'Platform (shared account)'
  }
  return 'Not configured'
}

function resolveTargetSetupLabel(
  targetMode: MessagingSetupMode | null,
  providerName: string,
): string {
  return targetMode === 'byo' ? providerName : 'platform'
}

function getConfirmButtonLabel(
  isCleaningUp: boolean,
  needsCleanupForSwitch: boolean,
  targetMode: MessagingSetupMode | null,
  providerName: string,
): string {
  if (isCleaningUp) {
    return 'Cleaning up…'
  }
  if (needsCleanupForSwitch) {
    return `Remove all and switch to ${resolveTargetSetupLabel(targetMode, providerName)}`
  }
  return 'Confirm switch'
}

type ModeToggleProps = Readonly<{
  selectedMode: MessagingSetupMode | null
  platformLabel: string
  byoLabel: string
  onTargetModeChange: (mode: MessagingSetupMode) => void
}>

const ModeToggle: React.FC<ModeToggleProps> = ({
  selectedMode,
  platformLabel,
  byoLabel,
  onTargetModeChange,
}) => (
  <div className="messaging-senders__mode-toggle">
    <ActionButton
      variant={selectedMode === 'platform' ? 'primary' : 'secondary'}
      onClick={() => onTargetModeChange('platform')}
    >
      {platformLabel}
    </ActionButton>
    <ActionButton
      variant={selectedMode === 'byo' ? 'primary' : 'secondary'}
      onClick={() => onTargetModeChange('byo')}
    >
      {byoLabel}
    </ActionButton>
  </div>
)

type InitialModePickerProps = Readonly<{
  channelLabel: string
  platformLabel: string
  byoLabel: string
  setupMode: MessagingSetupMode
  onSetupModeChange: (mode: MessagingSetupMode) => void
}>

const InitialModePicker: React.FC<InitialModePickerProps> = ({
  channelLabel,
  platformLabel,
  byoLabel,
  setupMode,
  onSetupModeChange,
}) => (
  <Panel title="Choose account type">
    <p className="messaging-senders__hint">
      Pick how this tenant will send {channelLabel}. You cannot mix platform and bring-your-own modes
      on the same channel.
    </p>
    <ModeToggle
      selectedMode={setupMode}
      platformLabel={platformLabel}
      byoLabel={byoLabel}
      onTargetModeChange={onSetupModeChange}
    />
  </Panel>
)

type SwitchModeFormProps = Readonly<{
  platformLabel: string
  byoLabel: string
  providerName: string
  currentMode: MessagingSetupMode | null
  targetMode: MessagingSetupMode | null
  onTargetModeChange: (mode: MessagingSetupMode) => void
  onConfirmSwitch: () => void
  onCancelSwitch: () => void
  isCleaningUp: boolean
  cleanupSteps: string[]
  needsCleanupForSwitch: boolean
}>

const SwitchModeForm: React.FC<SwitchModeFormProps> = ({
  platformLabel,
  byoLabel,
  providerName,
  currentMode,
  targetMode,
  onTargetModeChange,
  onConfirmSwitch,
  onCancelSwitch,
  isCleaningUp,
  cleanupSteps,
  needsCleanupForSwitch,
}) => {
  const showReadyAlert =
    !needsCleanupForSwitch && targetMode != null && targetMode !== currentMode

  return (
    <>
      <p className="messaging-senders__hint">Select the mode you want to use going forward.</p>
      <ModeToggle
        selectedMode={targetMode}
        platformLabel={platformLabel}
        byoLabel={byoLabel}
        onTargetModeChange={onTargetModeChange}
      />

      {needsCleanupForSwitch && cleanupSteps.length > 0 ? (
        <InlineAlert tone="warning">
          Switching requires cleanup first:
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {cleanupSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </InlineAlert>
      ) : null}

      {showReadyAlert ? (
        <InlineAlert tone="success">
          No senders or provider configuration are blocking the switch. Confirm to continue with{' '}
          {resolveTargetSetupLabel(targetMode, providerName)} setup.
        </InlineAlert>
      ) : null}

      <div className="messaging-senders__actions">
        <ActionButton onClick={onConfirmSwitch} disabled={!targetMode || isCleaningUp}>
          {getConfirmButtonLabel(isCleaningUp, needsCleanupForSwitch, targetMode, providerName)}
        </ActionButton>
        <ActionButton variant="secondary" onClick={onCancelSwitch} disabled={isCleaningUp}>
          Cancel
        </ActionButton>
      </div>
    </>
  )
}

export const AccountModeSwitchPanel: React.FC<AccountModeSwitchPanelProps> = ({
  channelLabel,
  platformLabel,
  byoLabel,
  providerName,
  currentMode,
  tenantMode,
  switchPanelOpen,
  targetMode,
  onOpenSwitch,
  onCancelSwitch,
  onTargetModeChange,
  onConfirmSwitch,
  isCleaningUp,
  cleanupSteps,
  needsCleanupForSwitch,
  canPickInitialMode,
  setupMode,
  onSetupModeChange,
}) => {
  if (canPickInitialMode) {
    return (
      <InitialModePicker
        channelLabel={channelLabel}
        platformLabel={platformLabel}
        byoLabel={byoLabel}
        setupMode={setupMode}
        onSetupModeChange={onSetupModeChange}
      />
    )
  }

  const activeLabel = resolveActiveLabel(tenantMode, currentMode, providerName)

  return (
    <Panel title="Account mode">
      <p className="messaging-senders__hint" style={{ marginBottom: 12 }}>
        Current mode: <strong>{activeLabel}</strong>. You can switch between platform verification
        and your own {providerName} account at any time.
      </p>

      {switchPanelOpen ? (
        <SwitchModeForm
          platformLabel={platformLabel}
          byoLabel={byoLabel}
          providerName={providerName}
          currentMode={currentMode}
          targetMode={targetMode}
          onTargetModeChange={onTargetModeChange}
          onConfirmSwitch={onConfirmSwitch}
          onCancelSwitch={onCancelSwitch}
          isCleaningUp={isCleaningUp}
          cleanupSteps={cleanupSteps}
          needsCleanupForSwitch={needsCleanupForSwitch}
        />
      ) : (
        <ActionButton variant="secondary" onClick={onOpenSwitch}>
          Switch account mode
        </ActionButton>
      )}
    </Panel>
  )
}
