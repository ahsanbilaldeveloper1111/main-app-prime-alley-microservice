import React, { useMemo } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
} from "lucide-react";
import StatsCards from "@components/GenericStatsCards";
import { COMMUNICATIONS_STAT_COLORS } from "@utils/communications/communicationsThemeTokens";
import { useAppSelector } from "../../toolkit/hooks";

const GRID_MIN_WIDTH = "180px";

const CallStatsSummaryCards: React.FC = () => {
  const stats = useAppSelector((s) => s.callDashboard.generalStats);

  const data = useMemo(
    () => [
      {
        title: "Total Calls",
        value: stats.totalCalls,
        icon: Phone,
        iconColor: COMMUNICATIONS_STAT_COLORS.primary.iconColor,
        iconBgColor: COMMUNICATIONS_STAT_COLORS.primary.iconBgColor,
        subtitle: "Total calls in the system",
      },
      {
        title: "Inbound",
        value: stats.totalInbound,
        icon: PhoneIncoming,
        iconColor: COMMUNICATIONS_STAT_COLORS.inbound.iconColor,
        iconBgColor: COMMUNICATIONS_STAT_COLORS.inbound.iconBgColor,
        subtitle: "Inbound calls in the system",
      },
      {
        title: "Outbound",
        value: stats.totalOutbound,
        icon: PhoneOutgoing,
        iconColor: COMMUNICATIONS_STAT_COLORS.outbound.iconColor,
        iconBgColor: COMMUNICATIONS_STAT_COLORS.outbound.iconBgColor,
        subtitle: "Outbound calls in the system",
      },
      {
        title: "Missed Incoming",
        value: stats.totalMissedIncoming,
        icon: PhoneMissed,
        iconColor: COMMUNICATIONS_STAT_COLORS.warning.iconColor,
        iconBgColor: COMMUNICATIONS_STAT_COLORS.warning.iconBgColor,
        subtitle: "Missed incoming calls in the system",
      },
      {
        title: "Missed Outgoing",
        value: stats.totalMissedOutgoing,
        icon: PhoneOff,
        iconColor: COMMUNICATIONS_STAT_COLORS.danger.iconColor,
        iconBgColor: COMMUNICATIONS_STAT_COLORS.danger.iconBgColor,
        subtitle: "Missed outgoing calls in the system",
      },
    ],
    [stats],
  );

  return (
    <div className="mb-4">
      <StatsCards data={data} gridMinWidth={GRID_MIN_WIDTH} />
    </div>
  );
};

export default CallStatsSummaryCards;
