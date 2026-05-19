export type CrmExtensionLookup = Readonly<{
  id?: unknown;
  extension?: unknown;
  display_name?: string;
  name?: string;
}>;

function toStableStringKey(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  if (typeof value === "bigint") return String(value);
  return null;
}

function findExtensionByUserExtension(
  extensions: readonly CrmExtensionLookup[],
  userExtension: string,
) {
  return extensions.find(
    (ext) => {
      const key = toStableStringKey(ext.id) ?? toStableStringKey(ext.extension);
      return key != null && key === userExtension;
    },
  );
}

export function getCrmListExtensionDisplayName(
  extensions: readonly CrmExtensionLookup[],
  extension: string,
): string {
  const extensionData = findExtensionByUserExtension(extensions, extension);
  return extensionData?.display_name || extensionData?.name || extension;
}

/** Matches prospects list Owner column: display name when known, else extension id. */
export function getCrmExtensionDisplayNameForUserExtension(
  extensions: readonly CrmExtensionLookup[],
  userExtension: string | number | null | undefined,
): string {
  if (userExtension == null || userExtension === "") {
    return "Unassigned";
  }
  const key = String(userExtension);
  const extensionData = findExtensionByUserExtension(extensions, key);
  return extensionData?.display_name || extensionData?.name || key;
}
