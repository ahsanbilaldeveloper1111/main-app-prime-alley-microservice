export function getCrmQuotesListExtensionDisplayName(
  extensions: readonly { id?: unknown; display_name?: string; name?: string }[],
  extension: string,
): string {
  const extensionData = extensions.find((ext) => ext.id === extension);
  return extensionData?.display_name || extensionData?.name || extension;
}
