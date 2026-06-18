import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildCreateHolidayCalendarPayload,
  type CreateHolidayCalendarFormState,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import { workforceKeys } from "@query/keys";
import { createHolidayCalendar } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useCreateHolidayCalendarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      tenantId: string;
      form: CreateHolidayCalendarFormState;
    }) => createHolidayCalendar(buildCreateHolidayCalendarPayload(input.tenantId, input.form)),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.holidayCalendars.all() })
        .catch(() => undefined);
      toast.success("Holiday calendar created.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to create holiday calendar."));
    },
  });
}
