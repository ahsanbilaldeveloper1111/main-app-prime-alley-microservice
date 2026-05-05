/** Local storage and cross-tab keys for CTI / useCtiStomp. */

export const CTI_CALL_STATES = {
  STORAGE_KEY: "cti_call_states",
  TIMESTAMP_KEY: "cti_call_states_timestamp",
  EXPIRY_HOURS: 24,
} as const;

/** Master tab keys (matching crossTabCtiManager). */
export const CTI_MASTER_TAB = {
  KEY: "cti_master_tab_id",
  HEARTBEAT_KEY: "cti_master_tab_id_heartbeat",
  TIMEOUT_MS: 5000,
} as const;
