import React from "react";
import { useAppSelector } from "../../toolkit/hooks";
import CallLogsDateRangeBanner from "./CallLogsDateRangeBanner";

const CallLogsDateRangeBannerConnected: React.FC = () => {
  const showDateRange = useAppSelector((s) => s.callLogsList.showDateRange);
  const startDateTime = useAppSelector((s) => s.callLogsList.startDateTime);
  const endDateTime = useAppSelector((s) => s.callLogsList.endDateTime);

  if (!showDateRange || !startDateTime || !endDateTime) {
    return null;
  }

  return (
    <CallLogsDateRangeBanner
      startDateTime={startDateTime}
      endDateTime={endDateTime}
    />
  );
};

export default CallLogsDateRangeBannerConnected;
