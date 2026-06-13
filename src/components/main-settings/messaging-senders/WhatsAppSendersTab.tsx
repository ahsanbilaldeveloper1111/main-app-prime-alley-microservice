import React from 'react'
import { AccountModeSwitchPanel } from './AccountModeSwitchPanel'
import { useWhatsAppSendersPage } from './useWhatsAppSendersPage'
import type { useWhatsAppSendersPage as UseWhatsAppSendersPage } from './useWhatsAppSendersPage'
import {
  ActionButton,
  formatTenantModeLabel,
  InlineAlert,
  MESSAGING_SENDERS_FONT,
  ModeBadge,
  Panel,
  SectionHeading,
  SelectField,
  DefaultBadge,
  StatusBadge,
  statusToneForWhatsAppStatus,
  TextField,
} from './messagingSendersUi'
import './messagingSenders.scss'

type WhatsAppSendersPageState = ReturnType<typeof UseWhatsAppSendersPage>

const WhatsAppSendersTable: React.FC<{ page: WhatsAppSendersPageState }> = ({ page }) => {
  if (page.senders.length === 0) {
    return <p className="messaging-senders__empty">No WhatsApp senders registered yet.</p>
  }

  return (
    <div className="messaging-senders__table-wrap">
      <table className="messaging-senders__table">
        <thead>
          <tr>
            <th>Phone number</th>
            <th>Display name</th>
            <th>Status</th>
            <th>Source</th>
            <th>Default</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {page.senders.map((sender) => (
            <tr key={sender.id}>
              <td>{sender.phone_number}</td>
              <td>{sender.display_name ?? '—'}</td>
              <td>
                <StatusBadge
                  label={sender.twilio_status}
                  tone={statusToneForWhatsAppStatus(sender.twilio_status)}
                />
              </td>
              <td>{sender.source}</td>
              <td>{sender.is_default ? <DefaultBadge /> : '—'}</td>
              <td>
                <ActionButton
                  variant="danger"
                  disabled={page.isDeletingSender}
                  onClick={() => {
                    if (globalThis.confirm(`Remove sender ${sender.phone_number}?`)) {
                      page.deleteSender(sender.id)
                    }
                  }}
                >
                  Remove
                </ActionButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const WhatsAppOtpPanel: React.FC<{ page: WhatsAppSendersPageState }> = ({ page }) => (
  <>
    <InlineAlert tone="warning">
      Enter the verification code sent to {page.phoneNumber} via {page.verificationMethod}.
    </InlineAlert>
    <TextField label="Verification code" value={page.otpCode} onChange={page.setOtpCode} required />
    <div className="messaging-senders__actions">
      <ActionButton onClick={page.submitOtp} disabled={page.isVerifying}>
        {page.isVerifying ? 'Verifying…' : 'Submit OTP'}
      </ActionButton>
    </div>
  </>
)

const WhatsAppActivatingPanel: React.FC<{ page: WhatsAppSendersPageState }> = ({ page }) => (
  <InlineAlert tone="warning">
    Sender #{page.pendingSenderId} is activating. Current status: {page.pendingStatus ?? 'pending'}.
    This page will refresh automatically when ONLINE.
  </InlineAlert>
)

const WhatsAppInitiatePanel: React.FC<{ page: WhatsAppSendersPageState }> = ({ page }) => (
  <>
    <p className="messaging-senders__hint">
      Register a WhatsApp business number on the shared platform account. Use E.164 format (e.g.
      +971564294298).
    </p>
    <TextField
      label="Phone number"
      value={page.phoneNumber}
      onChange={page.setPhoneNumber}
      required
      hint="Include country code with + prefix."
    />
    <TextField
      label="Display name"
      value={page.displayName}
      onChange={page.setDisplayName}
      hint="Shown to recipients as your business name."
    />
    <SelectField
      label="Verification method"
      value={page.verificationMethod}
      onChange={(value) => page.setVerificationMethod(value === 'voice' ? 'voice' : 'sms')}
      options={[
        { value: 'sms', label: 'SMS' },
        { value: 'voice', label: 'Voice call' },
      ]}
    />
    <div className="messaging-senders__actions">
      <ActionButton onClick={page.submitPlatformInitiate} disabled={page.isInitiating}>
        {page.isInitiating ? 'Sending code…' : 'Send verification code'}
      </ActionButton>
    </div>
  </>
)

function renderPlatformSetupContent(page: WhatsAppSendersPageState): React.ReactNode {
  if (page.awaitingOtp) {
    return <WhatsAppOtpPanel page={page} />
  }
  if (page.pendingSenderId && page.pendingStatus !== 'ONLINE') {
    return <WhatsAppActivatingPanel page={page} />
  }
  return <WhatsAppInitiatePanel page={page} />
}

const WhatsAppPlatformSetupPanel: React.FC<{ page: WhatsAppSendersPageState }> = ({ page }) => (
  <Panel title="Add platform sender">{renderPlatformSetupContent(page)}</Panel>
)

const WhatsAppByoSetupPanel: React.FC<{ page: WhatsAppSendersPageState }> = ({ page }) => (
  <Panel title="Twilio account">
    {page.hasConfig ? (
      <InlineAlert tone="success">
        Connected to Twilio
        {page.twilioConfig?.account_sid_masked ? ` (${page.twilioConfig.account_sid_masked})` : ''}.
        Sync WhatsApp senders from your account below.
      </InlineAlert>
    ) : (
      <>
        <p className="messaging-senders__hint">
          Enter your tenant&apos;s Twilio credentials. WhatsApp senders will be synced from the linked
          messaging service.
        </p>
        <TextField
          label="Account SID"
          value={page.accountSid}
          onChange={page.setAccountSid}
          required
          hint="Must start with AC."
        />
        <TextField
          label="Auth token"
          type="password"
          value={page.authToken}
          onChange={page.setAuthToken}
          required
        />
        <TextField
          label="Messaging Service SID"
          value={page.messagingServiceSid}
          onChange={page.setMessagingServiceSid}
          hint="Optional. Must start with MG when provided."
        />
        <div className="messaging-senders__actions">
          <ActionButton onClick={page.submitByoConfig} disabled={page.isSavingConfig}>
            {page.isSavingConfig ? 'Saving…' : 'Connect Twilio'}
          </ActionButton>
        </div>
      </>
    )}

    {page.hasConfig ? (
      <div className="messaging-senders__actions">
        <ActionButton onClick={page.syncSenders} disabled={page.isSyncingSenders}>
          {page.isSyncingSenders ? 'Syncing…' : 'Sync senders'}
        </ActionButton>
        <ActionButton variant="secondary" onClick={page.syncTemplates} disabled={page.isSyncingTemplates}>
          {page.isSyncingTemplates ? 'Syncing…' : 'Sync templates'}
        </ActionButton>
        <ActionButton
          variant="danger"
          onClick={() => {
            if (globalThis.confirm('Remove Twilio configuration?')) {
              page.deleteConfig()
            }
          }}
          disabled={page.isDeletingConfig}
        >
          {page.isDeletingConfig ? 'Removing…' : 'Remove configuration'}
        </ActionButton>
      </div>
    ) : null}
  </Panel>
)

export const WhatsAppSendersTab: React.FC = () => {
  const page = useWhatsAppSendersPage()

  if (page.isLoading) {
    return <p className="messaging-senders__loading">Loading WhatsApp senders…</p>
  }

  if (page.isError) {
    return (
      <div className="messaging-senders">
        <InlineAlert tone="danger">Failed to load WhatsApp senders.</InlineAlert>
        <ActionButton onClick={() => page.refetch().catch(() => undefined)}>Retry</ActionButton>
      </div>
    )
  }

  return (
    <div className="messaging-senders">
      <SectionHeading
        title="WhatsApp senders"
        description="Register WhatsApp business numbers for your tenant. Senders must be ONLINE before they can be used for outbound WhatsApp messages."
      />

      {page.tenantMode ? <ModeBadge label={formatTenantModeLabel(page.tenantMode)} /> : null}

      <Panel title="Registered senders">
        <WhatsAppSendersTable page={page} />
      </Panel>

      <AccountModeSwitchPanel
        channelLabel="WhatsApp"
        platformLabel="Platform (OTP verification)"
        byoLabel="Bring your own Twilio"
        providerName="Twilio"
        currentMode={page.modeSwitch.currentMode}
        tenantMode={page.tenantMode}
        switchPanelOpen={page.modeSwitch.switchPanelOpen}
        targetMode={page.modeSwitch.targetMode}
        onOpenSwitch={page.modeSwitch.openSwitchPanel}
        onCancelSwitch={page.modeSwitch.cancelSwitch}
        onTargetModeChange={page.modeSwitch.setTargetMode}
        onConfirmSwitch={page.modeSwitch.confirmSwitch}
        isCleaningUp={page.modeSwitch.isCleaningUp}
        cleanupSteps={page.modeSwitch.cleanupSteps}
        needsCleanupForSwitch={page.modeSwitch.needsCleanupForSwitch}
        canPickInitialMode={page.modeSwitch.canPickInitialMode}
        setupMode={page.setupMode}
        onSetupModeChange={page.setSetupMode}
      />

      {page.showPlatformSetup ? <WhatsAppPlatformSetupPanel page={page} /> : null}
      {page.showByoSetup ? <WhatsAppByoSetupPanel page={page} /> : null}

      <p className="messaging-senders__footer-note" style={{ fontFamily: MESSAGING_SENDERS_FONT }}>
        Only senders with status <strong>ONLINE</strong> can be used for outbound WhatsApp.
      </p>
    </div>
  )
}
