export type CrmExtensionLookup = Readonly<{
  id?: unknown;
  extension?: unknown;
  display_name?: string;
  name?: string;
}>;

function findExtensionByUserExtension(
  extensions: readonly CrmExtensionLookup[],
  userExtension: string,
) {
  return extensions.find(
    (ext) => ext.id != null && String(ext.id) === userExtension,
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
