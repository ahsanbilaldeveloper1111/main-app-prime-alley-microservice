import React from "react";
import { useAppSelector } from "@toolkit/hooks";
import CallLogsDateRangeBanner from "./CallLogsDateRangeBanner";

const CallRecordingsDateRangeBannerConnected: React.FC = () => {
  const appliedFilters = useAppSelector(
    (s) => s.callRecordingsList.appliedFilters,
  );
  const startDateTime = useAppSelector((s) => s.callRecordingsList.startDateTime);

  const startDateTimeValue = String(
    appliedFilters.start_date ?? startDateTime ?? "",
  );
  const endDateTimeValue = String(appliedFilters.end_date ?? "");

  if (!startDateTimeValue || !endDateTimeValue) {
    return null;
  }

  return (
    <CallLogsDateRangeBanner
      startDateTime={startDateTimeValue}
      endDateTime={endDateTimeValue}
    />
  );
};

export default CallRecordingsDateRangeBannerConnected;
