import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { workforceKeys } from "@query/keys";

import { getAttendanceWorkHoursPolicies } from "@utils/staffManagement";



export type WorkHoursPoliciesQueryArgs = Readonly<{

  tenantId: string | null;

  page: number;

  limit: number;

  enabled?: boolean;

}>;



export function useWorkHoursPoliciesQuery(args: WorkHoursPoliciesQueryArgs) {

  const tenantKey = args.tenantId?.trim() ?? "";

  const queryEnabled = args.enabled ?? true;



  return useQuery({

    queryKey: workforceKeys.attendancePolicies.workHours({

      tenantId: tenantKey,

      page: args.page,

      limit: args.limit,

    }),

    queryFn: async () => {

      if (!tenantKey) {

        return { data: [], pagination: undefined };

      }

      return getAttendanceWorkHoursPolicies({

        tenant_id: tenantKey,

        page: args.page,

        limit: args.limit,

      });

    },

    enabled: queryEnabled && Boolean(tenantKey),

    placeholderData: keepPreviousData,

  });

}

