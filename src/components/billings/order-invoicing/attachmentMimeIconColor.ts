/** Background color for attachment file-type icon (order + deal lists). */
export function attachmentMimeIconBackground(
  mimeType: string | undefined,
): string {
  const m = mimeType?.toLowerCase() ?? "";
  if (m.includes("pdf")) {
    return "#dc3545";
  }
  if (
    m.includes("csv") ||
    m.includes("excel") ||
    m.includes("spreadsheet")
  ) {
    return "#198754";
  }
  if (m.includes("image")) {
    return "#0d6efd";
  }
  return "#6c757d";
}
