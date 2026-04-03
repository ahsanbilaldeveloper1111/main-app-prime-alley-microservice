import React from "react";
import { Spinner, Badge, Button } from "react-bootstrap";
import {
  FiUpload,
  FiUser,
  FiUsers,
  FiClock,
  FiX,
  FiCalendar,
} from "react-icons/fi";
import moment from "moment";

export interface CrmListHistoryFormContentProps {
  historyData: any[];
  historyLoading: boolean;
  historyPagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  fetchHistoryData: (page: number) => void;
  campaignsById: Record<number, string>;
  getNameByExtension: (extension: string) => string;
}

export function CrmListHistoryFormContent({
  historyData,
  historyLoading,
  historyPagination,
  fetchHistoryData,
  campaignsById,
  getNameByExtension,
}: CrmListHistoryFormContentProps) {
  return (
    <>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">System Activity Log</h5>
            <p className="text-muted mb-0">
              Track all user activities including CSV uploads, data assignments,
              and campaign management.
            </p>
          </div>
          <div className="text-end">
            <Badge bg="info" className="me-2">
              {historyPagination.total} Total Activities
            </Badge>
            <Badge bg="secondary">
              Page {historyPagination.current_page} of{" "}
              {historyPagination.last_page}
            </Badge>
          </div>
        </div>
      </div>

      {historyLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading activity history...</p>
        </div>
      ) : historyData.length === 0 ? (
        <div className="text-center py-5">
          <FiClock size={48} className="text-muted mb-3" />
          <h6 className="text-muted">No Activity Found</h6>
          <p className="text-muted">
            No activities have been recorded yet.
          </p>
        </div>
      ) : (
        <div className="timeline">
          {historyData.map((activity) => (
            <HistoryTimelineItem
              key={activity.id}
              activity={activity}
              campaignsById={campaignsById}
              getNameByExtension={getNameByExtension}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!historyLoading &&
        historyData.length > 0 &&
        historyPagination.last_page > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <div className="btn-group" role="group">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={historyPagination.current_page === 1}
                onClick={() =>
                  fetchHistoryData(historyPagination.current_page - 1)
                }
              >
                Previous
              </Button>
              <Button variant="outline-secondary" size="sm" disabled>
                {historyPagination.current_page} / {historyPagination.last_page}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={
                  historyPagination.current_page ===
                  historyPagination.last_page
                }
                onClick={() =>
                  fetchHistoryData(historyPagination.current_page + 1)
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
    </>
  );
}

/* ---------- Timeline Item ---------- */

function getActivityIcon(action: string) {
  switch (action) {
    case "upload":
      return <FiUpload size={18} className="text-white" />;
    case "assign":
      return <FiUsers size={18} className="text-white" />;
    case "schedule_call":
    case "reschedule_call":
      return <FiCalendar size={18} className="text-white" />;
    case "cancel_call":
    case "unschedule_call":
      return <FiX size={18} className="text-white" />;
    default:
      return <FiUser size={18} className="text-white" />;
  }
}

function getActivityColor(action: string) {
  switch (action) {
    case "upload":
      return "primary";
    case "assign":
      return "success";
    case "schedule_call":
    case "reschedule_call":
      return "info";
    case "cancel_call":
    case "unschedule_call":
      return "warning";
    default:
      return "secondary";
  }
}

function formatActivityDetails(
  activity: any,
  campaignsById: Record<number, string>,
  getNameByExtension: (ext: string) => string,
) {
  const details = activity.details || {};
  switch (activity.action) {
    case "upload": {
      const campaignNames =
        details.campaign_ids
          ?.map(
            (id: number) => campaignsById[id] || `Campaign #${id}`,
          )
          .join(", ") || "No campaigns";
      const tags = details.tags?.join(", ") || "No tags";
      return (
        <div>
          <div className="mb-1">
            <strong>Uploaded {activity.total_records || 0} prospects</strong>
          </div>
          <div className="small text-muted">
            <div>
              <strong>Campaigns:</strong> {campaignNames}
            </div>
            <div>
              <strong>Tags:</strong> {tags}
            </div>
          </div>
        </div>
      );
    }
    case "assign":
      return (
        <div>
          <div className="mb-1">
            <strong>
              Assigned {activity.total_records || 0} prospects
            </strong>
          </div>
          <div className="small text-muted">
            <strong>To:</strong>{" "}
            {getNameByExtension(activity.user_extension_done_to) ||
              "Campaign team"}
          </div>
        </div>
      );
    case "schedule_call":
      return (
        <div>
          <div className="mb-1">
            <strong>Scheduled call</strong>
          </div>
          <div className="small text-muted">
            <div>
              <strong>Phone:</strong> {details.phone || "N/A"}
            </div>
            <div>
              <strong>Time:</strong>{" "}
              {moment(details.scheduled_call_at).format("MMM DD, YYYY HH:mm")}
            </div>
          </div>
        </div>
      );
    case "reschedule_call":
      return (
        <div>
          <div className="mb-1">
            <strong>Rescheduled call</strong>
          </div>
          <div className="small text-muted">
            <div>
              <strong>Phone:</strong> {details.phone || "N/A"}
            </div>
            <div>
              <strong>From:</strong>{" "}
              {moment(details.old_scheduled_call_at).format("MMM DD, HH:mm")}
            </div>
            <div>
              <strong>To:</strong>{" "}
              {moment(details.new_scheduled_call_at).format("MMM DD, HH:mm")}
            </div>
          </div>
        </div>
      );
    case "cancel_call":
    case "unschedule_call":
      return (
        <div>
          <div className="mb-1">
            <strong>Cancelled call</strong>
          </div>
          <div className="small text-muted">
            <div>
              <strong>Phone:</strong> {details.phone || "N/A"}
            </div>
            <div>
              <strong>Was scheduled:</strong>{" "}
              {moment(
                details.cancelled_scheduled_call_at ||
                  details.unscheduled_call_at,
              ).format("MMM DD, HH:mm")}
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div>
          <div className="mb-1">
            <strong>
              {activity.action
                ?.replace("_", " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </strong>
          </div>
          <div className="small text-muted">
            {activity.details?.description || "No details available"}
          </div>
        </div>
      );
  }
}

function HistoryTimelineItem({
  activity,
  campaignsById,
  getNameByExtension,
}: {
  activity: any;
  campaignsById: Record<number, string>;
  getNameByExtension: (ext: string) => string;
}) {
  return (
    <div className="timeline-item mb-4">
      <div className="d-flex">
        <div className="timeline-marker me-3">
          <div
            className={`bg-${getActivityColor(activity.action)} rounded-circle d-flex align-items-center justify-content-center shadow-sm`}
            style={{ width: "36px", height: "36px" }}
          >
            {getActivityIcon(activity.action)}
          </div>
        </div>
        <div className="timeline-content flex-grow-1">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="flex-grow-1">
                  <h6 className="mb-1 d-flex align-items-center">
                    <strong className="text-primary">
                      {getNameByExtension(
                        activity.user_extension_done_by,
                      ) || "System"}
                    </strong>
                    <Badge
                      bg={getActivityColor(activity.action)}
                      className="ms-2 small"
                    >
                      {activity.action
                        ?.replace("_", " ")
                        .replace(/\b\w/g, (l: string) =>
                          l.toUpperCase(),
                        )}
                    </Badge>
                  </h6>
                  <div className="text-muted">
                    {formatActivityDetails(
                      activity,
                      campaignsById,
                      getNameByExtension,
                    )}
                  </div>
                </div>
                <div className="text-end">
                  <small className="text-muted">
                    {moment(activity.created_at).format("MMM DD, YYYY")}
                  </small>
                  <br />
                  <small className="text-muted">
                    {moment(activity.created_at).format("HH:mm:ss")}
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div className="timeline-line"></div>
        </div>
      </div>
    </div>
  );
}
