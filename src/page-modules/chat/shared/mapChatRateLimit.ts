import type { ChatRateLimit } from "@utils/chat";

export interface ChatUserRateLimitView {
  perMinuteRemaining: number;
  perMinuteLimit: number;
  perDayRemaining: number;
  perDayLimit: number;
  /** When false, only configured caps are known (no usage from API). */
  hasUsageCounts: boolean;
}

export function mapChatRateLimitApi(
  data: ChatRateLimit,
  hasUsageCounts = true,
): ChatUserRateLimitView {
  return {
    perMinuteRemaining: data.per_minute_remaining,
    perMinuteLimit: data.per_minute_limit,
    perDayRemaining: data.per_day_remaining,
    perDayLimit: data.per_day_limit,
    hasUsageCounts,
  };
}

export function buildUserRateLimitFromSettingsCaps(
  caps: { perMinuteLimit: number; perDayLimit: number },
): ChatUserRateLimitView {
  return {
    perMinuteLimit: caps.perMinuteLimit,
    perDayLimit: caps.perDayLimit,
    perMinuteRemaining: caps.perMinuteLimit,
    perDayRemaining: caps.perDayLimit,
    hasUsageCounts: false,
  };
}
