import { coercePicklistId } from "@components/crm/tickets/crmTicketCoercion";

export type TicketHierarchyExtensionLike = {
  id?: unknown;
  display_name?: string;
  name?: string;
  extension?: string;
};

export function formatExtensionIdForLabel(id: unknown): string {
  return coercePicklistId(id);
}

export function resolveTicketExtensionLabel(
  extension: TicketHierarchyExtensionLike,
): string {
  const displayName = extension.display_name?.trim();
  if (displayName) {
    return displayName;
  }
  const name = extension.name?.trim();
  if (name) {
    return name;
  }
  const extensionCode = extension.extension?.trim();
  if (extensionCode) {
    return extensionCode;
  }
  return formatExtensionIdForLabel(extension.id);
}
