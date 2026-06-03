import React from "react";
import moment from "moment";
import { Calendar } from "lucide-react";
import { formatDateTimeToLocal, GlobalDateTimeFormat } from "@utils/Helper";

export interface CallLogsDateRangeBannerProps {
  startDateTime: string;
  endDateTime: string;
}

const CallLogsDateRangeBanner: React.FC<
  Readonly<CallLogsDateRangeBannerProps>
> = ({ startDateTime, endDateTime }) => {
  if (
    !moment.utc(startDateTime).isValid() ||
    !moment.utc(endDateTime).isValid()
  ) {
    return null;
  }

  return (
    <div
      className="call-logs-date-range-banner communications-date-range-banner mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "10px 12px",
      }}
    >
      <div className="d-flex align-items-center gap-2">
        <span
          className="d-inline-flex align-items-center justify-content-center"
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "#eef2ff",
            color: "#4f46e5",
          }}
        >
          <Calendar size={16} />
        </span>
        <div className="d-flex align-items-center gap-2 communications-date-range-banner__label-row">
          <span
            className="text-muted"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.3px",
            }}
          >
            Selected Date Range
          </span>
          <span
            className="communications-date-range-banner__dates"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)} —{" "}
            {formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CallLogsDateRangeBanner;
