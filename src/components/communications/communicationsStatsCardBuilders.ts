import type { StatsCardData } from "@components/GenericStatsCards";
import type { LucideIcon } from "lucide-react";
import { Hash, Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";

type CommunicationsStatsPalette = {
  iconColor: string;
  iconBgColor: string;
  dotColor: string;
};

export const COMMUNICATIONS_STATS_PALETTES = {
  primary: {
    iconColor: "#0066CC",
    iconBgColor: "#EEF2FF",
    dotColor: "#0066CC",
  },
  inbound: {
    iconColor: "#059669",
    iconBgColor: "#D1FAE5",
    dotColor: "#059669",
  },
  outbound: {
    iconColor: "#0066CC",
    iconBgColor: "#E0F2FE",
    dotColor: "#0066CC",
  },
} as const satisfies Record<string, CommunicationsStatsPalette>;

export function buildCommunicationsMetricCard(
  title: string,
  value: number,
  icon: LucideIcon,
  palette: CommunicationsStatsPalette,
  metricText: string,
): StatsCardData {
  return {
    title,
    value: value || 0,
    icon,
    iconColor: palette.iconColor,
    iconBgColor: palette.iconBgColor,
    metric: {
      text: metricText,
      dotColor: palette.dotColor,
    },
  };
}

export function buildExtensionsStatsCard(
  extensions: number,
  metricText: string,
): StatsCardData {
  return buildCommunicationsMetricCard(
    "Extensions",
    extensions,
    Hash,
    COMMUNICATIONS_STATS_PALETTES.primary,
    metricText,
  );
}

export function buildInboundStatsCard(
  inbound: number,
  metricText: string,
): StatsCardData {
  return buildCommunicationsMetricCard(
    "Inbound",
    inbound,
    PhoneIncoming,
    COMMUNICATIONS_STATS_PALETTES.inbound,
    metricText,
  );
}

export function buildOutboundStatsCard(
  outbound: number,
  metricText: string,
): StatsCardData {
  return buildCommunicationsMetricCard(
    "Outbound",
    outbound,
    PhoneOutgoing,
    COMMUNICATIONS_STATS_PALETTES.outbound,
    metricText,
  );
}

export function buildRemoteNumbersStatsCard(
  numbers: number,
  metricText: string,
): StatsCardData {
  return buildCommunicationsMetricCard(
    "Remote Numbers",
    numbers,
    Phone,
    COMMUNICATIONS_STATS_PALETTES.primary,
    metricText,
  );
}

export function buildTotalCallsStatsCard(
  totalCalls: number,
  metricText: string,
): StatsCardData {
  return buildCommunicationsMetricCard(
    "Total Calls",
    totalCalls,
    Phone,
    COMMUNICATIONS_STATS_PALETTES.primary,
    metricText,
  );
}
