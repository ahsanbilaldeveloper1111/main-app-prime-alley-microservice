export function crmQuotesListExtensionToSelectValue(
  id: string | null,
  extensions: any[],
): { value: string; label: string } | null {
  if (!id) return null;
  const ext = extensions.find((e: any) => (e.id || e.extension) === id);
  return ext
    ? { value: id, label: ext.display_name || ext.name || id }
    : { value: id, label: id };
}
