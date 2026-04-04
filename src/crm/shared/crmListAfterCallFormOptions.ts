/** Options for the shared after-call dialog (disposition + call status). */
export const CRM_LIST_AFTER_CALL_DISPOSITION_SELECT_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "callback_requested", label: "Call Back Requested" },
  { value: "follow_up", label: "Follow Up" },
  { value: "do_not_call", label: "Do Not Call" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "spam", label: "Spam" },
];

export const CRM_LIST_AFTER_CALL_STATUS_SELECT_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "answered", label: "Answered" },
  { value: "no_answer", label: "No Answer" },
  { value: "busy", label: "Busy" },
  { value: "voicemail", label: "Voicemail" },
  { value: "disconnected", label: "Disconnected" },
  { value: "network_error", label: "Network Error" },
];
