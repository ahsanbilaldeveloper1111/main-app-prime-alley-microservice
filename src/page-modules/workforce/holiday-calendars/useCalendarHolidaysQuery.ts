import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { getCalendarHolidays } from "@utils/staffManagement";

export function useCalendarHolidaysQuery(calendarId: number | null) {
  return useQuery({
    queryKey: workforceKeys.holidayCalendars.holidays(calendarId ?? 0),
    queryFn: async () => {
      if (!calendarId) return [];
      return getCalendarHolidays(calendarId);
    },
    enabled: calendarId != null && calendarId > 0,
    placeholderData: keepPreviousData,
  });
}
