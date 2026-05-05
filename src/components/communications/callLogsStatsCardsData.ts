import type { StatsCardData } from "@components/GenericStatsCards";
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
      iconColor: "#3B82F6",
      iconBgColor: "#DBEAFE",
      subtitle: "Show total calls in the system",
    },
    {
      title: "Extensions",
      value: summary?.extensions || 0,
      icon: Hash,
      iconColor: "#8B5CF6",
      iconBgColor: "#EDE9FE",
      subtitle: "Show Extensions currently engaged or making calls",
    },
    {
      title: "Inbound",
      value: summary?.inbound || 0,
      icon: PhoneIncoming,
      iconColor: "#10B981",
      iconBgColor: "#D1FAE5",
      subtitle: "Total received call count",
    },
    {
      title: "Outbound",
      value: summary?.outbound || 0,
      icon: PhoneOutgoing,
      iconColor: "#0EA5E9",
      iconBgColor: "#E0F2FE",
      subtitle: "Total placed call count",
    },
  ];
}
