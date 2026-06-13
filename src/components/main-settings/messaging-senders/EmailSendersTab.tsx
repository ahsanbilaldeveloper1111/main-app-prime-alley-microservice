import React from 'react'
import { AccountModeSwitchPanel } from './AccountModeSwitchPanel'
import { useEmailSendersPage } from './useEmailSendersPage'
import type { useEmailSendersPage as UseEmailSendersPage } from './useEmailSendersPage'
import {
  ActionButton,
  formatTenantModeLabel,
  InlineAlert,
  MESSAGING_SENDERS_FONT,
  ModeBadge,
  Panel,
  SectionHeading,
  DefaultBadge,
  StatusBadge,
  statusToneForEmailVerification,
  TextField,
} from './messagingSendersUi'
import './messagingSenders.scss'

type EmailSendersPageState = ReturnType<typeof UseEmailSendersPage>

const EmailSendersTable: React.FC<{ page: EmailSendersPageState }> = ({ page }) => {
  if (page.senders.length === 0) {
    return <p className="messaging-senders__empty">No email senders registered yet.</p>
  }

  return (
    <div className="messaging-senders__table-wrap">
      <table className="messaging-senders__table">
        <thead>
          <tr>
            <th>Email</th>
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
              <td>{sender.from_email}</td>
              <td>{sender.from_name}</td>
              <td>
                <StatusBadge
                  label={sender.verification_status}
                  tone={statusToneForEmailVerification(sender.verification_status)}
                />
              </td>
              <td>{sender.source}</td>
              <td>{sender.is_default ? <DefaultBadge /> : '—'}</td>
              <td>
                <ActionButton
                  variant="danger"
                  disabled={page.isDeletingSender}
                  onClick={() => {
                    if (globalThis.confirm(`Remove sender ${sender.from_email}?`)) {
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

const EmailPlatformSetupPanel: React.FC<{ page: EmailSendersPageState }> = ({ page }) => (
  <Panel title="Add platform sender">
    {page.isVerifying ? (
      <>
        <InlineAlert tone="warning">
          Check your email for the verification link sent to{' '}
          <strong>{page.platformForm.from_email || 'the sender address'}</strong>. After clicking the
          link, this page will update automatically. Status: {page.pendingStatus ?? 'pending'}.
        </InlineAlert>
        <div className="messaging-senders__actions">
          <ActionButton variant="secondary" onClick={page.resendVerification} disabled={page.isResending}>
            {page.isResending ? 'Resending…' : 'Resend verification email'}
          </ActionButton>
        </div>
      </>
    ) : (
      <>
        <p className="messaging-senders__hint">
          SendGrid will email a verification link to the sender address. Required fields follow
          CAN-SPAM requirements.
        </p>
        <div className="messaging-senders__form-grid">
          <TextField
            label="From email"
            value={page.platformForm.from_email}
            onChange={(value) => page.updatePlatformField('from_email', value)}
            required
            hint="Verification link is sent to this address."
          />
          <TextField
            label="From name"
            value={page.platformForm.from_name}
            onChange={(value) => page.updatePlatformField('from_name', value)}
            required
          />
          <TextField
            label="Nickname"
            value={page.platformForm.nickname ?? ''}
            onChange={(value) => page.updatePlatformField('nickname', value)}
          />
          <TextField
            label="Street address"
            value={page.platformForm.address}
            onChange={(value) => page.updatePlatformField('address', value)}
            required
          />
          <TextField
            label="City"
            value={page.platformForm.city}
            onChange={(value) => page.updatePlatformField('city', value)}
            required
          />
          <TextField
            label="Country"
            value={page.platformForm.country}
            onChange={(value) => page.updatePlatformField('country', value)}
            required
          />
          <TextField
            label="State / region"
            value={page.platformForm.state ?? ''}
            onChange={(value) => page.updatePlatformField('state', value)}
          />
          <TextField
            label="ZIP / postal code"
            value={page.platformForm.zip ?? ''}
            onChange={(value) => page.updatePlatformField('zip', value)}
          />
          <TextField
            label="Reply-to email"
            value={page.platformForm.reply_to_email ?? ''}
            onChange={(value) => page.updatePlatformField('reply_to_email', value)}
          />
          <TextField
            label="Reply-to name"
            value={page.platformForm.reply_to_name ?? ''}
            onChange={(value) => page.updatePlatformField('reply_to_name', value)}
          />
        </div>
        <div className="messaging-senders__actions">
          <ActionButton
            onClick={page.submitPlatformForm}
            disabled={!page.isPlatformFormValid || page.isInitiating}
          >
            {page.isInitiating ? 'Sending verification…' : 'Send verification email'}
          </ActionButton>
        </div>
      </>
    )}
  </Panel>
)

const EmailByoSetupPanel: React.FC<{ page: EmailSendersPageState }> = ({ page }) => (
  <Panel title="SendGrid account">
    {page.hasConfig ? (
      <InlineAlert tone="success">
        Connected to SendGrid
        {page.sendGridConfig?.api_key_masked ? ` (${page.sendGridConfig.api_key_masked})` : ''}. Sync
        senders from your account below.
      </InlineAlert>
    ) : (
      <>
        <p className="messaging-senders__hint">
          Enter your tenant&apos;s SendGrid API key (starts with SG.). Senders will be synced from
          that account.
        </p>
        <TextField
          label="SendGrid API key"
          type="password"
          value={page.apiKey}
          onChange={page.setApiKey}
          required
          hint="Must start with SG."
        />
        <div className="messaging-senders__actions">
          <ActionButton onClick={page.submitByoConfig} disabled={page.isSavingConfig}>
            {page.isSavingConfig ? 'Saving…' : 'Connect SendGrid'}
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
            if (globalThis.confirm('Remove SendGrid configuration? Delete all synced senders first.')) {
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

export const EmailSendersTab: React.FC = () => {
  const page = useEmailSendersPage()

  if (page.isLoading) {
    return <p className="messaging-senders__loading">Loading email senders…</p>
  }

  if (page.isError) {
    return (
      <div className="messaging-senders">
        <InlineAlert tone="danger">Failed to load email senders.</InlineAlert>
        <ActionButton onClick={() => page.refetch().catch(() => undefined)}>Retry</ActionButton>
      </div>
    )
  }

  return (
    <div className="messaging-senders">
      <SectionHeading
        title="Email senders"
        description="Register outbound email addresses for your tenant. Verified senders can be used when sending email from CRM and communications."
      />

      {page.tenantMode ? <ModeBadge label={formatTenantModeLabel(page.tenantMode)} /> : null}

      <Panel title="Registered senders">
        <EmailSendersTable page={page} />
      </Panel>

      <AccountModeSwitchPanel
        channelLabel="email"
        platformLabel="Platform (verify email address)"
        byoLabel="Bring your own SendGrid"
        providerName="SendGrid"
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

      {page.showPlatformSetup ? <EmailPlatformSetupPanel page={page} /> : null}
      {page.showByoSetup ? <EmailByoSetupPanel page={page} /> : null}

      <p className="messaging-senders__footer-note" style={{ fontFamily: MESSAGING_SENDERS_FONT }}>
        Only senders with status <strong>verified</strong> can be used for outbound email.
      </p>
    </div>
  )
}
