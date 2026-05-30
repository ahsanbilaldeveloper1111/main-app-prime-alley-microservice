import { readUser, type AuthUser } from '@auth/authStorage'

/**
 * Logged-in user's PBX extension for notification-settings APIs (`user_extension`).
 * Reads from sessionStorage `authUser` — same object persisted at login.
 * `phone` is the canonical extension; `user_extension` / `extension` are fallbacks.
 */
export function resolveNotificationUserExtension(user?: AuthUser | null): string | undefined {
  const resolved = user ?? readUser()
  if (!resolved) {
    return undefined
  }
  const extension =
    resolved.phone?.trim() ||
    resolved.user_extension?.trim() ||
    resolved.extension?.trim()
  return extension || undefined
}
