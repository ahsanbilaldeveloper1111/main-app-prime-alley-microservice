import type { StatsCardData } from "@components/GenericStatsCards";
import { Hash, Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import type { CallRecordingsSummary } from "@toolkit/callRecordingsList/slice";

export function buildCallRecordingsStatsCardsData(
  summary: CallRecordingsSummary | undefined,
): StatsCardData[] {
  return [
    {
      title: "Extensions",
      value: summary?.extensions || 0,
      icon: Hash,
      iconColor: "#0066CC",
      iconBgColor: "#EEF2FF",
      metric: {
        text: "Extensions in the system",
        dotColor: "#0066CC",
      },
    },
    {
      title: "Remote Numbers",
      value: summary?.numbers || 0,
      icon: Phone,
      iconColor: "#0066CC",
      iconBgColor: "#EEF2FF",
      metric: {
        text: "Remote numbers in the system",
        dotColor: "#0066CC",
      },
    },
    {
      title: "Inbound",
      value: summary?.inbound || 0,
      icon: PhoneIncoming,
      iconColor: "#059669",
      iconBgColor: "#D1FAE5",
      metric: {
        text: "Inbound calls in the system",
        dotColor: "#059669",
      },
    },
    {
      title: "Outbound",
      value: summary?.outbound || 0,
      icon: PhoneOutgoing,
      iconColor: "#0066CC",
      iconBgColor: "#E0F2FE",
      metric: {
        text: "Outbound calls in the system",
        dotColor: "#0066CC",
      },
    },
  ];
}
