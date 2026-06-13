import { communicationsKeys } from '@query/keys'
import {
  deleteTwilioConfig,
  deleteWhatsAppSender,
  getTwilioConfig,
  initiatePlatformWhatsAppSender,
  listWhatsAppSenders,
  parseMessagingApiError,
  refreshWhatsAppSenderStatus,
  saveTwilioConfig,
  syncTwilioSenders,
  syncTwilioTemplates,
  verifyPlatformWhatsAppSender,
} from '@services/messagingSendersApi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useMessagingAccountModeSwitch } from './useMessagingAccountModeSwitch'

const POLL_MS = 4000

export function useWhatsAppSendersPage() {
  const { status: sessionStatus } = useSession()
  const queryClient = useQueryClient()
  const enabled = sessionStatus === 'authenticated'

  const [phoneNumber, setPhoneNumber] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [verificationMethod, setVerificationMethod] = useState<'sms' | 'voice'>('sms')
  const [pendingSenderId, setPendingSenderId] = useState<number | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [awaitingOtp, setAwaitingOtp] = useState(false)
  const [accountSid, setAccountSid] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [messagingServiceSid, setMessagingServiceSid] = useState('')

  const sendersQuery = useQuery({
    queryKey: communicationsKeys.messagingSenders.whatsAppSenders(),
    queryFn: () => listWhatsAppSenders({ per_page: 100 }),
    enabled,
    staleTime: 30_000,
  })

  const configQuery = useQuery({
    queryKey: communicationsKeys.messagingSenders.twilioConfig(),
    queryFn: getTwilioConfig,
    enabled,
    staleTime: 30_000,
  })

  const tenantMode = sendersQuery.data?.tenantMode ?? null
  const senders = sendersQuery.data?.senders ?? []
  const hasConfig = Boolean(configQuery.data?.has_credentials ?? configQuery.data?.account_sid_masked)

  const invalidateAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: communicationsKeys.messagingSenders.whatsAppSenders() }),
      queryClient.invalidateQueries({ queryKey: communicationsKeys.messagingSenders.twilioConfig() }),
    ])
  }, [queryClient])

  const resetPendingVerification = useCallback(() => {
    setPendingSenderId(null)
    setPendingStatus(null)
    setAwaitingOtp(false)
    setOtpCode('')
    setPhoneNumber('')
    setDisplayName('')
    setAccountSid('')
    setAuthToken('')
    setMessagingServiceSid('')
  }, [])

  const modeSwitch = useMessagingAccountModeSwitch({
    tenantMode,
    platformTenantMode: 'platform',
    byoTenantMode: 'byo_twilio',
    senders,
    hasConfig,
    removeSender: deleteWhatsAppSender,
    removeConfig: deleteTwilioConfig,
    invalidateAll: async () => {
      resetPendingVerification()
      await invalidateAll()
    },
    channelLabel: 'WhatsApp',
    providerName: 'Twilio',
  })

  const initiateMutation = useMutation({
    mutationFn: initiatePlatformWhatsAppSender,
    onSuccess: (sender) => {
      setPendingSenderId(sender.id)
      setPendingStatus(sender.twilio_status)
      setAwaitingOtp(true)
      toast.success('Verification code sent. Enter the OTP to complete registration.')
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to start WhatsApp sender registration.'))
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ senderId, code }: { senderId: number; code: string }) =>
      verifyPlatformWhatsAppSender({
        whatsapp_sender_id: senderId,
        verification_code: code,
      }),
    onSuccess: (sender) => {
      setPendingStatus(sender.twilio_status)
      setAwaitingOtp(false)
      setOtpCode('')
      toast.success('OTP accepted. Waiting for sender to come online.')
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to verify WhatsApp sender.'))
    },
  })

  const deleteSenderMutation = useMutation({
    mutationFn: deleteWhatsAppSender,
    onSuccess: () => {
      toast.success('WhatsApp sender removed.')
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to remove WhatsApp sender.'))
    },
  })

  const saveConfigMutation = useMutation({
    mutationFn: saveTwilioConfig,
    onSuccess: () => {
      setAccountSid('')
      setAuthToken('')
      toast.success('Twilio account connected.')
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to save Twilio configuration.'))
    },
  })

  const syncSendersMutation = useMutation({
    mutationFn: syncTwilioSenders,
    onSuccess: ({ count }) => {
      toast.success(`Synced ${count} sender${count === 1 ? '' : 's'} from Twilio.`)
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to sync Twilio senders.'))
    },
  })

  const syncTemplatesMutation = useMutation({
    mutationFn: syncTwilioTemplates,
    onSuccess: ({ count }) => {
      toast.success(`Synced ${count} template${count === 1 ? '' : 's'} from Twilio.`)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to sync Twilio templates.'))
    },
  })

  const deleteConfigMutation = useMutation({
    mutationFn: deleteTwilioConfig,
    onSuccess: () => {
      toast.success('Twilio configuration removed.')
      invalidateAll().catch(() => undefined)
    },
    onError: (error: unknown) => {
      toast.error(parseMessagingApiError(error, 'Failed to remove Twilio configuration.'))
    },
  })

  useEffect(() => {
    if (!pendingSenderId) return
    if (pendingStatus === 'ONLINE') return
    if (awaitingOtp) return

    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      try {
        const sender = await refreshWhatsAppSenderStatus(pendingSenderId)
        if (cancelled || !sender) return
        setPendingStatus(sender.twilio_status)
        if (sender.twilio_status === 'ONLINE') {
          toast.success('WhatsApp sender is online.')
          setPendingSenderId(null)
          invalidateAll().catch(() => undefined)
        }
      } catch {
        // Keep polling until sender is online or user leaves the page.
      }
    }

    poll()
    const intervalId = globalThis.setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      globalThis.clearInterval(intervalId)
    }
  }, [pendingSenderId, pendingStatus, awaitingOtp, invalidateAll])

  const submitPlatformInitiate = useCallback(() => {
    const trimmedPhone = phoneNumber.trim()
    if (!trimmedPhone.startsWith('+')) {
      toast.error('Phone number must be in E.164 format (e.g. +971564294298).')
      return
    }
    initiateMutation.mutate({
      phone_number: trimmedPhone,
      verification_method: verificationMethod,
      display_name: displayName.trim() || undefined,
    })
  }, [phoneNumber, verificationMethod, displayName, initiateMutation])

  const submitOtp = useCallback(() => {
    if (!pendingSenderId) return
    const code = otpCode.trim()
    if (!code) {
      toast.error('Enter the verification code.')
      return
    }
    verifyMutation.mutate({ senderId: pendingSenderId, code })
  }, [pendingSenderId, otpCode, verifyMutation])

  const submitByoConfig = useCallback(() => {
    const sid = accountSid.trim()
    const token = authToken.trim()
    const serviceSid = messagingServiceSid.trim()
    if (!sid.startsWith('AC')) {
      toast.error('Twilio Account SID must start with AC.')
      return
    }
    if (!token) {
      toast.error('Auth token is required.')
      return
    }
    if (serviceSid && !serviceSid.startsWith('MG')) {
      toast.error('Messaging Service SID must start with MG when provided.')
      return
    }
    saveConfigMutation.mutate({
      account_sid: sid,
      auth_token: token,
      ...(serviceSid ? { messaging_service_sid: serviceSid } : {}),
    })
  }, [accountSid, authToken, messagingServiceSid, saveConfigMutation])

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
    phoneNumber,
    setPhoneNumber,
    displayName,
    setDisplayName,
    verificationMethod,
    setVerificationMethod,
    submitPlatformInitiate,
    isInitiating: initiateMutation.isPending,
    awaitingOtp,
    otpCode,
    setOtpCode,
    submitOtp,
    isVerifying: verifyMutation.isPending,
    pendingSenderId,
    pendingStatus,
    deleteSender: (id: number) => deleteSenderMutation.mutate(id),
    isDeletingSender: deleteSenderMutation.isPending,
    accountSid,
    setAccountSid,
    authToken,
    setAuthToken,
    messagingServiceSid,
    setMessagingServiceSid,
    submitByoConfig,
    isSavingConfig: saveConfigMutation.isPending,
    syncSenders: () => syncSendersMutation.mutate(),
    isSyncingSenders: syncSendersMutation.isPending,
    syncTemplates: () => syncTemplatesMutation.mutate(),
    isSyncingTemplates: syncTemplatesMutation.isPending,
    deleteConfig: () => deleteConfigMutation.mutate(),
    isDeletingConfig: deleteConfigMutation.isPending,
    twilioConfig: configQuery.data,
    hasConfig,
  }
}
