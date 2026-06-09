import type { StatsCardData } from "@components/GenericStatsCards";
import {
  buildExtensionsStatsCard,
  buildInboundStatsCard,
  buildOutboundStatsCard,
  buildRemoteNumbersStatsCard,
} from "@components/communications/communicationsStatsCardBuilders";
import type { CallRecordingsSummary } from "@toolkit/callRecordingsList/slice";

export function buildCallRecordingsStatsCardsData(
  summary: CallRecordingsSummary | undefined,
): StatsCardData[] {
  return [
    buildExtensionsStatsCard(summary?.extensions || 0, "Extensions in the system"),
    buildRemoteNumbersStatsCard(
      summary?.numbers || 0,
      "Remote numbers in the system",
    ),
    buildInboundStatsCard(summary?.inbound || 0, "Inbound calls in the system"),
    buildOutboundStatsCard(summary?.outbound || 0, "Outbound calls in the system"),
  ];
}
