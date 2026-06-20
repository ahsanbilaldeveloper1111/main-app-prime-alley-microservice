/** Row shape from call-recordings API (dataList items). */
export interface CallRecordingRow {
  Id?: string;
  DateTime?: string;
  AgentExtension?: string;
  Username?: string;
  Department?: string;
  RemotePartyNumber?: string;
  Direction?: string;
  Duration?: string | number;
  imagicle?: string;
  [key: string]: unknown;
}
