import {
  formatDateTimeFilterForApi,
} from "@utils/communicationsDateUtils";
import { normalizePhoneValue } from "@utils/phoneMatch";

export function formatCallRecordingsFiltersForApi(filters: Record<string, unknown>): {
  applied: Record<string, unknown>;
  normalizedRemotePartyNumber: string | undefined;
} {
  const applied: Record<string, unknown> = { ...filters };

  const normalizedRemotePartyNumber = normalizePhoneValue(
    applied.remote_party_number as string | undefined,
  );
  if (normalizedRemotePartyNumber) {
    applied.remote_party_number = normalizedRemotePartyNumber;
  } else {
    delete applied.remote_party_number;
  }

  if (applied.start_date != null) {
    applied.start_date = formatDateTimeFilterForApi(
      String(applied.start_date as string),
      false,
    );
  }
  if (applied.end_date != null) {
    applied.end_date = formatDateTimeFilterForApi(
      String(applied.end_date as string),
      true,
    );
  }
  delete applied.timezone;

  return { applied, normalizedRemotePartyNumber };
}
