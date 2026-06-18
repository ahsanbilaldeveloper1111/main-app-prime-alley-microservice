import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { workforceKeys } from "@query/keys";
import { deleteCalendarHoliday } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useDeleteCalendarHolidayMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { calendarId: number; holidayId: number }) =>
      deleteCalendarHoliday(input.calendarId, input.holidayId),
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.holidayCalendars.all() })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({
          queryKey: workforceKeys.holidayCalendars.holidays(variables.calendarId),
        })
        .catch(() => undefined);
      toast.success("Holiday deleted.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to delete holiday."));
    },
  });
}
