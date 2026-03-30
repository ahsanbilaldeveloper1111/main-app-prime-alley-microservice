/** Non-enumerable flag: interceptor showed UI (toast) for this rejection; treat as handled for unhandledrejection. */
const AXIOS_USER_FACING_REJECTION = "__axiosUserFacingRejection";

export function markAxiosUserFacingRejection(error: unknown): void {
  if (error && typeof error === "object") {
    Object.defineProperty(error, AXIOS_USER_FACING_REJECTION, {
      value: true,
      enumerable: false,
      configurable: true,
    });
  }
}

export function isAxiosUserFacingRejection(reason: unknown): boolean {
  if (!reason || typeof reason !== "object") return false;
  return (reason as Record<string, unknown>)[AXIOS_USER_FACING_REJECTION] === true;
}
