import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { getHolidayCalendars } from "@utils/staffManagement";

export type HolidayCalendarsQueryArgs = Readonly<{
  tenantId: string | null;
  year: string;
  status: string;
  limit: number;
}>;

export function useHolidayCalendarsQuery(args: HolidayCalendarsQueryArgs) {
  const statusKey = (args.status ?? "").trim();
  const yearKey = (args.year ?? "").trim();
  const parsedYear = yearKey ? Number(yearKey) : undefined;

  return useQuery({
    queryKey: workforceKeys.holidayCalendars.list({
      tenantId: args.tenantId ?? "",
      year: yearKey,
      status: statusKey,
      limit: args.limit,
    }),
    queryFn: async () => {
      if (!args.tenantId) {
        return { data: [], pagination: undefined };
      }
      return getHolidayCalendars({
        tenant_id: args.tenantId,
        ...(parsedYear != null && Number.isFinite(parsedYear) ? { year: parsedYear } : {}),
        ...(statusKey ? { status: statusKey } : {}),
        limit: args.limit,
      });
    },
    enabled: Boolean(args.tenantId?.trim()),
    placeholderData: keepPreviousData,
  });
}
