/** Late adjustment feature disabled — uncomment the block below to re-enable. */

/*
import {
  formatLateAdjustmentRequestStatus,
  isLateAdjustmentPendingStatus,
} from "@page-modules/workforce/check-in-out/lateAdjustmentDomain";
import type { LateAdjustmentRequest } from "@utils/staffManagement";
import { Check, Clock, X } from "lucide-react";
import React, { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";

export type LateAdjustmentRequestsPanelProps = Readonly<{
  requests: LateAdjustmentRequest[];
  isLoading: boolean;
  isError: boolean;
  actionLoading: boolean;
  getEmployeeLabel: (userId: string | null | undefined) => string;
  onApprove: (request: LateAdjustmentRequest, comment: string) => void;
  onReject: (request: LateAdjustmentRequest, comment: string) => void;
  onRetry: () => void;
}>;

function LateAdjustmentRequestRow({
  request,
  actionLoading,
  employeeLabel,
  onApprove,
  onReject,
}: Readonly<{
  request: LateAdjustmentRequest;
  actionLoading: boolean;
  employeeLabel: string;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
}>) {
  const [comment, setComment] = useState("");
  const lateMinutes = request.late_minutes;
  const pending = isLateAdjustmentPendingStatus(request.status);

  return (
    <article className="late-adjustment-panel__row">
      <div className="late-adjustment-panel__row-main">
        <p className="late-adjustment-panel__employee">{employeeLabel}</p>
        <p className="late-adjustment-panel__meta">
          {lateMinutes != null && lateMinutes > 0
            ? `${lateMinutes} min late`
            : "Late arrival"}
          {request.work_date ? ` · ${request.work_date}` : ""}
        </p>
        {request.reason ? (
          <p className="late-adjustment-panel__reason">{request.reason}</p>
        ) : null}
        {!pending ? (
          <p className="late-adjustment-panel__status">
            Status: {formatLateAdjustmentRequestStatus(request.status)}
            {request.comment ? ` — ${request.comment}` : ""}
          </p>
        ) : null}
      </div>

      {pending ? (
        <div className="late-adjustment-panel__actions">
          <Form.Control
            type="text"
            className="late-adjustment-panel__comment"
            placeholder="Optional comment"
            value={comment}
            disabled={actionLoading}
            onChange={(event) => setComment(event.target.value)}
          />
          <div className="late-adjustment-panel__action-buttons">
            <Button
              type="button"
              variant="success"
              size="sm"
              disabled={actionLoading}
              onClick={() => onApprove(comment.trim())}
            >
              <Check size={14} aria-hidden />
              Approve
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              disabled={actionLoading}
              onClick={() => onReject(comment.trim())}
            >
              <X size={14} aria-hidden />
              Reject
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function LateAdjustmentRequestsPanel({
  requests,
  isLoading,
  isError,
  actionLoading,
  getEmployeeLabel,
  onApprove,
  onReject,
  onRetry,
}: LateAdjustmentRequestsPanelProps) {
  const pendingRequests = requests.filter((request) =>
    isLateAdjustmentPendingStatus(request.status),
  );

  return (
    <section className="check-in-out-page__card late-adjustment-panel">
      <div className="check-in-out-page__header">
        <h2 className="check-in-out-page__title check-in-out-page__title--section">
          <Clock size={18} aria-hidden />
          Late adjustment requests
        </h2>
        <p className="check-in-out-page__subtitle">
          Review and approve or reject employee late adjustment requests.
        </p>
      </div>

      {isLoading ? (
        <output className="late-adjustment-panel__loading">
          <Spinner animation="border" size="sm" aria-hidden />
          <span>Loading requests…</span>
        </output>
      ) : null}

      {isError ? (
        <div className="late-adjustment-panel__empty">
          <p>Failed to load late adjustment requests.</p>
          <Button type="button" variant="outline-primary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && pendingRequests.length === 0 ? (
        <p className="late-adjustment-panel__empty">No pending late adjustment requests.</p>
      ) : null}

      {!isLoading && !isError && pendingRequests.length > 0 ? (
        <div className="late-adjustment-panel__list">
          {pendingRequests.map((request) => (
            <LateAdjustmentRequestRow
              key={request.id}
              request={request}
              actionLoading={actionLoading}
              employeeLabel={getEmployeeLabel(request.user_id)}
              onApprove={(comment) => onApprove(request, comment)}
              onReject={(comment) => onReject(request, comment)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
*/
