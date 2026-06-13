import type { StatsCardData } from "@components/GenericStatsCards";
import {
  buildExtensionsStatsCard,
  buildInboundStatsCard,
  buildOutboundStatsCard,
  buildTotalCallsStatsCard,
} from "@components/communications/communicationsStatsCardBuilders";
import type { CallLogsSummary } from "./callLogTypes";

export function buildCallLogsStatsCardsData(
  totalCalls: number,
  summary: CallLogsSummary,
): StatsCardData[] {
  return [
    buildTotalCallsStatsCard(totalCalls, "Currently in the system"),
    buildExtensionsStatsCard(
      summary?.extensions || 0,
      "Extensions engaged or making calls",
    ),
    buildInboundStatsCard(summary?.inbound || 0, "Total received call count"),
    buildOutboundStatsCard(summary?.outbound || 0, "Total placed call count"),
  ];
}
