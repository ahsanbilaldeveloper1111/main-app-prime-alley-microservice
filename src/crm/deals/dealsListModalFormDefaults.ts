export const DEALS_EMPTY_MEETING_FORM = {
  dealId: null as number | null,
  dealName: "",
  meetingName: "",
  meetingType: "Online",
  meetingDate: "",
  meetingTime: "",
  meetingOutcome: "",
  extensions: [] as string[],
};

export const DEALS_EMPTY_FOLLOWUP_FORM = {
  dealId: null as number | null,
  dealName: "",
  followUpDate: "",
  followUpStatus: "Pending",
  communicationChannel: "Phone Call",
  communicationChannelOther: "",
  notes: "",
  userExtension: "",
};

export type DealsFollowupFormShape = typeof DEALS_EMPTY_FOLLOWUP_FORM;

/** True when user chose "Other" channel but did not fill the detail field. */
export function dealsFollowupChannelOtherIsInvalid(
  data: Pick<
    DealsFollowupFormShape,
    "communicationChannel" | "communicationChannelOther"
  >,
): boolean {
  return (
    data.communicationChannel === "Other" &&
    !data.communicationChannelOther?.trim()
  );
}
