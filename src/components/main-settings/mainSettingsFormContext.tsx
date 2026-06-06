import React, { createContext, useContext, useMemo } from "react";
import { useRouter } from "next/router";

type MainSettingsFormContextValue = Readonly<{
  preferSidebarForms: boolean;
}>;

const MainSettingsFormContext = createContext<MainSettingsFormContextValue>({
  preferSidebarForms: false,
});

export function MainSettingsFormProvider({
  children,
  preferSidebarForms = true,
}: Readonly<{
  children: React.ReactNode;
  preferSidebarForms?: boolean;
}>) {
  const value = useMemo(() => ({ preferSidebarForms }), [preferSidebarForms]);
  return (
    <MainSettingsFormContext.Provider value={value}>{children}</MainSettingsFormContext.Provider>
  );
}

/** Route prefixes where data-entry forms use the right-hand panel instead of centered modals. */
const FORM_SIDEBAR_PATH_PREFIXES = [
  "/main-settings",
  "/controlhub/users",
  "/profile",
] as const;

export function pathnamePrefersFormSidebar(pathname: string): boolean {
  return FORM_SIDEBAR_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** True inside Main Settings layout or on routes that use panel forms (e.g. Control Hub users). */
export function useMainSettingsFormSidebar(): boolean {
  const { preferSidebarForms } = useContext(MainSettingsFormContext);
  const router = useRouter();
  const pathname = router.pathname ?? "";
  return preferSidebarForms || pathnamePrefersFormSidebar(pathname);
}
