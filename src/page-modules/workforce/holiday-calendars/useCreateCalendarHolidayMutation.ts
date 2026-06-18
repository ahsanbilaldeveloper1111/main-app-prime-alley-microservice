import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildCreateCalendarHolidayPayload,
  type CreateCalendarHolidayFormState,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import { workforceKeys } from "@query/keys";
import { createCalendarHoliday } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useCreateCalendarHolidayMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      calendarId: number;
      form: CreateCalendarHolidayFormState;
    }) =>
      createCalendarHoliday(
        input.calendarId,
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
      toast.success("Holiday added to calendar.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to add holiday."));
    },
  });
}
