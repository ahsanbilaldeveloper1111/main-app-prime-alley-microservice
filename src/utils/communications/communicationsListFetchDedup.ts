/** Shared guard for call-logs / recordings list fetches to avoid duplicate in-flight requests. */
export function shouldSkipCommunicationsListFetch(
    isFetching: boolean,
    paramsKey: string,
    lastParamsKey: string,
    lastFetchTime: number,
    now: number = Date.now(),
): boolean {
    if (isFetching && lastParamsKey === paramsKey && now - lastFetchTime < 500) {
        return true;
    }
    if (lastParamsKey === paramsKey && now - lastFetchTime < 100) {
        return true;
    }
    return false;
}
