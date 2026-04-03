/** Shared CRM list-page option lists and mock data (Sonar/DRY). */

export const CRM_LIST_PAGE_STATIC_TAGS = [
  { value: "hot-lead", label: "Hot Lead" },
  { value: "cold-lead", label: "Cold Lead" },
  { value: "follow-up", label: "Follow Up" },
  { value: "interested", label: "Interested" },
  { value: "not-interested", label: "Not Interested" },
  { value: "callback", label: "Callback" },
  { value: "qualified", label: "Qualified" },
  { value: "unqualified", label: "Unqualified" },
] as const;

export type CrmListPageCallEndReason = {
  value: string;
  label: string;
  color: string;
};

export const CRM_LIST_PAGE_CALL_END_REASONS: readonly CrmListPageCallEndReason[] =
  [
    { value: "call_later", label: "Call Later", color: "warning" },
    { value: "dont_call", label: "Don't Call", color: "danger" },
    {
      value: "not_reachable",
      label: "Number Not Reachable",
      color: "secondary",
    },
    { value: "dncr_blocklisted", label: "DNCR Blocklisted", color: "dark" },
    { value: "answered", label: "Answered", color: "success" },
    { value: "busy", label: "Busy", color: "info" },
    { value: "no_answer", label: "No Answer", color: "light" },
  ];

export type CrmListPageMockCallHistoryEntry = {
  id: number;
  duration: string;
  endReason: string;
  disposition: string;
  calledAt: string;
  recordingUrl: string;
  comment: string;
};

const MOCK_CALL_HISTORIES: readonly CrmListPageMockCallHistoryEntry[] = [
  {
    id: 1,
    duration: "2:34",
    endReason: "answered",
    disposition: "interested",
    calledAt: "2024-01-15T10:30:00Z",
    recordingUrl: "https://example.com/recording1.mp3",
    comment:
      "Client showed interest in our premium package. Asked for pricing details and wants to schedule a demo next week.",
  },
  {
    id: 2,
    duration: "0:45",
    endReason: "busy",
    disposition: "callback_requested",
    calledAt: "2024-01-14T14:20:00Z",
    recordingUrl: "https://example.com/recording2.mp3",
    comment:
      "Line was busy. Left voicemail with callback request for tomorrow morning.",
  },
  {
    id: 3,
    duration: "1:12",
    endReason: "no_answer",
    disposition: "no_answer",
    calledAt: "2024-01-13T09:15:00Z",
    recordingUrl: "https://example.com/recording3.mp3",
    comment:
      "No answer after multiple rings. Will try again later in the day.",
  },
  {
    id: 4,
    duration: "3:45",
    endReason: "answered",
    disposition: "not_interested",
    calledAt: "2024-01-12T16:20:00Z",
    recordingUrl: "https://example.com/recording4.mp3",
    comment:
      "Client politely declined. Not interested in our services at this time. Asked to be removed from calling list.",
  },
  {
    id: 5,
    duration: "4:12",
    endReason: "answered",
    disposition: "follow_up",
    calledAt: "2024-01-11T11:30:00Z",
    recordingUrl: "https://example.com/recording5.mp3",
    comment:
      "Client needs to discuss with their team. Will follow up in 2 weeks with additional information about our enterprise solutions.",
  },
];

/**
 * Demo call history for sidebar UI (legacy mock); slice varies by entry id.
 */
export function getCrmListPageMockCallHistory(
  entryId: number,
): CrmListPageMockCallHistoryEntry[] {
  return [...MOCK_CALL_HISTORIES].slice(0, (entryId % 3) + 2);
}
