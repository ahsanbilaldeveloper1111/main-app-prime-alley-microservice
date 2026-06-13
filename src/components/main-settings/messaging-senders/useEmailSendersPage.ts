import { communicationsKeys } from '@query/keys'
import {
  deleteEmailSender,
  deleteSendGridConfig,
  getEmailSenderVerificationStatus,
  getSendGridConfig,
  initiatePlatformEmailSender,
  listEmailSenders,
  parseMessagingApiError,
  resendEmailSenderVerification,
  saveSendGridConfig,
  syncSendGridSenders,
  syncSendGridTemplates,
  type PlatformEmailInitiatePayload,
} from '@services/messagingSendersApi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useMessagingAccountModeSwitch } from './useMessagingAccountModeSwitch'

const POLL_MS = 4000

const defaultPlatformForm = (): PlatformEmailInitiatePayload => ({
  from_email: '',
  from_name: '',
  address: '',
  city: '',
  country: '',
  reply_to_email: '',
  reply_to_name: '',
  nickname: '',
  state: '',
  zip: '',
})

export function useEmailSendersPage() {
  const { status: sessionStatus } = useSession()
  const queryClient = useQueryClient()
  const enabled = sessionStatus === 'authenticated'

  const [platformForm, setPlatformForm] = useState(defaultPlatformForm)
  const [apiKey, setApiKey] = useState('')
  const [pendingSenderId, setPendingSenderId] = useState<number | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)

  const sendersQuery = useQuery({
    queryKey: communicationsKeys.messagingSenders.emailSenders(),
    queryFn: () => listEmailSenders({ per_page: 100 }),
    enabled,
    staleTime: 30_000,
  })

  const configQuery = useQuery({
    queryKey: communicationsKeys.messagingSenders.sendGridConfig(),
    queryFn: getSendGridConfig,
    enabled,
    staleTime: 30_000,
  })

  const tenantMode = sendersQuery.data?.tenantMode ?? null
  const senders = sendersQuery.data?.senders ?? []
  const hasConfig = Boolean(configQuery.data?.has_api_key ?? configQuery.data?.api_key_masked)

  const invalidateAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: communicationsKeys.messagingSenders.emailSenders() }),
      queryClient.invalidateQueries({ queryKey: communicationsKeys.messagingSenders.sendGridConfig() }),
    ])
  }, [queryClient])

  const resetPendingVerification = useCallback(() => {
    setPendingSenderId(null)
    setPendingStatus(null)
    setPlatformForm(defaultPlatformForm())
    setApiKey('')
  }, [])

  const modeSwitch = useMessagingAccountModeSwitch({
    tenantMode,
    platformTenantMode: 'platform',
    byoTenantMode: 'byo_sendgrid',
    senders,
    hasConfig,
    removeSender: deleteEmailSender,
    removeConfig: deleteSendGridConfig,
    invalidateAll: async () => {
      resetPendingVerification()
      await invalidateAll()
    },
    channelLabel: 'email',
    providerName: 'SendGrid',
  })

  const initiateMutation = useMutation({
    mutationFn: initiatePlatformEmailSender,
    onSuccess: (sender) => {
      setPendingSenderId(sender.id)
      setPendingStatus(sender.verification_status)
      toast.success('Verification email sent. Check the inbox for the sender address.')
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to start email sender verification.'))
    },
  })

  const resendMutation = useMutation({
    mutationFn: resendEmailSenderVerification,
    onSuccess: () => {
      toast.success('Verification email resent.')
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to resend verification email.'))
    },
  })

  const deleteSenderMutation = useMutation({
    mutationFn: deleteEmailSender,
    onSuccess: () => {
      toast.success('Email sender removed.')
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to remove email sender.'))
    },
  })

  const saveConfigMutation = useMutation({
    mutationFn: saveSendGridConfig,
    onSuccess: () => {
      setApiKey('')
      toast.success('SendGrid account connected.')
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to save SendGrid configuration.'))
    },
  })

  const syncSendersMutation = useMutation({
    mutationFn: syncSendGridSenders,
    onSuccess: ({ count }) => {
      toast.success(`Synced ${count} sender${count === 1 ? '' : 's'} from SendGrid.`)
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to sync SendGrid senders.'))
    },
  })

  const syncTemplatesMutation = useMutation({
    mutationFn: syncSendGridTemplates,
    onSuccess: ({ count }) => {
      toast.success(`Synced ${count} template${count === 1 ? '' : 's'} from SendGrid.`)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to sync SendGrid templates.'))
    },
  })

  const deleteConfigMutation = useMutation({
    mutationFn: deleteSendGridConfig,
    onSuccess: () => {
      toast.success('SendGrid configuration removed.')
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to remove SendGrid configuration.'))
    },
  })

  useEffect(() => {
    if (!pendingSenderId) return
    if (pendingStatus === 'verified' || pendingStatus === 'failed') return

    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      try {
        const sender = await getEmailSenderVerificationStatus(pendingSenderId)
        if (cancelled || !sender) return
        setPendingStatus(sender.verification_status)
        if (sender.verification_status === 'verified') {
          toast.success('Email sender verified successfully.')
          setPendingSenderId(null)
          invalidateAll().catch(() => undefined)
        }
        if (sender.verification_status === 'failed') {
          toast.error('Email sender verification failed. Try resending or add a new sender.')
        }
      } catch {
        // Keep polling; transient errors are expected during verification.
      }
    }

    poll()
    const intervalId = globalThis.setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      globalThis.clearInterval(intervalId)
    }
  }, [pendingSenderId, pendingStatus, invalidateAll])

  const updatePlatformField = useCallback(
    (field: keyof PlatformEmailInitiatePayload, value: string) => {
      setPlatformForm((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const submitPlatformForm = useCallback(() => {
    const payload: PlatformEmailInitiatePayload = {
      from_email: platformForm.from_email.trim(),
      from_name: platformForm.from_name.trim(),
      address: platformForm.address.trim(),
      city: platformForm.city.trim(),
      country: platformForm.country.trim(),
      reply_to_email: (platformForm.reply_to_email || platformForm.from_email).trim(),
      reply_to_name: (platformForm.reply_to_name || platformForm.from_name).trim(),
    }
    const nickname = platformForm.nickname?.trim()
    const state = platformForm.state?.trim()
    const zip = platformForm.zip?.trim()
    if (nickname) payload.nickname = nickname
    if (state) payload.state = state
    if (zip) payload.zip = zip
    initiateMutation.mutate(payload)
  }, [platformForm, initiateMutation])

  const submitByoConfig = useCallback(() => {
    const trimmed = apiKey.trim()
    if (!trimmed.startsWith('SG.')) {
      toast.error('SendGrid API key must start with SG.')
      return
    }
    saveConfigMutation.mutate({ api_key: trimmed })
  }, [apiKey, saveConfigMutation])

  const isPlatformFormValid = useMemo(() => {
    return (
      platformForm.from_email.trim() !== '' &&
      platformForm.from_name.trim() !== '' &&
      platformForm.address.trim() !== '' &&
      platformForm.city.trim() !== '' &&
      platformForm.country.trim() !== ''
    )
  }, [platformForm])

  return {
    senders,
    tenantMode,
    isLoading: sendersQuery.isPending,
    isError: sendersQuery.isError,
    refetch: sendersQuery.refetch,
    setupMode: modeSwitch.setupMode,
    setSetupMode: modeSwitch.setSetupMode,
    showPlatformSetup: modeSwitch.showPlatformSetup,
    showByoSetup: modeSwitch.showByoSetup,
    modeSwitch,
    platformForm,
    updatePlatformField,
    submitPlatformForm,
    isPlatformFormValid,
    isInitiating: initiateMutation.isPending,
    pendingSenderId,
    pendingStatus,
    resendVerification: () => {
      if (pendingSenderId) {
        resendMutation.mutate(pendingSenderId)
      }
    },
    isResending: resendMutation.isPending,
    deleteSender: (id: number) => deleteSenderMutation.mutate(id),
    isDeletingSender: deleteSenderMutation.isPending,
    apiKey,
    setApiKey,
    submitByoConfig,
    isSavingConfig: saveConfigMutation.isPending,
    syncSenders: () => syncSendersMutation.mutate(),
    isSyncingSenders: syncSendersMutation.isPending,
    syncTemplates: () => syncTemplatesMutation.mutate(),
    isSyncingTemplates: syncTemplatesMutation.isPending,
    deleteConfig: () => deleteConfigMutation.mutate(),
    isDeletingConfig: deleteConfigMutation.isPending,
    sendGridConfig: configQuery.data,
    hasConfig,
    isVerifying: Boolean(pendingSenderId) && pendingStatus !== 'verified' && pendingStatus !== 'failed',
  }
}
