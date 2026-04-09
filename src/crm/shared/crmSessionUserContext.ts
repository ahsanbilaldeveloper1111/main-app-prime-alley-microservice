import type { Session } from "next-auth";

/**
 * Normalized session fields for CRM activity modals, communication, and sidebars.
 * Keeps `useCrmActivityModals` / layout code from repeating `session?.user as …` casts.
 */
export type CrmSessionUserContext = Readonly<{
  userEmail: string;
  userName: string;
  extension: string;
  tenantId: string;
}>;

export type GetCrmSessionUserContextOptions = Readonly<{
  /** Sidebar paths use `""` when tenant is absent; activity modals use `"default"`. */
  tenantMissingFallback?: "default" | "empty";
}>;

export function getCrmSessionUserContext(
  session: Session | null | undefined,
  options?: GetCrmSessionUserContextOptions,
): CrmSessionUserContext {
  const u = session?.user as
    | {
        email?: string;
        name?: string;
        extension?: string;
        phone?: string;
        tenant_id?: string;
        tenant?: string;
      }
    | undefined;

  const tenantMissing =
    options?.tenantMissingFallback === "empty" ? "" : "default";

  return {
    userEmail: u?.email ?? "user@example.com",
    userName: u?.name ?? "Your Name",
    extension: u?.extension ?? u?.phone ?? "unknown",
    tenantId: u?.tenant_id ?? u?.tenant ?? tenantMissing,
  };
}
