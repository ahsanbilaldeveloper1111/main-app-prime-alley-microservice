import moment from 'moment';

/** Default “today” range for communications list UIs (local datetime-local + UTC Z for API). */
export function getDefaultCommunicationsDateFilterPair(
    startKey: string,
    endKey: string,
): {
    current: Record<string, string>;
    applied: Record<string, string>;
} {
    const now = moment();
    const startDateApi =
        now.clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    const endDateApi =
        now.clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    const startDateUi = now.clone().startOf('day').format('YYYY-MM-DDTHH:mm');
    const endDateUi = now.clone().endOf('day').format('YYYY-MM-DDTHH:mm');
    return {
        current: { [startKey]: startDateUi, [endKey]: endDateUi },
        applied: { [startKey]: startDateApi, [endKey]: endDateApi },
    };
}
