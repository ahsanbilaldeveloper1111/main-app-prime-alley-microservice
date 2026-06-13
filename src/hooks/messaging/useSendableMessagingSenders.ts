import { communicationsKeys } from '@query/keys'
import {
  listEmailSenders,
  listWhatsAppSenders,
  type EmailSender,
  type WhatsAppSender,
} from '@services/messagingSendersApi'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

export function pickDefaultSenderId<T extends { id: number; is_default: boolean }>(
  senders: readonly T[],
): number | null {
  if (senders.length === 0) {
    return null
  }
  const defaultSender = senders.find((sender) => sender.is_default)
  return defaultSender?.id ?? senders[0].id
}

export function formatEmailSenderLabel(sender: EmailSender): string {
  const name = sender.from_name?.trim()
  if (name) {
    return `${name} <${sender.from_email}>`
  }
  return sender.from_email
}

export function formatWhatsAppSenderLabel(sender: WhatsAppSender): string {
  const name = sender.display_name?.trim()
  if (name) {
    return `${name} (${sender.phone_number})`
  }
  return sender.phone_number
}

export function useSendableEmailSenders(enabled: boolean) {
  const query = useQuery({
    queryKey: [...communicationsKeys.messagingSenders.emailSenders(), 'sendable'],
    queryFn: () => listEmailSenders({ per_page: 100, verification_status: 'verified' }),
    enabled,
    staleTime: 60_000,
  })

  const senders = useMemo(
    () => (query.data?.senders ?? []).filter((s) => s.verification_status === 'verified'),
    [query.data?.senders],
  )

  const defaultId = useMemo(() => pickDefaultSenderId(senders), [senders])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }
    setSelectedId(defaultId)
  }, [enabled, defaultId])

  const resolvedId = selectedId ?? defaultId

  return {
    senders,
    selectedId: resolvedId,
    setSelectedId,
    defaultId,
    isLoading: query.isPending,
    isError: query.isError,
    isEmpty: !query.isPending && senders.length === 0,
    refetch: query.refetch,
  }
}

export function useSendableWhatsAppSenders(enabled: boolean) {
  const query = useQuery({
    queryKey: [...communicationsKeys.messagingSenders.whatsAppSenders(), 'sendable'],
    queryFn: () => listWhatsAppSenders({ per_page: 100, status: 'ONLINE' }),
    enabled,
    staleTime: 60_000,
  })

  const senders = useMemo(
    () => (query.data?.senders ?? []).filter((s) => s.twilio_status === 'ONLINE'),
    [query.data?.senders],
  )

  const defaultId = useMemo(() => pickDefaultSenderId(senders), [senders])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }
    setSelectedId(defaultId)
  }, [enabled, defaultId])

  const resolvedId = selectedId ?? defaultId

  return {
    senders,
    selectedId: resolvedId,
    setSelectedId,
    defaultId,
    isLoading: query.isPending,
    isError: query.isError,
    isEmpty: !query.isPending && senders.length === 0,
    refetch: query.refetch,
  }
}
