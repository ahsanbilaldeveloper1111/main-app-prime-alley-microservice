export type CampaignConsoleTeamOption = { id: number; name: string };

export type CampaignConsoleTeamUser = {
  loginId: string;
  firstName?: string;
  lastName?: string;
  extension?: string;
  state?: string;
  stateChangeTime?: string;
  reasonCode?: { label?: string };
  uri?: string;
  dialogsUri?: string;
  mediaType?: number;
  pendingState?: string;
  wrapUpTimer?: number;
};

export type CampaignConsoleTeamApiResponse = {
  status?: string;
  statusCode?: string;
  responseData?: {
    id?: number;
    name?: string;
    uri?: string;
    users?: CampaignConsoleTeamUser[];
  };
};

export type CampaignConsoleDisplayAgent = {
  id: string;
  loginId: string;
  name: string;
  /** Raw Finesse state for logic (READY, TALKING, ACTIVE, …). */
  state: string;
  /** Formatted label for the roster table. */
  stateLabel: string;
  stateColor: string;
  timeInState: string;
  extension: string;
  label?: string;
};

/** Fixed menu in a portal; avoids table/overflow clipping and row paint order. */
export type CampaignConsoleActionMenuPortalState = {
  agent: CampaignConsoleDisplayAgent;
  top: number;
  left: number;
  maxHeight: number;
};
