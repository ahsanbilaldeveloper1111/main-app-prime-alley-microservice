export type TenantConfigInnerTab = "settings" | "config-authoring";

export const TENANT_CONFIG_INNER_TABS: ReadonlyArray<{
  id: TenantConfigInnerTab;
  label: string;
}> = [
  { id: "settings", label: "Settings" },
  { id: "config-authoring", label: "Config authoring" },
];
