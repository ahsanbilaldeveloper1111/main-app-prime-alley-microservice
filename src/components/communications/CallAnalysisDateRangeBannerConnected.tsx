import React from "react";
import { useAppSelector } from "@toolkit/hooks";
import CallLogsDateRangeBanner from "./CallLogsDateRangeBanner";

const CallAnalysisDateRangeBannerConnected: React.FC = () => {
  const filters = useAppSelector((s) => s.callAnalysisList?.filters);

  const startDateTime = String(filters?.start_datetime ?? "");
  const endDateTime = String(filters?.end_datetime ?? "");

  if (!startDateTime || !endDateTime) {
    return null;
  }

  return (
    <CallLogsDateRangeBanner
      startDateTime={startDateTime}
      endDateTime={endDateTime}
    />
  );
};

export default CallAnalysisDateRangeBannerConnected;
