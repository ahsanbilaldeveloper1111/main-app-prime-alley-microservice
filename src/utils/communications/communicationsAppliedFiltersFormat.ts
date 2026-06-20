import { normalizePhoneValue } from '@utils/phoneMatch';
import {
    formatEndDateValueForApi,
    formatStartDateValueForApi,
} from './communicationsDateExtensionFilters';

function normalizeCalledNumbersFilter(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map(normalizePhoneValue).filter(Boolean);
    }

    if (typeof value === 'string' && value) {
        return value
            .split(',')
            .map((entry) => entry.trim())
            .map(normalizePhoneValue)
            .filter(Boolean);
    }

    return [];
}

export function formatCallLogsFiltersForApi(filters: Record<string, any>): Record<string, any> {
    const formattedFilters: Record<string, any> = { ...filters };

    const calledNumbers = normalizeCalledNumbersFilter(formattedFilters.called_numbers);
    if (calledNumbers.length > 0) {
        formattedFilters.called_numbers = calledNumbers;
    } else {
        delete formattedFilters.called_numbers;
    }

    delete formattedFilters.phone_number;
    delete formattedFilters.phone_number_exact;

    if (formattedFilters.start_datetime) {
        formattedFilters.start_datetime = formatStartDateValueForApi(
            String(formattedFilters.start_datetime),
        );
    }

    if (formattedFilters.end_datetime) {
        formattedFilters.end_datetime = formatEndDateValueForApi(
            String(formattedFilters.end_datetime),
        );
    }

    delete formattedFilters.timezone;

    return formattedFilters;
}

export type CallRecordingsFormattedFilters = {
    applied: Record<string, any>;
    normalizedRemotePartyNumber: string;
};

export function formatCallRecordingsFiltersForApi(
    filters: Record<string, any>,
): CallRecordingsFormattedFilters {
    const formattedFilters: Record<string, any> = { ...filters };

    if (formattedFilters.start_datetime && !formattedFilters.start_date) {
        formattedFilters.start_date = formattedFilters.start_datetime;
    }
    if (formattedFilters.end_datetime && !formattedFilters.end_date) {
        formattedFilters.end_date = formattedFilters.end_datetime;
    }
    delete formattedFilters.start_datetime;
    delete formattedFilters.end_datetime;

    if (formattedFilters.start_date) {
        formattedFilters.start_date = formatStartDateValueForApi(
            String(formattedFilters.start_date),
        );
    }

    if (formattedFilters.end_date) {
        formattedFilters.end_date = formatEndDateValueForApi(
            String(formattedFilters.end_date),
        );
    }

    const rawRemote = formattedFilters.remote_party_number;
    const normalizedRemotePartyNumber = Array.isArray(rawRemote)
        ? normalizePhoneValue(rawRemote[0])
        : normalizePhoneValue(rawRemote);
    if (normalizedRemotePartyNumber) {
        formattedFilters.remote_party_number = [normalizedRemotePartyNumber];
        formattedFilters.remote_party_number_exact = normalizedRemotePartyNumber;
    } else {
        delete formattedFilters.remote_party_number;
        delete formattedFilters.remote_party_number_exact;
    }

    delete formattedFilters.timezone;

    return {
        applied: formattedFilters,
        normalizedRemotePartyNumber,
    };
}
