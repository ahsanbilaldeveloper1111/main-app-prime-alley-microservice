import React from 'react'
import FormModal from '@pages/partial/FormModal'
import { Spinner } from 'react-bootstrap'
import type { LdapSyncJob } from '@hooks/controlhub/users/useLdapSync'

interface SyncLdapUsersModalProps {
  show: boolean
  onHide: () => void
  loading: boolean
  job: LdapSyncJob | null
  onRefreshJob: () => void
}

function getJobStatusText(statusRaw: unknown): string {
  if (typeof statusRaw !== 'string') return '—'
  const s = statusRaw.trim()
  return s || '—'
}

function isJobFinished(statusRaw: unknown): boolean {
  const status = typeof statusRaw === 'string' ? statusRaw.trim().toLowerCase() : ''
  return status === 'completed' || status === 'failed' || status === 'finished' || status === 'cancelled'
}

const SyncLdapUsersModal: React.FC<SyncLdapUsersModalProps> = ({
  show,
  onHide,
  loading,
  job,
  onRefreshJob,
}) => {

  const counts = job?.counts ?? {}
  const processed = counts.processed ?? 0
  const created = counts.new ?? 0
  const updated = counts.updated ?? 0
  const removed = counts.removed ?? 0
  const errors = counts.errors ?? 0
  const statusText = getJobStatusText(job?.status)
  const finished = isJobFinished(job?.status)

  let bodyContent: React.ReactNode
  if (loading) {
    bodyContent = (
      <div className="d-flex align-items-center gap-2 text-muted">
        <Spinner animation="border" size="sm" />
        <span>Syncing users…</span>
      </div>
    )
  } else if (job == null) {
    bodyContent = <div className="text-muted">No job found.</div>
  } else if (finished === false) {
    bodyContent = (
      <div className="d-flex align-items-center gap-2 text-muted">
        <Spinner animation="border" size="sm" />
        <span>Sync in progress (status: {statusText})</span>
      </div>
    )
  } else {
    bodyContent = (
      <table className="table table-bordered table-align-center mb-0">
        <thead>
          <tr>
            <th>Type</th>
            <th>Total Users</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Processed</td>
            <td>{processed}</td>
          </tr>
          <tr>
            <td>New</td>
            <td>{created}</td>
          </tr>
          <tr>
            <td>Updated</td>
            <td>{updated}</td>
          </tr>
          <tr>
            <td>Removed</td>
            <td>{removed}</td>
          </tr>
          <tr>
            <td>Errors</td>
            <td>{errors}</td>
          </tr>
        </tbody>
      </table>
    )
  }

  return (
    <FormModal
      show={show}
      onHide={onHide}
      title="Synced Users"
      desc=""
      size="lg"
      formHtml={
        <div>
          {bodyContent}
        </div>
      }
      submitButtonText="Close"
      cancelButtonText="Close"
      onSubmit={onHide}
      ShowSubmitButton={true}
          submitButtonVariant="primary"
          hideCancelButton={true}
          hideFooterInstructions={true}
          
    />
  )
}

export default SyncLdapUsersModal

