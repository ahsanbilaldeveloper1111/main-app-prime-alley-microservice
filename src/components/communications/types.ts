export interface GeneralStats {
  totalCalls: number;
  totalInbound: number;
  totalOutbound: number;
  totalMissedIncoming: number;
  totalMissedOutgoing: number;
  totalAvgRingTime: number;
  totalAvgDuration: number;
  totalAvgCost: number;
}

export interface TrendByCountry {
  CallDate: string;
  StartHour: string;
  Country: string;
  IsCountryTotal: string;
  Calls: string;
  Unanswered: string;
  Answered: string;
  AvgRingTime: string;
  MaxRingTime: string;
  TotalDuration: string;
  AvgDuration: string;
  Duration: string;
  Cost: string;
  AvgCost: string;
}

export interface ExtensionStatRow {
  Extension: string;
  Calls: string;
  Answered: string;
  Unanswered: string;
  TotalDuration: string;
  Cost?: string;
}
