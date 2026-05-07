# TanStack Query (project-wide)

## Scope

- **TanStack Query** owns **server / remote async state**: HTTP reads, cache, background refresh, and mutations that should invalidate or patch that cache.
- **Redux Toolkit** remains for **global client UI state**, wizard flows, Finesse session fields still centralized in storage/slices, and legacy thunks until migrated.
- **Local React state** for ephemeral UI (modals, dropdowns, form drafts).

## Provider and defaults

- A single `QueryClient` is created once per client tree via `useState(() => createAppQueryClient())` in `src/components/providers.tsx`.
- House defaults live in `src/query/createAppQueryClient.ts`: `staleTime` 60s, `retry: 1`, **`refetchOnWindowFocus: false`** (matches `SessionProvider` refetch behavior).
- For SSR routes later, add dehydration only where needed (`HydrationBoundary`); most pages stay client-driven today.

## Query keys

- Use **namespaced factories** in `src/query/keys.ts` (e.g. `communicationsKeys`). Avoid raw string keys scattered in components.
- List queries should include **stable serializations** of filter objects (e.g. `JSON.stringify(appliedFilters)`) and explicit **refresh tokens** where Redux still owns filter commit (`refreshKey`).

## Mutations and staleness

- After a successful **mutation** that changes server data shown in a query, call `queryClient.invalidateQueries({ queryKey: ... })` for the affected namespace, or use `setQueryData` when the response maps cheaply to cache.
- **Real-time (STOMP/SSE)**: prefer **`invalidateQueries`** on reconnect or domain events unless you can patch from the payload.

## `enabled`

- Gate queries until prerequisites exist (session, Finesse user/team, feature flags). Do not fire list APIs with partial identity.

## Planner (work planner)

- **Task list** (`/planner/tasks` and project-embedded list): `plannerKeys.tasks.list({ ... })` includes scope, pager, serialized filters, active tab, project filter directory fingerprint, extension map stamp, and embed refresh signal when applicable.
- **Task detail**: `plannerKeys.tasks.detail(taskId)`.
- **Project detail**: `plannerKeys.projects.detail(projectId)`; **filter directory** (task filters + dashboard project picker): `plannerKeys.projects.filterDirectory()` with shared `fetchPlannerProjectFilterDirectory` in `src/query/fetchPlannerProjectFilterDirectory.ts`.
- **Global statuses admin**: `plannerKeys.statuses.global()`; **workflow/status picker data** for the task list: `plannerKeys.statuses.workflow(projectId | null)`.
- After task or status mutations, invalidate `plannerKeys.tasks.all()` or `plannerKeys.statuses.all()` as appropriate.

## Communications pilot

- **Call logs**: list fetch uses `useQuery` + `communicationsKeys.callLogs.list(...)`; Redux still holds filters, pagination UX, and table data via `hydrateCallLogsFetchResult` on success (transitional).
- **Call recordings**: list fetch uses `useQuery` + `communicationsKeys.callRecordings.list(...)` with `fetchCallRecordingsListPayload`; Redux still holds filters, pagination, charts/table via `hydrateCallRecordingsFetchResult` on success (transitional). Export uses `useMutation` + invalidation of `communicationsKeys.callRecordings.all()`.
- **Campaign manager**: Finesse campaigns list uses `useQuery` + `communicationsKeys.finesse.campaigns`; STOMP `onStompConnected` invalidates `communicationsKeys.finesse.all()` to resync after transport readiness.

## Compliance (DNCR)

- **CDR records** (`/compliance/cdr-records`): list uses `useQuery` + `complianceKeys.cdr.list({ page, perPage, filtersKey })` with `fetchComplianceCdrList` in `src/query/fetchComplianceCdrList.ts`. `filtersKey` is `JSON.stringify(appliedFilters)`.
- **Local DND blocks** (`/compliance/add-records`, `/compliance/local-dnd-call-block`): list uses `useQuery` + `complianceKeys.localDndBlocks.list({ variant, page, perPage, search, company })` and shared invalidation via `complianceKeys.localDndBlocks.all()` after add / delete / bulk operations (`invalidateQueries`).
- **Check-number flows** (`api-number-check`, `check-number`): remain imperative POST helpers (`CheckNumber`, `BulkCheckNumber`); candidates for `useMutation` later if you want centralized pending/error state.

## Redux migration strategy (backlog)

- Inventory **thunks that only fetch remote data** (CRM, planner, billing, communications dashboard, etc.); those are candidates to move behind `useQuery` / `useMutation` without changing the global provider again.
- **Call dashboard** and similar screens: Option A — short-term keep Redux for existing reads; Option B — add RQ for new reads only; Option C — move dashboard server payload into RQ and shrink the slice to UI-only when ready.
