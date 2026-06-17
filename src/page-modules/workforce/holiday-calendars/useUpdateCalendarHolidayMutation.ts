import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildCreateCalendarHolidayPayload,
  type CreateCalendarHolidayFormState,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import { workforceKeys } from "@query/keys";
import { updateCalendarHoliday } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useUpdateCalendarHolidayMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      calendarId: number;
      holidayId: number;
      form: CreateCalendarHolidayFormState;
    }) =>
      updateCalendarHoliday(
        input.calendarId,
        input.holidayId,
        buildCreateCalendarHolidayPayload(input.form),
      ),
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.holidayCalendars.all() })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({
          queryKey: workforceKeys.holidayCalendars.holidays(variables.calendarId),
        })
        .catch(() => undefined);
      toast.success("Holiday updated.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to update holiday."));
    },
  });
}
