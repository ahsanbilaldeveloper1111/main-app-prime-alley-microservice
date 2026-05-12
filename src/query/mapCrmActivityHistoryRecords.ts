import type { HistoryListRecord } from "@utils/crm";
import { stripTrailingParenthetical } from "@utils/displayName";

export type ActivityRecordRow = {
  id: number;
  record_id?: string;
  customer: string;
  type: string;
  agent: string;
  lastActivity: string;
  stage: string;
  tags: string[];
  dateTime: string;
};

export function mapCrmActivityHistoryRecords(
  records: HistoryListRecord[],
  extensions: readonly any[],
): ActivityRecordRow[] {
  return records.map((record: HistoryListRecord, index: number) => {
    const typeCapitalized =
      record.record_type.charAt(0).toUpperCase() + record.record_type.slice(1);

    const dateObj = new Date(record.updated_at);
    const dateStr = dateObj.toISOString().split("T")[0];
    const timeStr = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const formattedDate = `${dateStr} ${timeStr}`;

    const agentExtension = record.assigned_to || record.action_by;
    let agentName = "N/A";
    if (agentExtension) {
      const extension = extensions.find(
        (ext: any) => ext?.id == agentExtension || ext?.extension == agentExtension,
      );
      const fullName = String(
        extension?.display_name || extension?.name || agentExtension,
      );
      agentName = stripTrailingParenthetical(fullName) || fullName;
    }

    return {
      id: Number.parseInt(record.record_id, 10) || index + 1,
      record_id: record.record_id,
      customer: record.record_name,
      type: typeCapitalized,
      agent: agentName,
      lastActivity: formattedDate,
      dateTime: record.updated_at,
      stage: record.stage_name || "N/A",
      tags: [],
    };
  });
}
