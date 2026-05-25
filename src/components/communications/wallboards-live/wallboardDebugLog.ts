/** Debug-mode NDJSON logging for wallboard supervision (session 8bce45). */
export function wallboardDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
  runId = "whisper-to-silent",
): void {
  // #region agent log
  fetch("http://127.0.0.1:7304/ingest/018bbd1f-52ad-440c-99ca-dcd51835655f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8bce45",
    },
    body: JSON.stringify({
      sessionId: "8bce45",
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}
