import { useCallback, useEffect, useState } from 'react'
import { SyncLdapUsers, GetLdapSyncJobById } from '@utils/users'

export type LdapSyncJobCounts = {
  processed?: number
  new?: number
  updated?: number
  removed?: number
  errors?: number
}

export type LdapSyncJob = {
  job_id: string
  status?: string
  company_id?: string | null
  requested_by_user_id?: number
  requested_by_extension?: string
  counts?: LdapSyncJobCounts
  last_error?: string | null
  started_at?: string | null
  finished_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

function isJobFinished(statusRaw: unknown): boolean {
  const status = typeof statusRaw === 'string' ? statusRaw.trim().toLowerCase() : ''
  return status === 'completed' || status === 'failed' || status === 'finished' || status === 'cancelled'
}

export const useLdapSync = () => {
  const [loadingSyncRequest, setLoadingSyncRequest] = useState(false)
  const [loadingJobStatus, setLoadingJobStatus] = useState(false)
  const [ldapSyncJob, setLdapSyncJob] = useState<LdapSyncJob | null>(null)
  const [showSyncLdapUsersModal, setShowSyncLdapUsersModal] = useState(false)
  const [errorLdapUsers, setErrorLdapUsers] = useState<any>(null)

  const handleCloseSyncLdapUsersModal = () => {
    setShowSyncLdapUsersModal(false)
  }

  const refreshLdapJobStatus = useCallback(async () => {
    const jobId = ldapSyncJob?.job_id
    if (!jobId) return
    setLoadingJobStatus(true)
    try {
      const res = await GetLdapSyncJobById(jobId)
      if (res === false) return
      setLdapSyncJob(res as LdapSyncJob)
    } catch (error) {
      setErrorLdapUsers(error)
    } finally {
      setLoadingJobStatus(false)
    }
  }, [ldapSyncJob?.job_id])

  const syncLdapUsers = async () => {
    try {
      setLoadingSyncRequest(true)
      setErrorLdapUsers(null)
      setShowSyncLdapUsersModal(true)
      setLdapSyncJob(null)

      const response = await SyncLdapUsers()
      if (response === false) {
        setLdapSyncJob(null)
      } else {
        setLdapSyncJob(response as LdapSyncJob)
      }
    } catch (error) {
      setErrorLdapUsers(error)
    } finally {
      setLoadingSyncRequest(false)
    }
  }

  useEffect(() => {
    const jobId = ldapSyncJob?.job_id
    if (!jobId) return
    if (!showSyncLdapUsersModal) return
    if (isJobFinished(ldapSyncJob?.status)) return

    let cancelled = false

    const pollOnce = async () => {
      if (cancelled) return
      setLoadingJobStatus(true)
      try {
        const res = await GetLdapSyncJobById(jobId)
        if (cancelled) return
        if (res !== false) setLdapSyncJob(res as LdapSyncJob)
      } catch (error: any) {
        const status = error?.response?.status
        // If endpoint/job isn't available, stop polling so UI doesn't spin forever.
        if (status === 404) {
          cancelled = true
          return
        }
        if (!cancelled) setErrorLdapUsers(error)
      } finally {
        if (!cancelled) setLoadingJobStatus(false)
      }
    }

    pollOnce()
    const intervalId = globalThis.setInterval(pollOnce, 3000)
    return () => {
      cancelled = true
      globalThis.clearInterval(intervalId)
    }
  }, [ldapSyncJob?.job_id, ldapSyncJob?.status, showSyncLdapUsersModal])

  const loadingLdapUsers = loadingSyncRequest || loadingJobStatus

  return {
    loadingLdapUsers,
    ldapSyncJob,
    showSyncLdapUsersModal,
    errorLdapUsers,
    handleCloseSyncLdapUsersModal,
    syncLdapUsers,
    refreshLdapJobStatus,
  }
}

