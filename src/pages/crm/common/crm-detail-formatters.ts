type GenericRecord = Record<string, unknown>;

const EMPTY_VALUE = "--";

export const formatCrmShortDate = (dateValue: string | null | undefined): string =>
  dateValue
    ? new Date(dateValue).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : EMPTY_VALUE;

export const formatCrmSummaryUpdatedLabel = (dateValue: string | null | undefined): string | undefined =>
  dateValue
    ? `Updated ${new Date(dateValue).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : undefined;

export const formatCrmAmount = (
  row: GenericRecord,
  options?: { currencyKey?: string; amountKeys?: string[] }
): string => {
  const currencyKey = options?.currencyKey ?? "currency";
  const amountKeys = options?.amountKeys ?? ["net_value", "grand_total"];
  const currency = row[currencyKey];
  const amount = amountKeys.map((key) => row[key]).find((value) => value != null && value !== "");
  return amount ? `${currency ?? ""} ${amount}` : EMPTY_VALUE;
};

export const getCrmExtensionDisplayName = (
  rawValue: unknown,
  extensions: GenericRecord[],
  fallback: string = EMPTY_VALUE
): string => {
  if (rawValue == null || rawValue === "") return fallback;
  const match = extensions.find(
    (ext) =>
      String(ext.id) === String(rawValue) ||
      String(ext.extension) === String(rawValue)
  );
  const resolved = (match?.display_name ?? match?.name ?? rawValue) as string | number;
  return String(resolved);
};
