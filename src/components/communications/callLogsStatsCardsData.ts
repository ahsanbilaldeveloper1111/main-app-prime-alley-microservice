import type { StatsCardData } from "@components/GenericStatsCards";
import { COMMUNICATIONS_STAT_COLORS } from "@utils/communications/communicationsThemeTokens";
import { Hash, Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import type { CallLogsSummary } from "./callLogTypes";

export function buildCallLogsStatsCardsData(
  totalCalls: number,
  summary: CallLogsSummary,
): StatsCardData[] {
  return [
    {
      title: "Total Calls",
      value: totalCalls || 0,
      icon: Phone,
      iconColor: COMMUNICATIONS_STAT_COLORS.primary.iconColor,
      iconBgColor: COMMUNICATIONS_STAT_COLORS.primary.iconBgColor,
      subtitle: "Show total calls in the system",
    },
    {
      title: "Extensions",
      value: summary?.extensions || 0,
      icon: Hash,
      iconColor: COMMUNICATIONS_STAT_COLORS.primary.iconColor,
      iconBgColor: COMMUNICATIONS_STAT_COLORS.primary.iconBgColor,
      subtitle: "Show Extensions currently engaged or making calls",
    },
    {
      title: "Inbound",
      value: summary?.inbound || 0,
      icon: PhoneIncoming,
      iconColor: COMMUNICATIONS_STAT_COLORS.inbound.iconColor,
      iconBgColor: COMMUNICATIONS_STAT_COLORS.inbound.iconBgColor,
      subtitle: "Total received call count",
    },
    {
      title: "Outbound",
      value: summary?.outbound || 0,
      icon: PhoneOutgoing,
      iconColor: COMMUNICATIONS_STAT_COLORS.outbound.iconColor,
      iconBgColor: COMMUNICATIONS_STAT_COLORS.outbound.iconBgColor,
      subtitle: "Total placed call count",
    },
  ];
}
