import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { workforceKeys } from "@query/keys";
import { publishHolidayCalendar } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function usePublishHolidayCalendarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (calendarId: number) => publishHolidayCalendar(calendarId),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.holidayCalendars.all() })
        .catch(() => undefined);
      toast.success("Holiday calendar published.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to publish holiday calendar."));
    },
  });
}
